import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { LoilonoteClient, NoteBuilder } from '@samcct-bit/loilonote-core';
import { resolveCourseId, resolveNoteId } from './resolver.js';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

const server = new McpServer({
  name: 'loilonote',
  version: '0.1.0',
});

function getClient(): LoilonoteClient {
  return new LoilonoteClient();
}

// --- Tool: 列出課程 ---
server.registerTool(
  'loilonote_course_list',
  { description: '列出所有 Loilonote 課程（依班級分組）' },
  async () => {
    const result = await getClient().listCourses();
    const groups = Array.isArray(result) ? result : [result];
    const text = groups.map(g =>
      `## ${g.user_group_name}\n` +
      g.courses.map(c => `- [${c.course_id}] ${c.name}${c.in_charge ? ' (教師)' : ''}`).join('\n')
    ).join('\n\n');
    return { content: [{ type: 'text' as const, text }] };
  }
);

// --- Tool: 列出筆記 ---
server.registerTool(
  'loilonote_note_list',
  {
    description: '列出指定課程中的所有筆記（含名稱、版本、更新時間、縮圖）',
    inputSchema: { course: z.union([z.string(), z.number()]).describe('課程名稱或 ID') },
  },
  async ({ course }) => {
    const client = getClient();
    const courseId = await resolveCourseId(client, course);
    const result = await client.listNotes(courseId);
    const text = result.notes.map(n =>
      `- [${n.id}] ${n.name}  v${n.version}  ${n.updated_at}`
    ).join('\n');
    return { content: [{ type: 'text' as const, text: text || '（無筆記）' }] };
  }
);

// --- Tool: 取得筆記資訊 ---
server.registerTool(
  'loilonote_note_info',
  {
    description: '從課程筆記列表中查詢特定筆記的詳細資訊（名稱、版本、縮圖URL、權限等）',
    inputSchema: {
      course: z.union([z.string(), z.number()]).describe('課程名稱或 ID'),
      note: z.union([z.string(), z.number()]).describe('筆記名稱或 ID'),
    },
  },
  async ({ course, note }) => {
    const client = getClient();
    const courseId = await resolveCourseId(client, course);
    const noteId = await resolveNoteId(client, courseId, note);
    const result = await client.listNotes(courseId);
    const targetNote = result.notes.find(n => n.id === noteId);
    if (!targetNote) {
      return { content: [{ type: 'text' as const, text: `找不到筆記 ${noteId}（在課程 ${courseId} 中）` }] };
    }
    const info = {
      id: targetNote.id,
      name: targetNote.name,
      version: targetNote.version,
      created_at: targetNote.created_at,
      updated_at: targetNote.updated_at,
      permission: targetNote.viewer_permission,
      shared: targetNote.is_shared,
      thumbnail_small: targetNote.thumbnail?.small?.url ?? null,
    };
    return { content: [{ type: 'text' as const, text: JSON.stringify(info, null, 2) }] };
  }
);

// --- Tool: 列出繳交作業 ---
server.registerTool(
  'loilonote_submission_list',
  {
    description: '列出指定課程的所有繳交作業（含名稱、開放時間、截止時間）',
    inputSchema: { course: z.union([z.string(), z.number()]).describe('課程名稱或 ID') },
  },
  async ({ course }) => {
    const client = getClient();
    const courseId = await resolveCourseId(client, course);
    const result = await client.listSubmissions(courseId);
    const text = result.submissions.map(s => {
      const status = s.submitted ? '已繳' : `接受中（至 ${s.expiry}）`;
      return `- [#${s.submission_number}] ${s.message || '(無標題)'}  ${status}`;
    }).join('\n');
    return { content: [{ type: 'text' as const, text: text || '（無繳交作業）' }] };
  }
);

// --- Tool: 下載筆記檔案 ---
server.registerTool(
  'loilonote_note_download',
  {
    description: '下載筆記原始內容（ZIP 格式，包含所有卡片與多媒體附件）',
    inputSchema: { 
      course: z.union([z.string(), z.number()]).optional().describe('課程名稱或 ID (若筆記為名稱則必填)'),
      note: z.union([z.string(), z.number()]).describe('筆記名稱或 ID') 
    },
  },
  async ({ course, note }) => {
    const client = getClient();
    let nid: number;
    if (typeof note === 'number') {
      nid = note;
    } else {
      if (course === undefined) throw new Error('若使用筆記名稱查詢，必須提供課程名稱或 ID。');
      const cid = await resolveCourseId(client, course);
      nid = await resolveNoteId(client, cid, note);
    }
    const data = await client.getNote(nid);
    const text = `筆記 ${nid} 下載完成，大小 ${(data.byteLength / 1024).toFixed(1)} KB（ZIP 格式，內含卡片頁面與多媒體附件）`;
    return { content: [{ type: 'text' as const, text }] };
  }
);

