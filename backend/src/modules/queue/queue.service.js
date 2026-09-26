import prisma from '../../config/db.js';
import { triggerTokenCalledNotification } from '../notifications/notification.service.js';
import { emitCallNext, emitQueueTransfer } from '../realtime/socket.service.js';

/**
 * Format helper for calendar date portion (midnight)
 */
const getNormalizedDate = (dateString) => {
  if (dateString) {
    const d = new Date(dateString);
    return new Date(d.toISOString().split('T')[0]);
  }
  return new Date(new Date().toISOString().split('T')[0]);
};

/**
 * Mask patient name for public TV display privacy compliance
 * Example: "John Doe" -> "J*** D**", "Priya Patel" -> "P**** P****"
 */
export const maskPatientName = (fullName) => {
  if (!fullName) return 'Patient';
  return fullName
    .split(' ')
    .map((word) => {
      if (word.length <= 1) return word;
      return word[0] + '*'.repeat(Math.max(1, word.length - 1));
    })
    .join(' ');
};

/**
 * Priority weighting for queue sorting
 */
const PRIORITY_WEIGHTS = {
  EMERGENCY: 1,
  PRIORITY: 2,
  NORMAL: 3,
};

/**
 * 1. Get Live Doctor Consulting Queue
 */
export const getDoctorLiveQueue = async (hospitalId, doctorId, date) => {
  const queueDate = getNormalizedDate(date);

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      department: true,
      schedules: {
        where: { dayOfWeek: queueDate.getDay(), isActive: true },
      },
    },
  });

  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }

  const slotDuration = doctor.schedules[0]?.slotDurationMinutes || 15;

  // Auto-close any stale active tokens from prior days
  await prisma.token.updateMany({
    where: {
      hospitalId,
      doctorId,
      queueDate: { lt: queueDate },
      status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
    },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  // Retrieve all tokens for this doctor today
  const allTokens = await prisma.token.findMany({
    where: {
      hospitalId,
      doctorId,
      queueDate,
    },
    include: {
      patient: true,
      appointment: true,
      department: true,
    },
    orderBy: { tokenNumber: 'asc' },
  });

  // 1. Current Token in Room (prioritizes IN_CONSULTATION if ongoing, then CALLED)
  const inConsultationToken = allTokens
    .filter((t) => t.status === 'IN_CONSULTATION')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;

  const calledToken = allTokens
    .filter((t) => t.status === 'CALLED')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;

  const currentToken = inConsultationToken || calledToken || null;

  // 2. Waiting Tokens (Sorted by Priority then Token Number)
  const waitingTokens = allTokens
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => {
      const weightA = PRIORITY_WEIGHTS[a.tokenType] || 3;
      const weightB = PRIORITY_WEIGHTS[b.tokenType] || 3;
      if (weightA !== weightB) return weightA - weightB;
      return a.tokenNumber - b.tokenNumber;
    })
    .map((t, index) => ({
      ...t,
      formattedToken: `T-${String(t.tokenNumber).padStart(3, '0')}`,
      queuePosition: index + 1,
      estimatedWaitMins: index * slotDuration,
    }));

  // 3. Skipped Tokens
  const skippedTokens = allTokens
    .filter((t) => t.status === 'SKIPPED')
    .map((t) => ({
      ...t,
      formattedToken: `T-${String(t.tokenNumber).padStart(3, '0')}`,
    }));

  // 4. Completed Tokens
  const completedTokens = allTokens
    .filter((t) => t.status === 'COMPLETED')
    .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt))
    .map((t) => ({
      ...t,
      formattedToken: `T-${String(t.tokenNumber).padStart(3, '0')}`,
    }));

  return {
    doctor: {
      id: doctor.id,
      name: doctor.user?.name,
      specialization: doctor.specialization,
      department: doctor.department?.name,
      status: doctor.status,
      slotDurationMinutes: slotDuration,
    },
    queueDate: queueDate.toISOString().split('T')[0],
    currentToken: currentToken
      ? {
          ...currentToken,
          formattedToken: `T-${String(currentToken.tokenNumber).padStart(3, '0')}`,
        }
      : null,
    calledToken: calledToken
      ? {
          ...calledToken,
          formattedToken: `T-${String(calledToken.tokenNumber).padStart(3, '0')}`,
        }
      : null,
    inConsultationToken: inConsultationToken
      ? {
          ...inConsultationToken,
          formattedToken: `T-${String(inConsultationToken.tokenNumber).padStart(3, '0')}`,
        }
      : null,
    waitingTokens,
    skippedTokens,
    completedTokens,
    metrics: {
      totalIssued: allTokens.length,
      waitingCount: waitingTokens.length,
      completedCount: completedTokens.length,
      skippedCount: skippedTokens.length,
      estimatedRemainingMins: waitingTokens.length * slotDuration,
    },
  };
};

