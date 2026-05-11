import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { verifyAccessToken } from '../utils/token.utils';
import { UserRole } from '../types';

// ── Verify JWT access token + live DB checks ──────────────────────────────────
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // 1. Verify user still exists and is active
    const result = await query(
      'SELECT id, email, role, is_active, password_changed_at FROM users WHERE id = $1',
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({ success: false, message: 'User no longer exists.' });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({ success: false, message: 'Account has been deactivated.' });
      return;
    }

    // 2. Reject token if password was changed after it was issued
    if (decoded.iat && user.password_changed_at) {
      const passwordChangedAt = Math.floor(
        new Date(user.password_changed_at).getTime() / 1000
      );
      if (decoded.iat < passwordChangedAt) {
        res.status(401).json({
          success: false,
          message: 'Password was recently changed. Please log in again.',
        });
        return;
      }
    }

    req.user = { id: user.id, email: user.email, role: user.role, iat: decoded.iat };
    next();
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === 'TokenExpiredError'
        ? 'Token expired. Please refresh your session.'
        : 'Invalid token.';

    res.status(401).json({ success: false, message });
  }
};

// ── Role-based access control ─────────────────────────────────────────────────
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
};
