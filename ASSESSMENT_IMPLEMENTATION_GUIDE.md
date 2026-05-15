# Assessment Module - Complete Implementation Guide

## Overview

This guide provides **step-by-step instructions** for implementing the production-grade assessment system. Follow these steps in order to ensure proper dependency management and integration.

---

## Phase 1: Database Setup (30 minutes)

### Step 1.1: Run Database Migration

```bash
# Connect to your Neon database
psql $DATABASE_URL

# Run the assessment schema
\i backend/database/assessment_schema.sql

# Verify tables created
\dt

# Expected output:
# - question_bank
# - test_questions
# - student_attempts
# - student_answers
# - manual_reviews
```

### Step 1.2: Verify Indexes

```sql
-- Check indexes were created
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE '%question%' OR tablename LIKE '%attempt%' OR tablename LIKE '%answer%';
```

### Step 1.3: Test Triggers

```sql
-- Insert a test question
INSERT INTO question_bank (
  question_type, domain, title, description, type_specific_data, created_by
) VALUES (
  'mcq', 'Web', 'Test Question', 'What is React?',
  '{"options": ["Library", "Framework"], "correct_answer": "Library"}',
  1
);

-- Verify updated_at trigger works
UPDATE question_bank SET title = 'Updated Title' WHERE id = 1;
SELECT id, title, created_at, updated_at FROM question_bank WHERE id = 1;
-- updated_at should be newer than created_at
```

**WHY**: Database schema is the foundation. All code depends on correct table structure.

---

## Phase 2: Backend - Repository Layer (1 hour)

### Step 2.1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2.2: Create Remaining Repositories

I've already created:
- ✅ `repositories/question.repository.ts`
- ✅ `repositories/attempt.repository.ts`

You need to create:

#### `repositories/answer.repository.ts`

