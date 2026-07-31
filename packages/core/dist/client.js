import { getToken, updateToken } from './config.js';
import { loginWithBrowser } from './cdp-auth.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
export class LoilonoteClient {
    baseUrl;
    timeout;
    token;
    refreshPromise;
    onTokenRefreshStart;
    constructor(baseUrl, timeout) {
        this.baseUrl = baseUrl ?? process.env.LOILONOTE_BASE_URL ?? 'https://n.loilo.tv';
        this.timeout = timeout ?? 30000;
        this.token = getToken();
    }
    setToken(token) {
        this.token = token;
    }
    appendToken(url) {
        const token = this.token ?? getToken();
        if (!token)
            return url;
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}auth_token=${encodeURIComponent(token)}`;
    }
    async refreshAuthToken() {
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
    async request(path, init = {}) {
        const url = new URL(path, this.baseUrl);
        const makeFetch = async (targetUrl) => {
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
            }
            finally {
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
        return response.json();
    }
    // --- Auth ---
    async authenticate(appId, oauthToken) {
        this.token = oauthToken;
        return this.request('/api/apps/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ app_id: appId, auth_token: oauthToken }).toString(),
        });
    }
    // --- Courses ---
    async listCourses() {
        return this.request('/api/courses/v3');
    }
    async getCourse(courseId) {
        return this.request(`/api/courses/${courseId}`);
    }
    /**
     * 取得指定課程的學生名單（去識別化）
     */
    async listUsers(courseId) {
        const url = new URL(`https://n.loilo.tv/api/courses/${courseId}`);
        const makeFetch = async (targetUrl) => fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
            }
        });
        let fullUrl = this.appendToken(url.toString());
        let response = await makeFetch(fullUrl);
        if (response.status === 401) {
            await this.refreshAuthToken();
            fullUrl = this.appendToken(url.toString());
            response = await makeFetch(fullUrl);
        }
        if (!response.ok) {
            throw new Error(`Failed to list users: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json());
        const rawUsers = data.students || data.users || [];
        // 回傳去識別化後的資料
        return rawUsers
            .map((u) => this.anonymizeUser(u));
    }
    /**
     * 將單一使用者去識別化 (轉為 stu01 格式)
     */
    anonymizeUser(user) {
        const name = user.display_name || user.first_name || '';
        let seatNumStr = '';
        // 1. 嘗試從名字開頭提取數字 (例如 "01王大明", "10501 王大明", "18 陳妍喬")
        const match = name.match(/^(\d+)/);
        if (match) {
            // 如果數字很長（像是學號 10501），我們可以只取最後兩碼作為座號，或是直接用
            // 但為了安全，如果數字小於 100，直接當座號；否則取最後兩碼
            const num = parseInt(match[1], 10);
            if (num > 100) {
                seatNumStr = String(num % 100);
            }
            else {
                seatNumStr = String(num);
            }
        }
        // 2. 如果名字沒有數字，使用系統的 sort_key
        else if (user.sort_key) {
            seatNumStr = user.sort_key;
        }
        // 3. Fallback
        else {
            seatNumStr = '99';
        }
        const paddedSeat = seatNumStr.padStart(2, '0');
        return {
            user_id: user.id,
            seat_number: paddedSeat,
            anonymized_name: `stu${paddedSeat}`,
            is_graduated: user.is_graduated
        };
    }
    // --- Notes ---
    async listNotes(courseId, orderBy = 'update_time_desc') {
        return this.request(`/api/notes/v2?course_id=${courseId}&order_by=${orderBy}`);
    }
    async getNote(noteId) {
        const url = new URL(`/api/notes/${noteId}`, this.baseUrl);
        const makeFetch = async (targetUrl) => fetch(targetUrl);
        let fullUrl = this.appendToken(url.toString());
        let response = await makeFetch(fullUrl);
        if (response.status === 401) {
            await this.refreshAuthToken();
            fullUrl = this.appendToken(url.toString());
            response = await makeFetch(fullUrl);
        }
        if (!response.ok)
            throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
    }
    /**
     * 下載並解析筆記 ZIP 內容
     */
    async getParsedNote(noteId) {
        const data = await this.getNote(noteId);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip(Buffer.from(data));
        const version = parseInt(zip.readAsText('version').trim(), 10);
        const header = JSON.parse(zip.readAsText('header'));
        const body = JSON.parse(zip.readAsText('body'));
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
    async backupNote(noteId) {
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
    async packNote(parsed) {
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
    async updateNote(courseId, noteId, version, zipBuffer) {
        const fetchUrl = `https://n.loilo.tv/api/notes/upload`;
        const makeFetch = async (token) => {
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
    async uploadGenericFile(buffer, extension) {
        const url = new URL(`/api/generic_files?extension=${encodeURIComponent(extension)}`, this.baseUrl);
        const makeFetch = async (targetUrl) => fetch(targetUrl, {
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
        return res.json();
    }
    async createAsset(req) {
        // The API expects a JSON body with generic_file_id, page_count, metadata, thumbnails, auth_token
        const makeFetch = async (token) => {
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
        return res.json();
    }
    async fetchOGP(targetUrl) {
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
            return await res.json();
        }
        catch {
            return { url: targetUrl };
        }
    }
    /**
     * 列出筆記中的所有媒體資源（圖片/PDF/背景圖的 remote_id）
     */
    extractAssets(parsed) {
        const assets = [];
        for (const frame of parsed.body.data.frames) {
            const gadgets = frame.gadgets;
            // drawn gadget: picture/PDF embedded asset
            if (gadgets.drawn) {
                const drawn = gadgets.drawn;
                const asset = drawn.asset;
                if (asset?.remote_id && typeof asset.remote_id === 'string') {
                    assets.push({ frameId: frame.id, frameType: frame.type, remoteId: asset.remote_id });
                }
            }
            // bgm gadget: background image asset
            if (gadgets.bgm) {
                const bgm = gadgets.bgm;
                if (bgm.image) {
                    const img = bgm.image;
                    if (img?.remote_id && typeof img.remote_id === 'string') {
                        assets.push({ frameId: frame.id, frameType: `${frame.type}-bg`, remoteId: img.remote_id });
                    }
                }
            }
        }
        return assets;
    }
    extractText(parsed) {
        const texts = [];
        for (const frame of parsed.body.data.frames) {
            const gadgets = frame.gadgets;
            // 遍歷所有 gadget 找文字內容
            for (const key of Object.keys(gadgets)) {
                const gadget = gadgets[key];
                if (!gadget)
                    continue;
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
    async listSubmissions(courseId, limit = 30) {
        return this.request(`/api/courses/${courseId}/submissions/v2?limit=${limit}`);
    }
    async submitNote(courseId, submissionId, zipBuffer) {
        const fetchUrl = `https://n.loilo.tv/api/courses/${courseId}/submissions/${submissionId}/v2`;
        const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
        const { id: dummyId } = await this.uploadGenericFile(dummyPng, '.png');
        const makeFetch = async (token) => {
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
//# sourceMappingURL=client.js.map