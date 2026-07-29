# Loilonote CLI / MCP Server

讓 AI Agent 直接操作 [LoiLoNote School](https://n.loilo.tv) 的命令列工具與 MCP Server。

支援查看課程、筆記列表、繳交作業列表、筆記內容解析（ZIP 內文字提取、卡片結構檢視）。

## 安裝

```bash
npm install -g @samcct-bit/loilonote-cli
```

需求：Node.js 22+、Chrome 瀏覽器（登入用）

## 快速開始

### 1. 登入

```bash
loilonote login
```

自動打開 Chrome 瀏覽器，在 Loilonote 完成 Google / Microsoft 登入後，token 自動擷取並儲存至 `~/.loilonote/config.json`。

> Token 效期 24 小時，過期後需重新登入。

### 2. 設定到 AI Agent

依你使用的 AI Agent 加入對應的 MCP 設定：

<details>
<summary><b>OpenCode</b></summary>

```jsonc
// ~/.config/opencode/opencode.json
{
  "mcp": {
    "loilonote": {
      "type": "local",
      "command": ["npx", "-y", "@samcct-bit/loilonote-mcp"],
      "enabled": true
    }
  }
}
```
</details>

<details>
<summary><b>Claude Desktop / Claude Code</b></summary>

```json
// Claude Desktop 設定檔
{
  "mcpServers": {
    "loilonote": {
      "command": "npx",
      "args": ["-y", "@samcct-bit/loilonote-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>ChatGPT</b></summary>

```json
{
  "mcpServers": {
    "loilonote": {
      "command": "npx",
      "args": ["-y", "@samcct-bit/loilonote-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>VS Code / Cursor</b></summary>

```json
{
  "servers": {
    "loilonote": {
      "command": "npx",
      "args": ["-y", "@samcct-bit/loilonote-mcp"]
    }
  }
}
```
</details>

<details>
<summary><b>Antigravity</b></summary>

```yaml
mcp_servers:
  loilonote:
    command: npx
    args: ["-y", "@samcct-bit/loilonote-mcp"]
```
</details>

### 3. 開始使用

重啟 AI Agent 後，直接對它說：

> 「列出我的 Loilonote 課程」

AI Agent 會自動呼叫 MCP tools 取得資料。

## MCP Tools（AI Agent 可呼叫的 8 個工具）

| Tool | 說明 |
|------|------|
| `loilonote_course_list` | 列出所有課程（依班級分組） |
| `loilonote_note_list` | 列出課程中的所有筆記（含版本、更新時間、縮圖） |
| `loilonote_note_info` | 查詢筆記詳細資訊（版本、權限、縮圖 URL） |
| `loilonote_note_inspect` | 解析筆記內部結構（卡片類型/數量/gadget） |
| `loilonote_note_text` | 提取筆記中所有卡片合併後的純文字內容 |
| `loilonote_note_download` | 下載筆記原始內容（ZIP 檔，含卡片與多媒體） |
| `loilonote_submission_list` | 列出課程的繳交作業（含開放/截止時間） |

## CLI 命令（非 AI Agent，終端機手動使用）

```bash
loilonote login              # 登入（自動打開瀏覽器）
loilonote course list        # 列出所有課程
loilonote note list <id>     # 列出課程筆記
loilonote note inspect <id>  # 解析筆記結構
loilonote note text <id>     # 提取筆記文字
```

## 專案結構

```
loilonote-cli/
├── packages/
│   ├── core/       # @samcct-bit/loilonote-core — API client、認證、型別
│   ├── cli/        # @samcct-bit/loilonote-cli — 命令列介面（commander.js）
│   └── mcp/        # @samcct-bit/loilonote-mcp — MCP Server（自包含，可獨立安裝）
├── docs/
│   └── architecture.md  # 架構設計文件
└── rdq/
    └── RDQ-spec-loilonote-arch-20260729.md  # 需求規格卡
```

## 開發

```bash
git clone https://github.com/samcct-bit/loilonote-cli.git
cd loilonote-cli
npm install
npm run build
```

## 技術細節

- **API Base**：`https://n.loilo.tv/api/`
- **認證**：`auth_token` URL query parameter（24 小時有效）
- **登入方式**：Chrome DevTools Protocol 攔截 token，支援 Google / Microsoft SSO
- **筆記格式**：ZIP 壓縮檔內含 `version` / `header` / `body`（JSON frames 結構）
- **MCP 傳輸**：stdio transport（JSON-RPC 2.0）

## License

MIT
