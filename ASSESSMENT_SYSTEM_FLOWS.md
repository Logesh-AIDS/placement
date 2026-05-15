# Assessment Module - System Flows

## Visual Flow Diagrams

### 1. Student Test Taking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     STUDENT TEST FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. BROWSE TESTS
   ┌──────────────┐
   │ Student      │
   │ Dashboard    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ GET /tests   │ ← Filter by domain
   │ ?domain=Web  │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Display available tests      │
   │ - Title, Duration, Marks     │
   │ - "Start Test" button        │
   └──────────────────────────────┘

2. START TEST
   ┌──────────────┐
   │ Click        │
   │ "Start Test" │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ POST /attempts/start        │
   │ { test_id: 1 }              │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Backend Validation:         │
   │ ✓ Test exists & active      │
   │ ✓ Domain matches            │
   │ ✓ No existing attempt       │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Create attempt record       │
   │ - Start timer               │
   │ - Load questions            │
   │ - Hide correct answers      │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Redirect to test page       │
   │ /take-test/[attemptId]      │
   └─────────────────────────────┘

3. ANSWER QUESTIONS
   ┌─────────────────────────────┐
   │ Test Page Loaded            │
   │ - Timer starts countdown    │
   │ - Question 1 displayed      │
   │ - Navigator shows progress  │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Student answers question    │
   │ - MCQ: Select option        │
   │ - Coding: Write code        │
   │ - SQL: Write query          │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Autosave triggers           │
   │ - Every 30 seconds          │
   │ - On question change        │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ POST /answers/autosave      │
   │ {                           │
   │   attempt_id: 123,          │
   │   question_id: 1,           │
   │   answer_data: {...},       │
   │   time_spent: 45            │
   │ }                           │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Backend Validation:         │
   │ ✓ Attempt belongs to user   │
   │ ✓ Timer not expired         │
   │ ✓ Attempt not submitted     │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Upsert answer               │
   │ - Create or update          │
   │ - Increment version         │
   │ - Update timestamp          │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Continue answering...       │
   │ Repeat for all questions    │
   └─────────────────────────────┘

4. SUBMIT TEST
   ┌─────────────────────────────┐
   │ Click "Submit Test"         │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Show confirmation dialog    │
   │ - List unanswered questions │
   │ - "Are you sure?"           │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ POST /attempts/:id/submit   │
   │ {                           │
   │   answers: [                │
   │     { question_id, data },  │
   │     ...                     │
   │   ]                         │
   │ }                           │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Backend Processing:         │
   │ ✓ Validate timer            │
   │ ✓ Save all answers          │
   │ ✓ Auto-score MCQ            │
   │ ✓ Create manual reviews     │
   │ ✓ Calculate scores          │
   │ ✓ Mark as submitted         │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Return results              │
   │ - MCQ score (immediate)     │
   │ - Pending reviews count     │
   │ - Percentage                │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Redirect to results page    │
   │ /test-results/[attemptId]   │
   └─────────────────────────────┘

5. VIEW RESULTS
   ┌─────────────────────────────┐
   │ GET /attempts/:id/results   │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Display results:            │
   │ - MCQ answers (correct/wrong)│
   │ - Coding answers (pending)  │
   │ - Total score               │
   │ - Pass/Fail status          │
   └─────────────────────────────┘
```

---

### 2. Admin Test Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN TEST CREATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

1. CREATE QUESTIONS
   ┌──────────────┐
   │ Admin        │
   │ Dashboard    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Navigate to                  │
   │ "Create Question" page       │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Fill question form:          │
   │ - Type (MCQ/SQL/Coding)      │
   │ - Domain (Web/DSA/ML)        │
   │ - Title & Description        │
   │ - Type-specific data         │
   │ - Marks & Time               │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ POST /admin/questions        │
   │ {                            │
   │   question_type: "mcq",      │
   │   domain: "Web",             │
   │   title: "What is React?",   │
   │   type_specific_data: {      │
   │     options: [...],          │
   │     correct_answer: "..."    │
   │   },                         │
   │   default_marks: 10          │
   │ }                            │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Validate & Save              │
   │ - Check required fields      │
   │ - Validate type-specific data│
   │ - Insert into question_bank  │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Question created             │
   │ - Show success message       │
   │ - Return question ID         │
   └──────────────────────────────┘

2. CREATE TEST
   ┌──────────────────────────────┐
   │ Navigate to                  │
   │ "Create Test" page           │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Fill test form:              │
   │ - Title & Description        │
   │ - Domain                     │
   │ - Duration (minutes)         │
   │ - Passing marks              │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Add questions:               │
   │ - Search question bank       │
   │ - Select existing questions  │
   │ - OR create new inline       │
   │ - Set marks per question     │
   │ - Set order                  │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ POST /admin/tests            │
   │ {                            │
   │   title: "Web Assessment",   │
   │   domain: "Web",             │
   │   duration_minutes: 90,      │
   │   passing_marks: 60,         │
   │   questions: [               │
   │     {                        │
   │       question_id: 1,        │
   │       marks: 10,             │
   │       order_index: 1         │
   │     },                       │
   │     ...                      │
   │   ]                          │
   │ }                            │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Backend Processing:          │
   │ 1. Create test record        │
   │ 2. Create test_questions     │
   │ 3. Calculate total_marks     │
   │ 4. Validate passing_marks    │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Test created                 │
   │ - Show success message       │
   │ - Redirect to test list      │
   └──────────────────────────────┘
```

