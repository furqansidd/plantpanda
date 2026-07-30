import dotenv from 'dotenv';
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  MONGO_URI: required('MONGO_URI', 'mongodb://localhost:27017/plantpanda'),
  REDIS_URL: required('REDIS_URL', 'redis://localhost:6379'),

  JWT_SECRET: required('JWT_SECRET', 'dev_secret_change_me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME: process.env.COOKIE_NAME || 'pp_token',

  CLIENT_ORIGIN: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),

  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',

  DISPATCH_INITIAL_RADIUS_KM: parseFloat(process.env.DISPATCH_INITIAL_RADIUS_KM || '5'),
  DISPATCH_EXPANDED_RADIUS_KM: parseFloat(process.env.DISPATCH_EXPANDED_RADIUS_KM || '8'),
  DISPATCH_ESCALATION_SECONDS: parseInt(process.env.DISPATCH_ESCALATION_SECONDS || '180', 10),

  COD_BLOCK_THRESHOLD: parseFloat(process.env.COD_BLOCK_THRESHOLD || '5000'),

  DEFAULT_PER_KM_RATE: parseFloat(process.env.DEFAULT_PER_KM_RATE || '20'),
  DEFAULT_BASE_FEE: parseFloat(process.env.DEFAULT_BASE_FEE || '20'),
  DEFAULT_COMMISSION_RATE: parseFloat(process.env.DEFAULT_COMMISSION_RATE || '10'),
};
