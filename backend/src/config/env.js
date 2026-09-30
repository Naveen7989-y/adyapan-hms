import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default_jwt_secret') {
    console.error('FATAL: JWT_SECRET must be defined with a secure random key in production!');
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
};