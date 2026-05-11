# Placement Portal - Database Schema

## Setup (Neon PostgreSQL)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy your connection string from the Neon dashboard
3. Run the schema: `psql <connection_string> -f database/schema.sql`
4. (Dev only) Run seed data: `psql <connection_string> -f database/seed.sql`

---

## Schema Overview

### Tables

| Table | Description |
|---|---|
| `users` | All users — students, HR, admins |
| `tests` | Test metadata created by admins |
| `questions` | Questions per test (options as JSONB) |
| `test_attempts` | Student test submissions and scores |
| `jobs` | Job postings created by HR |
| `applications` | Student applications to jobs |

### ENUMs

| Type | Values |
|---|---|
| `user_role` | `student`, `hr`, `admin` |
| `user_status` | `qualified`, `partial`, `not_qualified` |
| `domain_type` | `Web`, `DSA`, `ML` |
| `application_status` | `applied`, `shortlisted`, `rejected` |

---

## Relationships

```
users (admin) ──< tests ──< questions
users (hr)    ──< jobs  ──< applications >── users (student)
users (student) ──< test_attempts >── tests
```

---

## Key Design Decisions

- `users.domain` and `users.score` are only meaningful for students — enforced via CHECK constraints
- `test_attempts.percentage` is a **generated column** (auto-calculated, no manual updates needed)
- `applications(student_id, job_id)` has a UNIQUE constraint to prevent duplicate applications
- `updated_at` is auto-managed via triggers on all tables
- Student `status` is auto-updated via trigger when a test attempt is completed
- Scores ≥ 80% → `qualified`, ≥ 50% → `partial`, else → `not_qualified`
