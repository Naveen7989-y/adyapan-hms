import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import patientRoutes from './modules/patients/patient.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import doctorRoutes from './modules/doctors/doctor.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import tokenRoutes from './modules/tokens/token.routes.js';
import checkinRoutes from './modules/tokens/checkin.routes.js';
import queueRoutes from './modules/queue/queue.routes.js';
import consultationRoutes from './modules/consultations/consultation.routes.js';
import prescriptionRoutes from './modules/prescriptions/prescription.routes.js';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorHandler.js';
import { generalApiLimiter } from './middlewares/rateLimiter.js';

const app = express();

// Trust reverse proxy (Nginx / Cloudflare / Load Balancers) for accurate client IP detection & rate limiting
app.set('trust proxy', 1);

// Security and basic middlewares
app.use(helmet());
const allowedOrigins = config.frontendUrl && config.frontendUrl.includes(',')
  ? config.frontendUrl.split(',').map((o) => o.trim())
  : (config.frontendUrl || 'http://localhost:5173');

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'production') {
  app.use(morgan('combined'));
} else if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Global API Rate Limiting
app.use('/api', generalApiLimiter);

// Healthcare Data Security: Prevent client/proxy disk caching of sensitive clinical records
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);

// Fallback handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