---

### 3. Admin Review Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN REVIEW FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. VIEW REVIEW QUEUE
   ┌──────────────┐
   │ Admin        │
   │ Dashboard    │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Navigate to                  │
   │ "Review Queue" page          │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ GET /admin/reviews/pending   │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Display pending reviews:     │
   │ - Student name               │
   │ - Test name                  │
   │ - Question title             │
   │ - Question type              │
   │ - Submitted time             │
   │ - "Review" button            │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Sort by:                     │
   │ - Oldest first (default)     │
   │ - Test name                  │
   │ - Student name               │
   └──────────────────────────────┘

2. REVIEW ANSWER
   ┌──────────────────────────────┐
   │ Click "Review" button        │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Display review panel:        │
   │                              │
   │ LEFT SIDE:                   │
   │ - Question description       │
   │ - Test cases (if coding)     │
   │ - Expected output (if SQL)   │
   │ - Constraints                │
   │                              │
   │ RIGHT SIDE:                  │
   │ - Student's answer           │
   │ - Code editor (read-only)    │
   │ - Syntax highlighting        │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Admin evaluates:             │
   │ - Read code/query            │
   │ - Check correctness          │
   │ - Check edge cases           │
   │ - Check efficiency           │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Fill review form:            │
   │ - Marks awarded (0-max)      │
   │ - Feedback (optional)        │
   │ - "Submit Review" button     │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ POST /admin/reviews/:id      │
   │ {                            │
   │   marks_awarded: 15,         │
   │   feedback: "Good work..."   │
   │ }                            │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Backend Processing:          │
   │ 1. Validate marks <= max     │
   │ 2. Update review status      │
   │ 3. Trigger score calculation │
   │ 4. Update attempt scores     │
   │ 5. Check if all reviews done │
   │ 6. Mark attempt as evaluated │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Review submitted             │
   │ - Show success message       │
   │ - Load next review           │
   └──────────────────────────────┘

3. SCORE CALCULATION (Automatic)
   ┌──────────────────────────────┐
   │ Database Trigger:            │
   │ update_attempt_score()       │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Calculate scores:            │
   │ - Sum MCQ scores             │
   │ - Sum manual review scores   │
   │ - Total = MCQ + Manual       │
   │ - Percentage = Total/Max     │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Update student_attempts:     │
   │ - manual_score               │
   │ - total_score                │
   │ - percentage (computed)      │
   │ - evaluated_at (if all done) │
   └──────┬───────────────────────┘
          │
          ▼
   ┌──────────────────────────────┐
   │ Update users table:          │
   │ - score (latest test score)  │
   │ - status (qualified/partial) │
   └──────────────────────────────┘
```

---

### 4. Autosave Flow (Technical)

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTOSAVE FLOW                              │
└─────────────────────────────────────────────────────────────────┘

FRONTEND:
┌──────────────────────────────┐
│ Student types in editor      │
│ - MCQ: Select option         │
│ - Coding: Write code         │
│ - SQL: Write query           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Update local state           │
│ dispatch({                   │
│   type: 'SET_ANSWER',        │
│   questionId: 1,             │
│   answerData: {...}          │
│ })                           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Debounce timer starts        │
│ - 30 second countdown        │
│ - Reset on each keystroke    │
└──────┬───────────────────────┘
       │
       ▼ (after 30s of inactivity)
┌──────────────────────────────┐
│ OR: Question change detected │
│ - User clicks "Next"         │
│ - Trigger immediate save     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Check if answer changed      │
│ - Compare with last saved    │
│ - Skip if identical          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ POST /answers/autosave       │
│ {                            │
│   attempt_id: 123,           │
│   question_id: 1,            │
│   answer_data: {...},        │
│   time_spent_seconds: 45     │
│ }                            │
└──────┬───────────────────────┘
       │
       ▼
BACKEND:
┌──────────────────────────────┐
│ Validate request:            │
│ ✓ Attempt exists             │
│ ✓ Belongs to student         │
│ ✓ Not submitted              │
│ ✓ Timer not expired          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Upsert answer:               │
│ INSERT ... ON CONFLICT       │
│ DO UPDATE SET                │
│   answer_data = $1,          │
│   version = version + 1      │
│ WHERE version = $2           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Optimistic lock check:       │
│ - If version mismatch:       │
│   → Concurrent update        │
│   → Retry with new version   │
│ - If success:                │
│   → Answer saved             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Update attempt timestamp:    │
│ last_autosave_at = NOW()     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Return success               │
│ { success: true }            │
└──────┬───────────────────────┘
       │
       ▼
FRONTEND:
┌──────────────────────────────┐
│ Update UI:                   │
│ - Show "Saved" indicator     │
│ - Mark answer as saved       │
│ - Update question navigator  │
└──────────────────────────────┘
```

