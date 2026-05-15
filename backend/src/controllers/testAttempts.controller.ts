import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';

// ── POST /api/test-attempts/start  (student only) ────────────────────────────
export const startAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { test_id } = req.body;
    const student_id = req.user!.id;

    // Check test exists and is active
    const test = await query('SELECT id, total_marks, domain FROM tests WHERE id = $1 AND is_active = true', [test_id]);
    if (!test.rows[0]) return next(createError('Test not found or inactive.', 404));

    // Check student domain matches test domain
    const student = await query('SELECT domain FROM users WHERE id = $1', [student_id]);
    if (student.rows[0].domain !== test.rows[0].domain) {
      return next(createError(`This test is for domain: ${test.rows[0].domain}.`, 400));
    }

    // Check no existing attempt
    const existing = await query(
      'SELECT id FROM test_attempts WHERE student_id = $1 AND test_id = $2',
      [student_id, test_id]
    );
    if (existing.rows[0]) return next(createError('You have already attempted this test.', 409));

    const result = await query(
      `INSERT INTO test_attempts (student_id, test_id, score, total_marks)
       VALUES ($1, $2, 0, $3)
       RETURNING *`,
      [student_id, test_id, test.rows[0].total_marks]
    );

    res.status(201).json({ success: true, message: 'Test started.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/test-attempts/:id/submit  (student only) ───────────────────────
export const submitAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { answers } = req.body as { answers: Record<number, string> };
    const student_id = req.user!.id;

    // Verify attempt belongs to this student and is not yet completed
    const attempt = await query(
      'SELECT * FROM test_attempts WHERE id = $1 AND student_id = $2 AND completed_at IS NULL',
      [req.params.id, student_id]
    );
    if (!attempt.rows[0]) return next(createError('Attempt not found or already submitted.', 404));

    // Fetch correct answers and test details
    const [questions, testDetails] = await Promise.all([
      query(
        'SELECT id, correct_answer, marks FROM questions WHERE test_id = $1',
        [attempt.rows[0].test_id]
      ),
      query(
        'SELECT passing_marks FROM tests WHERE id = $1',
        [attempt.rows[0].test_id]
      ),
    ]);

    // Calculate score
    let score = 0;
    for (const q of questions.rows) {
      if (answers[q.id] === q.correct_answer) {
        score += q.marks;
      }
    }

    const totalMarks = attempt.rows[0].total_marks;
    const percentage = Math.round((score / totalMarks) * 100);
    const passingMarks = testDetails.rows[0]?.passing_marks || 0;

    // Update test attempt with score and completion time
    const result = await query(
      `UPDATE test_attempts
       SET score = $1, completed_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [score, req.params.id]
    );

    // CRITICAL FIX: Explicitly update user's score and status
    // This ensures the score is updated even if the database trigger fails
    const status = percentage >= 80 ? 'qualified' : percentage >= 50 ? 'partial' : 'not_qualified';
    
    await query(
      `UPDATE users
       SET score = $1, status = $2
       WHERE id = $3`,
      [score, status, student_id]
    );

    // Add calculated fields to response
    const attemptResult = {
      ...result.rows[0],
      percentage,
      passing_marks: passingMarks,
    };

    res.status(200).json({
      success: true,
      message: 'Test submitted.',
      data: attemptResult,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/test-attempts/my  (student — own attempts) ──────────────────────
export const getMyAttempts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT ta.*, t.title AS test_title, t.domain, t.passing_marks
       FROM test_attempts ta
       JOIN tests t ON ta.test_id = t.id
       WHERE ta.student_id = $1
       ORDER BY ta.started_at DESC`,
      [req.user!.id]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/test-attempts  (admin — all attempts) ───────────────────────────
export const getAllAttempts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT ta.*, u.name AS student_name, t.title AS test_title
       FROM test_attempts ta
       JOIN users u ON ta.student_id = u.id
       JOIN tests t ON ta.test_id = t.id
       ORDER BY ta.started_at DESC`
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
