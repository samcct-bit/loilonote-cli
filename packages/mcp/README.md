# Loilonote MCP Server

讓 AI Agent（Claude Code、ChatGPT、OpenCode、Antigravity 等）直接操作 [LoiLoNote School](https://n.loilo.tv) — 查看課程、筆記、繳交作業，提取文字與媒體內容。

## 快速安裝

```bash
npm install -g github:samcct-bit/loilonote-cli
```

## 登入

```bash
loilonote-mcp login
```

會自動打開 Chrome 瀏覽器，在瀏覽器中完成 Google / Microsoft 登入後，token 自動擷取並儲存。

## 設定到 AI Agent

### OpenCode

在 `~/.config/opencode/opencode.json` 加入：

```json
{
  "mcp": {
    "loilonote": {
      "type": "local",
      "command": ["loilonote-mcp"],
      "enabled": true
    }
  }
}
```

### Claude Code / Claude Desktop

在 Claude Desktop 設定檔加入：

```json
{
  "mcpServers": {
    "loilonote": {
      "command": "npx",
      "args": ["loilonote-mcp"]
    }
  }
}
```

### ChatGPT / OpenAI

```json
{
  "mcpServers": {
    "loilonote": {
      "command": "npx",
      "args": ["loilonote-mcp"]
    }
  }
}
```

### VS Code / Cursor

在 `.vscode/mcp.json` 或 Copilot 設定加入：

```json
{
  "servers": {
    "loilonote": {
      "command": "npx",
      "args": ["loilonote-mcp"]
    }
  }
}
```

### Antigravity

```yaml
mcp_servers:
  loilonote:
    command: npx
    args: ["loilonote-mcp"]
```

## 可用 Tools（AI Agent 可呼叫的）

| Tool | 說明 |
|------|------|
| `loilonote_course_list` | 列出所有課程（依班級分組） |
| `loilonote_note_list` | 列出課程中的筆記 |
| `loilonote_note_info` | 查詢筆記詳細資訊（版本、縮圖、權限） |
| `loilonote_note_inspect` | 解析筆記內部結構（卡片類型/數量） |
| `loilonote_note_text` | 提取筆記中所有純文字內容 |
| `loilonote_note_download` | 下載筆記原始 ZIP 檔 |
| `loilonote_submission_list` | 列出課程的繳交作業 |
| `loilonote_course_detail` | 取得課程詳細資訊（學生名單等） |

## CLI 命令（非 AI Agent 使用）

```bash
loilonote-mcp login              # 登入
loilonote-mcp course-list        # 列出課程
loilonote-mcp note-list <course> # 列出筆記
```

## 需求

- Node.js 22+
- Chrome 瀏覽器（登入用）

## License

MIT