---

### 5. Timer Expiration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   TIMER EXPIRATION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

FRONTEND:
┌──────────────────────────────┐
│ Timer hook running           │
│ - Update every 1 second      │
│ - Calculate remaining time   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Check remaining time         │
│ remaining = expiresAt - now  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Display countdown            │
│ - Green: > 5 minutes         │
│ - Yellow: 1-5 minutes        │
│ - Red: < 1 minute            │
│ - Blinking: < 30 seconds     │
└──────┬───────────────────────┘
       │
       ▼ (when remaining = 0)
┌──────────────────────────────┐
│ Timer expired!               │
│ - Stop timer                 │
│ - Show alert                 │
│ - Disable answer inputs      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Auto-submit attempt          │
│ - Call onExpire callback     │
│ - Trigger submit flow        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ POST /attempts/:id/submit    │
│ - Include all saved answers  │
│ - Include unsaved answers    │
└──────┬───────────────────────┘
       │
       ▼
BACKEND:
┌──────────────────────────────┐
│ Validate timer:              │
│ expiresAt = startedAt +      │
│   duration + 30s grace       │
│                              │
│ if (now > expiresAt):        │
│   → Reject submission        │
│ else:                        │
│   → Accept submission        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Process submission           │
│ - Save answers               │
│ - Calculate scores           │
│ - Mark as submitted          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Return results               │
│ - Redirect to results page   │
└──────────────────────────────┘

WHY 30-SECOND GRACE PERIOD?
- Network latency (slow connections)
- Clock skew (client/server time difference)
- Final autosave completion
- Fair to all students
```

---

### 6. Database Trigger Flow (Score Calculation)

```
┌─────────────────────────────────────────────────────────────────┐
│                DATABASE TRIGGER FLOW                            │
└─────────────────────────────────────────────────────────────────┘

TRIGGER: update_score_after_review
EVENT: AFTER INSERT OR UPDATE ON manual_reviews
WHEN: NEW.status = 'completed'

┌──────────────────────────────┐
│ Admin submits review         │
│ UPDATE manual_reviews        │
│ SET status = 'completed',    │
│     marks_awarded = 15       │
│ WHERE id = 42                │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Trigger fires                │
│ update_score_after_review()  │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Get attempt_id from review   │
│ SELECT attempt_id            │
│ FROM student_answers         │
│ WHERE id = NEW.answer_id     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Calculate manual score       │
│ SELECT SUM(marks_awarded)    │
│ FROM manual_reviews mr       │
│ JOIN student_answers sa      │
│   ON mr.answer_id = sa.id    │
│ WHERE sa.attempt_id = ?      │
│   AND mr.status = 'completed'│
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Update attempt scores        │
│ UPDATE student_attempts      │
│ SET                          │
│   manual_score = ?,          │
│   total_score = mcq_score + ?│
│ WHERE id = ?                 │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Check if all reviews done    │
│ SELECT COUNT(*)              │
│ FROM manual_reviews mr       │
│ WHERE mr.status != 'completed'│
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ If all reviews completed:    │
│ UPDATE student_attempts      │
│ SET                          │
│   status = 'evaluated',      │
│   evaluated_at = NOW()       │
│ WHERE id = ?                 │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Update user's overall score  │
│ UPDATE users                 │
│ SET                          │
│   score = ?,                 │
│   status = CASE              │
│     WHEN % >= 80 THEN        │
│       'qualified'            │
│     WHEN % >= 50 THEN        │
│       'partial'              │
│     ELSE 'not_qualified'     │
│   END                        │
│ WHERE id = ?                 │
└──────────────────────────────┘

WHY USE TRIGGERS?
- Automatic score calculation
- No manual intervention needed
- Consistent logic
- Atomic updates
- Audit trail
```

---

## Summary

These flows show:
1. **Student Flow**: Browse → Start → Answer → Autosave → Submit → Results
2. **Admin Flow**: Create Questions → Create Test → Review Answers → Assign Marks
3. **Autosave Flow**: Debounce → Validate → Upsert → Optimistic Lock
4. **Timer Flow**: Countdown → Expire → Auto-submit → Grace Period
5. **Trigger Flow**: Review Complete → Calculate Scores → Update Attempt → Update User

**Key Takeaways**:
- ✅ Server-side validation at every step
- ✅ Optimistic locking prevents race conditions
- ✅ Triggers automate score calculation
- ✅ Grace period ensures fairness
- ✅ Autosave prevents data loss

**Refer to these flows when implementing features to understand the complete picture.**
