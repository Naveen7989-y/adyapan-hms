import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { generateToken } from '../../utils/token.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout window

// In-memory failed attempts tracker keyed by normalized email
const loginAttemptsMap = new Map();

// Periodically clean up expired lockout records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttemptsMap.entries()) {
    if (record.lockedUntil && record.lockedUntil <= now) {
      loginAttemptsMap.delete(key);
    } else if (now - record.lastAttempt > LOCKOUT_DURATION_MS) {
      loginAttemptsMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

const checkLockout = (email) => {
  const key = email.toLowerCase().trim();
  const record = loginAttemptsMap.get(key);
  if (!record) return;

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const roleLabel = record.role ? ` (${record.role.replace('_', ' ')})` : '';
    const error = new Error(
      `Too many incorrect login attempts for this account${roleLabel}. Maximum 5 attempts allowed. Account is locked. Please try again after ${remainingMinutes} minute(s).`
    );
    error.statusCode = 429;
    throw error;
  }

  // If lockout has elapsed, reset counter
  if (record.lockedUntil && record.lockedUntil <= now) {
    loginAttemptsMap.delete(key);
  }
};

const recordFailedAttempt = (email, role = null) => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const record = loginAttemptsMap.get(key) || { count: 0, lockedUntil: null, lastAttempt: now, role };

  record.count += 1;
  record.lastAttempt = now;
  if (role) record.role = role;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttemptsMap.set(key, record);
    const roleLabel = record.role ? ` for role ${record.role.replace('_', ' ')}` : '';
    const error = new Error(
      `Maximum 5 incorrect login attempts reached${roleLabel}. This account has been locked for 15 minutes.`
    );
    error.statusCode = 429;
    throw error;
  }

  loginAttemptsMap.set(key, record);
  const remaining = MAX_FAILED_ATTEMPTS - record.count;
  const error = new Error(
    `Invalid email or password. ${remaining} attempt(s) remaining before account lockout.`
  );
  error.statusCode = 401;
  throw error;
};

const clearFailedAttempts = (email) => {
  const key = email.toLowerCase().trim();
  loginAttemptsMap.delete(key);
};

/**
 * Authenticate user with email and password
 * Enforces a strict 5-attempt incorrect entry policy per role/account
 */
export const loginUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verify this account is not currently locked out
  checkLockout(normalizedEmail);

  // 2. Find user by email across active hospitals
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    include: {
      hospital: {
        select: { id: true, name: true, code: true, isActive: true },
      },
      doctor: {
        select: { id: true, specialization: true, status: true, departmentId: true },
      },
    },
  });

  if (!user) {
    // Record failed attempt for unknown accounts too (prevents username harvesting)
    recordFailedAttempt(normalizedEmail);
  }

  if (user.status !== 'ACTIVE') {
    const error = new Error(`Account is ${user.status.toLowerCase()}. Contact administrator.`);
    error.statusCode = 403;
    throw error;
  }

  if (!user.hospital.isActive) {
    const error = new Error('Associated hospital account is inactive');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Record failed attempt tagged with user's specific role
    recordFailedAttempt(normalizedEmail, user.role);
  }

  // 3. Authentication successful! Clear failed attempt counter for this account/role
  clearFailedAttempts(normalizedEmail);

  // Issue token
  const token = generateToken({
    userId: user.id,
    hospitalId: user.hospitalId,
    role: user.role,
  });

  // Exclude password from return payload
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Fetch current authenticated user's profile
 */
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      hospitalId: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      status: true,
      createdAt: true,
      hospital: {
        select: { id: true, name: true, code: true },
      },
      doctor: {
        select: {
          id: true,
          specialization: true,
          consultationFee: true,
          status: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Self-service password change for authenticated users
 */
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    const error = new Error('Current password and new password are required');
    error.statusCode = 400;
    throw error;
  }

  // Enforce password strength (min 8 chars, uppercase, lowercase, number)
  if (newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
    const error = new Error('New password must be at least 8 characters and contain uppercase, lowercase, and a number');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    const error = new Error('Current password does not match');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: 'Password updated successfully' };
};

