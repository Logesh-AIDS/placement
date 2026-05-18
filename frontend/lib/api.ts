// ── Centralised API client ────────────────────────────────────────────────────
// All fetch calls go through here so token handling is in one place.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (networkErr) {
    // fetch() itself threw — backend is down or CORS blocked the preflight
    console.error('[API] Network error:', networkErr);
    throw new ApiError(0, 'Cannot reach the server. Make sure the backend is running.');
  }

  // Try to parse JSON — server might return HTML on unexpected errors
  let data: { message?: string } = {};
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (e.g. HTML 500 page)
    console.error('[API] Non-JSON response from', endpoint, res.status);
    throw new ApiError(res.status, `Server error (${res.status}). Please try again.`);
  }

  if (!res.ok) {
    // If 401 Unauthorized, clear session and redirect to login
    if (res.status === 401) {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pp_access_token');
        localStorage.removeItem('pp_refresh_token');
        localStorage.removeItem('pp_user');
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login?expired=true';
        }
      }
    }
    
    throw new ApiError(res.status, data.message || `Request failed (${res.status}).`);
  }

  return data as T;
}

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: RegisterPayload) =>
    request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  refresh: (refreshToken: string) =>
    request<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  me: (token: string) =>
    request<{ success: boolean; data: AuthUser }>('/auth/me', { token }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
};

// ── Jobs endpoints ────────────────────────────────────────────────────────────
export const jobsApi = {
  getAll: (token: string, domain?: string, page = 1) =>
    request<JobsResponse>(`/jobs?page=${page}&limit=20${domain && domain !== 'all' ? `&domain=${domain}` : ''}`, { token }),

  getById: (token: string, id: number) =>
    request<{ success: boolean; data: Job }>(`/jobs/${id}`, { token }),

  create: (token: string, payload: CreateJobPayload) =>
    request<{ success: boolean; data: Job }>('/jobs', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),

  getMyJobs: (token: string) =>
    request<{ success: boolean; data: Job[] }>('/jobs/my', { token }),
};

// ── Settings endpoints ────────────────────────────────────────────────────────
export const settingsApi = {
  get: (token: string) =>
    request<{ success: boolean; data: Record<string, string> }>('/settings', { token }),

  update: (token: string, payload: { passing_score?: number }) =>
    request<{ success: boolean; data: Record<string, string> }>('/settings', {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    }),
};

// ── Applications endpoints ────────────────────────────────────────────────────
export const applicationsApi = {
  apply: (token: string, job_id: number, cover_letter?: string) =>
    request<{ success: boolean; data: Application }>('/applications', {
      method: 'POST',
      token,
      body: JSON.stringify({ job_id, cover_letter }),
    }),

  getMy: (token: string) =>
    request<{ success: boolean; data: Application[] }>('/applications/my', { token }),

  getHRApplications: (token: string) =>
    request<{ success: boolean; data: HRApplication[] }>('/applications/hr/all', { token }),

  updateStatus: (token: string, applicationId: number, status: 'applied' | 'shortlisted' | 'rejected') =>
    request<{ success: boolean; data: Application }>(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    }),
};

// ── Tests endpoints ───────────────────────────────────────────────────────────
export const testsApi = {
  getAll: (token: string, domain?: string) =>
    request<{ success: boolean; data: TestMeta[] }>(
      `/tests${domain ? `?domain=${domain}` : ''}`,
      { token }
    ),

  getById: (token: string, id: number) =>
    request<{ success: boolean; data: TestWithQuestions }>(`/tests/${id}`, { token }),

  startAttempt: (token: string, test_id: number) =>
    request<{ success: boolean; data: { id: number } }>('/test-attempts/start', {
      method: 'POST',
      token,
      body: JSON.stringify({ test_id }),
    }),

  submitAttempt: (token: string, attemptId: number, answers: Record<number, string>) =>
    request<{ success: boolean; data: AttemptResult }>(`/test-attempts/${attemptId}/submit`, {
      method: 'POST',
      token,
      body: JSON.stringify({ answers }),
    }),

  getMyAttempts: (token: string) =>
    request<{ success: boolean; data: AttemptResult[] }>('/test-attempts/my', { token }),

  // XML import/export
  importFromXML: (token: string, xmlContent: string) =>
    request<{ success: boolean; message: string; data: TestMeta }>('/tests/import-xml', {
      method: 'POST',
      token,
      body: JSON.stringify({ xmlContent }),
    }),

  exportToXML: async (token: string, testId: number): Promise<string> => {
    const res = await fetch(`${BASE_URL}/tests/${testId}/export-xml`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      throw new ApiError(res.status, data.message || 'Export failed');
    }
    return await res.text();
  },
};

