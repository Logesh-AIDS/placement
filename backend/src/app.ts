import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import jobRoutes from './routes/jobs.routes';
import applicationRoutes from './routes/applications.routes';
import testRoutes from './routes/tests.routes';
import testAttemptRoutes from './routes/testAttempts.routes';
import profileRoutes from './routes/profile.routes';
import settingsRoutes from './routes/settings.routes';
import codingReviewRoutes from './routes/codingReview.routes';
import { errorHandler, notFound } from './middleware/error.middleware';

dotenv.config();

const app = express();

// ── CORS must come BEFORE helmet ─────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Security ──────────────────────────────────────────────────────────────────
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false, // Don't use helmet's defaults, use our custom directives
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'", CLIENT_URL], // ← Allow frontend to embed backend PDFs
      frameSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:", "blob:"],
      objectSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// General API limiter — generous for normal usage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Auth limiter — only applies to login/register/forgot-password (NOT /me or /refresh)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 login attempts per 15 min is plenty for real use
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for token refresh and profile fetch — these are called
    // automatically on every page load and should never be rate-limited
    const skipped = ['/me', '/refresh', '/logout', '/logout-all', '/sessions', '/change-password'];
    return skipped.some((path) => req.path.endsWith(path));
  },
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes and try again.' },
});

app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Static file serving (uploaded photos & resumes) ──────────────────────────
// Serve with proper cache headers and CORS
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for uploaded files
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Remove X-Frame-Options to let CSP frameAncestors handle it
  res.removeHeader('X-Frame-Options');
  
  // FORCE NO CACHE for development (to prevent CSP caching issues)
  // In production, you can change this to: 'public, max-age=3600'
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // For PDFs, set proper content type and allow inline display
  if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
  }
  
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Placement Portal API is running.' });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/test-attempts', testAttemptRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', codingReviewRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
