export interface Notebook {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  cardCount?: number;
}

export interface Card {
  id: string;
  notebookId: string;
  content: unknown;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  studentCount: number;
}

export interface Submission {
  id: string;
  cardId: string;
  studentId: string;
  submittedAt: string;
  status: 'pending' | 'graded';
}

export interface Session {
  token: string;
  type: 'cookie' | 'bearer';
  expiresAt: Date;
  refreshToken?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface LoilonoteConfig {
  version: number;
  auth: {
    method: 'cookie' | 'bearer' | 'none';
    token: string | null;
    tokenFile: string | null;
  };
  server: {
    baseUrl: string;
    timeout: number;
  };
  cli: {
    outputFormat: 'table' | 'json' | 'yaml';
    colorEnabled: boolean;
  };
}
