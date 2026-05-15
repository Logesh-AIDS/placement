// ============================================================================
// QUESTION REPOSITORY
// ============================================================================
// Handles all database operations for question_bank and test_questions tables
// WHY: Encapsulates SQL queries, makes them reusable and testable

import { query, QueryResult } from '../config/db';
import { QuestionBank, TestQuestion, CreateQuestionRequest } from '../types/assessment.types';

export class QuestionRepository {
  // ── Question Bank Operations ───────────────────────────────────────────────

  async findById(id: number): Promise<QuestionBank | null> {
    const result = await query<QuestionBank>(
      'SELECT * FROM question_bank WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIds(ids: number[]): Promise<QuestionBank[]> {
    if (ids.length === 0) return [];
    
    const result = await query<QuestionBank>(
      'SELECT * FROM question_bank WHERE id = ANY($1::int[])',
      [ids]
    );
    return result.rows;
  }

  async findByDomain(domain: string, isActive = true): Promise<QuestionBank[]> {
    const result = await query<QuestionBank>(
      `SELECT * FROM question_bank 
       WHERE domain = $1 AND is_active = $2
       ORDER BY created_at DESC`,
      [domain, isActive]
    );
    return result.rows;
  }

  async findByType(questionType: string, domain?: string): Promise<QuestionBank[]> {
    let sql = 'SELECT * FROM question_bank WHERE question_type = $1 AND is_active = true';
    const params: unknown[] = [questionType];
    
    if (domain) {
      sql += ' AND domain = $2';
      params.push(domain);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await query<QuestionBank>(sql, params);
    return result.rows;
  }

  async create(data: CreateQuestionRequest, createdBy: number): Promise<QuestionBank> {
    const result = await query<QuestionBank>(
      `INSERT INTO question_bank (
        question_type, domain, title, description, type_specific_data,
        difficulty_level, default_marks, default_time_mins, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.question_type,
        data.domain,
        data.title,
        data.description,
        JSON.stringify(data.type_specific_data),
        data.difficulty_level || 'medium',
        data.default_marks || 1,
        data.default_time_mins || 5,
        createdBy,
      ]
    );
    return result.rows[0];
  }

  async update(id: number, data: Partial<CreateQuestionRequest>): Promise<QuestionBank | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.type_specific_data !== undefined) {
      updates.push(`type_specific_data = $${paramIndex++}`);
      values.push(JSON.stringify(data.type_specific_data));
    }
    if (data.difficulty_level !== undefined) {
      updates.push(`difficulty_level = $${paramIndex++}`);
      values.push(data.difficulty_level);
    }
    if (data.default_marks !== undefined) {
      updates.push(`default_marks = $${paramIndex++}`);
      values.push(data.default_marks);
    }
    if (data.default_time_mins !== undefined) {
      updates.push(`default_time_mins = $${paramIndex++}`);
      values.push(data.default_time_mins);
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result = await query<QuestionBank>(
      `UPDATE question_bank SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deactivate(id: number): Promise<boolean> {
    const result = await query(
      'UPDATE question_bank SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM question_bank WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  // ── Test Questions Operations ──────────────────────────────────────────────

  async findTestQuestions(testId: number): Promise<Array<TestQuestion & QuestionBank>> {
    const result = await query<TestQuestion & QuestionBank>(
      `SELECT 
        tq.id as test_question_id,
        tq.test_id,
        tq.question_id,
        tq.order_index,
        tq.marks,
        tq.is_required,
        qb.*
       FROM test_questions tq
       JOIN question_bank qb ON tq.question_id = qb.id
       WHERE tq.test_id = $1
       ORDER BY tq.order_index ASC`,
      [testId]
    );
    return result.rows;
  }

  async addQuestionToTest(
    testId: number,
    questionId: number,
    orderIndex: number,
    marks: number
  ): Promise<TestQuestion> {
    const result = await query<TestQuestion>(
      `INSERT INTO test_questions (test_id, question_id, order_index, marks)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [testId, questionId, orderIndex, marks]
    );
    return result.rows[0];
  }

  async removeQuestionFromTest(testId: number, questionId: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM test_questions WHERE test_id = $1 AND question_id = $2 RETURNING id',
      [testId, questionId]
    );
    return result.rowCount > 0;
  }

  async updateTestQuestionMarks(testId: number, questionId: number, marks: number): Promise<boolean> {
    const result = await query(
      'UPDATE test_questions SET marks = $1 WHERE test_id = $2 AND question_id = $3 RETURNING id',
      [marks, testId, questionId]
    );
    return result.rowCount > 0;
  }

  async reorderTestQuestions(testId: number, questionOrders: Array<{ questionId: number; orderIndex: number }>): Promise<void> {
    // Use a transaction to ensure atomicity
    const client = await query.connect();
    try {
      await client.query('BEGIN');
      
      for (const { questionId, orderIndex } of questionOrders) {
        await client.query(
          'UPDATE test_questions SET order_index = $1 WHERE test_id = $2 AND question_id = $3',
          [orderIndex, testId, questionId]
        );
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  async findAllPaginated(
    page: number,
    limit: number,
    filters?: {
      domain?: string;
      questionType?: string;
      isActive?: boolean;
    }
  ): Promise<{ questions: QuestionBank[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.domain) {
      conditions.push(`domain = $${paramIndex++}`);
      params.push(filters.domain);
    }
    if (filters?.questionType) {
      conditions.push(`question_type = $${paramIndex++}`);
      params.push(filters.questionType);
    }
    if (filters?.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      params.push(filters.isActive);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM question_bank ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    params.push(limit, offset);
    const result = await query<QuestionBank>(
      `SELECT * FROM question_bank ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return { questions: result.rows, total };
  }
}

export const questionRepository = new QuestionRepository();
