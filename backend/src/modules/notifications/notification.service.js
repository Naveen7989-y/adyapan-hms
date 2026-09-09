import prisma from '../../config/db.js';
import { getNotificationProvider } from './providers/index.js';

const VALID_CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP'];

/**
 * Core notification dispatch engine with status tracking
 */
export const dispatchNotification = async (hospitalId, data) => {
  const { recipient, channel = 'SMS', eventType, title, message } = data;

  if (!recipient || !title || !message) {
    const error = new Error('Recipient, title, and message are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedChannel = channel.toUpperCase();
  if (!VALID_CHANNELS.includes(normalizedChannel)) {
    const error = new Error(`Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // 1. Create audit record in PENDING status
  const notification = await prisma.notification.create({
    data: {
      hospitalId,
      recipient: recipient.trim(),
      channel: normalizedChannel,
      eventType: eventType || 'GENERAL_NOTIFICATION',
      title: title.trim(),
      message: message.trim(),
      status: 'PENDING',
    },
  });

  // 2. Dispatch via provider adapter
  try {
    const provider = getNotificationProvider(normalizedChannel);
    const result = await provider.send({
      recipient: notification.recipient,
      channel: notification.channel,
      eventType: notification.eventType,
      title: notification.title,
      message: notification.message,
    });

    if (result.success) {
      const updated = await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT' },
      });
      return updated;
    } else {
      const updated = await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED', errorLog: result.error || 'Provider rejected message' },
      });
      return updated;
    }
  } catch (dispatchErr) {
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'FAILED', errorLog: dispatchErr.message },
    });
    return updated;
  }
};

/**
 * Event Trigger: Appointment Booked
 */
export const triggerAppointmentBookedNotification = async (appointment) => {
  if (!appointment?.patient?.phone) return;

  const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString();
  const doctorName = appointment.doctor?.user?.name || 'Physician';
  const hospitalName = 'Adyapan Hospital';

  const title = 'Appointment Confirmed';
  const message = `Dear ${appointment.patient.fullName}, your consultation with ${doctorName} is confirmed for ${dateFormatted} at ${appointment.timeSlot}. UHID: ${appointment.patient.uhid}. - ${hospitalName}`;

  return dispatchNotification(appointment.hospitalId, {
    recipient: appointment.patient.phone,
    channel: 'SMS',
    eventType: 'APPOINTMENT_BOOKED',
    title,
    message,
  });
};

/**
 * Event Trigger: Appointment Rescheduled
 */
export const triggerAppointmentRescheduledNotification = async (appointment) => {
  if (!appointment?.patient?.phone) return;

  const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString();
  const doctorName = appointment.doctor?.user?.name || 'Physician';

  const title = 'Appointment Rescheduled';
  const message = `Dear ${appointment.patient.fullName}, your consultation with ${doctorName} has been rescheduled to ${dateFormatted} at ${appointment.timeSlot}. - Adyapan Hospital`;

  return dispatchNotification(appointment.hospitalId, {
    recipient: appointment.patient.phone,
    channel: 'SMS',
    eventType: 'APPOINTMENT_RESCHEDULED',
    title,
    message,
  });
};

/**
 * Event Trigger: Appointment Cancelled
 */
export const triggerAppointmentCancelledNotification = async (appointment, reason) => {
  if (!appointment?.patient?.phone) return;

  const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString();
  const doctorName = appointment.doctor?.user?.name || 'Physician';

  const title = 'Appointment Cancelled';
  const message = `Dear ${appointment.patient.fullName}, your appointment with ${doctorName} scheduled for ${dateFormatted} has been cancelled. Reason: ${reason || 'Administrative update'}. - Adyapan Hospital`;

  return dispatchNotification(appointment.hospitalId, {
    recipient: appointment.patient.phone,
    channel: 'SMS',
    eventType: 'APPOINTMENT_CANCELLED',
    title,
    message,
  });
};

/**
 * Event Trigger: Appointment Reminder
 */
export const triggerAppointmentReminderNotification = async (appointment) => {
  if (!appointment?.patient?.phone) return;

  const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString();
  const doctorName = appointment.doctor?.user?.name || 'Physician';

  const title = 'Appointment Reminder';
  const message = `Reminder: You have an upcoming consultation with ${doctorName} on ${dateFormatted} at ${appointment.timeSlot}. Please report to reception 15 mins prior. - Adyapan Hospital`;

  return dispatchNotification(appointment.hospitalId, {
    recipient: appointment.patient.phone,
    channel: 'SMS',
    eventType: 'APPOINTMENT_REMINDER',
    title,
    message,
  });
};

/**
 * Event Trigger: Token Generated (Check-in / Walk-in)
 */
export const triggerTokenGeneratedNotification = async (hospitalId, { patient, doctor, tokenNumber, tokenType, position, estimatedWaitMins }) => {
  if (!patient?.phone) return;

  const doctorName = doctor?.user?.name || 'Physician';
  const tokenFormatted = `T-${String(tokenNumber).padStart(3, '0')}`;
  const priorityNote = tokenType !== 'NORMAL' ? ` [${tokenType}]` : '';

  const title = `Token Issued: ${tokenFormatted}`;
  const message = `Hello ${patient.fullName}, your token is ${tokenFormatted}${priorityNote} for ${doctorName}. Queue Position: #${position}. Est. Wait: ~${estimatedWaitMins} mins. - Adyapan Hospital`;

  return dispatchNotification(hospitalId, {
    recipient: patient.phone,
    channel: 'SMS',
    eventType: 'TOKEN_GENERATED',
    title,
    message,
    metadata: { tokenNumber, tokenType, position, estimatedWaitMins },
  });
};

/**
 * Event Trigger: Token Called to Consult Room
 */
export const triggerTokenCalledNotification = async (hospitalId, { patient, doctor, tokenNumber, roomNumber }) => {
  if (!patient?.phone) return;

  const doctorName = doctor?.user?.name || 'Physician';
  const tokenFormatted = `T-${String(tokenNumber).padStart(3, '0')}`;
  const roomMsg = roomNumber ? ` in Room ${roomNumber}` : '';

  const title = `Your Turn: ${tokenFormatted}`;
  const message = `Alert: Token ${tokenFormatted} (${patient.fullName}), please proceed to ${doctorName}${roomMsg} for consultation. - Adyapan Hospital`;

  return dispatchNotification(hospitalId, {
    recipient: patient.phone,
    channel: 'SMS',
    eventType: 'TOKEN_CALLED',
    title,
    message,
    metadata: { tokenNumber, roomNumber },
  });
};

/**
 * Query notifications with filters
 */
export const listNotifications = async (hospitalId, query = {}) => {
  const { channel, status, eventType, search, limit = 50, page = 1 } = query;
  const take = Math.min(parseInt(limit, 10) || 50, 100);
  const skip = ((parseInt(page, 10) || 1) - 1) * take;

  const whereClause = {
    hospitalId,
    ...(channel && { channel: channel.toUpperCase() }),
    ...(status && { status: status.toUpperCase() }),
    ...(eventType && { eventType }),
    ...(search && {
      OR: [
        { recipient: { contains: search.trim() } },
        { title: { contains: search.trim() } },
        { message: { contains: search.trim() } },
      ],
    }),
  };

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where: whereClause }),
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page: parseInt(page, 10) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Aggregated delivery metrics
 */
export const getNotificationMetrics = async (hospitalId) => {
  const [total, sent, failed, pending] = await Promise.all([
    prisma.notification.count({ where: { hospitalId } }),
    prisma.notification.count({ where: { hospitalId, status: 'SENT' } }),
    prisma.notification.count({ where: { hospitalId, status: 'FAILED' } }),
    prisma.notification.count({ where: { hospitalId, status: 'PENDING' } }),
  ]);

  const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : 100;

  return {
    total,
    sent,
    failed,
    pending,
    deliveryRate,
  };
};

/**
 * Retry a failed notification
 */
export const retryNotification = async (hospitalId, notificationId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, hospitalId },
  });

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  const provider = getNotificationProvider(notification.channel);
  const result = await provider.send({
    recipient: notification.recipient,
    channel: notification.channel,
    eventType: notification.eventType,
    title: notification.title,
    message: notification.message,
  });

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: result.success ? 'SENT' : 'FAILED',
      errorLog: result.success ? null : result.error,
    },
  });

  return updated;
};
