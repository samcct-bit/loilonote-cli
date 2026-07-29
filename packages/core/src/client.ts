import { getToken } from './config.js';
import type {
  NotesListResponse, SubmissionsResponse, LoilonoteSession,
  CourseGroup, Course, ParsedNote, NoteBody, NoteHeader, NoteFrame,
} from './types.js';

export class LoilonoteClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null;

  constructor(baseUrl?: string, timeout?: number) {
    this.baseUrl = baseUrl ?? process.env.LOILONOTE_BASE_URL ?? 'https://n.loilo.tv';
    this.timeout = timeout ?? 30000;
    this.token = getToken();
  }

  setToken(token: string): void {
    this.token = token;
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
  async listCourses(): Promise<CourseGroup | CourseGroup[]> {
    return this.request('/api/courses/v3');
  }

  async getCourse(courseId: number): Promise<Course> {
    return this.request(`/api/courses/${courseId}`);
  }

  // --- Notes ---
  async listNotes(courseId: number, orderBy: string = 'update_time_desc'): Promise<NotesListResponse> {
    return this.request(`/api/notes/v2?course_id=${courseId}&order_by=${orderBy}`);
  }

  async getNote(noteId: number): Promise<ArrayBuffer> {
    const url = new URL(`/api/notes/${noteId}`, this.baseUrl);
    const fullUrl = this.appendToken(url.toString());
    const response = await fetch(fullUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.arrayBuffer();
  }

  /**
   * 下載並解析筆記 ZIP 內容
   */
  async getParsedNote(noteId: number): Promise<ParsedNote> {
    const data = await this.getNote(noteId);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(Buffer.from(data));

    const version = parseInt(zip.readAsText('version').trim(), 10);
    const header: NoteHeader = JSON.parse(zip.readAsText('header'));
    const body: NoteBody = JSON.parse(zip.readAsText('body'));

    const frameTypes = body.data.frames.map(f => f.type);
    const uniqueTypes = [...new Set(frameTypes)];

    return {
      version,
      header,
      body,
      frameCount: body.data.frames.length,
      frameTypes: uniqueTypes,
    };
  }

  /**
   * 從已解析筆記中提取純文字內容
   */
  extractText(parsed: ParsedNote): string {
    const texts: string[] = [];
    for (const frame of parsed.body.data.frames) {
      const gadgets = frame.gadgets as Record<string, unknown>;
      // 遍歷所有 gadget 找文字內容
      for (const key of Object.keys(gadgets)) {
        const gadget = gadgets[key] as Record<string, unknown> | undefined;
        if (!gadget) continue;
        // text gadget
        if (gadget.text && typeof gadget.text === 'string') {
          texts.push(gadget.text);
        }
        // rich text / html content
        if (gadget.html && typeof gadget.html === 'string') {
          texts.push(gadget.html.replace(/<[^>]+>/g, ''));
        }
      }
    }
    return texts.join('\n---\n');
  }

  // --- Submissions ---
  async listSubmissions(courseId: number, limit: number = 30): Promise<SubmissionsResponse> {
    return this.request(`/api/courses/${courseId}/submissions/v2?limit=${limit}`);
  }
}
