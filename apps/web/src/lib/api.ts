import { ApiResponse, PaginatedData, Project, GlobalStats, StudentStats, User } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export class ApiError extends Error {
  statusCode: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode = 400, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

let activeAuthToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  activeAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('hub_token', token);
    } else {
      sessionStorage.removeItem('hub_token');
    }
  }
}

export function getApiAuthToken(): string | null {
  if (activeAuthToken) return activeAuthToken;
  if (typeof window !== 'undefined') {
    activeAuthToken = sessionStorage.getItem('hub_token');
  }
  return activeAuthToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getApiAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly cookies
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    message: 'Failed to parse server response.',
    data: null as unknown as T,
  }));

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
      data.errors
    );
  }

  return data.data;
}

export const api = {
  auth: {
    signup: (body: { name: string; email: string; password: string }) =>
      request<{ user: User; token: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      }),
    getMe: () => request<User>('/api/auth/me'),
  },

  projects: {
    submit: (body: { name: string; repoUrl: string; liveUrl: string; description: string }) =>
      request<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getMyProjects: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      const query = q.toString() ? `?${q.toString()}` : '';
      return request<PaginatedData<Project>>(`/api/projects/my${query}`);
    },

    getMyStats: () => request<StudentStats>('/api/projects/my/stats'),

    getById: (id: string) => request<Project>(`/api/projects/${id}`),

    getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', params.page.toString());
      if (params?.limit) q.append('limit', params.limit.toString());
      if (params?.status && params.status !== 'ALL') q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      const query = q.toString() ? `?${q.toString()}` : '';
      return request<PaginatedData<Project>>(`/api/projects${query}`);
    },

    getGlobalStats: () => request<GlobalStats>('/api/projects/stats'),

    review: (id: string, body: { status: 'APPROVED' | 'REJECTED'; reviewComment?: string }) =>
      request<Project>(`/api/projects/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },
};
