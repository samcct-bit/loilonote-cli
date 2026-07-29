import { loadConfig, saveConfig } from './config.js';
import type { LoilonoteSession } from './types.js';

export class AuthManager {
  private token: string | null = null;
  private session: LoilonoteSession | null = null;

  constructor() {
    const config = loadConfig();
    this.token = config.auth.token;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getToken(): string | null {
    return this.token;
  }

  getSession(): LoilonoteSession | null {
    return this.session;
  }

  setToken(token: string): void {
    this.token = token;
    const config = loadConfig();
    config.auth.token = token;
    saveConfig(config);
  }

  /**
   * 驗證 token 是否有效（呼叫 /api/courses/v3 測試）
   */
  async validate(baseUrl: string = 'https://n.loilo.tv'): Promise<boolean> {
    if (!this.token) return false;
    try {
      const response = await fetch(`${baseUrl}/api/courses/v3?auth_token=${encodeURIComponent(this.token)}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 登入：POST /api/apps/authenticate
   */
  async login(appId: string, oauthToken: string, baseUrl: string = 'https://n.loilo.tv'): Promise<LoilonoteSession> {
    const response = await fetch(`${baseUrl}/api/apps/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ app_id: appId, auth_token: oauthToken }).toString(),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`Authentication failed: HTTP ${response.status}: ${error}`);
    }

    this.session = await response.json() as LoilonoteSession;
    this.token = oauthToken;
    this.setToken(oauthToken);
    return this.session;
  }

  logout(): void {
    this.token = null;
    this.session = null;
    const config = loadConfig();
    config.auth.token = null;
    config.auth.tokenFile = null;
    saveConfig(config);
  }
}
