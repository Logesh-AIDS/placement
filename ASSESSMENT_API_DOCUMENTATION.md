# Assessment Module - API Documentation

## Base URL
```
http://localhost:5000/api/assessments
```

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Student Endpoints

### 1. Start Test Attempt

**Endpoint**: `POST /attempts/start`

**Authorization**: Student only

**Description**: Creates a new test attempt for the authenticated student.

**Request Body**:
```json
{
  "test_id": 1
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "attempt_id": 123,
    "test": {
      "id": 1,
      "title": "Web Development Assessment",
      "duration_minutes": 60,
      "total_marks": 100
    },
    "questions": [
      {
        "id": 1,
        "question_type": "mcq",
        "title": "What is React?",
        "description": "Choose the correct answer",
        "type_specific_data": {
          "options": ["Library", "Framework", "Language"]
          // Note: correct_answer is hidden
        },
        "marks": 10,
        "order_index": 1
      },
      {
        "id": 2,
        "question_type": "coding",
        "title": "Implement Binary Search",
        "description": "Write a function to perform binary search",
        "type_specific_data": {
          "language": "javascript",
          "starter_code": "function binarySearch(arr, target) {\n  // Your code here\n}",
          "test_cases": [
            {
              "input": "[1,2,3,4,5], 3",
              "expected_output": "2"
            }
          ]
        },
        "marks": 20,
        "order_index": 2
      }
    ],
    "started_at": "2024-01-15T10:00:00Z",
    "expires_at": "2024-01-15T11:00:00Z"
  }
}
```

**Error Responses**:
- `404`: Test not found or inactive
- `403`: Domain mismatch (student domain ≠ test domain)
- `409`: Student already attempted this test

**Business Rules**:
1. Student can only attempt each test once
2. Student domain must match test domain
3. Test must be active
4. Timer starts immediately upon creation

---

### 2. Autosave Answer

**Endpoint**: `POST /answers/autosave`

**Authorization**: Student only

**Description**: Saves student's answer for a specific question (idempotent).

**Request Body**:
```json
{
  "attempt_id": 123,
  "question_id": 1,
  "answer_data": {
    "selected_option": "Library"
  },
  "time_spent_seconds": 45
}
```

**Answer Data Formats**:

**MCQ**:
```json
{
  "selected_option": "Library"
}
```

**SQL**:
```json
{
  "code": "SELECT * FROM users WHERE age > 18;"
}
```

**Coding**:
```json
{
  "code": "function binarySearch(arr, target) {\n  return arr.indexOf(target);\n}",
  "language": "javascript"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Answer saved"
}
```

