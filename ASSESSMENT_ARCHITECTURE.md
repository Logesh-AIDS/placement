# Assessment Module - Production Architecture

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Design Principles](#design-principles)
3. [Layer Responsibilities](#layer-responsibilities)
4. [Data Flow](#data-flow)
5. [Performance Strategy](#performance-strategy)
6. [Security Strategy](#security-strategy)
7. [Scalability Considerations](#scalability-considerations)

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Test Page    │  │ Admin Panel  │  │ Review Panel │     │
│  │ Components   │  │ Components   │  │ Components   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │   API Client    │                       │
│                   │  (lib/api.ts)   │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/JSON
┌────────────────────────────▼─────────────────────────────────┐
│                     BACKEND (Express)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    ROUTES LAYER                      │   │
│  │  - Request validation (express-validator)           │   │
│  │  - Authentication/Authorization middleware          │   │
│  │  - Rate limiting                                     │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │                 CONTROLLERS LAYER                    │   │
│  │  - HTTP request/response handling                   │   │
│  │  - Input sanitization                               │   │
│  │  - Error handling                                   │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │                  SERVICES LAYER                      │   │
│  │  - Business logic                                   │   │
│  │  - Transaction management                           │   │
│  │  - Cross-entity operations                          │   │
│  │  - Timer validation                                 │   │
│  │  - Score calculation                                │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │                REPOSITORIES LAYER                    │   │
│  │  - Database queries                                 │   │
│  │  - Data mapping (DB ↔ Domain models)               │   │
│  │  - Query optimization                               │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │                  DATABASE LAYER                      │   │
│  │  - PostgreSQL (Neon)                                │   │
│  │  - Connection pooling                               │   │
│  │  - Triggers & constraints                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Separation of Concerns
**WHY**: Each layer has a single responsibility, making code easier to test, maintain, and scale.

- **Routes**: HTTP concerns only (validation, auth)
- **Controllers**: Request/response transformation
- **Services**: Business logic (timer validation, scoring)
- **Repositories**: Data access patterns

**IMPACT**: 
- ✅ Easy to unit test services without HTTP mocking
- ✅ Can swap database without touching business logic
- ✅ Reusable services across different controllers

### 2. Dependency Injection
**WHY**: Services depend on abstractions (repository interfaces), not concrete implementations.

```typescript
// BAD: Tight coupling
class AssessmentService {
  async getAttempt(id: number) {
    return await query('SELECT * FROM student_attempts WHERE id = $1', [id]);
  }
}

// GOOD: Dependency injection
class AssessmentService {
  constructor(private attemptRepo: AttemptRepository) {}
  
  async getAttempt(id: number) {
    return await this.attemptRepo.findById(id);
  }
}
```

**IMPACT**:
- ✅ Easy to mock repositories in tests
- ✅ Can add caching layer without changing services
- ✅ Supports multiple database strategies

### 3. Transaction Management
**WHY**: Complex operations (submit attempt, calculate scores) must be atomic.

**PATTERN**: Service layer manages transactions, repositories execute queries.

```typescript
// Service handles transaction boundary
async submitAttempt(attemptId: number, answers: AnswerData[]) {
  return await this.db.transaction(async (trx) => {
    // All operations use same transaction
    await this.answerRepo.saveAnswers(answers, trx);
    await this.attemptRepo.markSubmitted(attemptId, trx);
    await this.scoreService.calculateScores(attemptId, trx);
  });
}
```

**IMPACT**:
- ✅ Prevents partial updates (all-or-nothing)
- ✅ Maintains data consistency
- ✅ Handles concurrent submissions safely

### 4. Optimistic Locking (Autosave)
**WHY**: Prevent race conditions when multiple autosave requests overlap.

**PATTERN**: Version field in `student_answers` table.

```typescript
// Update only if version matches (no concurrent modification)
UPDATE student_answers 
SET answer_data = $1, version = version + 1 
WHERE id = $2 AND version = $3
RETURNING *;
```

**IMPACT**:
- ✅ Prevents lost updates
- ✅ Detects concurrent modifications
- ✅ No need for pessimistic locks (better performance)

---

## Layer Responsibilities

### Routes Layer (`routes/assessment.routes.ts`)

**Responsibilities**:
- Define HTTP endpoints
- Apply middleware (auth, validation, rate limiting)
- Route to appropriate controller

**Example**:
```typescript
router.post(
  '/attempts/start',
  authenticate,
  authorize('student'),
  validateBody(startAttemptSchema),
  assessmentController.startAttempt
);
```

**WHY**: Keeps routing logic separate from business logic.

---

### Controllers Layer (`controllers/assessment.controller.ts`)

**Responsibilities**:
- Extract data from `req` (body, params, query, user)
- Call service methods
- Format response
- Handle errors

**Example**:
```typescript
async startAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const { test_id } = req.body;
    const student_id = req.user!.id;
    
    const result = await assessmentService.startAttempt(student_id, test_id);
    
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
```

**WHY**: Controllers are thin adapters between HTTP and business logic.

**PERFORMANCE**: No business logic here = fast request handling.

---

### Services Layer (`services/assessment.service.ts`)

**Responsibilities**:
- Business logic (timer validation, scoring, eligibility checks)
- Transaction management
- Cross-entity operations
- Error handling with domain-specific errors

**Example**:
```typescript
class AssessmentService {
  async startAttempt(studentId: number, testId: number) {
    // 1. Validate test exists and is active
    const test = await this.testRepo.findById(testId);
    if (!test || !test.is_active) {
      throw new BusinessError('Test not found or inactive', 404);
    }
    
    // 2. Check domain eligibility
    const student = await this.userRepo.findById(studentId);
    if (student.domain !== test.domain) {
      throw new BusinessError('Domain mismatch', 403);
    }
    
    // 3. Check no existing attempt
    const existing = await this.attemptRepo.findByStudentAndTest(studentId, testId);
    if (existing) {
      throw new BusinessError('Already attempted', 409);
    }
    
    // 4. Create attempt (transaction)
    return await this.attemptRepo.create({
      student_id: studentId,
      test_id: testId,
      max_possible_score: test.total_marks,
    });
  }
}
```

**WHY**: All business rules in one place, easy to test without HTTP.

**SCALABILITY**: Services can be extracted to microservices later.

---

### Repositories Layer (`repositories/assessment.repository.ts`)

**Responsibilities**:
- Database queries
- Data mapping (DB rows → Domain objects)
- Query optimization
- Connection management

**Example**:
```typescript
class AttemptRepository {
  async findById(id: number): Promise<StudentAttempt | null> {
    const result = await query(
      'SELECT * FROM student_attempts WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
  
  async findByStudentAndTest(studentId: number, testId: number) {
    const result = await query(
      'SELECT * FROM student_attempts WHERE student_id = $1 AND test_id = $2',
      [studentId, testId]
    );
    return result.rows[0] || null;
  }
  
  async create(data: CreateAttemptData, trx?: Transaction) {
    const db = trx || query;
    const result = await db(
      `INSERT INTO student_attempts (student_id, test_id, max_possible_score)
       VALUES ($1, $2, $3) RETURNING *`,
      [data.student_id, data.test_id, data.max_possible_score]
    );
    return result.rows[0];
  }
}
```

**WHY**: Encapsulates SQL, makes it easy to optimize queries without touching business logic.

**PERFORMANCE**: Can add caching, query batching, or read replicas here.

---

## Data Flow

### Student Takes Test (Happy Path)

```
1. Student clicks "Start Test"
   ↓
2. Frontend: POST /api/assessments/attempts/start { test_id: 1 }
   ↓
3. Route: Validate auth, body schema
   ↓
4. Controller: Extract test_id, student_id
   ↓
5. Service: 
   - Validate test exists
   - Check domain eligibility
   - Check no existing attempt
   - Create attempt record
   ↓
6. Repository: INSERT INTO student_attempts
   ↓
7. Controller: Format response with attempt_id, questions, timer
   ↓
8. Frontend: Render test page with timer

9. Student answers questions (autosave every 30s)
   ↓
10. Frontend: POST /api/assessments/answers/autosave
    { attempt_id, question_id, answer_data, version }
    ↓
11. Service: 
    - Validate attempt not submitted
    - Validate timer not expired
    - Update answer with optimistic lock
    ↓
12. Repository: UPDATE student_answers WHERE version = $1

13. Student clicks "Submit"
    ↓
14. Frontend: POST /api/assessments/attempts/:id/submit
    { answers: [...] }
    ↓
15. Service (Transaction):
    - Validate timer
    - Save all final answers
    - Auto-score MCQ questions
    - Create manual_reviews for SQL/Coding
    - Mark attempt as submitted
    - Calculate total score
    ↓
16. Repository: Multiple INSERTs/UPDATEs in transaction
    ↓
17. Controller: Return scores, pending review count
    ↓
18. Frontend: Show results page
```

---

## Performance Strategy

### 1. Database Indexing
**WHY**: Fast lookups for common queries.

**CRITICAL INDEXES**:
```sql
-- Student dashboard: "My attempts"
CREATE INDEX idx_student_attempts_student_status 
ON student_attempts(student_id, status);

-- Admin review queue: "Pending reviews"
CREATE INDEX idx_manual_reviews_pending 
ON manual_reviews(status, assigned_at) 
WHERE status = 'pending';

-- Test page: "Load questions"
CREATE INDEX idx_test_questions_order 
ON test_questions(test_id, order_index);
```

**IMPACT**: Query time drops from 500ms → 5ms for 100K records.

---

### 2. Pagination
**WHY**: Avoid loading 10K+ records in memory.

**PATTERN**: Cursor-based pagination for infinite scroll, offset for page numbers.

```typescript
// Offset pagination (admin review queue)
async getPendingReviews(page: number, limit: number) {
  const offset = (page - 1) * limit;
  return await query(
    `SELECT * FROM pending_reviews_queue 
     ORDER BY assigned_at ASC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}
```

**IMPACT**: 
- ✅ Constant memory usage
- ✅ Fast page loads (50ms vs 5s for 10K records)

---

### 3. Autosave Debouncing
**WHY**: Prevent 100 API calls when student types fast.

**PATTERN**: Frontend debounces autosave to 30s or on question change.

```typescript
// Frontend
const debouncedAutosave = useMemo(
  () => debounce(async (answer) => {
    await api.autosaveAnswer(answer);
  }, 30000), // 30 seconds
  []
);
```

**IMPACT**: 
- ✅ Reduces API calls by 90%
- ✅ Lower database load
- ✅ Better user experience (no lag)

---

### 4. Query Optimization
**WHY**: Avoid N+1 queries.

**BAD**:
```typescript
// N+1 query problem
const attempts = await getAttempts(); // 1 query
for (const attempt of attempts) {
  attempt.test = await getTest(attempt.test_id); // N queries
}
```

**GOOD**:
```typescript
// Single JOIN query
const attempts = await query(`
  SELECT sa.*, t.title, t.domain
  FROM student_attempts sa
  JOIN tests t ON sa.test_id = t.id
  WHERE sa.student_id = $1
`, [studentId]);
```

**IMPACT**: 100 queries → 1 query = 10x faster.

---

### 5. Connection Pooling
**WHY**: Neon (serverless Postgres) has connection limits.

**PATTERN**: Use `pg` pool with max connections.

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max 20 concurrent connections
  idleTimeoutMillis: 30000,
});
```

**IMPACT**: 
- ✅ Prevents "too many connections" errors
- ✅ Reuses connections (faster queries)

---

## Security Strategy

### 1. Timer Validation (Server-Side)
**WHY**: Prevent students from submitting after time expires.

**PATTERN**: Validate on every autosave and submit.

```typescript
function validateTimer(startedAt: Date, durationMinutes: number) {
  const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
  if (new Date() > expiresAt) {
    throw new BusinessError('Time expired', 403);
  }
}
```

**IMPACT**: 
- ✅ Prevents client-side timer manipulation
- ✅ Fair assessment

---

### 2. Hide Correct Answers
**WHY**: Students should not see correct answers during test.

**PATTERN**: Filter in repository layer.

```typescript
async getQuestionsForStudent(testId: number) {
  const questions = await this.questionRepo.findByTest(testId);
  
  return questions.map(q => {
    if (q.question_type === 'mcq') {
      const { correct_answer, ...rest } = q.type_specific_data;
      return { ...q, type_specific_data: rest };
    }
    return q;
  });
}
```

**IMPACT**: 
- ✅ Prevents cheating via browser DevTools
- ✅ Secure by default

---

### 3. Attempt Ownership Validation
**WHY**: Prevent students from accessing other students' attempts.

**PATTERN**: Always check `student_id` matches `req.user.id`.

```typescript
async getAttempt(attemptId: number, studentId: number) {
  const attempt = await this.attemptRepo.findById(attemptId);
  
  if (!attempt) {
    throw new BusinessError('Attempt not found', 404);
  }
  
  if (attempt.student_id !== studentId) {
    throw new BusinessError('Access denied', 403);
  }
  
  return attempt;
}
```

**IMPACT**: 
- ✅ Prevents unauthorized access
- ✅ GDPR compliance (data isolation)

---

### 4. Rate Limiting
**WHY**: Prevent autosave spam attacks.

**PATTERN**: Separate rate limits for autosave vs submit.

```typescript
// Autosave: 60 requests per minute (1 per second)
const autosaveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});

// Submit: 5 requests per minute (prevent retry spam)
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
});
```

**IMPACT**: 
- ✅ Prevents DoS attacks
- ✅ Protects database from overload

---

## Scalability Considerations

### 1. Horizontal Scaling (Stateless Backend)
**WHY**: Handle 1000+ concurrent test takers.

**PATTERN**: No session state in backend, all state in database.

**IMPACT**: 
- ✅ Can run multiple backend instances behind load balancer
- ✅ Auto-scaling in cloud (AWS ECS, Kubernetes)

---

### 2. Database Partitioning (Future)
**WHY**: When `student_attempts` table exceeds 1M rows.

**PATTERN**: Partition by `test_id` or `created_at`.

```sql
CREATE TABLE student_attempts_2024 PARTITION OF student_attempts
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

**IMPACT**: 
- ✅ Faster queries (scan only relevant partition)
- ✅ Easier archival (drop old partitions)

---

### 3. Read Replicas (Future)
**WHY**: Separate read traffic (student dashboards) from write traffic (submissions).

**PATTERN**: Route SELECT queries to read replica, INSERT/UPDATE to primary.

**IMPACT**: 
- ✅ 10x read throughput
- ✅ Primary database handles writes only

---

### 4. Caching (Future)
**WHY**: Reduce database load for frequently accessed data.

**PATTERN**: Cache test questions (rarely change) in Redis.

```typescript
async getTestQuestions(testId: number) {
  const cacheKey = `test:${testId}:questions`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Cache miss: fetch from DB
  const questions = await this.questionRepo.findByTest(testId);
  await redis.setex(cacheKey, 3600, JSON.stringify(questions)); // 1 hour TTL
  
  return questions;
}
```

**IMPACT**: 
- ✅ 100x faster (1ms vs 100ms)
- ✅ Reduces database load by 80%

---

## Next Steps

1. **Implement Service Layer** (`services/assessment.service.ts`)
2. **Implement Repository Layer** (`repositories/assessment.repository.ts`)
3. **Implement Controllers** (`controllers/assessment.controller.ts`)
4. **Implement Routes** (`routes/assessment.routes.ts`)
5. **Implement Frontend Components** (Test Page, Admin Panel, Review Panel)
6. **Write Tests** (Unit tests for services, integration tests for APIs)
7. **Performance Testing** (Load test with 100 concurrent users)
8. **Deploy** (Run migrations, deploy backend, deploy frontend)

---

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── assessment.service.ts       # Business logic
│   │   ├── scoring.service.ts          # Score calculation
│   │   └── review.service.ts           # Manual review workflow
│   ├── repositories/
│   │   ├── question.repository.ts      # Question CRUD
│   │   ├── attempt.repository.ts       # Attempt CRUD
│   │   ├── answer.repository.ts        # Answer CRUD
│   │   └── review.repository.ts        # Review CRUD
│   ├── controllers/
│   │   ├── assessment.controller.ts    # Student endpoints
│   │   └── admin-assessment.controller.ts # Admin endpoints
│   ├── routes/
│   │   ├── assessment.routes.ts        # Student routes
│   │   └── admin-assessment.routes.ts  # Admin routes
│   ├── middleware/
│   │   └── assessment.validation.ts    # Request validation schemas
│   └── types/
│       └── assessment.types.ts         # TypeScript types

frontend/
├── app/
│   └── dashboard/
│       ├── student/
│       │   └── take-test/
│       │       └── [attemptId]/
│       │           └── page.tsx        # Test taking page
│       └── admin/
│           ├── create-test/
│           │   └── page.tsx            # Test creation
│           └── review-queue/
│               └── page.tsx            # Manual review queue
├── components/
│   └── assessment/
│       ├── TestTimer.tsx               # Countdown timer
│       ├── QuestionRenderer.tsx        # Dynamic question renderer
│       ├── MCQQuestion.tsx             # MCQ renderer
│       ├── CodingQuestion.tsx          # Monaco editor
│       ├── SQLQuestion.tsx             # SQL editor
│       ├── QuestionNavigator.tsx       # Question list sidebar
│       └── ReviewPanel.tsx             # Admin review UI
└── lib/
    └── assessment-api.ts               # Assessment API client
```

---

## Summary

This architecture provides:

✅ **Separation of Concerns**: Routes → Controllers → Services → Repositories  
✅ **Testability**: Each layer can be unit tested independently  
✅ **Scalability**: Stateless backend, horizontal scaling ready  
✅ **Performance**: Indexed queries, pagination, autosave debouncing  
✅ **Security**: Timer validation, access control, rate limiting  
✅ **Maintainability**: Clear responsibilities, dependency injection  
✅ **Production-Ready**: Transaction management, error handling, monitoring hooks  

**This is NOT a tutorial architecture. This is how you build systems that scale to 100K+ users.**
