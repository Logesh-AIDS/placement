# Assessment Module - Quick Reference Guide

## Common Operations

### Database Operations

#### Create a Test Question (SQL)
```sql
-- MCQ Question
INSERT INTO question_bank (
  question_type, domain, title, description, type_specific_data, 
  default_marks, created_by
) VALUES (
  'mcq', 
  'Web', 
  'What is React?', 
  'Choose the correct answer',
  '{"options": ["Library", "Framework", "Language"], "correct_answer": "Library"}',
  10,
  1
);

-- Coding Question
INSERT INTO question_bank (
  question_type, domain, title, description, type_specific_data,
  default_marks, default_time_mins, created_by
) VALUES (
  'coding',
  'DSA',
  'Implement Binary Search',
  'Write a function to perform binary search on a sorted array',
  '{
    "language": "javascript",
    "starter_code": "function binarySearch(arr, target) {\n  // Your code here\n}",
    "test_cases": [
      {"input": "[1,2,3,4,5], 3", "expected_output": "2"}
    ],
    "constraints": ["1 <= arr.length <= 10^4"]
  }',
  20,
  15,
  1
);

-- SQL Question
INSERT INTO question_bank (
  question_type, domain, title, description, type_specific_data,
  default_marks, created_by
) VALUES (
  'sql',
  'Web',
  'Write a JOIN query',
  'Fetch all users with their orders',
  '{
    "schema_context": "users(id, name), orders(id, user_id, total)",
    "expected_output": "List of users with order totals"
  }',
  15,
  1
);
```

#### Create a Test
```sql
-- Create test
INSERT INTO tests (
  title, domain, description, duration_minutes, 
  total_marks, passing_marks, created_by
) VALUES (
  'Web Development Assessment',
  'Web',
  'Comprehensive test covering React, Node.js, and databases',
  90,
  100,
  60,
  1
) RETURNING id;

-- Link questions to test (assuming test_id = 1)
INSERT INTO test_questions (test_id, question_id, order_index, marks) VALUES
  (1, 1, 1, 10),
  (1, 2, 2, 20),
  (1, 3, 3, 15);
```

#### Query Pending Reviews
```sql
-- Get all pending reviews
SELECT * FROM pending_reviews_queue LIMIT 50;

-- Get reviews for specific test
SELECT * FROM pending_reviews_queue 
WHERE test_id = 1 
ORDER BY assigned_at ASC;

-- Get reviews for specific student
SELECT * FROM pending_reviews_queue 
WHERE student_id = 5;
```

#### Query Student Attempts
```sql
-- Get all attempts for a student
SELECT * FROM student_attempt_summary 
WHERE student_id = 5 
ORDER BY started_at DESC;

-- Get attempts for a test
SELECT * FROM student_attempt_summary 
WHERE test_id = 1 
ORDER BY percentage DESC;

-- Get in-progress attempts
SELECT * FROM student_attempts 
WHERE status = 'in_progress' 
AND started_at < NOW() - INTERVAL '2 hours';
```

---

### API Operations (curl)

#### Start Test Attempt
```bash
curl -X POST http://localhost:5000/api/assessments/attempts/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "test_id": 1
  }'
```

#### Autosave Answer (MCQ)
```bash
curl -X POST http://localhost:5000/api/assessments/answers/autosave \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attempt_id": 123,
    "question_id": 1,
    "answer_data": {
      "selected_option": "Library"
    },
    "time_spent_seconds": 45
  }'
```

#### Autosave Answer (Coding)
```bash
curl -X POST http://localhost:5000/api/assessments/answers/autosave \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attempt_id": 123,
    "question_id": 2,
    "answer_data": {
      "code": "function binarySearch(arr, target) {\n  return arr.indexOf(target);\n}",
      "language": "javascript"
    },
    "time_spent_seconds": 300
  }'
```

#### Submit Test
```bash
curl -X POST http://localhost:5000/api/assessments/attempts/123/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "question_id": 1,
        "answer_data": {"selected_option": "Library"},
        "time_spent_seconds": 120
      },
      {
        "question_id": 2,
        "answer_data": {
          "code": "function binarySearch(arr, target) { ... }",
          "language": "javascript"
        },
        "time_spent_seconds": 900
      }
    ]
  }'
```

#### Get Attempt Results
```bash
curl -X GET http://localhost:5000/api/assessments/attempts/123/results \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Submit Review (Admin)
```bash
curl -X POST http://localhost:5000/api/assessments/admin/reviews/15/submit \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marks_awarded": 15,
    "feedback": "Good implementation. Consider edge cases."
  }'
