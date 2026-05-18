import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';

// ── GET /api/admin/coding-submissions ────────────────────────────────────────
// Get all pending coding submissions for review
export const getPendingSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query; // 'pending', 'reviewed', 'all'
    
    let whereClause = '';
    if (status === 'pending') {
      whereClause = 'WHERE ca.reviewed_at IS NULL';
    } else if (status === 'reviewed') {
      whereClause = 'WHERE ca.reviewed_at IS NOT NULL';
    }
    
    const result = await query(
      `SELECT 
        ca.id,
        ca.attempt_id,
        ca.question_id,
        ca.student_id,
        ca.code_answer,
        ca.marks_obtained,
        ca.max_marks,
        ca.admin_feedback,
        ca.reviewed_by,
        ca.reviewed_at,
        ca.created_at,
        u.name AS student_name,
        u.email AS student_email,
        t.title AS test_title,
        t.id AS test_id,
        ta.score AS current_score,
        ta.total_marks AS test_total_marks,
        ta.completed_at
      FROM coding_answers ca
      JOIN users u ON ca.student_id = u.id
      JOIN test_attempts ta ON ca.attempt_id = ta.id
      JOIN tests t ON ta.test_id = t.id
      ${whereClause}
      ORDER BY ca.created_at DESC`,
      []
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/coding-submissions/:attemptId ─────────────────────────────
// Get all coding submissions for a specific test attempt
export const getSubmissionsByAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { attemptId } = req.params;
    
    const result = await query(
      `SELECT 
        ca.id,
        ca.attempt_id,
        ca.question_id,
        ca.code_answer,
        ca.marks_obtained,
        ca.max_marks,
        ca.admin_feedback,
        ca.reviewed_by,
        ca.reviewed_at,
        q.question_text,
        u.name AS student_name,
        u.email AS student_email,
        t.title AS test_title,
        ta.score AS current_score,
        ta.total_marks AS test_total_marks
      FROM coding_answers ca
      JOIN questions q ON ca.question_id = q.id
      JOIN users u ON ca.student_id = u.id
      JOIN test_attempts ta ON ca.attempt_id = ta.id
      JOIN tests t ON ta.test_id = t.id
      WHERE ca.attempt_id = $1
      ORDER BY ca.question_id`,
      [attemptId]
    );

    if (result.rows.length === 0) {
      return next(createError('No coding submissions found for this attempt.', 404));
    }

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/coding-submissions/:id/grade ─────────────────────────────
// Grade a coding submission
export const gradeSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { marks_obtained, admin_feedback } = req.body;
    
    // Validate marks
    if (marks_obtained === undefined || marks_obtained === null) {
      return next(createError('Marks obtained is required.', 400));
    }
    
    // Get the submission details
    const submissionResult = await query(
      `SELECT ca.*, ta.id AS attempt_id, ta.test_id, ta.score AS current_score, ta.total_marks
       FROM coding_answers ca
       JOIN test_attempts ta ON ca.attempt_id = ta.id
       WHERE ca.id = $1`,
      [id]
    );
    
    if (submissionResult.rows.length === 0) {
      return next(createError('Coding submission not found.', 404));
    }
    
    const submission = submissionResult.rows[0];
    
    // Validate marks range
    if (marks_obtained < 0 || marks_obtained > submission.max_marks) {
      return next(createError(`Marks must be between 0 and ${submission.max_marks}.`, 400));
    }
    
    // Update the coding answer with marks and feedback
    await query(
      `UPDATE coding_answers
       SET marks_obtained = $1,
           admin_feedback = $2,
           reviewed_by = $3,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [marks_obtained, admin_feedback || null, req.user!.id, id]
    );
    
    // Calculate new total score for the attempt
    // Get all coding answers for this attempt
    const allCodingAnswers = await query(
      `SELECT marks_obtained, max_marks
       FROM coding_answers
       WHERE attempt_id = $1`,
      [submission.attempt_id]
    );
    
    // Calculate total coding marks obtained
    let codingMarksObtained = 0;
    let allReviewed = true;
    
    for (const answer of allCodingAnswers.rows) {
      if (answer.marks_obtained === null) {
        allReviewed = false;
        break;
      }
      codingMarksObtained += answer.marks_obtained;
    }
    
    // If all coding questions are reviewed, update the test attempt score
    if (allReviewed) {
      const newTotalScore = submission.current_score + codingMarksObtained;
      
      await query(
        `UPDATE test_attempts
         SET score = $1
         WHERE id = $2`,
        [newTotalScore, submission.attempt_id]
      );
      
      // Get student_id from the attempt
      const attemptInfo = await query(
        `SELECT student_id, total_marks FROM test_attempts WHERE id = $1`,
        [submission.attempt_id]
      );
      
      const student_id = attemptInfo.rows[0].student_id;
      const totalMarks = attemptInfo.rows[0].total_marks;
      
      // Update user's score to their BEST score across all attempts
      const bestAttempt = await query(
        `SELECT MAX(score) as best_score FROM test_attempts 
         WHERE student_id = $1 AND completed_at IS NOT NULL`,
        [student_id]
      );
      
      const bestScore = bestAttempt.rows[0]?.best_score || newTotalScore;
      const bestPercentage = Math.round((bestScore / totalMarks) * 100);
      const status = bestPercentage >= 80 ? 'qualified' : bestPercentage >= 50 ? 'partial' : 'not_qualified';
      
      await query(
        `UPDATE users
         SET score = $1, status = $2
         WHERE id = $3`,
        [bestScore, status, student_id]
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Coding submission graded successfully.',
      data: {
        marks_obtained,
        all_reviewed: allReviewed,
        new_total_score: allReviewed ? submission.current_score + codingMarksObtained : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/test-attempts ─────────────────────────────────────────────
// Get all test attempts with coding questions
export const getTestAttemptsWithCoding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT DISTINCT
        ta.id AS attempt_id,
        ta.student_id,
        ta.test_id,
        ta.score,
        ta.total_marks,
        ta.percentage,
        ta.completed_at,
        u.name AS student_name,
        u.email AS student_email,
        t.title AS test_title,
        COUNT(ca.id) AS coding_questions_count,
        COUNT(CASE WHEN ca.reviewed_at IS NOT NULL THEN 1 END) AS reviewed_count
      FROM test_attempts ta
      JOIN users u ON ta.student_id = u.id
      JOIN tests t ON ta.test_id = t.id
      LEFT JOIN coding_answers ca ON ta.id = ca.attempt_id
      WHERE ta.completed_at IS NOT NULL
      GROUP BY ta.id, u.name, u.email, t.title
      HAVING COUNT(ca.id) > 0
      ORDER BY ta.completed_at DESC`,
      []
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
