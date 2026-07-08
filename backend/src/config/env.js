// ============================================================
// backend/src/config/env.js
// ============================================================
// Description: Environment configuration
// Version: 2.0.0
// ============================================================

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Using default values for missing variables.');
}

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

const env = {
  // Server
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/isp-ticketing',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key_here',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },
  
  // ✅ Email - via Resend HTTP API (SMTP ports are blocked on Render free tier)
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev'
  },
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Rate Limiting
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  
  // Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
    path: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    cookieExpires: parseInt(process.env.COOKIE_EXPIRES) || 7
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  
  // Features
  features: {
    enableEmail: process.env.ENABLE_EMAIL === 'true' || !!process.env.RESEND_API_KEY,
    enableSms: process.env.ENABLE_SMS === 'true',
    enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true'
  },
  
  // Environment helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};

// ============================================================
// ENVIRONMENT LOGGING
// ============================================================

if (env.isDevelopment) {
  console.log('🔧 Environment Configuration:');
  console.log(`  PORT: ${env.port}`);
  console.log(`  NODE_ENV: ${env.nodeEnv}`);
  console.log(`  FRONTEND_URL: ${env.frontendUrl}`);
  console.log(`  DATABASE: ${env.mongodbUri.split('/').pop()}`);
  console.log(`  EMAIL_ENABLED: ${env.features.enableEmail}`);
  console.log(`  EMAIL_USER: ${env.email.resendApiKey ? '✅ Configured' : '❌ Not configured'}`);
}

// ============================================================
// EXPORT ENV
// ============================================================

export default env;