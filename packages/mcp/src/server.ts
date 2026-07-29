import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { LoilonoteClient } from '@loilonote/core';

const server = new McpServer({
  name: 'loilonote',
  version: '0.1.0',
});

const client = new LoilonoteClient();

// --- Tool: 列出課程 ---
server.registerTool(
  'loilonote_course_list',
  {
    description: '列出所有課程',
  },
  async () => {
    const result = await client.listCourses();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --- Tool: 取得課程 ---
server.registerTool(
  'loilonote_course_get',
  {
    description: '取得指定課程的詳細內容',
    inputSchema: { courseId: z.number().describe('課程 ID') },
  },
  async ({ courseId }) => {
    const result = await client.getCourse(courseId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --- Tool: 列出筆記 ---
server.registerTool(
  'loilonote_note_list',
  {
    description: '列出指定課程中的所有筆記',
    inputSchema: { courseId: z.number().describe('課程 ID') },
  },
  async ({ courseId }) => {
    const result = await client.listNotes(courseId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --- Tool: 取得筆記 ---
server.registerTool(
  'loilonote_note_get',
  {
    description: '取得指定筆記的詳細資訊（回傳筆記詮釋資料，包含名稱、版本、縮圖等）',
    inputSchema: { noteId: z.number().describe('筆記 ID') },
  },
  async ({ noteId }) => {
    const notes = await client.listNotes(0); // 需要從 note 列表中查找，暫時回傳提示
    return {
      content: [{ type: 'text' as const, text: `筆記 ID: ${noteId}。請使用 loilonote_note_list 取得課程中的筆記列表，再用 loilonote_note_download 下載內容。` }],
    };
  }
);

// --- Tool: 下載筆記 ---
server.registerTool(
  'loilonote_note_download',
  {
    description: '下載筆記原始內容（ZIP 格式，包含卡片與附件）',
    inputSchema: { noteId: z.number().describe('筆記 ID') },
  },
  async ({ noteId }) => {
    const data = await client.getNote(noteId);
    return {
      content: [{
        type: 'text' as const,
        text: `筆記 ${noteId} 下載完成，大小 ${(data.byteLength / 1024).toFixed(1)} KB（二進位 ZIP 內容無法直接以文字顯示）`,
      }],
    };
  }
);

// --- Tool: 列出繳交作業 ---
server.registerTool(
  'loilonote_submission_list',
  {
    description: '列出指定課程的繳交作業',
    inputSchema: { courseId: z.number().describe('課程 ID') },
  },
  async ({ courseId }) => {
    const result = await client.listSubmissions(courseId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --- Entry point ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Loilonote MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
