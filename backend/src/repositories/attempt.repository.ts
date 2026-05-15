// ============================================================================
// ATTEMPT REPOSITORY
// ============================================================================
// Handles all database operations for student_attempts table
// WHY: Centralized data access for attempt lifecycle management

import { query } from '../config/db';
import { StudentAttempt, AttemptStatus } from '../types/assessment.types';

export interface CreateAttemptData {
  student_id: number;
  test_id: number;
  max_possible_score: number;
  ip_address?: string;
  user_agent?: string;
}

export interface UpdateAttemptScores {
  mcq_score?: number;
  manual_score?: number;
  total_score?: number;
}

export class AttemptRepository {
  // ── Core CRUD Operations ───────────────────────────────────────────────────

  async findById(id: number): Promise<StudentAttempt | null> {
    const result = await query<StudentAttempt>(
      'SELECT * FROM student_attempts WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByStudentAndTest(studentId: number, testId: number): Promise<StudentAttempt | null> {
    const result = await query<StudentAttempt>(
      'SELECT * FROM student_attempts WHERE student_id = $1 AND test_id = $2',
      [studentId, testId]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateAttemptData): Promise<StudentAttempt> {
    const result = await query<StudentAttempt>(
      `INSERT INTO student_attempts (
        student_id, test_id, max_possible_score, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        data.student_id,
        data.test_id,
        data.max_possible_score,
        data.ip_address || null,
        data.user_agent || null,
      ]
    );
    return result.rows[0];
  }

  // ── Status Management ──────────────────────────────────────────────────────

  async markSubmitted(attemptId: number): Promise<StudentAttempt | null> {
    const result = await query<StudentAttempt>(
      `UPDATE student_attempts 
       SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'in_progress'
       RETURNING *`,
      [attemptId]
    );
    return result.rows[0] || null;
  }

  async markEvaluated(attemptId: number): Promise<StudentAttempt | null> {
    const result = await query<StudentAttempt>(
      `UPDATE student_attempts 
       SET status = 'evaluated', evaluated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'submitted'
       RETURNING *`,
      [attemptId]
    );
    return result.rows[0] || null;
  }

  // ── Score Management ───────────────────────────────────────────────────────

  async updateScores(attemptId: number, scores: UpdateAttemptScores): Promise<StudentAttempt | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (scores.mcq_score !== undefined) {
      updates.push(`mcq_score = $${paramIndex++}`);
      values.push(scores.mcq_score);
    }
    if (scores.manual_score !== undefined) {
      updates.push(`manual_score = $${paramIndex++}`);
      values.push(scores.manual_score);
    }
    if (scores.total_score !== undefined) {
      updates.push(`total_score = $${paramIndex++}`);
      values.push(scores.total_score);
    }

    if (updates.length === 0) return this.findById(attemptId);

    values.push(attemptId);
    const result = await query<StudentAttempt>(
      `UPDATE student_attempts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async updateAutosaveTimestamp(attemptId: number): Promise<void> {
    await query(
      'UPDATE student_attempts SET last_autosave_at = CURRENT_TIMESTAMP WHERE id = $1',
      [attemptId]
    );
  }

  // ── Query Operations ───────────────────────────────────────────────────────

  async findByStudent(studentId: number, status?: AttemptStatus): Promise<StudentAttempt[]> {
    let sql = `
      SELECT sa.*, t.title as test_title, t.domain, t.passing_marks
      FROM student_attempts sa
      JOIN tests t ON sa.test_id = t.id
      WHERE sa.student_id = $1
    `;
    const params: unknown[] = [studentId];

    if (status) {
      sql += ' AND sa.status = $2';
      params.push(status);
    }

    sql += ' ORDER BY sa.started_at DESC';

    const result = await query<StudentAttempt>(sql, params);
    return result.rows;
  }

  async findByTest(testId: number, status?: AttemptStatus): Promise<StudentAttempt[]> {
    let sql = `
      SELECT sa.*, u.name as student_name, u.email as student_email
      FROM student_attempts sa
      JOIN users u ON sa.student_id = u.id
      WHERE sa.test_id = $1
    `;
    const params: unknown[] = [testId];

    if (status) {
      sql += ' AND sa.status = $2';
      params.push(status);
    }

    sql += ' ORDER BY sa.submitted_at DESC NULLS LAST';

    const result = await query<StudentAttempt>(sql, params);
    return result.rows;
  }

  async findInProgress(studentId: number): Promise<StudentAttempt[]> {
    const result = await query<StudentAttempt>(
      `SELECT sa.*, t.title as test_title, t.duration_minutes
       FROM student_attempts sa
       JOIN tests t ON sa.test_id = t.id
       WHERE sa.student_id = $1 AND sa.status = 'in_progress'
       ORDER BY sa.started_at DESC`,
      [studentId]
    );
    return result.rows;
  }

  // ── Statistics ─────────────────────────────────────────────────────────────

  async getAttemptStats(testId: number): Promise<{
    total_attempts: number;
    completed_attempts: number;
    average_score: number;
    pass_rate: number;
  }> {
    const result = await query<{
      total_attempts: string;
      completed_attempts: string;
      average_score: string;
      pass_rate: string;
    }>(
      `SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN status = 'evaluated' THEN 1 END) as completed_attempts,
        COALESCE(AVG(CASE WHEN status = 'evaluated' THEN percentage END), 0) as average_score,
        COALESCE(
          COUNT(CASE WHEN status = 'evaluated' AND percentage >= (SELECT passing_marks FROM tests WHERE id = $1) THEN 1 END)::DECIMAL / 
          NULLIF(COUNT(CASE WHEN status = 'evaluated' THEN 1 END), 0) * 100,
          0
        ) as pass_rate
       FROM student_attempts
       WHERE test_id = $1`,
      [testId]
    );

    const row = result.rows[0];
    return {
      total_attempts: parseInt(row.total_attempts, 10),
      completed_attempts: parseInt(row.completed_attempts, 10),
      average_score: parseFloat(row.average_score),
      pass_rate: parseFloat(row.pass_rate),
    };
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  async findAllPaginated(
    page: number,
    limit: number,
    filters?: {
      studentId?: number;
      testId?: number;
      status?: AttemptStatus;
    }
  ): Promise<{ attempts: StudentAttempt[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.studentId) {
      conditions.push(`sa.student_id = $${paramIndex++}`);
      params.push(filters.studentId);
    }
    if (filters?.testId) {
      conditions.push(`sa.test_id = $${paramIndex++}`);
      params.push(filters.testId);
    }
    if (filters?.status) {
      conditions.push(`sa.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM student_attempts sa ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results with joins
    params.push(limit, offset);
    const result = await query<StudentAttempt>(
      `SELECT sa.*, 
        u.name as student_name, 
        u.email as student_email,
        t.title as test_title,
        t.domain,
        t.passing_marks
       FROM student_attempts sa
       JOIN users u ON sa.student_id = u.id
       JOIN tests t ON sa.test_id = t.id
       ${whereClause}
       ORDER BY sa.started_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return { attempts: result.rows, total };
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  async deleteExpiredInProgressAttempts(expirationHours: number): Promise<number> {
    const result = await query(
      `DELETE FROM student_attempts 
       WHERE status = 'in_progress' 
       AND started_at < NOW() - INTERVAL '${expirationHours} hours'
       RETURNING id`,
      []
    );
    return result.rowCount;
  }
}

export const attemptRepository = new AttemptRepository();
