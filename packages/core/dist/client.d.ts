import type { NotesListResponse, SubmissionsResponse, LoilonoteSession, CourseGroup, CourseDetail, ParsedNote, OgpResponse, CreateAssetRequest, AssetResponse } from './types.js';
export declare class LoilonoteClient {
    private baseUrl;
    private timeout;
    private token;
    private refreshPromise?;
    onTokenRefreshStart?: () => void;
    constructor(baseUrl?: string, timeout?: number);
    setToken(token: string): void;
    private appendToken;
    private refreshAuthToken;
    private request;
    authenticate(appId: string, oauthToken: string): Promise<LoilonoteSession>;
    listCourses(): Promise<CourseGroup | CourseGroup[]>;
    getCourse(courseId: number): Promise<CourseDetail>;
    /**
     * 取得指定課程的學生名單（去識別化）
     */
    listUsers(courseId: number): Promise<any>;
    /**
     * 將單一使用者去識別化 (轉為 stu01 格式)
     */
    private anonymizeUser;
    listNotes(courseId: number, orderBy?: string): Promise<NotesListResponse>;
    getNote(noteId: number): Promise<ArrayBuffer>;
    /**
     * 下載並解析筆記 ZIP 內容
     */
    getParsedNote(noteId: number): Promise<ParsedNote>;
    /**
     * 備份筆記原始 ZIP 至本機
     */
    backupNote(noteId: number): Promise<string>;
    /**
     * 將修改後的 ParsedNote 重新打包為 ZIP Buffer
     */
    packNote(parsed: ParsedNote): Promise<Buffer>;
    /**
     * 覆寫筆記內容 (利用 FormData 打包上傳)
     */
    updateNote(courseId: number, noteId: number, version: number, zipBuffer: Buffer): Promise<void>;
    uploadGenericFile(buffer: Buffer, extension: string): Promise<{
        id: number;
    }>;
    createAsset(req: CreateAssetRequest): Promise<AssetResponse>;
    fetchOGP(targetUrl: string): Promise<OgpResponse>;
    /**
     * 列出筆記中的所有媒體資源（圖片/PDF/背景圖的 remote_id）
     */
    extractAssets(parsed: ParsedNote): {
        frameId: string;
        frameType: string;
        remoteId: string;
    }[];
    extractText(parsed: ParsedNote): string;
    listSubmissions(courseId: number, limit?: number): Promise<SubmissionsResponse>;
    submitNote(courseId: number, submissionId: number, zipBuffer: Buffer): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map