**Error Responses**:
- `404`: Attempt not found
- `403`: Access denied (attempt doesn't belong to student) OR Time expired
- `400`: Attempt already submitted

**Business Rules**:
1. Validates attempt belongs to authenticated student
2. Validates timer not expired
3. Upserts answer (creates or updates)
4. Updates `last_autosave_at` timestamp
5. Increments version number (optimistic locking)

**Performance**:
- Debounce on frontend (30s)
- Idempotent (safe to retry)
- Uses `ON CONFLICT` for upsert (atomic)

---

### 3. Submit Test Attempt

**Endpoint**: `POST /attempts/:attempt_id/submit`

**Authorization**: Student only

**Description**: Submits the test attempt for evaluation.

**Request Body**:
```json
{
  "answers": [
    {
      "question_id": 1,
      "answer_data": {
        "selected_option": "Library"
      },
      "time_spent_seconds": 120
    },
    {
      "question_id": 2,
      "answer_data": {
        "code": "function binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}",
        "language": "javascript"
      },
      "time_spent_seconds": 900
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "attempt_id": 123,
    "status": "submitted",
    "mcq_score": 10,
    "total_score": 10,
    "max_possible_score": 30,
    "percentage": 33.33,
    "submitted_at": "2024-01-15T10:45:00Z",
    "requires_manual_review": true,
    "pending_review_count": 1
  }
}
```

**Error Responses**:
- `404`: Attempt not found
- `403`: Access denied OR Time expired (with 30s grace period)
- `400`: Attempt already submitted

**Business Rules**:
1. Validates timer (allows 30s grace period for network latency)
2. Saves all answers as final
3. Auto-scores MCQ questions
4. Creates `manual_reviews` for SQL/Coding questions
5. Updates attempt status to `submitted`
6. Calculates MCQ score immediately
7. Manual score added later by admin

**Transaction Safety**:
- All operations in single transaction
- Rollback on any error
- Atomic score calculation

**Performance**:
- Batch insert answers
- Parallel score calculation
- Indexed queries for questions

---

### 4. Get Attempt Results

**Endpoint**: `GET /attempts/:attempt_id/results`

**Authorization**: Student only

**Description**: Retrieves detailed results for a submitted attempt.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": 123,
      "student_id": 5,
      "test_id": 1,
      "status": "evaluated",
      "mcq_score": 10,
      "manual_score": 15,
      "total_score": 25,
      "max_possible_score": 30,
      "percentage": 83.33,
      "started_at": "2024-01-15T10:00:00Z",
      "submitted_at": "2024-01-15T10:45:00Z",
      "evaluated_at": "2024-01-15T11:30:00Z"
    },
    "test": {
      "id": 1,
      "title": "Web Development Assessment",
      "domain": "Web",
      "passing_marks": 50
    },
    "answers": [
      {
        "question_id": 1,
        "question_type": "mcq",
        "question_title": "What is React?",
        "answer_data": {
          "selected_option": "Library"
        },
        "is_correct": true,
        "auto_score": 10,
        "max_marks": 10
      },
      {
        "question_id": 2,
        "question_type": "coding",
        "question_title": "Implement Binary Search",
        "answer_data": {
          "code": "function binarySearch(arr, target) { ... }",
          "language": "javascript"
        },
        "is_correct": null,
        "auto_score": 0,
        "manual_review": {
          "status": "completed",
          "marks_awarded": 15,
          "feedback": "Good implementation. Consider edge cases for empty arrays.",
          "reviewed_at": "2024-01-15T11:30:00Z"
        },
        "max_marks": 20
      }
    ]
  }
}
```

**Error Responses**:
- `404`: Attempt not found
- `403`: Access denied (attempt doesn't belong to student)

**Business Rules**:
1. Only shows results after submission
2. Shows pending reviews if not yet evaluated
3. Shows feedback only after review completed

---

## Admin Endpoints

### 5. Create Question

**Endpoint**: `POST /admin/questions`

**Authorization**: Admin only

**Description**: Creates a new question in the question bank.

**Request Body (MCQ)**:
```json
{
  "question_type": "mcq",
  "domain": "Web",
  "title": "What is React?",
  "description": "Choose the correct answer about React",
  "type_specific_data": {
    "options": ["Library", "Framework", "Language", "Database"],
    "correct_answer": "Library"
  },
  "difficulty_level": "easy",
  "default_marks": 10,
  "default_time_mins": 2
}
```

**Request Body (Coding)**:
```json
{
  "question_type": "coding",
  "domain": "DSA",
  "title": "Implement Binary Search",
  "description": "Write a function to perform binary search on a sorted array",
  "type_specific_data": {
    "language": "javascript",
    "starter_code": "function binarySearch(arr, target) {\n  // Your code here\n}",
    "test_cases": [
      {
        "input": "[1,2,3,4,5], 3",
        "expected_output": "2",
        "is_hidden": false
      },
      {
        "input": "[1,2,3,4,5], 6",
        "expected_output": "-1",
        "is_hidden": true
      }
    ],
    "constraints": [
      "1 <= arr.length <= 10^4",
      "Array is sorted in ascending order"
    ]
  },
  "difficulty_level": "medium",
  "default_marks": 20,
  "default_time_mins": 15
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 42,
    "question_type": "coding",
    "domain": "DSA",
    "title": "Implement Binary Search",
    "description": "Write a function to perform binary search on a sorted array",
    "type_specific_data": { ... },
    "difficulty_level": "medium",
    "default_marks": 20,
    "default_time_mins": 15,
    "created_by": 1,
    "is_active": true,
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  }
}
```

**Validation**:
- MCQ must have at least 2 options
- MCQ `correct_answer` must be in `options`
- Coding must have `language`
- SQL can have optional `expected_output` and `schema_context`

---

### 6. Create Test with Questions

**Endpoint**: `POST /admin/tests`

**Authorization**: Admin only

**Description**: Creates a new test and links questions to it.

**Request Body**:
```json
{
  "title": "Web Development Final Assessment",
  "domain": "Web",
  "description": "Comprehensive test covering React, Node.js, and databases",
  "duration_minutes": 90,
  "passing_marks": 60,
  "questions": [
    {
      "question_id": 1,
      "marks": 10,
      "order_index": 1
    },
    {
      "question_id": 2,
      "marks": 20,
      "order_index": 2
    },
    {
      "question_data": {
        "question_type": "sql",
        "domain": "Web",
        "title": "Write a JOIN query",
        "description": "Fetch all users with their orders",
        "type_specific_data": {
          "schema_context": "users(id, name), orders(id, user_id, total)"
        },
        "default_marks": 15
      },
      "marks": 15,
      "order_index": 3
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "Web Development Final Assessment",
    "domain": "Web",
    "description": "Comprehensive test covering React, Node.js, and databases",
    "duration_minutes": 90,
    "total_marks": 45,
    "passing_marks": 60,
    "created_by": 1,
    "is_active": true,
    "created_at": "2024-01-15T09:00:00Z",
    "questions": [
      {
        "test_question_id": 10,
        "question_id": 1,
        "order_index": 1,
        "marks": 10
      },
      {
        "test_question_id": 11,
        "question_id": 2,
        "order_index": 2,
        "marks": 20
      },
      {
        "test_question_id": 12,
        "question_id": 43,
        "order_index": 3,
        "marks": 15
      }
    ]
  }
}
```

**Business Rules**:
1. Can reuse existing questions (`question_id`)
2. Can create new questions inline (`question_data`)
3. `total_marks` auto-calculated from question marks
4. Questions ordered by `order_index`

---

### 7. Get Review Queue

**Endpoint**: `GET /admin/reviews/pending`

**Authorization**: Admin only

**Description**: Retrieves pending manual reviews.

**Query Parameters**:
- `limit` (optional): Max results (default: 50)
- `page` (optional): Page number (default: 1)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "review_id": 15,
      "answer_id": 234,
      "question_id": 2,
      "question_type": "coding",
      "question_title": "Implement Binary Search",
      "question_description": "Write a function to perform binary search",
      "type_specific_data": {
        "language": "javascript",
        "test_cases": [ ... ]
      },
      "answer_data": {
        "code": "function binarySearch(arr, target) { ... }",
        "language": "javascript"
      },
      "student_id": 5,
      "student_name": "John Doe",
      "student_email": "john@example.com",
      "test_id": 1,
      "test_title": "Web Development Assessment",
      "max_marks": 20,
      "assigned_at": "2024-01-15T10:45:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50
  }
}
```

---

### 8. Submit Review

**Endpoint**: `POST /admin/reviews/:review_id/submit`

**Authorization**: Admin only

**Description**: Submits marks and feedback for a manual review.

**Request Body**:
```json
{
  "marks_awarded": 15,
  "feedback": "Good implementation. Consider edge cases for empty arrays."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "review_id": 15,
    "answer_id": 234,
    "reviewer_id": 1,
    "status": "completed",
    "marks_awarded": 15,
    "max_marks": 20,
    "feedback": "Good implementation. Consider edge cases for empty arrays.",
    "reviewed_at": "2024-01-15T11:30:00Z"
  }
}
```

**Business Rules**:
1. `marks_awarded` must be ≤ `max_marks`
2. Triggers score recalculation for attempt
3. Updates attempt status to `evaluated` if all reviews completed
4. Updates student's overall score in `users` table

**Database Trigger**:
- `update_attempt_score()` trigger recalculates total score
- Marks attempt as `evaluated` when all reviews completed

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**HTTP Status Codes**:
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions or timer expired)
- `404`: Not Found
- `409`: Conflict (duplicate attempt)
- `500`: Internal Server Error

