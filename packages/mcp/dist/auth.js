import { loadConfig, saveConfig } from './config.js';
export class AuthManager {
    token = null;
    session = null;
    constructor() {
        const config = loadConfig();
        this.token = config.auth.token;
    }
    isAuthenticated() {
        return this.token !== null;
    }
    getToken() {
        return this.token;
    }
    getSession() {
        return this.session;
    }
    setToken(token) {
        this.token = token;
        const config = loadConfig();
        config.auth.token = token;
        saveConfig(config);
    }
    /**
     * 驗證 token 是否有效（呼叫 /api/courses/v3 測試）
     */
    async validate(baseUrl = 'https://n.loilo.tv') {
        if (!this.token)
            return false;
        try {
            const response = await fetch(`${baseUrl}/api/courses/v3?auth_token=${encodeURIComponent(this.token)}`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    /**
     * 登入：POST /api/apps/authenticate
     */
    async login(appId, oauthToken, baseUrl = 'https://n.loilo.tv') {
        const response = await fetch(`${baseUrl}/api/apps/authenticate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ app_id: appId, auth_token: oauthToken }).toString(),
        });
        if (!response.ok) {
            const error = await response.text().catch(() => 'Unknown error');
            throw new Error(`Authentication failed: HTTP ${response.status}: ${error}`);
        }
        this.session = await response.json();
        this.token = oauthToken;
        this.setToken(oauthToken);
        return this.session;
    }
    logout() {
        this.token = null;
        this.session = null;
        const config = loadConfig();
        config.auth.token = null;
        config.auth.tokenFile = null;
        saveConfig(config);
    }
}
