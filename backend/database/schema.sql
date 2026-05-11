-- ============================================================================
-- Placement Portal - PostgreSQL Database Schema
-- Designed for Neon (Serverless PostgreSQL)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role        AS ENUM ('student', 'hr', 'admin');
CREATE TYPE user_status      AS ENUM ('qualified', 'partial', 'not_qualified');
CREATE TYPE domain_type      AS ENUM ('Web', 'DSA', 'ML');
CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'rejected');

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id                   SERIAL PRIMARY KEY,
    name                 VARCHAR(255) NOT NULL,
    email                VARCHAR(255) NOT NULL UNIQUE,
    password             VARCHAR(255) NOT NULL,
    role                 user_role NOT NULL,
    domain               domain_type NULL,
    score                INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    status               user_status DEFAULT 'not_qualified',
    is_active            BOOLEAN DEFAULT true,
    failed_attempts      INTEGER DEFAULT 0,
    locked_until         TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    password_changed_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at        TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- domain required for students, forbidden for hr/admin
    CONSTRAINT check_student_domain CHECK (
        (role = 'student' AND domain IS NOT NULL) OR
        (role IN ('hr', 'admin') AND domain IS NULL)
    )
    -- NOTE: role-based constraints (only admin creates tests, only hr creates jobs)
    -- are enforced at the application layer, not via subquery CHECK constraints
    -- because PostgreSQL does not allow subqueries in CHECK constraints.
);

-- ============================================================================
-- REFRESH TOKENS TABLE
-- ============================================================================

CREATE TABLE refresh_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at  TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ip_address  VARCHAR(45),
    user_agent  TEXT
);

-- ============================================================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================================================

CREATE TABLE password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at     TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TESTS TABLE
-- ============================================================================

CREATE TABLE tests (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    domain           domain_type NOT NULL,
    description      TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    total_marks      INTEGER NOT NULL CHECK (total_marks > 0),
    passing_marks    INTEGER NOT NULL CHECK (passing_marks > 0),
    created_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_passing_lte_total CHECK (passing_marks <= total_marks)
);

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================

CREATE TABLE questions (
    id              SERIAL PRIMARY KEY,
    test_id         INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    options         JSONB NOT NULL,
    correct_answer  VARCHAR(255) NOT NULL,
    marks           INTEGER NOT NULL DEFAULT 1 CHECK (marks > 0),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_options_format CHECK (
        jsonb_typeof(options) = 'array' AND
        jsonb_array_length(options) >= 2
    )
);

-- ============================================================================
-- TEST ATTEMPTS TABLE
-- ============================================================================

CREATE TABLE test_attempts (
    id           SERIAL PRIMARY KEY,
    student_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id      INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    score        INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
    total_marks  INTEGER NOT NULL CHECK (total_marks > 0),
    percentage   DECIMAL(5,2) GENERATED ALWAYS AS
                     (ROUND((score::DECIMAL / total_marks) * 100, 2)) STORED,
    started_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_student_test UNIQUE (student_id, test_id)
);

-- ============================================================================
-- JOBS TABLE
-- ============================================================================

CREATE TABLE jobs (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    role         VARCHAR(255) NOT NULL,
    domain       domain_type NOT NULL,
    min_score    INTEGER NOT NULL CHECK (min_score >= 0 AND min_score <= 100),
    description  TEXT NOT NULL,
    requirements TEXT,
    location     VARCHAR(255),
    salary_range VARCHAR(100),
    hr_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active    BOOLEAN DEFAULT true,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- APPLICATIONS TABLE
-- ============================================================================

CREATE TABLE applications (
    id           SERIAL PRIMARY KEY,
    student_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id       INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status       application_status DEFAULT 'applied',
    cover_letter TEXT,
    applied_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_student_job_application UNIQUE (student_id, job_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_domain      ON users(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_users_status      ON users(status);

CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);

CREATE INDEX idx_tests_domain      ON tests(domain);
CREATE INDEX idx_tests_created_by  ON tests(created_by);
CREATE INDEX idx_tests_is_active   ON tests(is_active);

CREATE INDEX idx_questions_test_id ON questions(test_id);

CREATE INDEX idx_test_attempts_student_id ON test_attempts(student_id);
CREATE INDEX idx_test_attempts_test_id    ON test_attempts(test_id);

CREATE INDEX idx_jobs_domain       ON jobs(domain);
CREATE INDEX idx_jobs_min_score    ON jobs(min_score);
CREATE INDEX idx_jobs_hr_id        ON jobs(hr_id);
CREATE INDEX idx_jobs_is_active    ON jobs(is_active);
CREATE INDEX idx_jobs_created_at   ON jobs(created_at DESC);
CREATE INDEX idx_jobs_domain_score ON jobs(domain, min_score) WHERE is_active = true;

CREATE INDEX idx_applications_student_id     ON applications(student_id);
CREATE INDEX idx_applications_job_id         ON applications(job_id);
CREATE INDEX idx_applications_status         ON applications(status);
CREATE INDEX idx_applications_applied_at     ON applications(applied_at DESC);
CREATE INDEX idx_applications_student_status ON applications(student_id, status);

-- ============================================================================
-- updated_at TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
    BEFORE UPDATE ON tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-UPDATE STUDENT STATUS AFTER TEST SUBMISSION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_status_from_test()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET
        score  = NEW.score,
        status = CASE
            WHEN NEW.percentage >= 80 THEN 'qualified'::user_status
            WHEN NEW.percentage >= 50 THEN 'partial'::user_status
            ELSE 'not_qualified'::user_status
        END
    WHERE id = NEW.student_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_status_after_test
    AFTER INSERT OR UPDATE ON test_attempts
    FOR EACH ROW
    WHEN (NEW.completed_at IS NOT NULL)
    EXECUTE FUNCTION update_user_status_from_test();

-- ============================================================================
-- CLEANUP FUNCTION — purge expired tokens
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at IS NOT NULL;

    DELETE FROM password_reset_tokens
    WHERE expires_at < CURRENT_TIMESTAMP OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE VIEW active_jobs_with_hr AS
SELECT
    j.id, j.title, j.role, j.domain, j.min_score,
    j.description, j.requirements, j.location, j.salary_range, j.created_at,
    u.name  AS hr_name,
    u.email AS hr_email
FROM jobs j
JOIN users u ON j.hr_id = u.id
WHERE j.is_active = true;

CREATE VIEW student_applications_detail AS
SELECT
    a.id            AS application_id,
    a.status        AS application_status,
    a.applied_at,
    u.id            AS student_id,
    u.name          AS student_name,
    u.email         AS student_email,
    u.domain        AS student_domain,
    u.score         AS student_score,
    u.status        AS student_status,
    j.id            AS job_id,
    j.title         AS job_title,
    j.role          AS job_role,
    j.min_score     AS job_min_score
FROM applications a
JOIN users u ON a.student_id = u.id
JOIN jobs  j ON a.job_id     = j.id;