/**
 * 2. Call Next Patient in Doctor's Queue
 */
export const callNextPatient = async (hospitalId, { doctorId, roomNumber, force = false }) => {
  const queueDate = getNormalizedDate();

  // Auto-close any stale active tokens from prior days
  await prisma.token.updateMany({
    where: {
      hospitalId,
      doctorId,
      queueDate: { lt: queueDate },
      status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
    },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  // Check if doctor currently has a CALLED or IN_CONSULTATION token for today
  if (!force) {
    const existingActive = await prisma.token.findFirst({
      where: {
        hospitalId,
        doctorId,
        queueDate,
        status: { in: ['CALLED', 'IN_CONSULTATION'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existingActive) {
      const formatted = `T-${String(existingActive.tokenNumber).padStart(3, '0')}`;
      const actionMsg = existingActive.status === 'IN_CONSULTATION'
        ? `Token ${formatted} is currently in consultation. Please complete or skip it before calling next.`
        : `Token ${formatted} is currently called. Please begin consultation or mark as skipped before calling next.`;
      const err = new Error(actionMsg);
      err.statusCode = 409;
      err.existingToken = existingActive;
      throw err;
    }
  } else {
    // Force flag: automatically mark previous active token(s) as SKIPPED so the room is cleared
    await prisma.token.updateMany({
      where: {
        hospitalId,
        doctorId,
        queueDate,
        status: { in: ['CALLED', 'IN_CONSULTATION'] },
      },
      data: { status: 'SKIPPED', updatedAt: new Date() },
    });
  }

  // Get all waiting tokens for this doctor today
  const waitingTokens = await prisma.token.findMany({
    where: {
      hospitalId,
      doctorId,
      queueDate,
      status: 'WAITING',
    },
    include: {
      patient: true,
      doctor: { include: { user: true, department: true } },
      department: true,
    },
  });

  if (waitingTokens.length === 0) {
    const err = new Error('No patients currently waiting in queue for this doctor');
    err.statusCode = 404;
    throw err;
  }

  // Sort by priority weight, then tokenNumber
  waitingTokens.sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[a.tokenType] || 3;
    const weightB = PRIORITY_WEIGHTS[b.tokenType] || 3;
    if (weightA !== weightB) return weightA - weightB;
    return a.tokenNumber - b.tokenNumber;
  });

  const nextToCall = waitingTokens[0];
  const assignedRoom = roomNumber || nextToCall.doctor?.roomNumber || 'Consultation Room';

  // Atomically transition token to CALLED
  const updatedToken = await prisma.token.update({
    where: { id: nextToCall.id },
    data: {
      status: 'CALLED',
      calledAt: new Date(),
    },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      department: true,
      appointment: true,
    },
  });

  // Asynchronously dispatch notification
  triggerTokenCalledNotification(hospitalId, {
    patient: updatedToken.patient,
    doctor: updatedToken.doctor,
    tokenNumber: updatedToken.tokenNumber,
    roomNumber: assignedRoom,
  }).catch((err) => console.error('Call next patient notification error:', err.message));

  const formattedToken = `T-${String(updatedToken.tokenNumber).padStart(3, '0')}`;
  const ttsText = `Token ${formattedToken.split('').join(' ')}, please proceed to ${updatedToken.doctor?.user?.name || 'Physician'} in ${assignedRoom}.`;

  // Real-time Socket.IO dispatch
  emitCallNext(hospitalId, {
    doctorId: updatedToken.doctorId,
    token: updatedToken,
    roomNumber: assignedRoom,
    doctorName: updatedToken.doctor?.user?.name,
  });

  return {
    ...updatedToken,
    formattedToken,
    roomNumber: assignedRoom,
    ttsAnnouncement: ttsText,
  };
};

/**
 * 3. Recall Currently Called Patient (Re-announce)
 */
export const recallPatient = async (hospitalId, { tokenId, roomNumber }) => {
  const token = await prisma.token.findFirst({
    where: { id: tokenId, hospitalId },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      department: true,
    },
  });

  if (!token) {
    const err = new Error('Token not found');
    err.statusCode = 404;
    throw err;
  }

  const assignedRoom = roomNumber || token.doctor?.roomNumber || 'Consultation Room';

  // Update calledAt timestamp to refresh announcement timer
  const updated = await prisma.token.update({
    where: { id: tokenId },
    data: {
      calledAt: new Date(),
      status: 'CALLED',
    },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      department: true,
    },
  });

  // Fire notification
  triggerTokenCalledNotification(hospitalId, {
    patient: updated.patient,
    doctor: updated.doctor,
    tokenNumber: updated.tokenNumber,
    roomNumber: assignedRoom,
  }).catch((err) => console.error('Recall patient notification error:', err.message));

  const formattedToken = `T-${String(updated.tokenNumber).padStart(3, '0')}`;
  const ttsText = `Reminder: Token ${formattedToken.split('').join(' ')}, please proceed to ${updated.doctor?.user?.name || 'Physician'} in ${assignedRoom}.`;

  // Real-time Socket.IO dispatch
  emitCallNext(hospitalId, {
    doctorId: updated.doctorId,
    token: updated,
    roomNumber: assignedRoom,
    doctorName: updated.doctor?.user?.name,
  });

  return {
    ...updated,
    formattedToken,
    roomNumber: assignedRoom,
    ttsAnnouncement: ttsText,
  };
};

/**
 * 4. Transfer Patient Token to Another Doctor
 */
export const transferToken = async (hospitalId, { tokenId, toDoctorId, reason }) => {
  const token = await prisma.token.findFirst({
    where: { id: tokenId, hospitalId },
    include: { appointment: true },
  });

  if (!token) {
    const err = new Error('Token not found');
    err.statusCode = 404;
    throw err;
  }

  if (['COMPLETED', 'CANCELLED'].includes(token.status)) {
    const err = new Error(`Cannot transfer a token with status: ${token.status}`);
    err.statusCode = 400;
    throw err;
  }

  const targetDoctor = await prisma.doctor.findFirst({
    where: { id: toDoctorId, hospitalId },
    include: { user: true, department: true },
  });

  if (!targetDoctor) {
    const err = new Error('Destination doctor not found');
    err.statusCode = 404;
    throw err;
  }

  // Update token doctor and department inside transaction with re-sequenced token number
  const transferredToken = await prisma.$transaction(async (tx) => {
    const lastToken = await tx.token.findFirst({
      where: {
        doctorId: toDoctorId,
        queueDate: token.queueDate,
      },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true },
    });
    const nextTokenNumber = (lastToken?.tokenNumber || 0) + 1;

    const updated = await tx.token.update({
      where: { id: tokenId },
      data: {
        doctorId: toDoctorId,
        departmentId: targetDoctor.departmentId,
        tokenNumber: nextTokenNumber,
        status: 'WAITING',
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    });

    // If appointment linked, mirror physician re-assignment
    if (token.appointmentId) {
      await tx.appointment.update({
        where: { id: token.appointmentId },
        data: {
          doctorId: toDoctorId,
          departmentId: targetDoctor.departmentId,
          status: 'CHECKED_IN',
        },
      });
    }

    return updated;
  });

  // Real-time Socket.IO dispatch
  emitQueueTransfer(hospitalId, {
    fromDoctorId: token.doctorId,
    toDoctorId,
    token: transferredToken,
  });

  return {
    ...transferredToken,
    formattedToken: `T-${String(transferredToken.tokenNumber).padStart(3, '0')}`,
    transferredTo: targetDoctor.user?.name,
    reason: reason || 'Clinical queue transfer',
  };
};

/**
 * 5. Public TV Queue Display Feed (Read-Only, Masked Privacy, Real-Time Feed)
 */
export const getPublicDisplayData = async (hospitalId, { departmentId } = {}) => {
  let resolvedHospitalId = hospitalId;
  if (!resolvedHospitalId) {
    const primaryHospital = await prisma.hospital.findFirst();
    resolvedHospitalId = primaryHospital?.id;
  }

  const queueDate = getNormalizedDate();

  const whereToken = {
    hospitalId: resolvedHospitalId,
    OR: [
      { queueDate },
      { status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] } },
    ],
  };

  if (departmentId) {
    whereToken.departmentId = departmentId;
  }

  // Fetch all active tokens for today or still in line
  const tokens = await prisma.token.findMany({
    where: whereToken,
    include: {
      patient: { select: { fullName: true, uhid: true } },
      doctor: {
        include: {
          user: { select: { name: true } },
          department: { select: { name: true, code: true } },
        },
      },
      department: { select: { name: true, code: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // 1. Tokens currently called or in consultation across doctors
  const nowServing = tokens
    .filter((t) => ['CALLED', 'IN_CONSULTATION'].includes(t.status))
    .map((t) => ({
      id: t.id,
      tokenNumber: t.tokenNumber,
      formattedToken: `T-${String(t.tokenNumber).padStart(3, '0')}`,
      maskedPatientName: maskPatientName(t.patient?.fullName),
      doctorName: t.doctor?.user?.name || 'Physician',
      departmentName: t.department?.name || 'General Clinic',
      roomNumber: t.doctor?.roomNumber || 'Consultation Room',
      status: t.status,
      tokenType: t.tokenType,
      calledAt: t.calledAt,
    }));

  // 2. Upcoming tokens in waiting line (Priority sorted, up to 8 items)
  const upcomingWaiting = tokens
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => {
      const weightA = PRIORITY_WEIGHTS[a.tokenType] || 3;
      const weightB = PRIORITY_WEIGHTS[b.tokenType] || 3;
      if (weightA !== weightB) return weightA - weightB;
      return a.tokenNumber - b.tokenNumber;
    })
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      tokenNumber: t.tokenNumber,
      formattedToken: `T-${String(t.tokenNumber).padStart(3, '0')}`,
      maskedPatientName: maskPatientName(t.patient?.fullName),
      doctorName: t.doctor?.user?.name || 'Physician',
      departmentName: t.department?.name || 'Clinic',
      tokenType: t.tokenType,
      status: t.status,
    }));

  // 3. Hospital details for display branding
  const hospital = await prisma.hospital.findUnique({
    where: { id: resolvedHospitalId },
    select: { name: true, code: true },
  });

  // 4. Latest announcement in the last 60 seconds for TV speech synthesis
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const recentAnnouncement = nowServing.find((t) => t.status === 'CALLED' && t.calledAt && new Date(t.calledAt) >= oneMinuteAgo);

  return {
    hospitalName: hospital?.name || 'Adyapan Hospital',
    date: queueDate.toISOString().split('T')[0],
    currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    nowServing,
    upcomingWaiting,
    recentAnnouncement: recentAnnouncement
      ? {
          tokenNumber: recentAnnouncement.formattedToken,
          roomNumber: recentAnnouncement.roomNumber,
          doctorName: recentAnnouncement.doctorName,
          speechText: `Token ${recentAnnouncement.formattedToken.split('').join(' ')}, please proceed to ${recentAnnouncement.doctorName} in ${recentAnnouncement.roomNumber}`,
        }
      : null,
  };
};

