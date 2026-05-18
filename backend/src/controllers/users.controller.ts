import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';

// ── GET /api/users  (admin only) ──────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, domain, status, page = '1', limit = '20' } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (role)   { conditions.push(`role = $${paramIndex++}`);   params.push(role); }
    if (domain) { conditions.push(`domain = $${paramIndex++}`); params.push(domain); }
    if (status) { conditions.push(`status = $${paramIndex++}`); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [usersResult, countResult] = await Promise.all([
      query(
        `SELECT id, name, email, role, domain, score, status, created_at
         FROM users ${where}
         ORDER BY created_at DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, Number(limit), offset]
      ),
      query(`SELECT COUNT(*) FROM users ${where}`, params),
    ]);

    res.status(200).json({
      success: true,
      data: usersResult.rows,
      pagination: {
        total: Number(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/:id  (admin only) ─────────────────────────────────────────
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, name, email, role, domain, score, status, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (!result.rows[0]) return next(createError('User not found.', 404));

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/users/:id  (admin only) ───────────────────────────────────────
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, role, domain, status } = req.body;

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           role = COALESCE($2, role),
           domain = COALESCE($3, domain),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING id, name, email, role, domain, score, status`,
      [name, role, domain, status, req.params.id]
    );

    if (!result.rows[0]) return next(createError('User not found.', 404));

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/users/:id  (admin only) ──────────────────────────────────────
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);

    if (!result.rows[0]) return next(createError('User not found.', 404));

    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
};
