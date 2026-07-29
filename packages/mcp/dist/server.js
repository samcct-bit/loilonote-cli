import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { LoilonoteClient } from './client.js';
const server = new McpServer({
    name: 'loilonote',
    version: '0.1.0',
});
function getClient() {
    return new LoilonoteClient();
}
// --- Tool: 列出課程 ---
server.registerTool('loilonote_course_list', { description: '列出所有 Loilonote 課程（依班級分組）' }, async () => {
    const result = await getClient().listCourses();
    const groups = Array.isArray(result) ? result : [result];
    const text = groups.map(g => `## ${g.user_group_name}\n` +
        g.courses.map(c => `- [${c.course_id}] ${c.name}${c.in_charge ? ' (教師)' : ''}`).join('\n')).join('\n\n');
    return { content: [{ type: 'text', text }] };
});
// --- Tool: 列出筆記 ---
server.registerTool('loilonote_note_list', {
    description: '列出指定課程中的所有筆記（含名稱、版本、更新時間、縮圖）',
    inputSchema: { courseId: z.number().describe('課程 ID') },
}, async ({ courseId }) => {
    const result = await getClient().listNotes(courseId);
    const text = result.notes.map(n => `- [${n.id}] ${n.name}  v${n.version}  ${n.updated_at}`).join('\n');
    return { content: [{ type: 'text', text: text || '（無筆記）' }] };
});
// --- Tool: 取得筆記資訊 ---
server.registerTool('loilonote_note_info', {
    description: '從課程筆記列表中查詢特定筆記的詳細資訊（名稱、版本、縮圖URL、權限等）',
    inputSchema: {
        courseId: z.number().describe('課程 ID'),
        noteId: z.number().describe('筆記 ID'),
    },
}, async ({ courseId, noteId }) => {
    const result = await getClient().listNotes(courseId);
    const note = result.notes.find(n => n.id === noteId);
    if (!note) {
        return { content: [{ type: 'text', text: `找不到筆記 ${noteId}（在課程 ${courseId} 中）` }] };
    }
    const info = {
        id: note.id,
        name: note.name,
        version: note.version,
        created_at: note.created_at,
        updated_at: note.updated_at,
        permission: note.viewer_permission,
        shared: note.is_shared,
        thumbnail_small: note.thumbnail?.small?.url ?? null,
    };
    return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
});
// --- Tool: 列出繳交作業 ---
server.registerTool('loilonote_submission_list', {
    description: '列出指定課程的所有繳交作業（含名稱、開放時間、截止時間）',
    inputSchema: { courseId: z.number().describe('課程 ID') },
}, async ({ courseId }) => {
    const result = await getClient().listSubmissions(courseId);
    const text = result.submissions.map(s => {
        const status = s.submitted ? '已繳' : `接受中（至 ${s.expiry}）`;
        return `- [#${s.submission_number}] ${s.message || '(無標題)'}  ${status}`;
    }).join('\n');
    return { content: [{ type: 'text', text: text || '（無繳交作業）' }] };
});
// --- Tool: 下載筆記檔案 ---
server.registerTool('loilonote_note_download', {
    description: '下載筆記原始內容（ZIP 格式，包含所有卡片與多媒體附件）',
    inputSchema: { noteId: z.number().describe('筆記 ID') },
}, async ({ noteId }) => {
    const data = await getClient().getNote(noteId);
    const text = `筆記 ${noteId} 下載完成，大小 ${(data.byteLength / 1024).toFixed(1)} KB（ZIP 格式，內含卡片頁面與多媒體附件）`;
    return { content: [{ type: 'text', text }] };
});
// --- Tool: 解析筆記結構 ---
server.registerTool('loilonote_note_inspect', {
    description: '解析筆記內部結構（版本、卡片類型、頁數、gadget 組成）',
    inputSchema: { noteId: z.number().describe('筆記 ID') },
}, async ({ noteId }) => {
    const parsed = await getClient().getParsedNote(noteId);
    const frames = parsed.body.data.frames.map(f => ({
        type: f.type,
        position: `${f.metadata.position.left.toFixed(0)},${f.metadata.position.top.toFixed(0)}`,
        size: `${f.content.size.width}x${f.content.size.height}`,
        gadgets: Object.keys(f.gadgets),
    }));
    return { content: [{
                type: 'text',
                text: JSON.stringify({
                    version: parsed.version,
                    format: parsed.body.format,
                    formatVersion: parsed.body.version,
                    frameCount: parsed.frameCount,
                    frameTypes: parsed.frameTypes,
                    frames,
                }, null, 2),
            }] };
});
// --- Tool: 提取筆記文字 ---
server.registerTool('loilonote_note_text', {
    description: '從筆記中提取所有純文字內容（合併所有卡片中的文字）',
    inputSchema: { noteId: z.number().describe('筆記 ID') },
}, async ({ noteId }) => {
    const parsed = await getClient().getParsedNote(noteId);
    const text = getClient().extractText(parsed);
    return { content: [{ type: 'text', text: text || '(無文字內容)' }] };
});
// --- Entry point ---
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Loilonote MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
