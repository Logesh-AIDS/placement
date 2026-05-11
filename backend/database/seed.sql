-- ============================================================================
-- Placement Portal - Seed Data (Development Only)
-- ============================================================================

-- Admin user
INSERT INTO users (name, email, password, role, domain, status) VALUES
('Admin User', 'admin@placement.com', '$2b$10$hashedpassword1', 'admin', NULL, 'not_qualified');

-- HR users
INSERT INTO users (name, email, password, role, domain, status) VALUES
('HR Alice', 'alice@techcorp.com', '$2b$10$hashedpassword2', 'hr', NULL, 'not_qualified'),
('HR Bob', 'bob@startup.io', '$2b$10$hashedpassword3', 'hr', NULL, 'not_qualified');

-- Students
INSERT INTO users (name, email, password, role, domain, score, status) VALUES
('Student One', 'student1@college.edu', '$2b$10$hashedpassword4', 'student', 'Web', 85, 'qualified'),
('Student Two', 'student2@college.edu', '$2b$10$hashedpassword5', 'student', 'DSA', 60, 'partial'),
('Student Three', 'student3@college.edu', '$2b$10$hashedpassword6', 'student', 'ML', 45, 'not_qualified');

-- Tests (created by admin id=1)
INSERT INTO tests (title, domain, description, duration_minutes, total_marks, passing_marks, created_by) VALUES
('Web Development Fundamentals', 'Web', 'Test covering HTML, CSS, JavaScript basics', 60, 100, 50, 1),
('Data Structures & Algorithms', 'DSA', 'Test covering arrays, trees, graphs, and complexity', 90, 100, 50, 1),
('Machine Learning Basics', 'ML', 'Test covering supervised learning, neural networks', 75, 100, 50, 1);

-- Questions for Web test (test_id=1)
INSERT INTO questions (test_id, question_text, options, correct_answer, marks) VALUES
(1, 'What does CSS stand for?', '["Cascading Style Sheets", "Creative Style System", "Computer Style Sheets", "Colorful Style Sheets"]', 'Cascading Style Sheets', 1),
(1, 'Which HTML tag is used for the largest heading?', '["<h6>", "<heading>", "<h1>", "<head>"]', '<h1>', 1);

-- Jobs (created by HR users)
INSERT INTO jobs (title, role, domain, min_score, description, location, hr_id) VALUES
('Frontend Developer', 'Software Engineer', 'Web', 70, 'Build responsive web applications using React', 'Remote', 2),
('Backend Engineer', 'Software Engineer', 'DSA', 65, 'Design scalable APIs and data structures', 'Bangalore', 2),
('ML Engineer', 'Data Scientist', 'ML', 75, 'Build and deploy machine learning models', 'Hyderabad', 3);

-- Applications
INSERT INTO applications (student_id, job_id, status) VALUES
(4, 1, 'applied'),    -- Student One applied to Frontend Developer
(5, 2, 'shortlisted'); -- Student Two shortlisted for Backend Engineer
