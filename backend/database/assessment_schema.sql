-- ============================================================================
-- ASSESSMENT MODULE - Production-Grade Schema
-- ============================================================================
-- Design Philosophy:
-- 1. Polymorphic question types (MCQ, SQL, Coding) with type-specific data
-- 2. Separation of test definition from student attempts
-- 3. Manual review workflow for non-MCQ questions
-- 4. Autosave support with optimistic locking
-- 5. Performance-optimized indexes for common queries
-- ============================================================================

-- ── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE question_type AS ENUM ('mcq', 'core_subject_mcq', 'sql', 'coding');
CREATE TYPE evaluation_status AS ENUM ('pending', 'in_review', 'completed');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'evaluated');

-- ── QUESTION BANK ────────────────────────────────────────────────────────────
-- WHY: Centralized question repository for reusability across tests
-- PERFORMANCE: Indexed by type and domain for fast filtering
-- SCALABILITY: Questions are independent of tests (many-to-many via test_questions)

CREATE TABLE question_bank (
    id                  SERIAL PRIMARY KEY,
    question_type       question_type NOT NULL,
    domain              domain_type NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    
    -- Type-specific data stored as JSONB for flexibility
    -- MCQ: { options: string[], correct_answer: string }
    -- SQL: { expected_output?: string, schema_context?: string }
    -- Coding: { language: string, starter_code?: string, test_cases?: array }
    type_specific_data  JSONB NOT NULL,
    
    difficulty_level    VARCHAR(20) DEFAULT 'medium',
    default_marks       INTEGER NOT NULL DEFAULT 1 CHECK (default_marks > 0),
    default_time_mins   INTEGER DEFAULT 5 CHECK (default_time_mins > 0),
    
    created_by          INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Validation: MCQ must have options array
    CONSTRAINT check_mcq_has_options CHECK (
        question_type NOT IN ('mcq', 'core_subject_mcq') OR
        (jsonb_typeof(type_specific_data->'options') = 'array' AND
         jsonb_array_length(type_specific_data->'options') >= 2)
    )
);

-- ── TEST_QUESTIONS (Join Table) ──────────────────────────────────────────────
-- WHY: Many-to-many relationship allows question reuse across tests
-- PERFORMANCE: Composite index on (test_id, order_index) for fast ordered retrieval
-- SCALABILITY: Override marks per test without modifying question_bank

CREATE TABLE test_questions (
    id              SERIAL PRIMARY KEY,
    test_id         INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_id     INTEGER NOT NULL REFERENCES question_bank(id) ON DELETE RESTRICT,
    
    order_index     INTEGER NOT NULL CHECK (order_index > 0),
    marks           INTEGER NOT NULL CHECK (marks > 0),
    is_required     BOOLEAN DEFAULT true,
    
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_test_question UNIQUE (test_id, question_id),
    CONSTRAINT unique_test_order UNIQUE (test_id, order_index)
);

-- ── STUDENT_ATTEMPTS (Enhanced) ──────────────────────────────────────────────
-- WHY: Track attempt lifecycle with proper status management
-- PERFORMANCE: Indexed by student_id and status for dashboard queries
-- SECURITY: Timer validation via started_at + test duration

CREATE TABLE student_attempts (
    id                  SERIAL PRIMARY KEY,
    student_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id             INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    
    status              attempt_status DEFAULT 'in_progress',
    
    -- Scoring
    mcq_score           INTEGER DEFAULT 0 CHECK (mcq_score >= 0),
    manual_score        INTEGER DEFAULT 0 CHECK (manual_score >= 0),
    total_score         INTEGER DEFAULT 0 CHECK (total_score >= 0),
    max_possible_score  INTEGER NOT NULL CHECK (max_possible_score > 0),
    percentage          DECIMAL(5,2) GENERATED ALWAYS AS 
                            (ROUND((total_score::DECIMAL / max_possible_score) * 100, 2)) STORED,
    
    -- Timing
    started_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at        TIMESTAMP WITH TIME ZONE,
    evaluated_at        TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    last_autosave_at    TIMESTAMP WITH TIME ZONE,
    
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_student_test_attempt UNIQUE (student_id, test_id),
    CONSTRAINT check_submitted_after_started CHECK (submitted_at IS NULL OR submitted_at >= started_at),
    CONSTRAINT check_evaluated_after_submitted CHECK (evaluated_at IS NULL OR evaluated_at >= submitted_at)
);

-- ── STUDENT_ANSWERS ──────────────────────────────────────────────────────────
-- WHY: Store all answer types (MCQ selections, code, SQL queries)
-- PERFORMANCE: Indexed by attempt_id for fast retrieval during evaluation
-- AUTOSAVE: version field prevents race conditions

