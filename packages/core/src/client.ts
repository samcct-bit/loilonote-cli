import { getToken } from './config.js';
import type { NotesListResponse, SubmissionsResponse, LoilonoteSession } from './types.js';

export class LoilonoteClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl ?? process.env.LOILONOTE_BASE_URL ?? 'https://n.loilo.tv';
    this.timeout = timeout ?? 30000;
    this.token = getToken();
  }

  private appendToken(url: string): string {
    const token = this.token ?? getToken();
    if (!token) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}auth_token=${encodeURIComponent(token)}`;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const fullUrl = this.appendToken(url.toString());

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(fullUrl, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...init.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      return response.json() as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // --- Auth ---
  async authenticate(appId: string, oauthToken: string): Promise<LoilonoteSession> {
    this.token = oauthToken;
    return this.request<LoilonoteSession>('/api/apps/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ app_id: appId, auth_token: oauthToken }).toString(),
    });
  }

  // --- Courses ---
  async getCourse(courseId: number): Promise<unknown> {
    return this.request(`/api/courses/${courseId}`);
  }

  async attendCourse(courseId: number): Promise<unknown> {
    return this.request(`/api/courses/${courseId}/attend`, { method: 'POST' });
  }

  // --- Notes ---
  async listNotes(courseId: number, orderBy: string = 'update_time_desc'): Promise<NotesListResponse> {
    return this.request(`/api/notes/v2?course_id=${courseId}&order_by=${orderBy}`);
  }

  async getNote(noteId: number): Promise<unknown> {
    return this.request(`/api/notes/${noteId}`);
  }

  // --- Submissions ---
  async listSubmissions(courseId: number): Promise<SubmissionsResponse> {
    return this.request(`/api/v2?course_id=${courseId}`);
  }

  // --- Courses list (v3) ---
  async listCourses(): Promise<unknown> {
    return this.request('/api/v3');
  }

  // --- Mobile Push ---
  async getMobilePush(courseId?: number): Promise<unknown> {
    const params = courseId ? `?course_id=${courseId}` : '';
    return this.request(`/api/mobile_push${params}`);
  }
}