/**
 * 6. Public Patient Token Tracking (Direct Database Query by Token # or UHID)
 */
export const trackTokenData = async (hospitalId, searchTerm) => {
  let resolvedHospitalId = hospitalId;
  if (!resolvedHospitalId) {
    const primaryHospital = await prisma.hospital.findFirst();
    resolvedHospitalId = primaryHospital?.id;
  }

  const raw = String(searchTerm || '').trim();
  if (!raw) return { found: false };

  // Parse token number & department code if available (e.g. "T-001", "GEN-002", "1")
  const parsedNum = parseInt(raw.replace(/^[A-Za-z]+[-_ ]*0*/, ''), 10);
  const codeMatch = raw.match(/^([A-Za-z]+)/);
  const deptCode = codeMatch ? codeMatch[1].toUpperCase() : null;

  const orConditions = [
    { patient: { uhid: { equals: raw, mode: 'insensitive' } } },
    { patient: { uhid: { contains: raw, mode: 'insensitive' } } },
  ];

  if (!isNaN(parsedNum)) {
    if (deptCode && deptCode !== 'T') {
      orConditions.push({
        tokenNumber: parsedNum,
        department: { code: { equals: deptCode, mode: 'insensitive' } },
      });
    }
    orConditions.push({ tokenNumber: parsedNum });
  }

  // Retrieve candidate tokens from DB, preferring active/recent tokens
  const tokens = await prisma.token.findMany({
    where: {
      hospitalId: resolvedHospitalId,
      OR: orConditions,
    },
    include: {
      patient: true,
      doctor: {
        include: {
          user: true,
          department: true,
          schedules: {
            where: { isActive: true },
          },
        },
      },
      department: true,
    },
    orderBy: [
      { queueDate: 'desc' },
      { updatedAt: 'desc' },
    ],
    take: 5,
  });

  if (!tokens || tokens.length === 0) {
    return { found: false };
  }

  // Prioritize active tokens (WAITING, CALLED, IN_CONSULTATION), then today's, then newest
  const activeToken = tokens.find((t) => ['CALLED', 'IN_CONSULTATION', 'WAITING'].includes(t.status)) || tokens[0];

  // Current token being called / in consultation by this doctor
  const activeCall = await prisma.token.findFirst({
    where: {
      hospitalId: resolvedHospitalId,
      doctorId: activeToken.doctorId,
      queueDate: activeToken.queueDate,
      status: { in: ['CALLED', 'IN_CONSULTATION'] },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const calledTokenFormatted = activeCall
    ? `T-${String(activeCall.tokenNumber).padStart(3, '0')}`
    : 'None';

  // Calculate waiting queue position & ahead count
  let aheadCount = 0;
  let estWait = 'Immediate (Please proceed to chamber)';
  let stageIndex = 0;

  const dayOfWeek = activeToken.queueDate ? new Date(activeToken.queueDate).getDay() : new Date().getDay();
  const schedule = activeToken.doctor?.schedules?.find((s) => s.dayOfWeek === dayOfWeek) || activeToken.doctor?.schedules?.[0];
  const slotMinutes = schedule?.slotDurationMinutes || 15;

  if (activeToken.status === 'WAITING') {
    aheadCount = await prisma.token.count({
      where: {
        hospitalId: resolvedHospitalId,
        doctorId: activeToken.doctorId,
        queueDate: activeToken.queueDate,
        status: 'WAITING',
        tokenNumber: { lt: activeToken.tokenNumber },
      },
    });

    if (aheadCount === 0) {
      estWait = `Next in line (~${slotMinutes} mins)`;
      stageIndex = 2; // Vital Triage / Next in Line
    } else {
      estWait = `~${(aheadCount + 1) * slotMinutes} mins`;
      stageIndex = 1; // Waiting Hall
    }
  } else if (activeToken.status === 'CALLED') {
    aheadCount = 0;
    estWait = 'Now Calling - Proceed to Room';
    stageIndex = 3; // Doctor Suite
  } else if (activeToken.status === 'IN_CONSULTATION') {
    aheadCount = 0;
    estWait = 'Currently In Consultation';
    stageIndex = 3; // Doctor Suite
  } else if (activeToken.status === 'COMPLETED') {
    aheadCount = 0;
    estWait = 'Consultation Completed';
    stageIndex = 3;
  } else {
    estWait = activeToken.status;
    stageIndex = 0;
  }

  const prefix = activeToken.department?.code || 'GEN';
  const displayToken = `${prefix}-${String(activeToken.tokenNumber).padStart(3, '0')}`;
  const canonicalToken = `T-${String(activeToken.tokenNumber).padStart(3, '0')}`;

  return {
    found: true,
    id: activeToken.id,
    token: canonicalToken,
    displayToken,
    tokenNumber: activeToken.tokenNumber,
    department: activeToken.department?.name || 'General Clinic',
    doctor: activeToken.doctor?.user?.name || 'Physician',
    room: activeToken.doctor?.roomNumber || 'Room 101',
    status: activeToken.status === 'CALLED' ? 'Now Calling / In Room' :
            activeToken.status === 'IN_CONSULTATION' ? 'In Consultation' :
            activeToken.status === 'COMPLETED' ? 'Completed' :
            activeToken.status === 'WAITING' ? 'Waiting in Queue' : activeToken.status,
    ahead: aheadCount,
    estWait,
    calledToken: calledTokenFormatted,
    stageIndex,
    patientName: maskPatientName(activeToken.patient?.fullName),
    uhid: activeToken.patient?.uhid || null,
    queueDate: activeToken.queueDate.toISOString().split('T')[0],
  };
};

