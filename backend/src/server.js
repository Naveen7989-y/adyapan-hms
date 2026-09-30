import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { initSocketIO } from './modules/realtime/socket.service.js';
import { expirePastDayAppointments } from './modules/appointments/appointment.service.js';

const allowedOrigins = config.frontendUrl && config.frontendUrl.includes(',')
  ? config.frontendUrl.split(',').map((o) => o.trim())
  : (config.frontendUrl || 'http://localhost:5173');

const server = http.createServer(app);

// Attach Socket.IO for real-time bi-directional communication
initSocketIO(server, allowedOrigins);

server.listen(config.port, () => {
  console.log(`===================================================`);
  console.log(` Adyapan HMS Backend Service Started Successfully`);
  console.log(` Port: ${config.port}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Health check: http://localhost:${config.port}/api/health`);
  console.log(` Socket.IO: Real-Time Engine Active`);
  console.log(`===================================================`);

  
  // Run day-change auto-expiration immediately on start
  expirePastDayAppointments().catch((err) =>
    console.error('Initial auto-expire failed:', err.message)
  );
  setInterval(()=>{
    console.log(process.memoryUsage())
    console.log('Heartbeat: ' + new Date().toISOString());
  }, 300000);
  // Set recurring check every 10 minutes to auto-expire when date rolls over to midnight
  setInterval(() => {
    expirePastDayAppointments().catch((err) =>
      console.error('Periodic auto-expire failed:', err.message)
    );
  }, 10 * 60 * 1000);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});
