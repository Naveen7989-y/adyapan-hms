import prisma from '../../config/db.js';
import { emitConsultationStatus } from '../realtime/socket.service.js';

/**
 * Helper to normalize date to calendar day
 */
const getNormalizedDate = (dateString) => {
  if (dateString) {
    const d = new Date(dateString);
    return new Date(d.toISOString().split('T')[0]);
  }
  return new Date(new Date().toISOString().split('T')[0]);
};

/**
 * Format vitals object to structured readable text or preserve JSON
 */
export const formatVitalsNotes = (vitals, existingNotes = '') => {
  if (!vitals || Object.keys(vitals).length === 0) return existingNotes;

  const vitalsHeader = '--- CLINICAL VITALS ---';
  const parts = [];
  if (vitals.bp) parts.push(`BP: ${vitals.bp} mmHg`);
  if (vitals.pulse) parts.push(`Pulse: ${vitals.pulse} bpm`);
  if (vitals.temp) parts.push(`Temp: ${vitals.temp} °F`);
  if (vitals.spo2) parts.push(`SpO2: ${vitals.spo2}%`);
  if (vitals.weight) parts.push(`Weight: ${vitals.weight} kg`);
  if (vitals.height) parts.push(`Height: ${vitals.height} cm`);
  if (vitals.bmi) parts.push(`BMI: ${vitals.bmi}`);

  if (parts.length === 0) return existingNotes;

  const vitalsText = `${vitalsHeader}\n${parts.join(' | ')}`;
  if (!existingNotes) return vitalsText;
  if (existingNotes.includes(vitalsHeader)) {
    // Replace old vitals section
    return existingNotes.replace(new RegExp(`${vitalsHeader}[\\s\\S]*?(\\n\\n|$)`), `${vitalsText}\n\n`);
  }
  return `${vitalsText}\n\n${existingNotes}`;
};

/**
 * 1. Start Clinical Consultation (or retrieve active one)
 */
export const startConsultation = async (hospitalId, {
  patientId,
  doctorId,
  tokenId,
  appointmentId,
  symptoms,
  vitals,
  notes,
}) => {
  // If tokenId provided, verify if consultation already exists
  if (tokenId) {
    const existingByToken = await prisma.consultation.findFirst({
      where: { tokenId, hospitalId },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        token: true,
        appointment: true,
      },
    });

    if (existingByToken) {
      return existingByToken;
    }
  }

  // If appointmentId provided, verify if consultation exists
  if (appointmentId) {
    const existingByAppt = await prisma.consultation.findFirst({
      where: { appointmentId, hospitalId },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        token: true,
        appointment: true,
      },
    });

    if (existingByAppt) {
      return existingByAppt;
    }
  }

  // Resolve patient and doctor from Token or Appointment if not provided
  let resolvedPatientId = patientId;
  let resolvedDoctorId = doctorId;
  let resolvedApptId = appointmentId;

  if (tokenId) {
    const token = await prisma.token.findFirst({
      where: { id: tokenId, hospitalId },
    });
    if (token) {
      resolvedPatientId = token.patientId;
      resolvedDoctorId = token.doctorId;
      resolvedApptId = token.appointmentId || resolvedApptId;
    }
  } else if (appointmentId) {
    const appt = await prisma.appointment.findFirst({
      where: { id: appointmentId, hospitalId },
    });
    if (appt) {
      resolvedPatientId = appt.patientId;
      resolvedDoctorId = appt.doctorId;
    }
  }

  if (!resolvedPatientId || !resolvedDoctorId) {
    const err = new Error('Patient ID and Doctor ID are required to initiate consultation');
    err.statusCode = 400;
    throw err;
  }

  const combinedNotes = formatVitalsNotes(vitals, notes);

  // Execute in transaction to atomically update token/appointment status to IN_CONSULTATION
  const consultation = await prisma.$transaction(async (tx) => {
    // 1. Create Consultation record
    const created = await tx.consultation.create({
      data: {
        hospitalId,
        patientId: resolvedPatientId,
        doctorId: resolvedDoctorId,
        tokenId: tokenId || null,
        appointmentId: resolvedApptId || null,
        symptoms: symptoms || null,
        notes: combinedNotes || null,
        status: 'IN_PROGRESS',
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        token: true,
        appointment: true,
      },
    });

    // 2. Update Token status to IN_CONSULTATION if applicable
    if (tokenId) {
      await tx.token.update({
        where: { id: tokenId },
        data: { status: 'IN_CONSULTATION' },
      });
    }

    // 3. Update Appointment status to IN_CONSULTATION if applicable
    if (resolvedApptId) {
      await tx.appointment.update({
        where: { id: resolvedApptId },
        data: { status: 'IN_CONSULTATION' },
      });
    }

    return created;
  });

  // Real-time Socket.IO dispatch
  emitConsultationStatus(hospitalId, {
    doctorId: consultation.doctorId,
    consultationId: consultation.id,
    status: 'IN_CONSULTATION',
    token: consultation.token,
    appointment: consultation.appointment,
  });

  return consultation;
};

/**
 * 2. Update Consultation Draft / In-Progress Notes
 */
