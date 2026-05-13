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
import { errorHandler, notFound } from './middleware/error.middleware';

dotenv.config();

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

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
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
