---
date: 2026-07-29
status: draft
rdq_spec: rdq/RDQ-spec-loilonote-arch-20260729.md
---

# Loilonote MCP/CLI 架構設計文件

## 目錄
1. [現成資源盤點](#1-現成資源盤點)
2. [Loilonote 平台分析](#2-loilonote-平台分析)
3. [認證機制分析](#3-認證機制分析)
4. [MCP 協定規格摘要](#4-mcp-協定規格摘要)
5. [架構設計](#5-架構設計)
6. [Config 結構](#6-config-結構)
7. [README 雛形](#7-readme-雛形)
8. [Token 流向圖](#8-token-流向圖)
9. [下一步與開放問題](#9-下一步與開放問題)

---

## 1. 現成資源盤點

### 1.1 MCP 官方資源

| 資源 | 說明 |
|------|------|
| [MCP 規範](https://modelcontextprotocol.io/specification/latest) | JSON-RPC 2.0 協定，2026-07-28 版本 |
| [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | 官方 TS SDK（13k stars） |
| [Python SDK](https://github.com/modelcontextprotocol/python-sdk) | 官方 Python SDK（23.8k stars） |
| [Java/Kotlin SDK](https://github.com/modelcontextprotocol/kotlin-sdk) | 官方 Kotlin SDK（1.4k stars）－JetBrains 協作 |
| [MCP Inspector](https://github.com/modelcontextprotocol/inspector) | 視覺化測試工具（10.5k stars） |
| [MCP Servers](https://github.com/modelcontextprotocol/servers) | 官方範例伺服器集（89k stars） |

### 1.2 Loilonote 相關 GitHub 專案

| 專案 | 說明 | 語言 |
|------|------|------|
| [zozonteq/loilonote-dark-theme](https://github.com/zozonteq/loilonote-dark-theme) | 非官方暗色主題（3 stars） | CSS |
| [MOBnD/Loilonote_kakutyou](https://github.com/MOBnD/Loilonote_kakutyou) | 輔助網站（學校個人研究） | HTML |
| [Himezakura/loilonote](https://github.com/Himezakura/loilonote) | 非官方工具（2 stars） | JavaScript |

> **結論：目前沒有任何官方的 Loilonote API SDK 或公開的第三方整合工具。** 社群專案規模極小，都屬前端 hack 性質，沒有穩定的 API 套件可沿用。

### 1.3 日本 EdTech API 模式參考

日本教育平台常見的整合模式：
- **LTI (Learning Tools Interoperability)**：IMS Global 標準，日本多數 LMS 採用
- **SSO 整合**：Google Workspace / Microsoft 365 教育版為主流，OAuth 2.0 + OpenID Connect
- **CSV 批次匯入**：帳號/班級資料透過 CSV 匯入管理後台
- **Webhook / callback**：少數平台提供事件通知

---

## 2. Loilonote 平台分析

### 2.1 平台概覽

| 項目 | 資訊 |
|------|------|
| 正式名稱 | LoiLoNote School |
| 開發商 | LoiLo Inc.（日本） |
| 用戶規模 | 13,000+ 學校、280 萬日活用戶 |
| 官網 | https://n.loilo.tv |
| Web App | https://loilonote.app |
| 管理後台 | https://n.loilo.tv/users/sign_in |
| 服務狀態頁 | https://status.loilonote.app |

### 2.2 登入方式（從登入頁面解析）

```
https://loilonote.app/login
```

支援三種登入路徑：

| 路徑 | URL Pattern | 認證方式 |
|------|-------------|---------|
| LoiLoNote 帳號 | `/login/lns?backTo=%2F` | 帳號密碼（含忘記密碼流程） |
| Google | `/login/google?backTo=%2F` | Google OAuth 2.0 |
| Microsoft | `/login/azure?backTo=%2F` | Microsoft Azure AD OAuth |

管理員獨立入口：`https://n.loilo.tv/users/sign_in?lang=en`

### 2.3 API 端點推測

目前 **Loilonote 沒有公開的 REST API 文件**。以下基於 Web App 的 URL 結構與功能推測可能的內部 API：

| 推測端點（相對路徑） | 功能 | 備註 |
|---------------------|------|------|
| `POST /api/auth/login` | 登入／取得 session token | 推測 |
| `GET /api/notebooks` | 取得筆記列表 | 推測 |
| `POST /api/notebooks` | 建立筆記 | 推測 |
| `GET /api/notebooks/:id/cards` | 取得卡片列表 | 推測 |
| `POST /api/notebooks/:id/cards` | 建立卡片 | 推測 |
| `PUT /api/notebooks/:id/cards/:cid` | 更新卡片內容 | 推測 |
| `GET /api/classes` | 取得班級列表（教師） | 推測 |
| `POST /api/submissions` | 繳交作業 | 推測 |
| `GET /api/thinking-tools` | 取得思考工具 | 推測 |

### 2.4 關鍵發現：CDN 版號

登入頁面使用 `https://cdn.loilonote.app/7.8.0/` 作為資源 CDN 路徑，目前版本號為 **7.8.0**。這暗示前端為版本化部署，可以透過觀察 Web App 的 Network 請求來逆向 API。

### 2.5 官方文件與手冊

- 使用手冊：https://scrapbox.io/enloilomanual/User_Manual_Index
- 管理者手冊：https://scrapbox.io/enloilomanual/for_School_Admin
- 技術支援：https://scrapbox.io/enloilots/
- 教材案例：https://scrapbox.io/enloilots/Use_Cases_by_Subject

---

## 3. 認證機制分析

### 3.1 入口點分析

Loilonote 支援多種登入，核心認證流程推測：

```
┌──────────────────────────────────────────────────────────┐
│                      認證入口                              │
├──────────────┬──────────────────┬─────────────────────────┤
│ LoiLoNote    │ Google SSO       │ Microsoft SSO           │
│ 帳號/密碼    │ OAuth 2.0        │ Azure AD OAuth          │
│ POST /login/ │ → /login/google  │ → /login/azure          │
│ lns          │                  │                         │
└──────────────┴──────────────────┴─────────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │    Session Token    │
              │  (Cookie / Bearer)  │
              └─────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │  loilonote.app API  │
              │  (內部 REST API)     │
              └─────────────────────┘
```

### 3.2 認證策略（給 CLI/MCP 工具）

| 方案 | 描述 | 優點 | 缺點 |
|------|------|------|------|
| **A. Session Cookie** | 模擬瀏覽器登入，保存 Cookie | 實作最簡單 | Cookie 會過期，需定期重登；不夠正規 |
| **B. OAuth 2.0 PKCE** | 用 Google/Microsoft OAuth 取得 token | 標準流程，安全性佳 | 需要 redirect URI，CLI 環境需開 localhost 接收 callback |
| **C. API Key** | 若 Loilonote 有提供 API Key（管理後台） | 最簡單穩定 | **目前未發現 API Key 機制** |
| **D. Device Code Flow** | Google/Microsoft 設備驗證碼流程 | 適合 CLI，不需 browser redirect | 需 Loilonote 後端支援此 grant type |

**現階段建議**：
- 優先探索方案 A（Cookie-based），因這是最快能驗證 API 可行性的路徑
- 若 API 端點行為穩定，再遷移到方案 B（OAuth PKCE），以支援長期 token 與 refresh
- 方案 D（Device Code Flow）需要 Loilonote 的 Auth Server 支援，機率較低

### 3.3 Token 儲存策略

```
優先級：
1. 環境變數 LOILONOTE_TOKEN（最高優先，CI/CD 用）
2. Config 檔 ~/.loilonote/config.json（本機開發用）
3. 作業系統 keychain（Windows Credential Manager / macOS Keychain / Linux secret-tool）

Token 格式（預設）：
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": "2026-08-05T12:00:00Z",
  "token_type": "Bearer"
}
```

---

## 4. MCP 協定規格摘要

### 4.1 核心架構

```
┌─────────────┐     JSON-RPC 2.0     ┌──────────────┐
│  MCP Host   │ ◄─────────────────► │  MCP Server   │
│ (AI Client) │   stdio / HTTP       │ (本專案)      │
└─────────────┘                      └──────┬───────┘
                                            │
                                   ┌────────▼───────┐
                                   │  Loilonote API │
                                   └────────────────┘
```

### 4.2 傳輸層選擇

| Transport | 適用場景 | 本專案是否採用 |
|-----------|---------|--------------|
| **stdio** | 本地 CLI 與 AI Host 同機執行 | **是（預設）** |
| Streamable HTTP | 遠端伺服器、多人使用 | 可選（未來擴充） |

### 4.3 Server Primitives（本專案預計實作的 MCP 介面）

| Primitive | MCP 方法 | Loilonote 對應功能 |
|-----------|---------|-------------------|
| **Tool** | `tools/list`, `tools/call` | 建立筆記、新增卡片、搜尋內容、繳交作業 |
| **Resource** | `resources/list`, `resources/read` | 讀取筆記內容、卡片列表、班級名單 |
| **Prompt** | `prompts/list`, `prompts/get` | 備課提示模板、評語生成模板 |

### 4.4 實作語言選擇

基於以下考量，**推薦 TypeScript (Node.js)**：

| 因素 | TypeScript | Python |
|------|-----------|--------|
| MCP SDK 成熟度 | 13k stars，官方主力 | 23.8k stars，社群活躍 |
| npm 發佈生態 | 直接 `npx loilonote-mcp` | 需 `pip install` |
| 跨平台 CLI | Node.js 內建，不需 runtime | 需 Python 3.10+ |
| Windows 相容性 | 原生支援 | 需額外處理編碼 |
| 本機開發環境 | samcct-bit 使用 Windows | 可 |

---

## 5. 架構設計

### 5.1 模組劃分

```
loilonote-cli/
├── packages/
│   ├── core/                    # @loilonote/core
│   │   ├── src/
│   │   │   ├── client.ts        # Loilonote API Client
│   │   │   ├── auth.ts          # 認證管理（Cookie / OAuth）
│   │   │   ├── endpoints/       # API 端點定義
│   │   │   │   ├── notebook.ts
│   │   │   │   ├── card.ts
│   │   │   │   ├── class.ts
│   │   │   │   └── submission.ts
│   │   │   └── types.ts         # TypeScript 型別定義
│   │   └── package.json
│   │
│   ├── cli/                     # @loilonote/cli
│   │   ├── src/
│   │   │   ├── index.ts         # CLI 入口
│   │   │   ├── commands/        # CLI 子命令
│   │   │   │   ├── login.ts
│   │   │   │   ├── notebook.ts
│   │   │   │   └── card.ts
│   │   │   └── config.ts        # Config 讀寫
│   │   └── package.json
│   │
│   └── mcp/                     # @loilonote/mcp
│       ├── src/
│       │   ├── index.ts         # MCP Server 入口
│       │   ├── tools/           # MCP Tool 定義
│       │   │   ├── notebook.ts
│       │   │   ├── card.ts
│       │   │   └── search.ts
│       │   ├── resources/       # MCP Resource 定義
│       │   │   └── notebook.ts
│       │   └── prompts/         # MCP Prompt 定義
│       │       └── teaching.ts
│       └── package.json
│
├── package.json                 # monorepo root (npm workspaces)
├── tsconfig.json
├── README.md
└── .env.example
```

### 5.2 架構層級圖

```
┌─────────────────────────────────────────────────────────────┐
│                      使用者                                  │
├───────────────────────┬─────────────────────────────────────┤
│   CLI 終端機           │   AI Host (Claude/VSCode/OpenCode)  │
│   $ loilonote login   │   MCP Client ──► stdio ──┐         │
│   $ loilonote note ls │                          │         │
└─────────┬─────────────┘              ┌───────────▼───────┐ │
          │                            │  @loilonote/mcp   │ │
          │                            │  MCP Server       │ │
          ▼                            │  (stdio transport)│ │
┌─────────────────────┐               └─────────┬─────────┘ │
│  @loilonote/cli     │                         │           │
│  CLI Interface      │                         ▼           │
│  (commander.js)     │               ┌─────────────────────┐
└─────────┬───────────┘               │  @loilonote/core    │
          │                           │  Loilonote Client   │
          ▼                           │  ├─ HTTP Client      │
┌─────────────────────┐               │  ├─ Auth Manager     │
│  ~/.loilonote/      │               │  └─ API Endpoints   │
│  config.json        │               └──────────┬──────────┘
│  (token storage)    │                          │
└─────────────────────┘                          │
                               ┌─────────────────▼──────────┐
                               │  Loilonote API              │
                               │  loilonote.app (HTTPS)      │
                               └────────────────────────────┘
```

### 5.3 認證層設計

```
AuthManager
├── login(): Promise<Session>      // 互動式登入（Cookie 或 OAuth）
├── refresh(): Promise<Session>    // 刷新 token
├── logout(): Promise<void>        // 清除 token
├── getSession(): Session | null   // 取得當前 session
└── isAuthenticated(): boolean     // 檢查是否已登入

Session {
  token: string
  type: 'cookie' | 'bearer'
  expiresAt: Date
}

ConfigLoader
├── load(): Config                 // 讀取 config（環境變數 > config.json > keychain）
├── save(config: Config): void     // 寫入 config
└── getToken(): string | null      // 取得 token（依優先級）
```

### 5.4 CLI 命令設計

```bash
# 認證
loilonote login              # 互動式登入
loilonote logout             # 清除登入狀態
loilonote whoami             # 顯示目前登入身份

# 筆記本
loilonote notebook list      # 列出筆記本
loilonote notebook create    # 建立筆記本
loilonote notebook get <id>  # 取得筆記本內容

# 卡片
loilonote card list <notebook-id>     # 列出筆記本卡片
loilonote card create <notebook-id>   # 建立卡片
loilonote card get <card-id>          # 取得卡片內容

# 全域
loilonote config show        # 顯示目前設定
loilonote config set <key> <value>   # 設定 config
```

### 5.5 MCP Tool 設計

```typescript
// 本專案預計暴露的 MCP Tools
tools: [
  {
    name: "loilonote_notebook_list",
    description: "列出當前用戶的所有筆記本"
  },
  {
    name: "loilonote_notebook_get",
    description: "取得指定筆記本的內容與卡片",
    inputSchema: { notebookId: string }
  },
  {
    name: "loilonote_notebook_create",
    description: "建立新的筆記本",
    inputSchema: { title: string }
  },
  {
    name: "loilonote_card_create",
    description: "在筆記本中新增卡片",
    inputSchema: { notebookId: string, content: string, type?: string }
  },
  {
    name: "loilonote_card_update",
    description: "更新卡片內容",
    inputSchema: { cardId: string, content: string }
  },
  {
    name: "loilonote_search",
    description: "搜尋筆記與卡片內容",
    inputSchema: { query: string }
  }
]
```

---

## 6. Config 結構

```json
{
  "$schema": "https://raw.githubusercontent.com/samcct-bit/loilonote-cli/main/schemas/config.schema.json",
  "version": 1,
  "auth": {
    "method": "cookie",
    "token": null,
    "tokenFile": null
  },
  "server": {
    "baseUrl": "https://loilonote.app",
    "timeout": 30000
  },
  "cli": {
    "outputFormat": "table",
    "colorEnabled": true
  },
  "mcp": {
    "transport": "stdio",
    "port": null
  }
}
```

### 環境變數對應

| 環境變數 | Config 路徑 | 說明 |
|----------|------------|------|
| `LOILONOTE_TOKEN` | `auth.token` | 直接指定 token（最高優先） |
| `LOILONOTE_BASE_URL` | `server.baseUrl` | API 基礎 URL |
| `LOILONOTE_CONFIG_PATH` | - | 自訂 config 檔路徑 |

---

## 7. README 雛形

```markdown
# Loilonote CLI / MCP Server

連接 [LoiLoNote School](https://n.loilo.tv) 的命令列工具與 MCP Server。

## 安裝

```bash
npm install -g loilonote-cli
```

## 快速開始

### 1. 登入

```bash
loilonote login
```

依照提示選擇登入方式（Google / Microsoft / LoiLoNote 帳號）。

### 2. 基本操作

```bash
# 列出筆記本
loilonote notebook list

# 建立筆記本
loilonote notebook create --title "我的筆記"

# 查看卡片
loilonote card list <notebook-id>
```

### 3. 設定為 MCP Server

在你的 AI Host 設定檔中加入：

```json
{
  "mcpServers": {
    "loilonote": {
      "command": "npx",
      "args": ["-y", "loilonote-cli", "mcp"]
    }
  }
}
```

## 認證

支援三種認證方式：

| 方式 | 說明 |
|------|------|
| 互動式 OAuth | `loilonote login`（預設，支援 Google/Microsoft SSO） |
| 環境變數 | `LOILONOTE_TOKEN=xxx loilonote notebook list` |
| Config 檔 | `~/.loilonote/config.json` 中的 `auth.token` |

## 環境需求

- Node.js 20+
- Windows / macOS / Linux

## License

MIT
```

---

## 8. Token 流向圖

```
┌──────────────────────────────────────────────────────────────────┐
│                        Token 安全流向                              │
│                                                                   │
│  ① 環境變數 LOILONOTE_TOKEN                                       │
│     適用：CI/CD、容器、短期 session                                │
│     ⚠ 不寫入磁碟，但可能出現在 process list (/proc/.../environ)    │
│                                                                   │
│  ② Config 檔 ~/.loilonote/config.json                             │
│     適用：本機開發                                                 │
│     ⚠ 檔案權限設為 600（僅擁有者可讀寫）                            │
│     ⚠ .gitignore 確保不進版控                                     │
│                                                                   │
│  ③ 作業系統 Keychain                                              │
│     適用：長期使用、桌面環境                                       │
│     ✅ 最安全，由 OS 管理加密                                      │
│     Windows: Credential Manager                                   │
│     macOS: Keychain                                               │
│     Linux: libsecret / gnome-keyring                              │
│                                                                   │
│  ─── 紅線（絕不越界）───                                           │
│  ❌ Token 絕不寫入程式碼、git repo、log 輸出                        │
│  ❌ Token 絕不透過 HTTP GET query string 傳遞                      │
│  ✅ Token 一律走 HTTP Header: Authorization: Bearer <token>        │
│  ✅ Config 檔內 token 欄位預設值為 null（不上傳預設 config）         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. 下一步與開放問題

### 已完成（本階段）
- [x] MCP 協定規格調查
- [x] Loilonote 平台公開資訊分析
- [x] 認證機制分析（三種入口點）
- [x] 現成資源盤點（無可用 SDK）
- [x] 模組架構初步設計

### 待進行（下一階段）
- [ ] 攔截 loilonote.app 的實際 HTTP 請求（Chrome DevTools）
- [ ] 確認 session token 格式與過期機制
- [ ] 驗證推測的 API 端點是否可用
- [ ] 決定最終認證方案（Cookie vs OAuth vs API Key）
- [ ] 建立 monorepo 專案骨架

### 開放問題
- ❓ Loilonote 是否在管理後台提供 API Key？（需登入後台確認）
- ❓ Session token 是否支援 refresh？（需實測）
- ❓ API 是否有 rate limit？（需實測）
- ❓ Loilonote 的 CORS 政策是否允許第三方請求？
- ❓ 是否有官方 API 開發文件但未對外公開？（可嘗試聯絡 LoiLo Inc.）
