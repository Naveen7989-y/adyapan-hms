import prisma from '../../config/db.js';

export const getHealthStatus = async () => {
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected';

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    system: 'Adyapan Hospital Queue & Appointment System API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };
};

