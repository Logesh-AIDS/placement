// ============================================================================
// Shared Types — mirrors the PostgreSQL schema
// ============================================================================

export type UserRole = 'student' | 'hr' | 'admin';
export type UserStatus = 'qualified' | 'partial' | 'not_qualified';
export type DomainType = 'Web' | 'DSA' | 'ML';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'rejected';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  domain: DomainType | null;
  score: number;
  status: UserStatus;
  is_active: boolean;
  failed_attempts: number;
  locked_until: Date | null;
  password_changed_at: Date;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export interface Test {
  id: number;
  title: string;
  domain: DomainType;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  created_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: number;
  test_id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  marks: number;
  created_at: Date;
  updated_at: Date;
}

export interface TestAttempt {
  id: number;
  student_id: number;
  test_id: number;
  score: number;
  total_marks: number;
  percentage: number;
  started_at: Date;
  completed_at: Date | null;
}

export interface Job {
  id: number;
  title: string;
  role: string;
  domain: DomainType;
  min_score: number;
  description: string;
  requirements: string | null;
  location: string | null;
  salary_range: string | null;
  hr_id: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Application {
  id: number;
  student_id: number;
  job_id: number;
  status: ApplicationStatus;
  cover_letter: string | null;
  applied_at: Date;
  updated_at: Date;
}

// JWT payload attached to req.user after auth middleware
export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  iat?: number;  // issued at — used to invalidate tokens after password change
  exp?: number;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
