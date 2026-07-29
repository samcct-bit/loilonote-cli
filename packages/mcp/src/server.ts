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
    description: '取得指定筆記的詳細內容',
    inputSchema: { noteId: z.number().describe('筆記 ID') },
  },
  async ({ noteId }) => {
    const result = await client.getNote(noteId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
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
