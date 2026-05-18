-- ============================================================================
-- CODING ANSWERS TABLE - For Manual Evaluation
-- ============================================================================

CREATE TABLE IF NOT EXISTS coding_answers (
    id                  SERIAL PRIMARY KEY,
    attempt_id          INTEGER NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id         INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    student_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_answer         TEXT NOT NULL,
    marks_obtained      INTEGER DEFAULT NULL,
    max_marks           INTEGER NOT NULL,
    admin_feedback      TEXT DEFAULT NULL,
    reviewed_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at         TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_attempt_question UNIQUE (attempt_id, question_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_coding_answers_attempt_id ON coding_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_coding_answers_student_id ON coding_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_coding_answers_reviewed ON coding_answers(reviewed_at) WHERE reviewed_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_coding_answers_updated_at
    BEFORE UPDATE ON coding_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