CREATE TABLE student_answers (
    id                  SERIAL PRIMARY KEY,
    attempt_id          INTEGER NOT NULL REFERENCES student_attempts(id) ON DELETE CASCADE,
    question_id         INTEGER NOT NULL REFERENCES question_bank(id) ON DELETE RESTRICT,
    
    -- Answer data (type-specific)
    -- MCQ: { selected_option: string }
    -- SQL/Coding: { code: string, language?: string }
    answer_data         JSONB NOT NULL,
    
    -- Auto-evaluation (for MCQ)
    is_correct          BOOLEAN,
    auto_score          INTEGER DEFAULT 0 CHECK (auto_score >= 0),
    
    -- Autosave support
    version             INTEGER DEFAULT 1,
    is_final            BOOLEAN DEFAULT false,
    
    -- Timing
    time_spent_seconds  INTEGER DEFAULT 0 CHECK (time_spent_seconds >= 0),
    answered_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

-- ── MANUAL_REVIEWS ───────────────────────────────────────────────────────────
-- WHY: Separate table for manual evaluation workflow
-- PERFORMANCE: Indexed by status for admin review queue
-- SCALABILITY: Supports multiple reviewers and review history

CREATE TABLE manual_reviews (
    id                  SERIAL PRIMARY KEY,
    answer_id           INTEGER NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
    reviewer_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    status              evaluation_status DEFAULT 'pending',
    
    -- Evaluation
    marks_awarded       INTEGER CHECK (marks_awarded >= 0),
    max_marks           INTEGER NOT NULL CHECK (max_marks > 0),
    feedback            TEXT,
    
    -- Timing
    assigned_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at         TIMESTAMP WITH TIME ZONE,
    
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_marks_within_max CHECK (marks_awarded IS NULL OR marks_awarded <= max_marks)
);

-- ── INDEXES ──────────────────────────────────────────────────────────────────
-- WHY: Optimize common query patterns identified from use cases

-- Question Bank
CREATE INDEX idx_question_bank_type ON question_bank(question_type);
CREATE INDEX idx_question_bank_domain ON question_bank(domain);
CREATE INDEX idx_question_bank_active ON question_bank(is_active) WHERE is_active = true;
CREATE INDEX idx_question_bank_created_by ON question_bank(created_by);

-- Test Questions
CREATE INDEX idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX idx_test_questions_question_id ON test_questions(question_id);
CREATE INDEX idx_test_questions_order ON test_questions(test_id, order_index);

-- Student Attempts
CREATE INDEX idx_student_attempts_student ON student_attempts(student_id);
CREATE INDEX idx_student_attempts_test ON student_attempts(test_id);
CREATE INDEX idx_student_attempts_status ON student_attempts(status);
CREATE INDEX idx_student_attempts_student_status ON student_attempts(student_id, status);
CREATE INDEX idx_student_attempts_submitted ON student_attempts(submitted_at DESC) WHERE submitted_at IS NOT NULL;

-- Student Answers
CREATE INDEX idx_student_answers_attempt ON student_answers(attempt_id);
CREATE INDEX idx_student_answers_question ON student_answers(question_id);
CREATE INDEX idx_student_answers_final ON student_answers(attempt_id, is_final) WHERE is_final = true;

-- Manual Reviews
CREATE INDEX idx_manual_reviews_status ON manual_reviews(status);
CREATE INDEX idx_manual_reviews_reviewer ON manual_reviews(reviewer_id);
CREATE INDEX idx_manual_reviews_pending ON manual_reviews(status, assigned_at) WHERE status = 'pending';

-- ── TRIGGERS ─────────────────────────────────────────────────────────────────

-- Auto-update updated_at timestamp
CREATE TRIGGER update_question_bank_updated_at
    BEFORE UPDATE ON question_bank
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_attempts_updated_at
    BEFORE UPDATE ON student_attempts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_answers_updated_at
    BEFORE UPDATE ON student_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_reviews_updated_at
    BEFORE UPDATE ON manual_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate total score when manual reviews complete
CREATE OR REPLACE FUNCTION update_attempt_score()
RETURNS TRIGGER AS $$
DECLARE
    attempt_record RECORD;
BEGIN
    -- Get current attempt scores
    SELECT 
        sa.id,
        sa.mcq_score,
        COALESCE(SUM(mr.marks_awarded), 0) as manual_score
    INTO attempt_record
    FROM student_attempts sa
    LEFT JOIN student_answers ans ON ans.attempt_id = sa.id
    LEFT JOIN manual_reviews mr ON mr.answer_id = ans.id AND mr.status = 'completed'
    WHERE sa.id = (SELECT attempt_id FROM student_answers WHERE id = NEW.answer_id)
    GROUP BY sa.id, sa.mcq_score;
    
    -- Update attempt with new scores
    UPDATE student_attempts
    SET 
        manual_score = attempt_record.manual_score,
        total_score = mcq_score + attempt_record.manual_score,
        evaluated_at = CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM student_answers sa2
                JOIN manual_reviews mr2 ON mr2.answer_id = sa2.id
                WHERE sa2.attempt_id = attempt_record.id 
                AND mr2.status != 'completed'
            ) THEN CURRENT_TIMESTAMP
            ELSE evaluated_at
        END
    WHERE id = attempt_record.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_score_after_review
    AFTER INSERT OR UPDATE ON manual_reviews
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_attempt_score();