```

---

### Frontend Code Snippets

#### Start Test
```typescript
import { assessmentApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthContext';

const { token } = useAuth();

async function startTest(testId: number) {
  try {
    const result = await assessmentApi.startAttempt(token!, testId);
    console.log('Attempt started:', result.data.attempt_id);
    // Navigate to test page
    router.push(`/dashboard/student/take-test/${result.data.attempt_id}`);
  } catch (err) {
    console.error('Failed to start test:', err);
  }
}
```

#### Autosave Answer
```typescript
import { assessmentApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthContext';
import { debounce } from 'lodash';

const { token } = useAuth();

const autosaveAnswer = debounce(async (
  attemptId: number,
  questionId: number,
  answerData: any,
  timeSpent: number
) => {
  try {
    await assessmentApi.autosaveAnswer(token!, {
      attempt_id: attemptId,
      question_id: questionId,
      answer_data: answerData,
      time_spent_seconds: timeSpent,
    });
    console.log('Answer saved');
  } catch (err) {
    console.error('Autosave failed:', err);
  }
}, 30000); // 30 seconds
```

#### Submit Test
```typescript
import { assessmentApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthContext';

const { token } = useAuth();

async function submitTest(attemptId: number, answers: any[]) {
  try {
    const result = await assessmentApi.submitAttempt(token!, attemptId, answers);
    console.log('Test submitted:', result.data);
    // Navigate to results page
    router.push(`/dashboard/student/test-results/${attemptId}`);
  } catch (err) {
    console.error('Submit failed:', err);
  }
}
```

#### Timer Hook
```typescript
import { useEffect, useState } from 'react';

function useTestTimer(expiresAt: Date, onExpire: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setRemainingSeconds(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  
  const formattedTime = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return { remainingSeconds, formattedTime };
}
```

---

### Common Queries

#### Get Test Statistics
```sql
SELECT 
  t.id,
  t.title,
  COUNT(DISTINCT sa.id) as total_attempts,
  COUNT(DISTINCT CASE WHEN sa.status = 'evaluated' THEN sa.id END) as completed,
  AVG(CASE WHEN sa.status = 'evaluated' THEN sa.percentage END) as avg_score,
  COUNT(DISTINCT CASE WHEN sa.percentage >= t.passing_marks THEN sa.id END)::DECIMAL / 
    NULLIF(COUNT(DISTINCT CASE WHEN sa.status = 'evaluated' THEN sa.id END), 0) * 100 as pass_rate
FROM tests t
LEFT JOIN student_attempts sa ON t.id = sa.test_id
WHERE t.id = 1
GROUP BY t.id, t.title;
```

#### Get Student Performance
```sql
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(DISTINCT sa.id) as tests_taken,
  AVG(sa.percentage) as avg_score,
  MAX(sa.percentage) as best_score,
  COUNT(DISTINCT CASE WHEN sa.percentage >= t.passing_marks THEN sa.id END) as tests_passed
FROM users u
LEFT JOIN student_attempts sa ON u.id = sa.student_id
LEFT JOIN tests t ON sa.test_id = t.id
WHERE u.id = 5
GROUP BY u.id, u.name, u.email;
```

#### Get Review Workload
```sql
SELECT 
  u.id as reviewer_id,
  u.name as reviewer_name,
  COUNT(DISTINCT CASE WHEN mr.status = 'in_review' THEN mr.id END) as in_review,
  COUNT(DISTINCT CASE WHEN mr.status = 'completed' THEN mr.id END) as completed,
  AVG(EXTRACT(EPOCH FROM (mr.reviewed_at - mr.assigned_at)) / 60) as avg_review_time_mins
FROM users u
LEFT JOIN manual_reviews mr ON u.id = mr.reviewer_id
WHERE u.role = 'admin'
GROUP BY u.id, u.name;
```

#### Find Expired In-Progress Attempts
```sql
SELECT 
  sa.id,
  sa.student_id,
  u.name as student_name,
  sa.test_id,
  t.title as test_title,
  sa.started_at,
  sa.started_at + (t.duration_minutes || ' minutes')::INTERVAL as should_expire_at,
  NOW() - sa.started_at as elapsed_time
FROM student_attempts sa
JOIN users u ON sa.student_id = u.id
JOIN tests t ON sa.test_id = t.id
WHERE sa.status = 'in_progress'
AND sa.started_at + (t.duration_minutes || ' minutes')::INTERVAL < NOW();
```

---

### Troubleshooting

#### "Time expired" error
```sql
-- Check if timer is actually expired
SELECT 
  sa.id,
  sa.started_at,
  t.duration_minutes,
  sa.started_at + (t.duration_minutes || ' minutes')::INTERVAL as expires_at,
  NOW() as current_time,
  CASE 
    WHEN NOW() > sa.started_at + (t.duration_minutes || ' minutes')::INTERVAL 
    THEN 'EXPIRED' 
    ELSE 'VALID' 
  END as status
FROM student_attempts sa
JOIN tests t ON sa.test_id = t.id
WHERE sa.id = 123;
```

#### "Attempt already exists" error
```sql
-- Check existing attempts
SELECT * FROM student_attempts 
WHERE student_id = 5 AND test_id = 1;

-- Delete attempt (if needed for testing)
DELETE FROM student_attempts 
WHERE student_id = 5 AND test_id = 1;
```

#### Autosave not working
```sql
-- Check last autosave timestamp
SELECT 
  sa.id,
  sa.last_autosave_at,
  NOW() - sa.last_autosave_at as time_since_last_save
FROM student_attempts sa
WHERE sa.id = 123;

-- Check saved answers
SELECT 
  ans.question_id,
  ans.answer_data,
  ans.is_final,
  ans.version,
  ans.updated_at
FROM student_answers ans
WHERE ans.attempt_id = 123
ORDER BY ans.updated_at DESC;
```

#### Review not updating score
```sql
-- Check review status
SELECT 
  mr.id,
  mr.status,
  mr.marks_awarded,
  mr.reviewed_at,
  sa.attempt_id
FROM manual_reviews mr
JOIN student_answers ans ON mr.answer_id = ans.id
JOIN student_attempts sa ON ans.attempt_id = sa.id
WHERE sa.id = 123;

-- Manually trigger score update
UPDATE student_attempts
SET 
  manual_score = (
    SELECT COALESCE(SUM(mr.marks_awarded), 0)
    FROM student_answers ans
    JOIN manual_reviews mr ON mr.answer_id = ans.id
    WHERE ans.attempt_id = student_attempts.id
    AND mr.status = 'completed'
  ),
  total_score = mcq_score + (
    SELECT COALESCE(SUM(mr.marks_awarded), 0)
    FROM student_answers ans
    JOIN manual_reviews mr ON mr.answer_id = ans.id
    WHERE ans.attempt_id = student_attempts.id
    AND mr.status = 'completed'
  )
WHERE id = 123;
```

---

### Performance Monitoring

#### Check Query Performance
```sql
-- Enable query timing
\timing on

-- Analyze slow queries
EXPLAIN ANALYZE
SELECT * FROM pending_reviews_queue LIMIT 50;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

#### Check Connection Pool
```sql
-- Check active connections
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = current_database();
```

#### Check Table Sizes
```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

### Maintenance Tasks

#### Cleanup Expired Tokens (Run Daily)
```sql
DELETE FROM refresh_tokens 
WHERE expires_at < NOW() OR revoked_at IS NOT NULL;

DELETE FROM password_reset_tokens 
WHERE expires_at < NOW() OR used_at IS NOT NULL;
```

#### Archive Old Attempts (Run Monthly)
```sql
-- Create archive table (one-time)
CREATE TABLE student_attempts_archive (LIKE student_attempts INCLUDING ALL);

-- Move old attempts
INSERT INTO student_attempts_archive
SELECT * FROM student_attempts
WHERE status = 'evaluated'
AND evaluated_at < NOW() - INTERVAL '1 year';

DELETE FROM student_attempts
WHERE status = 'evaluated'
AND evaluated_at < NOW() - INTERVAL '1 year';
```

#### Vacuum Tables (Run Weekly)
```sql
VACUUM ANALYZE student_attempts;
VACUUM ANALYZE student_answers;
VACUUM ANALYZE manual_reviews;
```

---

### Testing Checklist

#### Database Tests
- [ ] Create question (MCQ, SQL, Coding)
- [ ] Create test with questions
- [ ] Verify triggers fire on update
- [ ] Verify indexes exist
- [ ] Test views return correct data

#### API Tests
- [ ] Start attempt (success)
- [ ] Start attempt (duplicate - should fail)
- [ ] Start attempt (domain mismatch - should fail)
- [ ] Autosave answer (success)
- [ ] Autosave answer (timer expired - should fail)
- [ ] Submit attempt (success)
- [ ] Submit attempt (timer expired - should fail)
- [ ] Get results (success)
- [ ] Submit review (admin - success)

#### Frontend Tests
- [ ] Timer counts down correctly
- [ ] Autosave triggers every 30s
- [ ] Autosave triggers on question change
- [ ] Question navigator shows correct status
- [ ] Monaco editor loads for coding questions
- [ ] Submit confirmation shows unanswered questions
- [ ] Results page shows scores and feedback

---

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### Useful Commands

```bash
# Backend
cd backend
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server

# Frontend
cd frontend
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server

# Database
psql $DATABASE_URL       # Connect to database
\dt                      # List tables
\d table_name            # Describe table
\di                      # List indexes
```

---

**This quick reference covers 90% of common operations. For detailed explanations, refer to the main documentation files.**