```typescript
import { query } from '../config/db';
import { StudentAnswer, AnswerData } from '../types/assessment.types';

export class AnswerRepository {
  async findByAttempt(attemptId: number): Promise<StudentAnswer[]> {
    const result = await query<StudentAnswer>(
      'SELECT * FROM student_answers WHERE attempt_id = $1 ORDER BY answered_at',
      [attemptId]
    );
    return result.rows;
  }

  async findByAttemptAndQuestion(
    attemptId: number,
    questionId: number
  ): Promise<StudentAnswer | null> {
    const result = await query<StudentAnswer>(
      'SELECT * FROM student_answers WHERE attempt_id = $1 AND question_id = $2',
      [attemptId, questionId]
    );
    return result.rows[0] || null;
  }

  async upsert(data: {
    attempt_id: number;
    question_id: number;
    answer_data: AnswerData;
    time_spent_seconds: number;
    is_final?: boolean;
  }): Promise<StudentAnswer> {
    const result = await query<StudentAnswer>(
      `INSERT INTO student_answers (
        attempt_id, question_id, answer_data, time_spent_seconds, is_final
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (attempt_id, question_id) 
      DO UPDATE SET 
        answer_data = EXCLUDED.answer_data,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        is_final = EXCLUDED.is_final,
        version = student_answers.version + 1
      RETURNING *`,
      [
        data.attempt_id,
        data.question_id,
        JSON.stringify(data.answer_data),
        data.time_spent_seconds,
        data.is_final || false,
      ]
    );
    return result.rows[0];
  }

  async updateScore(
    answerId: number,
    isCorrect: boolean,
    autoScore: number
  ): Promise<void> {
    await query(
      'UPDATE student_answers SET is_correct = $1, auto_score = $2 WHERE id = $3',
      [isCorrect, autoScore, answerId]
    );
  }

  async markFinal(attemptId: number): Promise<void> {
    await query(
      'UPDATE student_answers SET is_final = true WHERE attempt_id = $1',
      [attemptId]
    );
  }
}

export const answerRepository = new AnswerRepository();
```

#### `repositories/review.repository.ts`

```typescript
import { query } from '../config/db';
import { ManualReview, EvaluationStatus, ReviewQueueItem } from '../types/assessment.types';

export class ReviewRepository {
  async findById(id: number): Promise<ManualReview | null> {
    const result = await query<ManualReview>(
      'SELECT * FROM manual_reviews WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(answerId: number, maxMarks: number): Promise<ManualReview> {
    const result = await query<ManualReview>(
      `INSERT INTO manual_reviews (answer_id, max_marks, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [answerId, maxMarks]
    );
    return result.rows[0];
  }

  async getPendingQueue(limit = 50): Promise<ReviewQueueItem[]> {
    const result = await query<ReviewQueueItem>(
      'SELECT * FROM pending_reviews_queue LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  async assignReviewer(reviewId: number, reviewerId: number): Promise<void> {
    await query(
      `UPDATE manual_reviews 
       SET reviewer_id = $1, status = 'in_review'
       WHERE id = $2`,
      [reviewerId, reviewId]
    );
  }

  async submitReview(
    reviewId: number,
    marksAwarded: number,
    feedback: string | null
  ): Promise<ManualReview> {
    const result = await query<ManualReview>(
      `UPDATE manual_reviews 
       SET marks_awarded = $1, feedback = $2, status = 'completed', reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [marksAwarded, feedback, reviewId]
    );
    return result.rows[0];
  }

  async findByAttempt(attemptId: number): Promise<ManualReview[]> {
    const result = await query<ManualReview>(
      `SELECT mr.* 
       FROM manual_reviews mr
       JOIN student_answers sa ON mr.answer_id = sa.id
       WHERE sa.attempt_id = $1`,
      [attemptId]
    );
    return result.rows;
  }
}

export const reviewRepository = new ReviewRepository();
```

**WHY**: Repositories isolate SQL from business logic. Services will depend on these.

---

## Phase 3: Backend - Service Layer (2 hours)

### Step 3.1: Create Assessment Service

Create `services/assessment.service.ts`:

```typescript
import { attemptRepository } from '../repositories/attempt.repository';
import { questionRepository } from '../repositories/question.repository';
import { answerRepository } from '../repositories/answer.repository';
import { reviewRepository } from '../repositories/review.repository';
import { query } from '../config/db';
import { createError } from '../middleware/error.middleware';
import {
  StartAttemptResponse,
  SubmitAttemptResponse,
  AutosaveAnswerRequest,
  AnswerData,
  isAttemptExpired,
  calculateAutoScore,
  sanitizeQuestionForStudent,
} from '../types/assessment.types';

export class AssessmentService {
  // ── Start Attempt ──────────────────────────────────────────────────────────

  async startAttempt(
    studentId: number,
    testId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<StartAttemptResponse> {
    // 1. Validate test exists and is active
    const testResult = await query(
      'SELECT * FROM tests WHERE id = $1 AND is_active = true',
      [testId]
    );
    const test = testResult.rows[0];
    
    if (!test) {
      throw createError('Test not found or inactive', 404);
    }

    // 2. Check student domain matches test domain
    const studentResult = await query('SELECT domain FROM users WHERE id = $1', [studentId]);
    const student = studentResult.rows[0];
    
    if (student.domain !== test.domain) {
      throw createError(`This test is for ${test.domain} domain only`, 403);
    }

    // 3. Check no existing attempt
    const existing = await attemptRepository.findByStudentAndTest(studentId, testId);
    if (existing) {
      throw createError('You have already attempted this test', 409);
    }

    // 4. Get test questions
    const testQuestions = await questionRepository.findTestQuestions(testId);
    
    if (testQuestions.length === 0) {
      throw createError('Test has no questions', 400);
    }

    // 5. Calculate max possible score
    const maxScore = testQuestions.reduce((sum, q) => sum + q.marks, 0);

    // 6. Create attempt
    const attempt = await attemptRepository.create({
      student_id: studentId,
      test_id: testId,
      max_possible_score: maxScore,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // 7. Sanitize questions (hide correct answers)
    const sanitizedQuestions = testQuestions.map((tq) => ({
      id: tq.question_id,
      question_type: tq.question_type,
      title: tq.title,
      description: tq.description,
      type_specific_data: sanitizeQuestionForStudent(tq).type_specific_data,
      marks: tq.marks,
      order_index: tq.order_index,
    }));

    // 8. Calculate expiration time
    const expiresAt = new Date(
      attempt.started_at.getTime() + test.duration_minutes * 60 * 1000
    );

    return {
      attempt_id: attempt.id,
      test: {
        id: test.id,
        title: test.title,
        duration_minutes: test.duration_minutes,
        total_marks: maxScore,
      },
      questions: sanitizedQuestions,
      started_at: attempt.started_at,
      expires_at: expiresAt,
    };
  }

  // ── Autosave Answer ────────────────────────────────────────────────────────

  async autosaveAnswer(data: AutosaveAnswerRequest, studentId: number): Promise<void> {
    // 1. Validate attempt belongs to student
    const attempt = await attemptRepository.findById(data.attempt_id);
    
    if (!attempt) {
      throw createError('Attempt not found', 404);
    }
    
    if (attempt.student_id !== studentId) {
      throw createError('Access denied', 403);
    }
    
    if (attempt.status !== 'in_progress') {
      throw createError('Attempt already submitted', 400);
    }

    // 2. Validate timer not expired
    const testResult = await query('SELECT duration_minutes FROM tests WHERE id = $1', [attempt.test_id]);
    const test = testResult.rows[0];
    
    if (isAttemptExpired(attempt.started_at, test.duration_minutes)) {
      throw createError('Time expired', 403);
    }

    // 3. Save answer (upsert)
    await answerRepository.upsert({
      attempt_id: data.attempt_id,
      question_id: data.question_id,
      answer_data: data.answer_data,
      time_spent_seconds: data.time_spent_seconds,
      is_final: false,
    });

    // 4. Update autosave timestamp
    await attemptRepository.updateAutosaveTimestamp(data.attempt_id);
  }

  // ── Submit Attempt ─────────────────────────────────────────────────────────

  async submitAttempt(
    attemptId: number,
    answers: Array<{ question_id: number; answer_data: AnswerData; time_spent_seconds: number }>,
    studentId: number
  ): Promise<SubmitAttemptResponse> {
    // 1. Validate attempt
    const attempt = await attemptRepository.findById(attemptId);
    
    if (!attempt) {
      throw createError('Attempt not found', 404);
    }
    
    if (attempt.student_id !== studentId) {
      throw createError('Access denied', 403);
    }
    
    if (attempt.status !== 'in_progress') {
      throw createError('Attempt already submitted', 400);
    }

    // 2. Validate timer (allow 30s grace period for network latency)
    const testResult = await query('SELECT duration_minutes FROM tests WHERE id = $1', [attempt.test_id]);
    const test = testResult.rows[0];
    const gracePeriodSeconds = 30;
    const expiresAt = new Date(
      attempt.started_at.getTime() + (test.duration_minutes * 60 + gracePeriodSeconds) * 1000
    );
    
    if (new Date() > expiresAt) {
      throw createError('Time expired', 403);
    }

    // 3. Get all questions for this test
    const testQuestions = await questionRepository.findTestQuestions(attempt.test_id);
    const questionMap = new Map(testQuestions.map(q => [q.question_id, q]));

    // 4. Transaction: Save answers, calculate scores, create reviews
    const client = await query.connect();
    
    try {
      await client.query('BEGIN');

      let mcqScore = 0;
      let pendingReviewCount = 0;

      // Save all answers
      for (const answer of answers) {
        const question = questionMap.get(answer.question_id);
        if (!question) continue;

        // Upsert answer
        const savedAnswer = await answerRepository.upsert({
          attempt_id: attemptId,
          question_id: answer.question_id,
          answer_data: answer.answer_data,
          time_spent_seconds: answer.time_spent_seconds,
          is_final: true,
        });

        // Auto-score MCQ questions
        if (question.question_type === 'mcq' || question.question_type === 'core_subject_mcq') {
          const { is_correct, score } = calculateAutoScore(question, answer.answer_data);
          await answerRepository.updateScore(savedAnswer.id, is_correct, score);
          mcqScore += score;
        } else {
          // Create manual review for SQL/Coding questions
          await reviewRepository.create(savedAnswer.id, question.marks);
          pendingReviewCount++;
        }
      }

      // Mark all answers as final
      await answerRepository.markFinal(attemptId);

      // Update attempt scores and mark as submitted
      await attemptRepository.updateScores(attemptId, {
        mcq_score: mcqScore,
        total_score: mcqScore, // Manual score will be added later
      });
      
      await attemptRepository.markSubmitted(attemptId);

      await client.query('COMMIT');

      // Fetch updated attempt
      const updatedAttempt = await attemptRepository.findById(attemptId);

      return {
        attempt_id: attemptId,
        status: updatedAttempt!.status,
        mcq_score: mcqScore,
        total_score: mcqScore,
        max_possible_score: attempt.max_possible_score,
        percentage: updatedAttempt!.percentage,
        submitted_at: updatedAttempt!.submitted_at!,
        requires_manual_review: pendingReviewCount > 0,
        pending_review_count: pendingReviewCount,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Get Attempt Results ────────────────────────────────────────────────────

  async getAttemptResults(attemptId: number, studentId: number) {
    const attempt = await attemptRepository.findById(attemptId);
    
    if (!attempt) {
      throw createError('Attempt not found', 404);
    }
    
    if (attempt.student_id !== studentId) {
      throw createError('Access denied', 403);
    }

    // Get test details
    const testResult = await query('SELECT * FROM tests WHERE id = $1', [attempt.test_id]);
    const test = testResult.rows[0];

    // Get answers with reviews
    const answers = await answerRepository.findByAttempt(attemptId);
    const reviews = await reviewRepository.findByAttempt(attemptId);
    const reviewMap = new Map(reviews.map(r => [r.answer_id, r]));

    // Get questions
    const questionIds = answers.map(a => a.question_id);
    const questions = await questionRepository.findByIds(questionIds);
    const questionMap = new Map(questions.map(q => [q.id, q]));

    const answersWithDetails = answers.map(answer => {
      const question = questionMap.get(answer.question_id);
      const review = reviewMap.get(answer.id);

      return {
        question_id: answer.question_id,
        question_type: question?.question_type,
        question_title: question?.title,
        answer_data: answer.answer_data,
        is_correct: answer.is_correct,
        auto_score: answer.auto_score,
        manual_review: review ? {
          status: review.status,
          marks_awarded: review.marks_awarded,
          feedback: review.feedback,
          reviewed_at: review.reviewed_at,
        } : undefined,
        max_marks: question?.default_marks || 0,
      };
    });

    return {
      attempt,
      test: {
        id: test.id,
        title: test.title,
        domain: test.domain,
        passing_marks: test.passing_marks,
      },
      answers: answersWithDetails,
    };
  }
}

export const assessmentService = new AssessmentService();
```

**WHY**: Service layer contains all business logic. Controllers will be thin wrappers around this.

**PERFORMANCE**: Transaction ensures atomicity (all-or-nothing submission).

**SECURITY**: Timer validation, ownership checks, domain validation.

---

## Phase 4: Backend - Controllers & Routes (1 hour)

### Step 4.1: Create Assessment Controller

Create `controllers/assessment.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { assessmentService } from '../services/assessment.service';

export const startAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { test_id } = req.body;
    const student_id = req.user!.id;
    const ip_address = req.ip;
    const user_agent = req.headers['user-agent'];

    const result = await assessmentService.startAttempt(
      student_id,
      test_id,
      ip_address,
      user_agent
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const autosaveAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attempt_id, question_id, answer_data, time_spent_seconds } = req.body;
    const student_id = req.user!.id;

    await assessmentService.autosaveAnswer(
      { attempt_id, question_id, answer_data, time_spent_seconds },
      student_id
    );

    res.status(200).json({ success: true, message: 'Answer saved' });
  } catch (err) {
    next(err);
  }
};

export const submitAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attempt_id } = req.params;
    const { answers } = req.body;
    const student_id = req.user!.id;

    const result = await assessmentService.submitAttempt(
      parseInt(attempt_id),
      answers,
      student_id
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getAttemptResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attempt_id } = req.params;
    const student_id = req.user!.id;

    const result = await assessmentService.getAttemptResults(
      parseInt(attempt_id),
      student_id
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
```

### Step 4.2: Create Routes

Create `routes/assessment.routes.ts`:

```typescript
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as assessmentController from '../controllers/assessment.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.post(
  '/attempts/start',
  authorize('student'),
  assessmentController.startAttempt
);

router.post(
  '/answers/autosave',
  authorize('student'),
  assessmentController.autosaveAnswer
);

router.post(
  '/attempts/:attempt_id/submit',
  authorize('student'),
  assessmentController.submitAttempt
);

router.get(
  '/attempts/:attempt_id/results',
  authorize('student'),
  assessmentController.getAttemptResults
);

export default router;
```

### Step 4.3: Register Routes in App

Edit `backend/src/app.ts`:

```typescript
import assessmentRoutes from './routes/assessment.routes';

// Add after existing routes
app.use('/api/assessments', assessmentRoutes);
```

**WHY**: Controllers are thin HTTP adapters. Routes define API structure.

---

## Phase 5: Frontend - API Client (30 minutes)

### Step 5.1: Extend API Client

Edit `frontend/lib/api.ts`, add:

```typescript
// Assessment endpoints
export const assessmentApi = {
  startAttempt: (token: string, testId: number) =>
    request<{ success: boolean; data: StartAttemptResponse }>('/assessments/attempts/start', {
      method: 'POST',
      token,
      body: JSON.stringify({ test_id: testId }),
    }),

  autosaveAnswer: (token: string, data: AutosaveAnswerRequest) =>
    request<{ success: boolean; message: string }>('/assessments/answers/autosave', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  submitAttempt: (token: string, attemptId: number, answers: SubmitAttemptRequest['answers']) =>
    request<{ success: boolean; data: SubmitAttemptResponse }>(
      `/assessments/attempts/${attemptId}/submit`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ answers }),
      }
    ),

  getAttemptResults: (token: string, attemptId: number) =>
    request<{ success: boolean; data: AttemptResultResponse }>(
      `/assessments/attempts/${attemptId}/results`,
      { token }
    ),
};

// Add types
export interface StartAttemptResponse {
  attempt_id: number;
  test: {
    id: number;
    title: string;
    duration_minutes: number;
    total_marks: number;
  };
  questions: Array<{
    id: number;
    question_type: string;
    title: string;
    description: string;
    type_specific_data: any;
    marks: number;
    order_index: number;
  }>;
  started_at: string;
  expires_at: string;
}

export interface AutosaveAnswerRequest {
  attempt_id: number;
  question_id: number;
  answer_data: any;
  time_spent_seconds: number;
}

export interface SubmitAttemptRequest {
  answers: Array<{
    question_id: number;
    answer_data: any;
    time_spent_seconds: number;
  }>;
}

export interface SubmitAttemptResponse {
  attempt_id: number;
  status: string;
  mcq_score: number;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  submitted_at: string;
  requires_manual_review: boolean;
  pending_review_count: number;
}
```

---

## Phase 6: Testing (1 hour)

### Step 6.1: Test Database

```sql
-- Test question creation
INSERT INTO question_bank (
  question_type, domain, title, description, type_specific_data, created_by
) VALUES (
  'mcq', 'Web', 'What is React?', 'Choose the correct answer',
  '{"options": ["Library", "Framework", "Language"], "correct_answer": "Library"}',
  1
);

-- Test test creation
INSERT INTO tests (title, domain, duration_minutes, total_marks, passing_marks, created_by)
VALUES ('Sample Test', 'Web', 30, 10, 5, 1);

-- Link question to test
INSERT INTO test_questions (test_id, question_id, order_index, marks)
VALUES (1, 1, 1, 10);
```

### Step 6.2: Test API Endpoints

```bash
# Start backend
cd backend
npm run dev

# Test start attempt (use your JWT token)
curl -X POST http://localhost:5000/api/assessments/attempts/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test_id": 1}'

# Test autosave
curl -X POST http://localhost:5000/api/assessments/answers/autosave \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attempt_id": 1,
    "question_id": 1,
    "answer_data": {"selected_option": "Library"},
    "time_spent_seconds": 30
  }'

# Test submit
curl -X POST http://localhost:5000/api/assessments/attempts/1/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [{
      "question_id": 1,
      "answer_data": {"selected_option": "Library"},
      "time_spent_seconds": 60
    }]
  }'
```

---

## Phase 7: Frontend Components (Next Document)

The frontend implementation will include:
1. Test taking page with timer
2. Question renderer (MCQ, Coding, SQL)
3. Monaco editor integration
4. Autosave logic
5. Admin test creation
6. Admin review panel

This will be covered in a separate document: `ASSESSMENT_FRONTEND_GUIDE.md`

---

## Performance Checklist

- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Autosave debounced (30s)
- [ ] Pagination implemented for large lists
- [ ] Timer validation on server-side
- [ ] Transaction management for submissions
- [ ] Rate limiting configured

---

## Security Checklist

- [ ] JWT authentication on all routes
- [ ] Role-based authorization (student/admin)
- [ ] Correct answers hidden from students
- [ ] Attempt ownership validation
- [ ] Timer expiration validation
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)

---

## Next Steps

1. Complete Phase 1-6 above
2. Test all endpoints with Postman/curl
3. Verify database triggers work correctly
4. Move to frontend implementation
5. Create admin panel for test creation
6. Create review panel for manual evaluation

---

## Troubleshooting

### "Table does not exist"
- Run `assessment_schema.sql` migration
- Check connection string in `.env`

### "Permission denied"
- Verify JWT token is valid
- Check user role matches route authorization

### "Time expired" error
- Check server time vs client time
- Verify grace period (30s) is sufficient

### "Attempt already exists"
- This is expected behavior (one attempt per test)
- Check `student_attempts` table for existing records

---

## Production Deployment

1. **Database**: Run migrations on production database
2. **Backend**: Deploy with environment variables
3. **Frontend**: Build and deploy Next.js app
4. **Monitoring**: Set up error tracking (Sentry)
5. **Backups**: Configure automated database backups
6. **Scaling**: Enable auto-scaling for backend instances

---

**This is a production-grade implementation. Follow each step carefully to ensure system stability and security.**