// ── Users endpoints (Admin only) ──────────────────────────────────────────────
export const usersApi = {
  getAll: (token: string, filters?: { role?: string; domain?: string; status?: string; page?: number; limit?: number }) =>
    request<UsersResponse>(`/users?${new URLSearchParams(filters as any).toString()}`, { token }),

  getById: (token: string, id: number) =>
    request<{ success: boolean; data: User }>(`/users/${id}`, { token }),

  update: (token: string, id: number, payload: Partial<UpdateUserPayload>) =>
    request<{ success: boolean; data: User }>(`/users/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    }),

  delete: (token: string, id: number) =>
    request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// ── Profile endpoints ─────────────────────────────────────────────────────────
export const profileApi = {
  get: (token: string) =>
    request<{ success: boolean; data: StudentProfile }>('/profile', { token }),

  update: (token: string, data: Partial<ProfileUpdatePayload>) =>
    request<{ success: boolean; data: StudentProfile }>('/profile', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),

  uploadPhoto: async (token: string, file: File): Promise<{ profile_photo_url: string }> => {
    const form = new FormData();
    form.append('photo', file);
    const res = await fetch(`${BASE_URL}/profile/photo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json() as { success: boolean; message?: string; data?: { profile_photo_url: string } };
    if (!res.ok) throw new ApiError(res.status, (data as { message?: string }).message || 'Upload failed.');
    return data.data!;
  },

  deletePhoto: (token: string) =>
    request('/profile/photo', { method: 'DELETE', token }),

  uploadResume: async (token: string, file: File): Promise<{ resume_url: string; resume_name: string }> => {
    const form = new FormData();
    form.append('resume', file);
    const res = await fetch(`${BASE_URL}/profile/resume`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json() as { success: boolean; message?: string; data?: { resume_url: string; resume_name: string } };
    if (!res.ok) throw new ApiError(res.status, (data as { message?: string }).message || 'Upload failed.');
    return data.data!;
  },

  deleteResume: (token: string) =>
    request('/profile/resume', { method: 'DELETE', token }),
};

// ── Admin Coding Review endpoints ────────────────────────────────────────────
export const adminReviewApi = {
  getTestAttemptsWithCoding: (token: string) =>
    request<{ success: boolean; data: TestAttemptWithCoding[] }>('/admin/test-attempts', { token }),

  getPendingSubmissions: (token: string, status?: 'pending' | 'reviewed' | 'all') =>
    request<{ success: boolean; data: CodingSubmission[] }>(
      `/admin/coding-submissions${status ? `?status=${status}` : ''}`,
      { token }
    ),

  getSubmissionsByAttempt: (token: string, attemptId: number) =>
    request<{ success: boolean; data: CodingSubmission[] }>(
      `/admin/coding-submissions/${attemptId}`,
      { token }
    ),

  gradeSubmission: (token: string, submissionId: number, marks_obtained: number, admin_feedback?: string) =>
    request<{ success: boolean; message: string; data: any }>(
      `/admin/coding-submissions/${submissionId}/grade`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ marks_obtained, admin_feedback }),
      }
    ),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'hr' | 'admin';
export type DomainType = 'Web' | 'DSA' | 'ML';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  domain: DomainType | null;
  score: number;
  status: string;
  last_login_at: string | null;
  created_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  domain?: DomainType;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

// ── Job types ─────────────────────────────────────────────────────────────────
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
  hr_name: string;
  hr_email: string;
  is_active: boolean;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateJobPayload {
  title: string;
  role: string;
  domain: DomainType;
  min_score: number;
  description: string;
  requirements?: string;
  location?: string;
  salary_range?: string;
}

interface JobsResponse {
  success: boolean;
  data: Job[];
  pagination: { total: number; page: number; limit: number };
}

// ── Profile types ─────────────────────────────────────────────────────────────
export interface StudentProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  domain: DomainType | null;
  score: number;
  status: string;
  phone: string | null;
  college: string | null;
  graduation_year: string | null;
  profile_photo_url: string | null;
  resume_url: string | null;
  resume_name: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface ProfileUpdatePayload {
  name: string;
  phone: string;
  college: string;
  graduation_year: string;
}

// ── Application type ──────────────────────────────────────────────────────────
export interface Application {
  id: number;
  student_id: number;
  job_id: number;
  status: 'applied' | 'shortlisted' | 'rejected';
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  // joined fields from GET /applications/my
  job_title?: string;
  job_role?: string;
  domain?: string;
  location?: string;
}

export interface HRApplication {
  id: number;
  student_id: number;
  job_id: number;
  status: 'applied' | 'shortlisted' | 'rejected';
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  student_name: string;
  student_email: string;
  student_domain: DomainType;
  student_score: number;
  student_status: string;
  phone: string | null;
  college: string | null;
  graduation_year: string | null;
  profile_photo_url: string | null;
  resume_url: string | null;
  resume_name: string | null;
  job_title: string;
  job_role: string;
  job_domain: DomainType;
}

// ── Test types ────────────────────────────────────────────────────────────────
export interface TestMeta {
  id: number;
  title: string;
  domain: DomainType;
  description: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  is_active: boolean;
  created_by_name: string;
}

export interface TestQuestion {
  id: number;
  test_id: number;
  question_text: string;
  options: string[];
  marks: number;
  // correct_answer is omitted for students
}

export interface TestWithQuestions extends TestMeta {
  questions: TestQuestion[];
}

export interface AttemptResult {
  id: number;
  student_id: number;
  test_id: number;
  score: number;
  total_marks: number;
  percentage: number;
  started_at: string;
  completed_at: string | null;
  test_title?: string;
  domain?: string;
  passing_marks?: number;
}

// ── User types (Admin) ────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  domain: DomainType | null;
  score: number;
  status: string;
  created_at: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  domain?: DomainType | null;
  status?: string;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// ── Admin Coding Review types ─────────────────────────────────────────────────
export interface TestAttemptWithCoding {
  attempt_id: number;
  student_id: number;
  test_id: number;
  score: number;
  total_marks: number;
  percentage: number;
  completed_at: string;
  student_name: string;
  student_email: string;
  test_title: string;
  coding_questions_count: number;
  reviewed_count: number;
}

export interface CodingSubmission {
  id: number;
  attempt_id: number;
  question_id: number;
  student_id: number;
  code_answer: string;
  marks_obtained: number | null;
  max_marks: number;
  admin_feedback: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  student_name: string;
  student_email: string;
  test_title: string;
  test_id: number;
  current_score: number;
  test_total_marks: number;
  completed_at: string;
  question_text?: string;
}