-- ── VIEWS ────────────────────────────────────────────────────────────────────

-- Admin review queue
CREATE VIEW pending_reviews_queue AS
SELECT 
    mr.id as review_id,
    mr.status,
    mr.assigned_at,
    sa.id as answer_id,
    sa.answer_data,
    qb.id as question_id,
    qb.question_type,
    qb.title as question_title,
    qb.description as question_description,
    qb.type_specific_data,
    st_att.id as attempt_id,
    st_att.student_id,
    u.name as student_name,
    u.email as student_email,
    t.id as test_id,
    t.title as test_title
FROM manual_reviews mr
JOIN student_answers sa ON mr.answer_id = sa.id
JOIN question_bank qb ON sa.question_id = qb.id
JOIN student_attempts st_att ON sa.attempt_id = st_att.id
JOIN users u ON st_att.student_id = u.id
JOIN tests t ON st_att.test_id = t.id
WHERE mr.status IN ('pending', 'in_review')
ORDER BY mr.assigned_at ASC;

-- Student attempt summary
CREATE VIEW student_attempt_summary AS
SELECT 
    sa.id as attempt_id,
    sa.student_id,
    u.name as student_name,
    u.email as student_email,
    sa.test_id,
    t.title as test_title,
    t.domain,
    sa.status,
    sa.mcq_score,
    sa.manual_score,
    sa.total_score,
    sa.max_possible_score,
    sa.percentage,
    sa.started_at,
    sa.submitted_at,
    sa.evaluated_at,
    COUNT(DISTINCT ans.id) as total_answers,
    COUNT(DISTINCT CASE WHEN mr.status = 'pending' THEN mr.id END) as pending_reviews,
    COUNT(DISTINCT CASE WHEN mr.status = 'completed' THEN mr.id END) as completed_reviews
FROM student_attempts sa
JOIN users u ON sa.student_id = u.id
JOIN tests t ON sa.test_id = t.id
LEFT JOIN student_answers ans ON ans.attempt_id = sa.id
LEFT JOIN manual_reviews mr ON mr.answer_id = ans.id
GROUP BY sa.id, u.name, u.email, t.title, t.domain;

-- ============================================================================
-- MIGRATION FROM OLD SCHEMA
-- ============================================================================
-- NOTE: This preserves existing test_attempts and questions data
-- Run this AFTER creating the new tables

-- Migrate existing questions to question_bank
INSERT INTO question_bank (
    question_type,
    domain,
    title,
    description,
    type_specific_data,
    default_marks,
    created_by,
    created_at
)
SELECT 
    'mcq'::question_type,
    t.domain,
    LEFT(q.question_text, 255) as title,
    q.question_text as description,
    jsonb_build_object(
        'options', q.options,
        'correct_answer', q.correct_answer
    ) as type_specific_data,
    q.marks,
    t.created_by,
    q.created_at
FROM questions q
JOIN tests t ON q.test_id = t.id;

-- Create test_questions mappings
INSERT INTO test_questions (test_id, question_id, order_index, marks)
SELECT 
    q.test_id,
    qb.id as question_id,
    ROW_NUMBER() OVER (PARTITION BY q.test_id ORDER BY q.id) as order_index,
    q.marks
FROM questions q
JOIN question_bank qb ON qb.description = q.question_text;

-- Migrate existing test_attempts to student_attempts
INSERT INTO student_attempts (
    student_id,
    test_id,
    status,
    mcq_score,
    total_score,
    max_possible_score,
    started_at,
    submitted_at,
    evaluated_at
)
SELECT 
    ta.student_id,
    ta.test_id,
    CASE 
        WHEN ta.completed_at IS NOT NULL THEN 'evaluated'::attempt_status
        ELSE 'in_progress'::attempt_status
    END,
    ta.score,
    ta.score,
    ta.total_marks,
    ta.started_at,
    ta.completed_at,
    ta.completed_at
FROM test_attempts ta;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- 1. JSONB indexes: Add GIN indexes if filtering by type_specific_data fields
--    CREATE INDEX idx_question_bank_type_data ON question_bank USING GIN (type_specific_data);
--
-- 2. Partitioning: For 100K+ attempts, partition student_attempts by test_id
--
-- 3. Archival: Move evaluated attempts older than 1 year to archive table
--
-- 4. Connection pooling: Use pgBouncer for serverless environments (Neon)
--
-- 5. Query optimization: Use EXPLAIN ANALYZE for slow queries
-- ============================================================================
