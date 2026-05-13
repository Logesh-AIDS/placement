import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';

// ── GET /api/settings  (public — students need passing_score) ─────────────────
export const getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query('SELECT key, value FROM portal_settings');
    const settings: Record<string, string> = {};
    result.rows.forEach((r: { key: string; value: string }) => {
      settings[r.key] = r.value;
    });
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/settings  (admin only) ────────────────────────────────────────
export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { passing_score } = req.body as { passing_score?: number };

    if (passing_score !== undefined) {
      await query(
        `INSERT INTO portal_settings (key, value, updated_at)
         VALUES ('passing_score', $1, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
        [String(passing_score)]
      );
    }

    const result = await query('SELECT key, value FROM portal_settings');
    const settings: Record<string, string> = {};
    result.rows.forEach((r: { key: string; value: string }) => {
      settings[r.key] = r.value;
    });

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};
