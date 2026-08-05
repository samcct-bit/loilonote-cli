import re

with open('packages/mcp/src/server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

imports = '''import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { LoilonoteClient, NoteBuilder } from '@samcct-bit/loilonote-core';
import { resolveCourseId, resolveNoteId } from './resolver.js';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
const _pkg = _require('../../package.json') as { version: string };

/**
 * 統一的錯誤處理包裝器，確保 Tool Handler 的錯誤以 AI 可讀的格式回傳
 */
function safeHandler<T extends (...args: any[]) => Promise<{ content: any[] }>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[MCP Tool Error]', message);
      return {
        content: [{ type: 'text' as const, text: \❌ 操作失敗：\\ }],
        isError: true,
      };
    }
  }) as T;
}

const server = new McpServer({
  name: 'loilonote',
  version: _pkg.version,
});
'''

content = re.sub(
    r"import \{ McpServer.*?const server = new McpServer\(\{\n\s*name: 'loilonote',\n\s*version: '0\.1\.0',\n\}\);",
    imports,
    content,
    flags=re.DOTALL
)

def repl_tool(m):
    return f"{m.group(1)}\n  safeHandler({m.group(2)})\n);"

content = re.sub(
    r"(server\.registerTool\([^,]+,\s*\{.*?\},)\s*(async\s*\([^\)]*\)\s*=>\s*\{.*?\})\n\);",
    repl_tool,
    content,
    flags=re.DOTALL
)

duplicate_resource = r"server\.registerResource\(\n\s*'loilonote_course_submissions',[\s\S]*?\}\s*\)\s*;\s*"
matches = list(re.finditer(duplicate_resource, content))
if len(matches) >= 2:
    start, end = matches[1].span()
    content = content[:start] + content[end:]

with open('packages/mcp/src/server.ts', 'w', encoding='utf-8') as f:
    f.write(content)
