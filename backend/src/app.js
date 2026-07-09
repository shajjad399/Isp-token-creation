// ============================================================
// backend/src/app.js
// ============================================================
// Description: Express application configuration
// Version: 2.0.0
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
// (ফাইলের একদম শুরুতে, অন্য import গুলোর সাথে যোগ করো)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Import configurations
import env from './config/env.js';
import logger from './config/logger.js';

// Import middleware
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
// ✅ Billing & Payment routes — notun add kora hoyeche (Billing Step 1)
import billingRoutes from './routes/billingRoutes.js';

// ============================================================
// INITIALIZE EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// ✅ CORS CONFIGURATION - PRODUCTION READY
// ============================================================

// Dynamic whitelist based on environment
const getCorsOrigin = () => {
  // Development origins
  const devOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  // Production origins from environment
  const prodOrigins = [];

  // Add FRONTEND_URL from environment if exists
  if (env.frontendUrl && env.frontendUrl !== 'http://localhost:5173') {
    prodOrigins.push(env.frontendUrl);
  }

  // Add Render URL pattern (if deployed on Render)
  if (process.env.RENDER_EXTERNAL_URL) {
    prodOrigins.push(process.env.RENDER_EXTERNAL_URL);
  }

  // Add Vercel URL pattern (wildcard for preview deployments)
  const vercelPattern = /\.vercel\.app$/;

  // Combine all origins
  const allowedOrigins = [...devOrigins, ...prodOrigins];

  // Return function for dynamic origin validation
  return function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    // Also check against Vercel pattern
    const isVercel = vercelPattern.test(origin);

    if (isAllowed || isVercel) {
      callback(null, true);
    } else {
      if (env.isDevelopment) {
        console.warn(`⚠️ CORS: Unknown origin "${origin}" - allowing in development mode`);
        callback(null, true);
      } else {
        console.warn(`❌ CORS: Blocked origin "${origin}"`);
        callback(new Error('Not allowed by CORS'), false);
      }
    }
  };
};

// CORS options
const corsOptions = {
  origin: getCorsOrigin(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================================
// SECURITY MIDDLEWARES
// ============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression({
  level: 6,
  threshold: 100 * 1024
}));

// ============================================================
// DATA SANITIZATION
// ============================================================

app.use(mongoSanitize());
app.use(xss());
app.use(hpp({
  whitelist: ['page', 'limit', 'sortBy', 'sortOrder', 'status', 'priority', 'category']
}));

app.use(cookieParser());

// ============================================================
// ✅ STATIC FILE SERVING - Uploaded avatars
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({
  windowMs: (env.rateLimit?.window || 15) * 60 * 1000,
  max: env.rateLimit?.max || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
app.use('/api', limiter);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 10000
}));

// ============================================================
// LOGGING
// ============================================================

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv || 'development',
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// ============================================================
// API DOCUMENTATION
// ============================================================

app.get('/', (req, res) => {
  res.json({
    name: 'ISP Ticketing System API',
    version: '1.0.0',
    description: 'Enterprise-grade support ticketing system',
    environment: env.nodeEnv || 'development',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        logout: 'POST /api/v1/auth/logout',
        profile: 'GET /api/v1/auth/profile',
        changePassword: 'POST /api/v1/auth/change-password',
        forgotPassword: 'POST /api/v1/auth/forgot-password',
        resetPassword: 'POST /api/v1/auth/reset-password'
      },
      tickets: {
        create: 'POST /api/v1/tickets',
        list: 'GET /api/v1/tickets',
        details: 'GET /api/v1/tickets/:id',
        update: 'PUT /api/v1/tickets/:id',
        delete: 'DELETE /api/v1/tickets/:id',
        status: 'PATCH /api/v1/tickets/:id/status',
        assign: 'PATCH /api/v1/tickets/:id/assign',
        comments: 'POST /api/v1/tickets/:id/comments',
        dashboard: 'GET /api/v1/tickets/dashboard/stats'
      },
      admin: {
        users: 'GET /api/admin/users',
        createUser: 'POST /api/admin/users',
        updateUser: 'PUT /api/admin/users/:id',
        deleteUser: 'DELETE /api/admin/users/:id',
        stats: 'GET /api/admin/stats'
      },
      billing: {
        summary: 'GET /api/v1/billing/invoices/summary',
        list: 'GET /api/v1/billing/invoices',
        create: 'POST /api/v1/billing/invoices',
        details: 'GET /api/v1/billing/invoices/:id',
        update: 'PUT /api/v1/billing/invoices/:id',
        delete: 'DELETE /api/v1/billing/invoices/:id',
        recordPayment: 'PATCH /api/v1/billing/invoices/:id/payment',
        cancel: 'PATCH /api/v1/billing/invoices/:id/cancel'
      }
    }
  });
});

// ============================================================
// ✅ API ROUTES - MAIN
// ============================================================

// Public API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/chats', chatRoutes);
// ✅ Billing & Payment API — notun add kora hoyeche (Billing Step 1)
app.use('/api/v1/billing', billingRoutes);

// ============================================================
// ✅ ADMIN API ROUTES (FIXED)
// ============================================================
app.use('/api/admin', adminRoutes);

// ============================================================
// ✅ DEBUG LOGGING (Add this temporarily)
// ============================================================
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFound);
app.use(errorHandler);

// ============================================================
// EXPORT APP
// ============================================================

export default app;