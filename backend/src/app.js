// ============================================================
// backend/src/app.js
// ============================================================
// Description: Express application configuration
// Version: 1.0.0
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

// ============================================================
// INITIALIZE EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// SECURITY MIDDLEWARES
// ============================================================

// Set security HTTP headers
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

// ============================================================
// CORS CONFIGURATION
// ============================================================

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// ============================================================
// COMPRESSION
// ============================================================

app.use(compression({
  level: 6,
  threshold: 100 * 1024 // 100KB
}));

// ============================================================
// DATA SANITIZATION
// ============================================================

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Sanitize data against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['page', 'limit', 'sortBy', 'sortOrder', 'status', 'priority', 'category']
}));

// ============================================================
// COOKIE PARSER
// ============================================================

app.use(cookieParser());

// ============================================================
// RATE LIMITING
// ============================================================

const limiter = rateLimit({
  windowMs: (env.rateLimit?.window || 15) * 60 * 1000,
  max: env.rateLimit?.max || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Apply rate limiting to all API routes
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

// Request logging
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
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv || 'development',
    memory: process.memoryUsage(),
    version: '1.0.0'
  };
  res.status(200).json(healthData);
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
      }
    },
    documentation: 'https://docs.ispticketing.com',
    support: 'support@ispticketing.com'
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

// ============================================================
// ✅ ADMIN API ROUTES
// ============================================================
app.use('/api/admin', adminRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler - Must be before error handler
app.use(notFound);

// Global error handler - Must be last
app.use(errorHandler);

// ============================================================
// EXPORT APP
// ============================================================

export default app;