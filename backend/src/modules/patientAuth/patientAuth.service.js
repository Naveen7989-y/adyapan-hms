import prisma from '../../config/db.js';
import { generateToken } from '../../utils/token.js';

// In-memory OTP cache: key = normalized phone string, value = { otp, expiresAt, attempts, patientIds }
const otpStore = new Map();

// Periodically clean up expired OTP records every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (record.expiresAt <= now) {
      otpStore.delete(key);
    }
  }
}, 2 * 60 * 1000).unref();

/**
 * Normalize phone string to alphanumeric digits for robust matching
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Find patient profiles linked to a given phone number
 */
export const findPatientsByPhone = async (phone) => {
  const cleanPhone = phone.trim();
  const digits = normalizePhone(phone);
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;

  // Search by exact phone string, or contains 10-digit number
  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { phone: cleanPhone },
        { phone: { contains: last10 } },
      ],
    },
    include: {
      hospital: {
        select: { id: true, name: true, code: true, isActive: true },
      },
      _count: {
        select: {
          appointments: true,
          prescriptions: true,
          tokens: true,
          invoices: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return patients;
};

/**
 * Send an OTP to a patient's phone number
 */
export const sendOtpToPatient = async (phone) => {
  if (!phone || phone.trim().length < 5) {
    const error = new Error('Please enter a valid phone number');
    error.statusCode = 400;
    throw error;
  }

  const cleanPhone = phone.trim();
  const digits = normalizePhone(cleanPhone);

  const patients = await findPatientsByPhone(cleanPhone);

  if (patients.length === 0) {
    const error = new Error(
      `No registered patient record found for mobile number "${cleanPhone}". Please verify your number or visit the Adyapan registration desk.`
    );
    error.statusCode = 404;
    throw error;
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  // Store in memory
  otpStore.set(digits, {
    otp,
    expiresAt,
    attempts: 0,
    patientIds: patients.map((p) => p.id),
  });

  const profiles = patients.map((p) => ({
    id: p.id,
    uhid: p.uhid,
    fullName: p.fullName,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    bloodGroup: p.bloodGroup,
    hospitalName: p.hospital?.name,
    recordCounts: p._count,
  }));

  return {
    message: `Verification code sent to ${cleanPhone}.`,
    phone: cleanPhone,
    profiles,
    expiresInSeconds: 300,
    // Included for immediate dev & demo testing convenience:
    demoOtp: otp,
  };
};

/**
 * Verify OTP and issue Patient JWT
 */
export const verifyOtpAndLogin = async (phone, enteredOtp, selectedPatientId = null) => {
  if (!phone || !enteredOtp) {
    const error = new Error('Phone number and 6-digit OTP are required');
    error.statusCode = 400;
    throw error;
  }

  const digits = normalizePhone(phone);
  const record = otpStore.get(digits);

  if (!record) {
    const error = new Error('OTP has expired or was not requested. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(digits);
    const error = new Error('OTP has expired. Please click "Resend Code".');
    error.statusCode = 400;
    throw error;
  }

  if (record.attempts >= 4) {
    otpStore.delete(digits);
    const error = new Error('Maximum incorrect OTP attempts exceeded. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  if (record.otp !== enteredOtp.toString().trim()) {
    record.attempts += 1;
    const remaining = 4 - record.attempts;
    const error = new Error(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
    error.statusCode = 400;
    throw error;
  }

  // OTP is verified! Consume it so it cannot be re-used
  otpStore.delete(digits);

  // Determine patient profile
  let patientId = selectedPatientId;
  if (!patientId || !record.patientIds.includes(patientId)) {
    patientId = record.patientIds[0];
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      hospital: {
        select: { id: true, name: true, code: true, isActive: true },
      },
    },
  });

  if (!patient) {
    const error = new Error('Selected patient record could not be found');
    error.statusCode = 404;
    throw error;
  }

  // Issue 7-day token for patient portal session
  const token = generateToken(
    {
      patientId: patient.id,
      hospitalId: patient.hospitalId,
      uhid: patient.uhid,
      role: 'PATIENT',
    },
    '7d'
  );

  return {
    patient: {
      id: patient.id,
      uhid: patient.uhid,
      fullName: patient.fullName,
      phone: patient.phone,
      email: patient.email,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      bloodGroup: patient.bloodGroup,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      medicalHistory: patient.medicalHistory,
      hospital: patient.hospital,
    },
    token,
  };
};

/**
 * Get authenticated patient's profile
 */
export const getPatientProfile = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      hospital: {
        select: { id: true, name: true, code: true },
      },
    },
  });

  if (!patient) {
    const error = new Error('Patient record not found');
    error.statusCode = 404;
    throw error;
  }

  return patient;
};