export const updateConsultation = async (hospitalId, consultationId, {
  symptoms,
  diagnosis,
  notes,
  advice,
  followUpDate,
  vitals,
}) => {
  const existing = await prisma.consultation.findFirst({
    where: { id: consultationId, hospitalId },
  });

  if (!existing) {
    const err = new Error('Consultation not found');
    err.statusCode = 404;
    throw err;
  }

  const updateData = {};
  if (symptoms !== undefined) updateData.symptoms = symptoms;
  if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
  if (advice !== undefined) updateData.advice = advice;
  if (followUpDate !== undefined) {
    updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
  }

  // Handle vitals formatting with notes
  if (vitals !== undefined || notes !== undefined) {
    const baseNotes = notes !== undefined ? notes : (existing.notes || '');
    updateData.notes = formatVitalsNotes(vitals, baseNotes);
  }

  return prisma.consultation.update({
    where: { id: consultationId },
    data: updateData,
    include: {
      patient: true,
      doctor: { include: { user: true, department: true } },
      token: true,
      appointment: true,
      prescription: true,
    },
  });
};

/**
 * 3. Complete Consultation
 */
export const completeConsultation = async (hospitalId, consultationId, {
  diagnosis,
  advice,
  followUpDate,
  notes,
  vitals,
}) => {
  const existing = await prisma.consultation.findFirst({
    where: { id: consultationId, hospitalId },
  });

  if (!existing) {
    const err = new Error('Consultation not found');
    err.statusCode = 404;
    throw err;
  }

  const finalDiagnosis = diagnosis || existing.diagnosis;
  if (!finalDiagnosis || !finalDiagnosis.trim()) {
    const err = new Error('A diagnosis is required to complete the consultation');
    err.statusCode = 400;
    throw err;
  }

  const baseNotes = notes !== undefined ? notes : (existing.notes || '');
  const finalNotes = formatVitalsNotes(vitals, baseNotes);

  const updateData = {
    diagnosis: finalDiagnosis,
    status: 'COMPLETED',
    notes: finalNotes,
  };

  if (advice !== undefined) updateData.advice = advice;
  if (followUpDate !== undefined) {
    updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark Token COMPLETED if linked directly or via appointment
    const targetTokenId = existing.tokenId || (
      existing.appointmentId
        ? (await tx.token.findFirst({ where: { appointmentId: existing.appointmentId }, select: { id: true } }))?.id
        : null
    );

    if (targetTokenId) {
      await tx.token.update({
        where: { id: targetTokenId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      if (!existing.tokenId) {
        updateData.tokenId = targetTokenId;
      }
    }

    // 2. Mark Appointment COMPLETED if linked
    if (existing.appointmentId) {
      await tx.appointment.update({
        where: { id: existing.appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    // 3. Update Consultation status (token and appointment reflect COMPLETED)
    const completed = await tx.consultation.update({
      where: { id: consultationId },
      data: updateData,
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        token: true,
        appointment: true,
      },
    });

    return completed;
  });

  // Real-time Socket.IO dispatch
  emitConsultationStatus(hospitalId, {
    doctorId: result.doctorId,
    consultationId: result.id,
    status: 'COMPLETED',
    token: result.token,
    appointment: result.appointment,
  });

  return result;
};

/**
 * 4. List & Filter Consultations
 */
export const getConsultations = async (hospitalId, query = {}) => {
  const {
    doctorId,
    patientId,
    date,
    status,
    search,
    limit = 50,
    page = 1,
  } = query;

  const take = Math.min(parseInt(limit, 10) || 50, 100);
  const skip = ((parseInt(page, 10) || 1) - 1) * take;

  const where = { hospitalId };

  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  if (date) {
    const targetDate = getNormalizedDate(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    where.createdAt = {
      gte: targetDate,
      lt: nextDay,
    };
  }

  if (search) {
    const trimmed = search.trim();
    where.OR = [
      { patient: { fullName: { contains: trimmed, mode: 'insensitive' } } },
      { patient: { uhid: { contains: trimmed, mode: 'insensitive' } } },
      { diagnosis: { contains: trimmed, mode: 'insensitive' } },
      { symptoms: { contains: trimmed, mode: 'insensitive' } },
    ];
  }

  const [total, consultations] = await Promise.all([
    prisma.consultation.count({ where }),
    prisma.consultation.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        token: true,
        appointment: true,
        prescription: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return {
    total,
    page: parseInt(page, 10) || 1,
    totalPages: Math.ceil(total / take),
    consultations,
  };
};

/**
 * 5. Get Single Consultation Details
 */
export const getConsultationById = async (hospitalId, consultationId) => {
  const consultation = await prisma.consultation.findFirst({
    where: { id: consultationId, hospitalId },
    include: {
      patient: true,
      doctor: { include: { user: true, department: true } },
      token: true,
      appointment: true,
      prescription: {
        include: { items: true },
      },
    },
  });

  if (!consultation) {
    const err = new Error('Consultation not found');
    err.statusCode = 404;
    throw err;
  }

  return consultation;
};

/**
 * 6. Get Comprehensive Patient Consultation History Timeline
 */
export const getPatientConsultationHistory = async (hospitalId, patientId) => {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId },
  });

  if (!patient) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }

  const consultations = await prisma.consultation.findMany({
    where: { patientId, hospitalId },
    include: {
      doctor: { include: { user: true, department: true } },
      token: true,
      appointment: true,
      prescription: {
        include: { items: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    patient,
    consultations,
    totalVisits: consultations.length,
  };
};
