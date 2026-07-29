import type { NotesListResponse, SubmissionsResponse, LoilonoteSession, CourseGroup, CourseDetail, ParsedNote } from './types.js';
export declare class LoilonoteClient {
    private baseUrl;
    private timeout;
    private token;
    constructor(baseUrl?: string, timeout?: number);
    setToken(token: string): void;
    private appendToken;
    private request;
    authenticate(appId: string, oauthToken: string): Promise<LoilonoteSession>;
    listCourses(): Promise<CourseGroup | CourseGroup[]>;
    getCourse(courseId: number): Promise<CourseDetail>;
    listNotes(courseId: number, orderBy?: string): Promise<NotesListResponse>;
    getNote(noteId: number): Promise<ArrayBuffer>;
    /**
     * 下載並解析筆記 ZIP 內容
     */
    getParsedNote(noteId: number): Promise<ParsedNote>;
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
}
//# sourceMappingURL=client.d.ts.map