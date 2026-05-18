import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';
import { UserRole, DomainType } from '../types';
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  hashToken,
  refreshTokenExpiry,
} from '../utils/token.utils';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, domain } = req.body as {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      domain?: DomainType;
    };

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return next(createError('Email already registered.', 409));
    }

    if (role === 'student' && !domain) {
      return next(createError('Domain is required for students.', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password, role, domain, password_changed_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id, name, email, role, domain, score, status, created_at`,
      [name, email, hashedPassword, role, domain ?? null]
    );

    const user = result.rows[0];

    // Issue both tokens on registration
    const accessToken  = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken();

    await storeRefreshToken(user.id, refreshToken, req);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const result = await query(
      `SELECT id, name, email, password, role, domain, score, status,
              is_active, failed_attempts, locked_until
       FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    // Use a generic message to prevent user enumeration
    if (!user) {
      return next(createError('Invalid email or password.', 401));
    }

    // Check account is active
    if (!user.is_active) {
      return next(createError('Account has been deactivated. Contact support.', 403));
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / 60000
      );
      return next(
        createError(`Account locked. Try again in ${minutesLeft} minute(s).`, 423)
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await handleFailedLogin(user.id, user.failed_attempts);
      return next(createError('Invalid email or password.', 401));
    }

    // Reset failed attempts and update last login on success
    await query(
      `UPDATE users
       SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    const accessToken  = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken();

    await storeRefreshToken(user.id, refreshToken, req);

    const { password: _pw, failed_attempts: _fa, locked_until: _lu, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
        expiresIn: '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };

    if (!token) {
      return next(createError('Refresh token is required.', 400));
    }

    const tokenHash = hashToken(token);

    // Look up the token in DB
    const result = await query(
      `SELECT rt.*, u.id AS uid, u.email, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    const stored = result.rows[0];

    // Token not found or already revoked
    if (!stored || stored.revoked_at) {
      // Possible token reuse attack — revoke ALL tokens for this user
      if (stored) {
        await query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1', [stored.user_id]);
      }
      return next(createError('Invalid or revoked refresh token.', 401));
    }

    // Token expired
    if (new Date(stored.expires_at) < new Date()) {
      await query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1', [stored.id]);
      return next(createError('Refresh token expired. Please log in again.', 401));
    }

    if (!stored.is_active) {
      return next(createError('Account has been deactivated.', 403));
    }

    // ── Token rotation: revoke old, issue new ─────────────────────────────────
    await query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1',
      [stored.id]
    );

    const newAccessToken  = generateAccessToken(stored.uid, stored.email, stored.role);
    const newRefreshToken = generateRefreshToken();

    await storeRefreshToken(stored.uid, newRefreshToken, req);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: '15m',
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as { refreshToken?: string };

    if (token) {
      const tokenHash = hashToken(token);
      // Revoke this specific refresh token
      await query(
        'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1',
        [tokenHash]
      );
    }

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/logout-all ─────────────────────────────────────────────────
// Revokes all sessions for the authenticated user (e.g. "sign out everywhere")
export const logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL',
      [req.user!.id]
    );

    res.status(200).json({ success: true, message: 'All sessions revoked.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, name, email, role, domain, score, status,
              last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.user!.id]
    );

    if (!result.rows[0]) {
      return next(createError('User not found.', 404));
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/auth/change-password ──────────────────────────────────────────
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const result = await query('SELECT id, password FROM users WHERE id = $1', [req.user!.id]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(createError('Current password is incorrect.', 400));
    }

    if (currentPassword === newPassword) {
      return next(createError('New password must differ from current password.', 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and set password_changed_at — this invalidates all existing access tokens
    await query(
      `UPDATE users
       SET password = $1, password_changed_at = CURRENT_TIMESTAMP, failed_attempts = 0
       WHERE id = $2`,
      [hashedPassword, req.user!.id]
    );

    // Revoke all refresh tokens to force re-login on all devices
    await query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL',
      [req.user!.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed. Please log in again on all devices.',
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body as { email: string };

    const result = await query('SELECT id FROM users WHERE email = $1 AND is_active = true', [email]);

    // Always return 200 to prevent email enumeration
    if (!result.rows[0]) {
      res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
      return;
    }

    const userId = result.rows[0].id;
    const resetToken = generateResetToken();
    const tokenHash  = hashToken(resetToken);

    // Invalidate any existing reset tokens for this user
    await query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL',
      [userId]
    );

    // Store new reset token (expires in 10 minutes)
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '10 minutes')`,
      [userId, tokenHash]
    );

    // In production: send email with reset link containing raw resetToken
    // e.g. https://yourapp.com/reset-password?token=<resetToken>
    // For now, return token in dev mode only
    const devData = process.env.NODE_ENV === 'development' ? { resetToken } : {};

    res.status(200).json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
      ...devData,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/reset-password ────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };

    const tokenHash = hashToken(token);

    const result = await query(
      `SELECT prt.id, prt.user_id
       FROM password_reset_tokens prt
       WHERE prt.token_hash = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > CURRENT_TIMESTAMP`,
      [tokenHash]
    );

    if (!result.rows[0]) {
      return next(createError('Invalid or expired reset token.', 400));
    }

    const { id: tokenId, user_id } = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used in a single transaction
    await query('BEGIN');
    try {
      await query(
        `UPDATE users
         SET password = $1, password_changed_at = CURRENT_TIMESTAMP, failed_attempts = 0, locked_until = NULL
         WHERE id = $2`,
        [hashedPassword, user_id]
      );

      await query(
        'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
        [tokenId]
      );

      // Revoke all refresh tokens
      await query(
        'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL',
        [user_id]
      );

      await query('COMMIT');
    } catch (txErr) {
      await query('ROLLBACK');
      throw txErr;
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/sessions ────────────────────────────────────────────────────
// Lists all active sessions for the current user
export const getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, ip_address, user_agent, created_at, expires_at
       FROM refresh_tokens
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC`,
      [req.user!.id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/auth/sessions/:id ────────────────────────────────────────────
// Revoke a specific session by its DB id
export const revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
       RETURNING id`,
      [req.params.id, req.user!.id]
    );

    if (!result.rows[0]) {
      return next(createError('Session not found.', 404));
    }

    res.status(200).json({ success: true, message: 'Session revoked.' });
  } catch (err) {
    next(err);
  }
};

// ── Private helpers ───────────────────────────────────────────────────────────

const storeRefreshToken = async (userId: number, rawToken: string, req: Request): Promise<void> => {
  const tokenHash = hashToken(rawToken);
  const expiresAt = refreshTokenExpiry();
  const ip        = req.ip ?? req.socket.remoteAddress ?? null;
  const ua        = req.headers['user-agent'] ?? null;

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, ip, ua]
  );
};

const handleFailedLogin = async (userId: number, currentAttempts: number): Promise<void> => {
  const newAttempts = currentAttempts + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    // Lock the account
    await query(
      `UPDATE users
       SET failed_attempts = $1,
           locked_until = CURRENT_TIMESTAMP + INTERVAL '${LOCK_DURATION_MINUTES} minutes'
       WHERE id = $2`,
      [newAttempts, userId]
    );
  } else {
    await query('UPDATE users SET failed_attempts = $1 WHERE id = $2', [newAttempts, userId]);
  }
};
