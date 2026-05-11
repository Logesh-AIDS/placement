import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserRole, JwtPayload } from '../types';

// ── Access token (short-lived, 15 min) ───────────────────────────────────────
export const generateAccessToken = (id: number, email: string, role: UserRole): string => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );
};

// ── Refresh token (long-lived opaque token, 7 days) ──────────────────────────
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

// ── Hash a token before storing in DB (never store raw tokens) ───────────────
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ── Verify access token ───────────────────────────────────────────────────────
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
};

// ── Generate a secure random token for password reset ────────────────────────
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// ── Refresh token expiry date (7 days from now) ───────────────────────────────
export const refreshTokenExpiry = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
};
