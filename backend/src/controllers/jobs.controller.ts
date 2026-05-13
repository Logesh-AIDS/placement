import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';

// ── GET /api/jobs  (all authenticated users) ──────────────────────────────────
export const getAllJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain, page = '1', limit = '20' } = req.query;

    const conditions: string[] = ['j.is_active = true'];
    const params: unknown[]    = [];
    let idx = 1;

    if (domain && domain !== 'all') {
      conditions.push(`j.domain = $${idx++}`);
      params.push(domain);
    }

    const where  = `WHERE ${conditions.join(' AND ')}`;
    const offset = (Number(page) - 1) * Number(limit);

    // Include application count per job
    const [jobsResult, countResult] = await Promise.all([
      query(
        `SELECT
           j.*,
           u.name  AS hr_name,
           u.email AS hr_email,
           COUNT(a.id)::int AS application_count
         FROM jobs j
         JOIN users u ON j.hr_id = u.id
         LEFT JOIN applications a ON a.job_id = j.id
         ${where}
         GROUP BY j.id, u.name, u.email
         ORDER BY j.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, Number(limit), offset]
      ),
      query(
        `SELECT COUNT(*) FROM jobs j ${where}`,
        params
      ),
    ]);

    res.status(200).json({
      success: true,
      data: jobsResult.rows,
      pagination: {
        total: Number(countResult.rows[0].count),
        page:  Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/jobs/:id ─────────────────────────────────────────────────────────
export const getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT
         j.*,
         u.name  AS hr_name,
         u.email AS hr_email,
         COUNT(a.id)::int AS application_count
       FROM jobs j
       JOIN users u ON j.hr_id = u.id
       LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.id = $1
       GROUP BY j.id, u.name, u.email`,
      [req.params.id]
    );

    if (!result.rows[0]) return next(createError('Job not found.', 404));

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/jobs  (hr only) ─────────────────────────────────────────────────
export const createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title, role, domain, min_score,
      description, requirements, location, salary_range,
    } = req.body;

    // Verify the requester is actually an HR user
    if (req.user!.role !== 'hr') {
      return next(createError('Only HR users can post jobs.', 403));
    }

    const result = await query(
      `INSERT INTO jobs
         (title, role, domain, min_score, description, requirements, location, salary_range, hr_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, role, domain, min_score, description, requirements ?? null,
       location ?? null, salary_range ?? null, req.user!.id]
    );

    res.status(201).json({ success: true, message: 'Job posted.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/jobs/:id  (hr own jobs / admin any) ────────────────────────────
export const updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title, role, domain, min_score,
      description, requirements, location, salary_range, is_active,
    } = req.body;

    const ownerCheck  = req.user!.role === 'hr' ? 'AND hr_id = $2' : '';
    const checkParams = req.user!.role === 'hr'
      ? [req.params.id, req.user!.id]
      : [req.params.id];

    const existing = await query(
      `SELECT id FROM jobs WHERE id = $1 ${ownerCheck}`,
      checkParams
    );
    if (!existing.rows[0]) return next(createError('Job not found or access denied.', 404));

    const result = await query(
      `UPDATE jobs
       SET title        = COALESCE($1,  title),
           role         = COALESCE($2,  role),
           domain       = COALESCE($3,  domain),
           min_score    = COALESCE($4,  min_score),
           description  = COALESCE($5,  description),
           requirements = COALESCE($6,  requirements),
           location     = COALESCE($7,  location),
           salary_range = COALESCE($8,  salary_range),
           is_active    = COALESCE($9,  is_active)
       WHERE id = $10
       RETURNING *`,
      [title, role, domain, min_score, description,
       requirements, location, salary_range, is_active, req.params.id]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/jobs/:id ──────────────────────────────────────────────────────
export const deleteJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerCheck = req.user!.role === 'hr' ? 'AND hr_id = $2' : '';
    const params     = req.user!.role === 'hr'
      ? [req.params.id, req.user!.id]
      : [req.params.id];

    const result = await query(
      `DELETE FROM jobs WHERE id = $1 ${ownerCheck} RETURNING id`,
      params
    );

    if (!result.rows[0]) return next(createError('Job not found or access denied.', 404));

    res.status(200).json({ success: true, message: 'Job deleted.' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/jobs/my  (hr — own jobs with application counts) ─────────────────
export const getMyJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT
         j.*,
         COUNT(a.id)::int AS application_count
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.id
       WHERE j.hr_id = $1
       GROUP BY j.id
       ORDER BY j.created_at DESC`,
      [req.user!.id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
