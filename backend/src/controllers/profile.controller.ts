import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ── GET /api/profile  — load own profile ─────────────────────────────────────
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, name, email, role, domain, score, status,
              phone, college, graduation_year,
              profile_photo_url, resume_url, resume_name,
              last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.user!.id]
    );

    if (!result.rows[0]) return next(createError('User not found.', 404));

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/profile  — update text fields ──────────────────────────────────
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone, college, graduation_year } = req.body as {
      name?: string;
      phone?: string;
      college?: string;
      graduation_year?: string;
    };

    const result = await query(
      `UPDATE users
       SET name            = COALESCE($1, name),
           phone           = COALESCE($2, phone),
           college         = COALESCE($3, college),
           graduation_year = COALESCE($4, graduation_year)
       WHERE id = $5
       RETURNING id, name, email, role, domain, score, status,
                 phone, college, graduation_year,
                 profile_photo_url, resume_url, resume_name`,
      [name || null, phone || null, college || null, graduation_year || null, req.user!.id]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/photo  — upload profile photo ──────────────────────────
export const uploadProfilePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) return next(createError('No photo file provided.', 400));

    // Remove query parameter - it can cause CORS issues and isn't needed
    // The browser will cache-bust naturally when the filename changes
    const photoUrl = `${BASE_URL}/uploads/photos/${req.file.filename}`;

    // Delete old photo file if it exists
    const existing = await query('SELECT profile_photo_url FROM users WHERE id = $1', [req.user!.id]);
    const oldUrl   = existing.rows[0]?.profile_photo_url as string | null;
    if (oldUrl) deleteFileFromUrl(oldUrl, 'photos');

    await query(
      'UPDATE users SET profile_photo_url = $1 WHERE id = $2',
      [photoUrl, req.user!.id]
    );

    res.status(200).json({
      success: true,
      message: 'Photo uploaded.',
      data: { profile_photo_url: photoUrl },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/profile/photo ─────────────────────────────────────────────────
export const deleteProfilePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await query('SELECT profile_photo_url FROM users WHERE id = $1', [req.user!.id]);
    const oldUrl   = existing.rows[0]?.profile_photo_url as string | null;
    if (oldUrl) deleteFileFromUrl(oldUrl, 'photos');

    await query('UPDATE users SET profile_photo_url = NULL WHERE id = $1', [req.user!.id]);

    res.status(200).json({ success: true, message: 'Photo removed.' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/profile/resume  — upload resume ─────────────────────────────────
export const uploadResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) return next(createError('No resume file provided.', 400));

    const resumeUrl  = `${BASE_URL}/uploads/resumes/${req.file.filename}`;
    const resumeName = req.file.originalname;

    // Delete old resume file
    const existing = await query('SELECT resume_url FROM users WHERE id = $1', [req.user!.id]);
    const oldUrl   = existing.rows[0]?.resume_url as string | null;
    if (oldUrl) deleteFileFromUrl(oldUrl, 'resumes');

    await query(
      'UPDATE users SET resume_url = $1, resume_name = $2 WHERE id = $3',
      [resumeUrl, resumeName, req.user!.id]
    );

    res.status(200).json({
      success: true,
      message: 'Resume uploaded.',
      data: { resume_url: resumeUrl, resume_name: resumeName },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/profile/resume ────────────────────────────────────────────────
export const deleteResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await query('SELECT resume_url FROM users WHERE id = $1', [req.user!.id]);
    const oldUrl   = existing.rows[0]?.resume_url as string | null;
    if (oldUrl) deleteFileFromUrl(oldUrl, 'resumes');

    await query(
      'UPDATE users SET resume_url = NULL, resume_name = NULL WHERE id = $1',
      [req.user!.id]
    );

    res.status(200).json({ success: true, message: 'Resume removed.' });
  } catch (err) {
    next(err);
  }
};

// ── Helper ────────────────────────────────────────────────────────────────────
function deleteFileFromUrl(url: string, subdir: 'photos' | 'resumes'): void {
  try {
    // Extract filename, removing any query parameters
    const urlWithoutQuery = url.split('?')[0];
    const filename = path.basename(urlWithoutQuery);
    const filepath = path.join(process.cwd(), 'uploads', subdir, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch {
    // Non-fatal — log but don't crash
    console.warn('[Profile] Could not delete old file:', url);
  }
}

// ── GET /api/profile/student/:id  — HR/admin view a student's profile ────────
export const getStudentProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Only HR and admin can view other students' profiles
    if (!['hr', 'admin'].includes(req.user!.role)) {
      return next(createError('Access denied.', 403));
    }

    const result = await query(
      `SELECT id, name, email, domain, score, status,
              phone, college, graduation_year,
              profile_photo_url, resume_url, resume_name,
              created_at
       FROM users WHERE id = $1 AND role = 'student'`,
      [req.params.id]
    );

    if (!result.rows[0]) return next(createError('Student not found.', 404));

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
