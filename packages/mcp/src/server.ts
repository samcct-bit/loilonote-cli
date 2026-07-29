import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { LoilonoteClient } from '@loilonote/core';

const server = new McpServer({
  name: 'loilonote',
  version: '0.1.0',
});

const client = new LoilonoteClient();

// --- Tool: 列出筆記本 ---
server.registerTool(
  'loilonote_notebook_list',
  {
    description: '列出 Loilonote 中的所有筆記本',
  },
  async () => {
    const result = await client.listNotebooks();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

// --- Tool: 取得筆記本 ---
server.registerTool(
  'loilonote_notebook_get',
  {
    description: '取得指定筆記本的詳細內容',
    inputSchema: { notebookId: z.string().describe('筆記本 ID') },
  },
  async ({ notebookId }) => {
    const notebook = await client.getNotebook(notebookId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(notebook, null, 2) }],
    };
  }
);

// --- Tool: 建立筆記本 ---
server.registerTool(
  'loilonote_notebook_create',
  {
    description: '在 Loilonote 中建立新的筆記本',
    inputSchema: { title: z.string().describe('筆記本標題') },
  },
  async ({ title }) => {
    const notebook = await client.createNotebook(title);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(notebook, null, 2) }],
    };
  }
);

// --- Tool: 列出卡片 ---
server.registerTool(
  'loilonote_card_list',
  {
    description: '列出指定筆記本中的所有卡片',
    inputSchema: { notebookId: z.string().describe('筆記本 ID') },
  },
  async ({ notebookId }) => {
    const cards = await client.listCards(notebookId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(cards, null, 2) }],
    };
  }
);

// --- Tool: 建立卡片 ---
server.registerTool(
  'loilonote_card_create',
  {
    description: '在指定筆記本中建立新卡片',
    inputSchema: {
      notebookId: z.string().describe('筆記本 ID'),
      content: z.string().describe('卡片內容（文字或 JSON）'),
    },
  },
  async ({ notebookId, content }) => {
    let parsed: unknown = content;
    try { parsed = JSON.parse(content); } catch { /* raw text */ }
    const card = await client.createCard(notebookId, parsed);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(card, null, 2) }],
    };
  }
);

// --- Tool: 搜尋 ---
server.registerTool(
  'loilonote_search',
  {
    description: '在 Loilonote 中搜尋筆記與卡片',
    inputSchema: { query: z.string().describe('搜尋關鍵字') },
  },
  async ({ query }) => {
    const result = await client.search(query);
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
