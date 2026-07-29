import { getToken, loadConfig, saveConfig } from './config.js';
import type { Session, LoilonoteConfig } from './types.js';

export class AuthManager {
  private config: LoilonoteConfig;

  constructor() {
    this.config = loadConfig();
  }

  isAuthenticated(): boolean {
    return getToken() !== null;
  }

  getToken(): string | null {
    return getToken();
  }

  async login(): Promise<Session> {
    // TODO: 實作 OAuth 2.0 PKCE flow
    throw new Error('Not implemented — needs API endpoint verification');
  }

  async logout(): Promise<void> {
    this.config.auth.token = null;
    this.config.auth.tokenFile = null;
    saveConfig(this.config);
  }

  async refreshSession(): Promise<Session | null> {
    // TODO: 若支援 refresh token，實作刷新邏輯
    throw new Error('Not implemented — needs API endpoint verification');
  }
}
