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
