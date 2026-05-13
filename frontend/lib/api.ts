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