---

## Rate Limiting

**Autosave**: 60 requests per minute per user  
**Submit**: 5 requests per minute per user  
**Other endpoints**: 300 requests per 15 minutes per user

---

## Performance Considerations

### Indexes Used
- `idx_student_attempts_student_status` for student dashboard
- `idx_manual_reviews_pending` for review queue
- `idx_test_questions_order` for question loading

### Query Optimization
- JOINs used to avoid N+1 queries
- Pagination for large result sets
- Connection pooling (max 20 connections)

### Caching Strategy (Future)
- Cache test questions (rarely change)
- Cache user permissions
- Invalidate on test/question updates

---

## Security

### Authentication
- JWT tokens with 15-minute expiry
- Refresh tokens for session management

### Authorization
- Role-based access control (student/admin)
- Ownership validation (student can only access own attempts)

### Input Validation
- Request body validation using express-validator
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

### Timer Validation
- Server-side validation on submit
- 30-second grace period for network latency
- Client timer is UX only (not trusted)

---

## Testing

### Test Cases

**Start Attempt**:
- ✅ Success: Valid test, matching domain
- ❌ Error: Test not found
- ❌ Error: Domain mismatch
- ❌ Error: Duplicate attempt

**Autosave**:
- ✅ Success: Valid answer
- ✅ Success: Upsert (update existing answer)
- ❌ Error: Timer expired
- ❌ Error: Attempt already submitted

**Submit**:
- ✅ Success: All MCQ questions auto-scored
- ✅ Success: Coding questions create manual reviews
- ❌ Error: Timer expired (no grace period)
- ❌ Error: Already submitted

**Review**:
- ✅ Success: Marks awarded, feedback saved
- ✅ Success: Attempt marked evaluated when all reviews done
- ❌ Error: Marks exceed max_marks

---

## Monitoring

### Metrics to Track
- Average test completion time
- Autosave success rate
- Submit success rate
- Review queue length
- API response times

### Alerts
- Review queue > 100 items
- API response time > 2 seconds
- Error rate > 5%

---

**This API is production-ready with proper validation, security, and performance optimization.**
