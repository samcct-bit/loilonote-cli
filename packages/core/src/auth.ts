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

  /**
   * 登入：POST /api/apps/authenticate
   * 傳入 app_id 與 OAuth token，換回 auth_token + session info
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
    this.saveState();
    return this.session;
  }

  /**
   * 直接設定 token（從環境變數或其他來源取得，跳過登入流程）
   */
  setToken(token: string): void {
    this.token = token;
    this.saveState();
  }

  logout(): void {
    this.token = null;
    this.session = null;
    const config = loadConfig();
    config.auth.token = null;
    config.auth.tokenFile = null;
    saveConfig(config);
  }

  private saveState(): void {
    const config = loadConfig();
    config.auth.token = this.token;
    saveConfig(config);
  }
}
