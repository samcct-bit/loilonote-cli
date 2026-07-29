import type { LoilonoteSession } from './types.js';
export declare class AuthManager {
    private token;
    private session;
    constructor();
    isAuthenticated(): boolean;
    getToken(): string | null;
    getSession(): LoilonoteSession | null;
    setToken(token: string): void;
    /**
     * 驗證 token 是否有效（呼叫 /api/courses/v3 測試）
     */
    validate(baseUrl?: string): Promise<boolean>;
    /**
     * 登入：POST /api/apps/authenticate
     */
    login(appId: string, oauthToken: string, baseUrl?: string): Promise<LoilonoteSession>;
    logout(): void;
}
