import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';

// ── POST /api/applications  (student only) ────────────────────────────────────
export const applyToJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { job_id, cover_letter } = req.body;
    const student_id = req.user!.id;

    // Check job exists and is active
    const job = await query('SELECT id, domain, min_score FROM jobs WHERE id = $1 AND is_active = true', [job_id]);
    if (!job.rows[0]) return next(createError('Job not found or no longer active.', 404));

    // Check student meets domain + score requirements
    const student = await query('SELECT domain, score, status FROM users WHERE id = $1', [student_id]);
    const s = student.rows[0];

    if (s.domain !== job.rows[0].domain) {
      return next(createError(`This job requires domain: ${job.rows[0].domain}.`, 400));
    }
    if (s.score < job.rows[0].min_score) {
      return next(createError(`Minimum score of ${job.rows[0].min_score} required.`, 400));
    }

    const result = await query(
      `INSERT INTO applications (student_id, job_id, cover_letter)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [student_id, job_id, cover_letter ?? null]
    );

    res.status(201).json({ success: true, message: 'Application submitted.', data: result.rows[0] });
  } catch (err: unknown) {
    // Unique constraint violation — already applied
    if ((err as { code?: string }).code === '23505') {
      return next(createError('You have already applied to this job.', 409));
    }
    next(err);
  }
};

// ── GET /api/applications/my  (student — own applications) ───────────────────
export const getMyApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT a.*, j.title AS job_title, j.role AS job_role, j.domain, j.location
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user!.id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/applications/job/:jobId  (hr — applications for their job) ───────
export const getApplicationsForJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // HR can only see applications for their own jobs
    const jobCheck = await query(
      'SELECT id FROM jobs WHERE id = $1 AND hr_id = $2',
      [req.params.jobId, req.user!.id]
    );
    if (!jobCheck.rows[0]) return next(createError('Job not found or access denied.', 404));

    const result = await query(
      `SELECT a.*, u.name AS student_name, u.email AS student_email,
              u.domain AS student_domain, u.score AS student_score, u.status AS student_status
       FROM applications a
       JOIN users u ON a.student_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.applied_at DESC`,
      [req.params.jobId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/applications/:id/status  (hr only) ────────────────────────────
export const updateApplicationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;

    // Ensure HR owns the job this application belongs to
    const check = await query(
      `SELECT a.id FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1 AND j.hr_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (!check.rows[0]) return next(createError('Application not found or access denied.', 404));

    const result = await query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/applications  (admin — all applications) ────────────────────────
export const getAllApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT a.*, u.name AS student_name, j.title AS job_title
       FROM applications a
       JOIN users u ON a.student_id = u.id
       JOIN jobs j ON a.job_id = j.id
       ORDER BY a.applied_at DESC`
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
