import { getToken, updateToken } from './config.js';
import { loginWithBrowser } from './cdp-auth.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  NotesListResponse, SubmissionsResponse, LoilonoteSession,
  CourseGroup, CourseDetail, ParsedNote, NoteBody, NoteHeader,
  OgpResponse, CreateAssetRequest, AssetResponse,
  AnonymizedUser, UserProfile
} from './types.js';

export class LoilonoteClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null;
  private refreshPromise?: Promise<string>;
  public onTokenRefreshStart?: () => void;

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

  private async refreshAuthToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    if (this.onTokenRefreshStart) {
      this.onTokenRefreshStart();
    }
    this.refreshPromise = loginWithBrowser().then(newToken => {
      this.setToken(newToken);
      updateToken(newToken);
      this.refreshPromise = undefined;
      return newToken;
    }).catch(err => {
      this.refreshPromise = undefined;
      throw err;
    });
    return this.refreshPromise;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    
    const makeFetch = async (targetUrl: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        return await fetch(targetUrl, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...init.headers,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    };

    let fullUrl = this.appendToken(url.toString());
    let response = await makeFetch(fullUrl);

    if (response.status === 401) {
      await this.refreshAuthToken();
      fullUrl = this.appendToken(url.toString());
      response = await makeFetch(fullUrl);
    }

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return response.json() as T;
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

  async getCourse(courseId: number): Promise<CourseDetail> {
    return this.request(`/api/courses/${courseId}`);
  }

  /**
   * 取得指定課程的學生名單（去識別化），座號唯一且排序。
   */
  async listUsers(courseId: number): Promise<AnonymizedUser[]> {
    // 直接呼叫 this.request()，重用其 token、retry 與 timeout 機制
    const data = await this.request<CourseDetail>(`/api/courses/${courseId}`);
    const rawUsers = data.students || [];

    // 去識別化
    const anonymized = rawUsers.map(u => this.anonymizeUser(u));

    // 確保座號唯一：若有重複，加上 B/C 後綴
    const seatCount = new Map<string, number>();
    for (const u of anonymized) {
      seatCount.set(u.seat_number, (seatCount.get(u.seat_number) ?? 0) + 1);
    }
    const seatSuffix = new Map<string, number>();
    const uniqueAnonymized = anonymized.map(u => {
      if ((seatCount.get(u.seat_number) ?? 0) > 1) {
        const suffixIdx = seatSuffix.get(u.seat_number) ?? 0;
        seatSuffix.set(u.seat_number, suffixIdx + 1);
        const suffix = suffixIdx === 0 ? 'B' : String.fromCharCode(67 + suffixIdx - 1); // B, C, D...
        return {
          anonymized_name: `stu${u.seat_number}${suffix}`,
          seat_number: u.seat_number,
          is_graduated: u.is_graduated,
        };
      }
      // 只輸出不含 _userId 的乾淨物件
      const { _userId: _, ...clean } = u;
      return clean;
    });

    // 按 seat_number 升序排序
    return uniqueAnonymized.sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }));
  }

  /**
   * 將單一使用者去識別化 (轉為 stu01 格式)
   * 策略：優先使用平台的 sort_key（最可靠），名字開頭數字只作補充。
   * user_id 只保留於私有回傳物件中，不對外暴露。
   */
  private anonymizeUser(user: UserProfile): AnonymizedUser & { _userId: number } {
    let seatNumStr = '';

    // 1. 優先使用 sort_key（平台官方的排序鍵，通常就是座號）
    if (user.sort_key && user.sort_key.trim() !== '') {
      seatNumStr = user.sort_key.trim();
    } else {
      // 2. 嘗試從 display_name 開頭提取數字（例如 "18 陳妍喬", "01王大明"）
      const name = user.display_name || user.first_name || '';
      const match = name.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        // 如果數字 > 100 (可能是學號)，取最後兩碼
        seatNumStr = num > 100 ? String(num % 100) : String(num);
      } else {
        // 3. Fallback：使用 user.id 的最後兩碼（確保唯一）
        seatNumStr = String(user.id % 100);
      }
    }

    const paddedSeat = seatNumStr.padStart(2, '0');
    return {
      _userId: user.id, // 僅供內部使用，不對 AI 暴露
      anonymized_name: `stu${paddedSeat}`,
      seat_number: paddedSeat,
      is_graduated: user.is_graduated,
    };
  }

  // --- Notes ---
  async listNotes(courseId: number, orderBy: string = 'update_time_desc'): Promise<NotesListResponse> {
    return this.request(`/api/notes/v2?course_id=${courseId}&order_by=${orderBy}`);
  }

  async getNote(noteId: number): Promise<ArrayBuffer> {
    const url = new URL(`/api/notes/${noteId}`, this.baseUrl);
    
    const makeFetch = async (targetUrl: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        return await fetch(targetUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    };

    let fullUrl = this.appendToken(url.toString());
    let response = await makeFetch(fullUrl);

    if (response.status === 401) {
      await this.refreshAuthToken();
      fullUrl = this.appendToken(url.toString());
      response = await makeFetch(fullUrl);
    }

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
   * 備份筆記原始 ZIP 至本機
   */
  async backupNote(noteId: number): Promise<string> {
    const data = await this.getNote(noteId);
    const backupDir = path.join(os.homedir(), '.loilonote', 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `note_${noteId}_${timestamp}.zip`);
    await fs.writeFile(backupPath, Buffer.from(data));
    return backupPath;
  }

  /**
   * 將修改後的 ParsedNote 重新打包為 ZIP Buffer
   */
  async packNote(parsed: ParsedNote): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    zip.addFile('version', Buffer.from(parsed.version.toString() + '\n'));
    zip.addFile('header', Buffer.from(JSON.stringify(parsed.header)));
    zip.addFile('body', Buffer.from(JSON.stringify(parsed.body)));
    return zip.toBuffer();
  }

  /**
   * 覆寫筆記內容 (利用 FormData 打包上傳)
   */
  async updateNote(courseId: number, noteId: number, version: number, zipBuffer: Buffer): Promise<void> {
    const fetchUrl = `https://n.loilo.tv/api/notes/upload`;
    
    const makeFetch = async (token: string) => {
      const formData = new FormData();
      formData.append('id', noteId.toString());
      formData.append('course_id', courseId.toString());
      formData.append('version', version.toString());
      
      const blob = new Blob([zipBuffer], { type: 'application/zip' });
      formData.append('data', blob, 'note.zip');
      formData.append('assets', '[]');
      formData.append('auth_token', token);

      return fetch(fetchUrl, {
        method: 'POST',
        body: formData
      });
    };

    let res = await makeFetch(this.token ?? getToken() ?? '');
    
    if (res.status === 401) {
       const newToken = await this.refreshAuthToken();
       res = await makeFetch(newToken);
    }
    
    if (!res.ok) {
        const error = await res.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${res.status}: ${error}`);
    }
  }

  // --- Assets & Media ---
  async uploadGenericFile(buffer: Buffer, extension: string): Promise<{ id: number }> {
    const url = new URL(`/api/generic_files?extension=${encodeURIComponent(extension)}`, this.baseUrl);
    
    const makeFetch = async (targetUrl: string) => fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': extension === '.png' ? 'image/png' : 'application/octet-stream',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      },
      body: buffer
    });

    let fullUrl = this.appendToken(url.toString());
    let res = await makeFetch(fullUrl);

    if (res.status === 401) {
       await this.refreshAuthToken();
       fullUrl = this.appendToken(url.toString());
       res = await makeFetch(fullUrl);
    }

    if (!res.ok) {
      const error = await res.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${res.status}: ${error}`);
    }
    return res.json() as Promise<{ id: number }>;
  }

  async createAsset(req: CreateAssetRequest): Promise<AssetResponse> {
    // The API expects a JSON body with generic_file_id, page_count, metadata, thumbnails, auth_token
    const makeFetch = async (token: string) => {
      const payload = { ...req, auth_token: token };
      return fetch(this.baseUrl + '/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(payload)
      });
    };

    let res = await makeFetch(this.token ?? getToken() ?? '');

    if (res.status === 401) {
       const newToken = await this.refreshAuthToken();
       res = await makeFetch(newToken);
    }

    if (!res.ok) {
      const error = await res.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${res.status}: ${error}`);
    }
    return res.json() as Promise<AssetResponse>;
  }

  async fetchOGP(targetUrl: string): Promise<OgpResponse> {
    // Note: The actual OGP API might be on loilonote.app rather than n.loilo.tv
    const res = await fetch('https://loilonote.app/api/ogp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ url: targetUrl })
    });
    if (!res.ok) {
      return { url: targetUrl }; // Fallback
    }
    try {
      return await res.json() as OgpResponse;
    } catch {
      return { url: targetUrl };
    }
  }

  /**
   * 列出筆記中的所有媒體資源（圖片/PDF/背景圖的 remote_id）
   */
  extractAssets(parsed: ParsedNote): { frameId: string; frameType: string; remoteId: string }[] {
    const assets: { frameId: string; frameType: string; remoteId: string }[] = [];
    for (const frame of parsed.body.data.frames) {
      const gadgets = frame.gadgets as Record<string, unknown>;

      // drawn gadget: picture/PDF embedded asset
      if (gadgets.drawn) {
        const drawn = gadgets.drawn as Record<string, unknown>;
        const asset = drawn.asset as Record<string, unknown> | undefined;
        if (asset?.remote_id && typeof asset.remote_id === 'string') {
          assets.push({ frameId: frame.id, frameType: frame.type, remoteId: asset.remote_id });
        }
      }

      // bgm gadget: background image asset
      if (gadgets.bgm) {
        const bgm = gadgets.bgm as Record<string, unknown>;
        if (bgm.image) {
          const img = bgm.image as Record<string, unknown> | undefined;
          if (img?.remote_id && typeof img.remote_id === 'string') {
            assets.push({ frameId: frame.id, frameType: `${frame.type}-bg`, remoteId: img.remote_id });
          }
        }
      }
    }
    return assets;
  }
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

  async submitNote(courseId: number, submissionId: number, zipBuffer: Buffer): Promise<void> {
    const fetchUrl = `https://n.loilo.tv/api/courses/${courseId}/submissions/${submissionId}/v2`;
    
    const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const { id: dummyId } = await this.uploadGenericFile(dummyPng, '.png');

    const makeFetch = async (token: string) => {
      const formData = new FormData();
      const blob = new Blob([zipBuffer], { type: 'application/zip' });
      formData.append('data', blob, 'note.zip');
      formData.append('thumbnails', JSON.stringify([{ index: 0, small: dummyId, medium: dummyId }]));
      formData.append('auth_token', token);

      return fetch(fetchUrl, {
        method: 'POST',
        body: formData
      });
    };

    let res = await makeFetch(this.token ?? getToken() ?? '');
    
    if (res.status === 401) {
       const newToken = await this.refreshAuthToken();
       res = await makeFetch(newToken);
    }
    
    if (!res.ok) {
        const error = await res.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${res.status}: ${error}`);
    }
  }
}