// --- Tool: 解析筆記結構 ---
server.registerTool(
  'loilonote_note_inspect',
  {
    description: '解析筆記內部結構（版本、卡片類型、頁數、gadget 組成）',
    inputSchema: { 
      course: z.union([z.string(), z.number()]).optional().describe('課程名稱或 ID (若筆記為名稱則必填)'),
      note: z.union([z.string(), z.number()]).describe('筆記名稱或 ID') 
    },
  },
  async ({ course, note }) => {
    const client = getClient();
    let nid: number;
    if (typeof note === 'number') {
      nid = note;
    } else {
      if (course === undefined) throw new Error('若使用筆記名稱查詢，必須提供課程名稱或 ID。');
      const cid = await resolveCourseId(client, course);
      nid = await resolveNoteId(client, cid, note);
    }
    const parsed = await client.getParsedNote(nid);
    const frames = parsed.body.data.frames.map(f => ({
      type: f.type,
      position: `${f.metadata.position.left.toFixed(0)},${f.metadata.position.top.toFixed(0)}`,
      size: `${f.content.size.width}x${f.content.size.height}`,
      gadgets: Object.keys(f.gadgets),
    }));
    return { content: [{
      type: 'text' as const,
      text: JSON.stringify({
        version: parsed.version,
        format: parsed.body.format,
        formatVersion: parsed.body.version,
        frameCount: parsed.frameCount,
        frameTypes: parsed.frameTypes,
        frames,
      }, null, 2),
    }] };
  }
);

// --- Tool: 提取筆記文字 ---
server.registerTool(
  'loilonote_note_text',
  {
    description: '從筆記中提取所有純文字內容（合併所有卡片中的文字）',
    inputSchema: { 
      course: z.union([z.string(), z.number()]).optional().describe('課程名稱或 ID (若筆記為名稱則必填)'),
      note: z.union([z.string(), z.number()]).describe('筆記名稱或 ID') 
    },
  },
  async ({ course, note }) => {
    const client = getClient();
    let nid: number;
    if (typeof note === 'number') {
      nid = note;
    } else {
      if (course === undefined) throw new Error('若使用筆記名稱查詢，必須提供課程名稱或 ID。');
      const cid = await resolveCourseId(client, course);
      nid = await resolveNoteId(client, cid, note);
    }
    const parsed = await client.getParsedNote(nid);
    const text = client.extractText(parsed);
    return { content: [{ type: 'text' as const, text: text || '(無文字內容)' }] };
  }
);

// --- Tool: 修改筆記內容 ---
server.registerTool(
  'loilonote_note_update',
  {
    description: '修改/覆寫/新增筆記內容。執行前會自動備份原始筆記至 ~/.loilonote/backups/',
    inputSchema: { 
      course: z.union([z.string(), z.number()]).describe('課程名稱或 ID'),
      note: z.union([z.string(), z.number()]).describe('筆記名稱或 ID'),
      newText: z.string().describe('要寫入的新文字內容'),
      action: z.enum(['append', 'replace']).default('append').describe('append: 新增卡片放置於最下方, replace: 覆寫第一張卡片內容')
    },
  },
  async ({ course, note, newText, action }) => {
    const client = getClient();
    
    // 名稱解析
    const courseId = await resolveCourseId(client, course);
    const noteId = await resolveNoteId(client, courseId, note);

    // 1. 強制備份
    const backupPath = await client.backupNote(noteId);
    
    // 2. 取得解析結構
    const parsed = await client.getParsedNote(noteId);
    if (parsed.body.data.frames.length === 0) {
      throw new Error('筆記中沒有任何卡片，無法寫入內容。');
    }
    
    // 3. 修改或新增卡片
    if (action === 'append') {
      // Deep clone first frame to ensure valid structure
      const firstFrame = parsed.body.data.frames[0];
      const newFrame = JSON.parse(JSON.stringify(firstFrame));
      
      newFrame.id = crypto.randomUUID().replace(/-/g, '').toLowerCase();
      
      let maxTop = 0;
      for (const frame of parsed.body.data.frames) {
        if (frame.metadata?.position?.top > maxTop) {
          maxTop = frame.metadata.position.top;
        }
      }
      newFrame.metadata.position.top = maxTop + 1000;
      
      // Clear all gadgets and add text
      newFrame.gadgets = {
        title: {
          text: newText,
          attributes: [{ type: 'font', value: { bold: false, size: 30 } }, { type: 'paragraph_style', value: { line_spacing: 0 } }, { type: 'foreground_color', value: '#FF000000' }, { type: 'language', value: 'zh-Hant' }],
          attribute_ranges: [{ index: 0, range: { location: 0, length: newText.length } }],
          forecolor: '#FF000000',
          vertical: false,
          h_alignment: 'left',
          v_alignment: 'middle',
          font_size: 30
        },
        drawn: { canvas: { width: 1024, height: 768 }, thumbnailRect: { x: 0, y: 0, width: 1, height: 1 } }
      };
      
      parsed.body.data.frames.push(newFrame);
    } else {
      // Replace 第一張卡片
      const firstFrame = parsed.body.data.frames[0];
      const gadgets = firstFrame.gadgets as Record<string, any>;
      let textGadgetKey = Object.keys(gadgets).find(k => gadgets[k] && typeof gadgets[k].text === 'string');
      
      if (!textGadgetKey) {
        textGadgetKey = 'title';
      }
      if (!gadgets[textGadgetKey]) {
        gadgets[textGadgetKey] = {
          attributes: [{ type: 'font', value: { bold: false, size: 30 } }, { type: 'paragraph_style', value: { line_spacing: 0 } }, { type: 'foreground_color', value: '#FF000000' }, { type: 'language', value: 'zh-Hant' }],
          forecolor: '#FF000000', vertical: false, h_alignment: 'left', v_alignment: 'middle', font_size: 30
        };
      }
      gadgets[textGadgetKey].text = newText;
      if (gadgets[textGadgetKey].attribute_ranges) {
        gadgets[textGadgetKey].attribute_ranges[0].range.length = newText.length;
      } else {
        gadgets[textGadgetKey].attribute_ranges = [{ index: 0, range: { location: 0, length: newText.length } }];
      }
    }
    
    // 4. 增加版本號並重新打包
    parsed.version += 1;
    const zipBuffer = await client.packNote(parsed);
    
    // 5. 批次上傳覆寫
    await client.updateNote(courseId, noteId, parsed.version, zipBuffer);
    
    const text = `成功更新筆記 ${noteId} (${action})！\n(已自動備份原始檔案至: ${backupPath})`;
    return { content: [{ type: 'text' as const, text }] };
  }
);

