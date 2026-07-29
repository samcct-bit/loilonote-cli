import { getToken } from './config.js';
export class LoilonoteClient {
    baseUrl;
    timeout;
    token;
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
    async request(path, init = {}) {
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
            return response.json();
        }
        finally {
            clearTimeout(timer);
        }
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
    // --- Notes ---
    async listNotes(courseId, orderBy = 'update_time_desc') {
        return this.request(`/api/notes/v2?course_id=${courseId}&order_by=${orderBy}`);
    }
    async getNote(noteId) {
        const url = new URL(`/api/notes/${noteId}`, this.baseUrl);
        const fullUrl = this.appendToken(url.toString());
        const response = await fetch(fullUrl);
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
}
//# sourceMappingURL=client.js.map