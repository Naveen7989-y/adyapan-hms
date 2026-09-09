import { Server } from 'socket.io';
import { verifyToken } from '../../utils/token.js';
import prisma from '../../config/db.js';

let ioInstance = null;

/**
 * Initialize Socket.IO with the HTTP Server instance
 * @param {import('http').Server} httpServer
 * @param {string|string[]} allowedOrigins
 */
export function initSocketIO(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Middleware for Authentication & Room Assignment
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const isPublicDisplay = socket.handshake.query?.isPublicDisplay === 'true';

    // Allow public displays to connect unauthenticated to public room
    if (isPublicDisplay || !token) {
      socket.data.isPublic = true;
      socket.data.hospitalId = socket.handshake.query?.hospitalId || 'public';
      return next();
    }

    try {
      const decoded = verifyToken(token);
      socket.data.user = decoded;
      socket.data.isPublic = false;
      socket.data.hospitalId = decoded.hospitalId;
      next();
    } catch (err) {
      // If token invalid, fall back to public safe or reject
      socket.data.isPublic = true;
      socket.data.hospitalId = 'public';
      next();
    }
  });

  io.on('connection', (socket) => {
    const { user, isPublic, hospitalId } = socket.data;

    if (isPublic) {
      // Public display screens join public-safe display room
      const publicRoom = `public:queue:${hospitalId}`;
      socket.join(publicRoom);
    } else if (user) {
      // Staff join hospital-wide room
      socket.join(`hospital:${user.hospitalId}`);

      // Doctors join their personal queue room
      if (user.role === 'DOCTOR' && socket.handshake.query?.doctorId) {
        socket.join(`doctor:${socket.handshake.query.doctorId}`);
      }

      // Department-specific room if provided
      if (socket.handshake.query?.departmentId) {
        socket.join(`department:${socket.handshake.query.departmentId}`);
      }
    }

    // Client requests to join a specific doctor queue room (validate hospital ownership)
    socket.on('subscribe:doctor_queue', async ({ doctorId }) => {
      if (!isPublic && doctorId && user?.hospitalId) {
        try {
          const doctor = await prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: user.hospitalId },
            select: { id: true },
          });
          if (doctor) {
            socket.join(`doctor:${doctorId}`);
          }
        } catch (err) {
          console.error('Socket doctor_queue subscription error:', err.message);
        }
      }
    });

    socket.on('unsubscribe:doctor_queue', ({ doctorId }) => {
      if (doctorId) {
        socket.leave(`doctor:${doctorId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Access the Socket.IO instance anywhere in backend services
 * @returns {Server|null}
 */
export function getIO() {
  return ioInstance;
}

// ============================================================
// REAL-TIME EVENT DISPATCHERS
// ============================================================

/**
 * 1. Dispatch Patient Check-In Event
 */
export function emitCheckIn(hospitalId, data) {
  if (!ioInstance) return;
  const { doctorId, departmentId, token, appointment } = data;

  // Staff event with patient details
  const staffPayload = {
    eventId: `checkin-${Date.now()}-${token.id}`,
    token,
    appointment,
    timestamp: new Date().toISOString(),
  };

  ioInstance.to(`hospital:${hospitalId}`).emit('queue:checkin', staffPayload);
  if (doctorId) ioInstance.to(`doctor:${doctorId}`).emit('queue:checkin', staffPayload);
  if (departmentId) ioInstance.to(`department:${departmentId}`).emit('queue:checkin', staffPayload);

  // Public-safe event without medical details
  const publicPayload = {
    tokenNumber: `T-${String(token.tokenNumber).padStart(3, '0')}`,
    tokenType: token.tokenType,
    queueDate: token.queueDate,
    status: token.status,
  };
  ioInstance.to(`public:queue:${hospitalId}`).emit('public:queue:update', publicPayload);
}

/**
 * 2. Dispatch Call Next Patient Event
 */
export function emitCallNext(hospitalId, data) {
  if (!ioInstance) return;
  const { doctorId, token, roomNumber, doctorName } = data;

  const tokenFormatted = `T-${String(token.tokenNumber).padStart(3, '0')}`;
  const speechText = `Token ${tokenFormatted}, please proceed to ${doctorName || 'Doctor'} in ${roomNumber || 'Consultation Room'}.`;

  // Staff payload
  const staffPayload = {
    eventId: `call-${Date.now()}-${token.id}`,
    token,
    roomNumber,
    doctorName,
    speechText,
    timestamp: new Date().toISOString(),
  };
  ioInstance.to(`hospital:${hospitalId}`).emit('queue:called', staffPayload);
  if (doctorId) ioInstance.to(`doctor:${doctorId}`).emit('queue:called', staffPayload);

  // Public display payload (Only token #, room, doctor, and speech text)
  const publicPayload = {
    tokenNumber: tokenFormatted,
    tokenType: token.tokenType,
    roomNumber: roomNumber || 'Room 101',
    doctorName: doctorName || 'Doctor',
    speechText,
    timestamp: new Date().toISOString(),
  };
  ioInstance.to(`public:queue:${hospitalId}`).emit('public:queue:called', publicPayload);
}

/**
 * 3. Dispatch Consultation Status Change (Start, Complete, Cancel)
 */
export function emitConsultationStatus(hospitalId, data) {
  if (!ioInstance) return;
  const { doctorId, consultationId, status, token, appointment } = data;

  const payload = {
    eventId: `consultation-${Date.now()}-${consultationId}`,
    consultationId,
    status,
    token,
    appointment,
    timestamp: new Date().toISOString(),
  };

  ioInstance.to(`hospital:${hospitalId}`).emit('queue:status_changed', payload);
  if (doctorId) ioInstance.to(`doctor:${doctorId}`).emit('queue:status_changed', payload);

  // Public queue state refresh
  ioInstance.to(`public:queue:${hospitalId}`).emit('public:queue:update', {
    tokenNumber: token?.tokenNumber ? `T-${String(token.tokenNumber).padStart(3, '0')}` : undefined,
    status: token?.status || status,
  });
}

/**
 * 4. Dispatch Queue Transfer Event
 */
export function emitQueueTransfer(hospitalId, data) {
  if (!ioInstance) return;
  const { fromDoctorId, toDoctorId, token } = data;

  const payload = {
    eventId: `transfer-${Date.now()}-${token.id}`,
    fromDoctorId,
    toDoctorId,
    token,
    timestamp: new Date().toISOString(),
  };

  ioInstance.to(`hospital:${hospitalId}`).emit('queue:transferred', payload);
  if (fromDoctorId) ioInstance.to(`doctor:${fromDoctorId}`).emit('queue:transferred', payload);
  if (toDoctorId) ioInstance.to(`doctor:${toDoctorId}`).emit('queue:transferred', payload);
  ioInstance.to(`public:queue:${hospitalId}`).emit('public:queue:update', {
    tokenNumber: `T-${String(token.tokenNumber).padStart(3, '0')}`,
    status: 'TRANSFERRED',
  });
}

/**
 * 5. Dispatch Priority / Emergency Status Event
 */
export function emitPriorityUpdate(hospitalId, data) {
  if (!ioInstance) return;
  const { doctorId, token } = data;

  const payload = {
    eventId: `priority-${Date.now()}-${token.id}`,
    token,
    timestamp: new Date().toISOString(),
  };

  ioInstance.to(`hospital:${hospitalId}`).emit('queue:priority_updated', payload);
  if (doctorId) ioInstance.to(`doctor:${doctorId}`).emit('queue:priority_updated', payload);
}