// --- Tool: 附加網頁卡片 ---
server.registerTool(
  'loilonote_note_append_web',
  {
    description: '附加一張網頁卡片至筆記。執行前會自動備份原始筆記。',
    inputSchema: {
      course: z.union([z.string(), z.number()]).optional().describe('課程名稱或 ID (若筆記為名稱則必填)'),
      note: z.union([z.string(), z.number()]).describe('筆記名稱或 ID'),
      url: z.string().describe('網址')
    }
  },
  async ({ course, note, url }) => {
    const client = getClient();
    const cid = course ? await resolveCourseId(client, course) : 0;
    const nid = await resolveNoteId(client, cid, note);

    const backupPath = await client.backupNote(nid);
    const parsed = await client.getParsedNote(nid);
    const ogp = await client.fetchOGP(url);
    NoteBuilder.appendWebCard(parsed, url, ogp.title);
    
    parsed.version += 1;
    const buf = await client.packNote(parsed);
    await client.updateNote(cid, nid, parsed.version, buf);
    return { content: [{ type: 'text' as const, text: `網頁卡片已成功附加！\n(已自動備份至: ${backupPath})` }] };
  }
);

// --- Tool: 附加圖片卡片 ---
server.registerTool(
  'loilonote_note_append_image',
  {
    description: '附加一張本地圖片至筆記。執行前會自動備份原始筆記。',
    inputSchema: {
      course: z.union([z.string(), z.number()]).optional().describe('課程名稱或 ID (若筆記為名稱則必填)'),
      note: z.union([z.string(), z.number()]).describe('筆記名稱或 ID'),
      filepath: z.string().describe('本機圖片檔案之絕對路徑')
    }
  },
  async ({ course, note, filepath }) => {
    const client = getClient();
    const cid = course ? await resolveCourseId(client, course) : 0;
    const nid = await resolveNoteId(client, cid, note);

    const buffer = fs.readFileSync(filepath);
    const ext = path.extname(filepath).toLowerCase();
    const uploadRes = await client.uploadGenericFile(buffer, ext);
    const assetRes = await client.createAsset({
      generic_file_id: uploadRes.id,
      page_count: 1,
      metadata: '[{"width":1024,"height":768}]',
      thumbnails: '[]'
    });

    const backupPath = await client.backupNote(nid);
    const parsed = await client.getParsedNote(nid);
    NoteBuilder.appendPictureCard(parsed, assetRes.id, path.basename(filepath));
    
    parsed.version += 1;
    const buf = await client.packNote(parsed);
    await client.updateNote(cid, nid, parsed.version, buf);
    return { content: [{ type: 'text' as const, text: `圖片卡片已成功附加！\n(已自動備份至: ${backupPath})` }] };
  }
);

// --- Tool: 繳交作業 ---
server.registerTool(
  'loilonote_sub_submit',
  {
    description: '將指定的筆記繳交至指定的課程作業箱。',
    inputSchema: {
      course: z.union([z.string(), z.number()]).describe('課程名稱或 ID'),
      submissionId: z.union([z.string(), z.number()]).describe('作業箱 ID（可透過 loilonote_submission_list 取得）'),
      note: z.union([z.string(), z.number()]).describe('要繳交的筆記名稱或 ID')
    }
  },
  async ({ course, submissionId, note }) => {
    const client = getClient();
    const cid = await resolveCourseId(client, course);
    const nid = await resolveNoteId(client, cid, note);
    const sid = typeof submissionId === 'number' ? submissionId : parseInt(submissionId as string, 10);

    const parsed = await client.getParsedNote(nid);
    const buf = await client.packNote(parsed);
    await client.submitNote(cid, sid, buf);
    return { content: [{ type: 'text' as const, text: `筆記 ${nid} 已成功繳交至課程 ${cid} 的作業箱 #${sid}！` }] };
  }
);

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
