export type Role = 'STUDENT' | 'MENTOR' | 'ADMIN';

export type ProjectStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: ProjectStatus;
  studentId: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  reviewedById?: string | null;
  reviewer?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  reviewComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface GlobalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface StudentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}
