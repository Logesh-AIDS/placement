import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';

// ── GET /api/tests  (all roles) ───────────────────────────────────────────────
export const getAllTests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain } = req.query;
    const params: unknown[] = [];
    let where = 'WHERE t.is_active = true';

    if (domain) { where += ' AND t.domain = $1'; params.push(domain); }

    const result = await query(
      `SELECT t.*, u.name AS created_by_name
       FROM tests t
       JOIN users u ON t.created_by = u.id
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/tests/:id  (all roles) ──────────────────────────────────────────
export const getTestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const testResult = await query(
      `SELECT t.*, u.name AS created_by_name
       FROM tests t JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (!testResult.rows[0]) return next(createError('Test not found.', 404));

    // Include questions (hide correct_answer for students)
    const isStudent = req.user!.role === 'student';
    const questionFields = isStudent
      ? 'id, test_id, question_text, options, marks'
      : 'id, test_id, question_text, options, correct_answer, marks';

    const questionsResult = await query(
      `SELECT ${questionFields} FROM questions WHERE test_id = $1 ORDER BY id`,
      [req.params.id]
    );

    res.status(200).json({
      success: true,
      data: { ...testResult.rows[0], questions: questionsResult.rows },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/tests  (admin only) ─────────────────────────────────────────────
export const createTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, domain, description, duration_minutes, total_marks, passing_marks, questions } = req.body;

    // Create test
    const testResult = await query(
      `INSERT INTO tests (title, domain, description, duration_minutes, total_marks, passing_marks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, domain, description, duration_minutes, total_marks, passing_marks, req.user!.id]
    );

    const test = testResult.rows[0];

    // Insert questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionInserts = questions.map((_: unknown, i: number) => {
        const base = i * 4;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      });

      const questionValues = questions.flatMap((q: {
        question_text: string;
        options: string[];
        correct_answer: string;
        marks?: number;
      }) => [q.question_text, JSON.stringify(q.options), q.correct_answer, q.marks ?? 1]);

      await query(
        `INSERT INTO questions (test_id, question_text, options, correct_answer, marks)
         SELECT $1, q.question_text, q.options::jsonb, q.correct_answer, q.marks
         FROM (VALUES ${questionInserts.map((_, i) => `($${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`).join(',')}) 
         AS q(question_text, options, correct_answer, marks)`,
        [test.id, ...questionValues]
      );
    }

    res.status(201).json({ success: true, message: 'Test created.', data: test });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/tests/:id  (admin only) ───────────────────────────────────────
export const updateTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, domain, description, duration_minutes, total_marks, passing_marks, is_active } = req.body;

    const result = await query(
      `UPDATE tests
       SET title           = COALESCE($1, title),
           domain          = COALESCE($2, domain),
           description     = COALESCE($3, description),
           duration_minutes= COALESCE($4, duration_minutes),
           total_marks     = COALESCE($5, total_marks),
           passing_marks   = COALESCE($6, passing_marks),
           is_active       = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [title, domain, description, duration_minutes, total_marks, passing_marks, is_active, req.params.id]
    );

    if (!result.rows[0]) return next(createError('Test not found.', 404));

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/tests/:id  (admin only) ──────────────────────────────────────
export const deleteTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query('DELETE FROM tests WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return next(createError('Test not found.', 404));

    res.status(200).json({ success: true, message: 'Test deleted.' });
  } catch (err) {
    next(err);
  }
};
