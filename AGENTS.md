# Loilonote cli（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介
構思與生成連接 Loilonote 的 MCP 或 CLI 工具。

## 關鍵時程
暫無。

## 目標與路線圖
- [x] 階段一：需求探索與技術調查
- [ ] 階段二：MCP/CLI 架構設計與實作
  - [x] RDQ 需求訪談
  - [x] 架構設計文件（docs/architecture.md）
  - [x] API 逆向驗證
  - [x] monorepo 專案骨架
  - [x] API client 實作
  - [x] MCP server（8 個 tools）
  - [x] 筆記 ZIP 解析（inspect/text 命令）
  - [x] CDP 自動登入
  - [x] MCP 自包含打包（可獨立安裝）

## 資料夾結構
```
loilonote/
├── AGENTS.md                 # 專案藍圖
├── handoff.md                # 交接檔
├── .gitignore
├── package.json              # monorepo root（npm workspaces）
├── tsconfig.json
├── .env.example
├── rdq/                      # RDQ 需求規格卡
│   └── RDQ-spec-loilonote-arch-20260729.md
├── docs/                     # 設計文件
│   └── architecture.md       # 架構設計文件
└── packages/
    ├── core/                 # @loilonote/core — API client & auth
    │   └── src/
    │       ├── index.ts
    │       ├── types.ts
    │       ├── config.ts
    │       ├── auth.ts
    │       └── client.ts
    ├── cli/                  # @loilonote/cli — 命令列介面
    │   └── src/
    │       ├── index.ts
    │       └── cli.ts
    └── mcp/                  # @loilonote/mcp — MCP Server
        └── src/
            ├── index.ts
            ├── entry.ts
            └── server.ts
```

## 同步層級（本專案初始化至第 3 層級）

| 層級 | 平台 | 位置 | 讀取時機 |
|------|------|------|---------|
| L1 | 本地 | `AGENTS.md`＋`handoff.md` | 每個 session |
| L2 | GitHub | samcct-bit/loilonote-cli（公開） | 指定時 |
| L3 | Obsidian | Loilonote cli/專案工作流程.md | 有需要時 |
| Obsidian Vault | 本地 | d:\antigravity\2026antigravity\SecondBrain\SecondBrain | — |

## 工作約定
- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文
- 修改前先確認計畫，優先保留原有資料結構
