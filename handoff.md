# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。

## ⏯️ 目前做到哪
Antigravity 已推送 v0.1.4（`feat(mcp): implement updateNote with batch upload & backup mechanism`），含新的 RDQ 規格卡 `RDQ-spec-modify-note-20260730.md`。本地已 pull 同步。
本階段實作了 `append-web`、`append-image` 及 `sub submit` 三項功能，並擴充至 CLI 及 MCP。處理了作業繳交時 `thumbnails is missing` 的問題（動態上傳 1x1 透明佔位圖），並修正了 npm workspaces 版本連結的相關問題。

### 套件名稱
- `@samcct-bit/loilonote-core`
- `@samcct-bit/loilonote-cli`
- `@samcct-bit/loilonote-mcp`

### 安裝後可用命令
```
loilonote login              # CLI 登入
loilonote course list        # CLI 課程列表
loilonote note list <id>     # CLI 筆記列表
loilonote note inspect <id>  # CLI 解析筆記
loilonote note text <id>     # CLI 提取文字
loilonote note append-web    # CLI 附加網頁卡片
loilonote note append-image  # CLI 附加圖片卡片
loilonote sub list           # CLI 作業箱列表
loilonote sub submit         # CLI 繳交作業
loilonote-mcp                # 啟動 MCP Server（給 AI Agent）
```

## 🚦 目前狀態
可安裝使用。`npm install -g @samcct-bit/loilonote-cli` 即可。OpenCode MCP 已配置。
13 CLI 命令 + 12 MCP tools（新增修改寫入功能及附加卡片、繳交作業功能） + CDP 自動登入。
安全機制：每次透過 MCP 寫入筆記前，都會自動在本地 `~/.loilonote/backups/` 產生完整 ZIP 備份。

## ➡️ 下一步
1. 收集使用者回饋，優化卡片新增 (append) 與覆寫 (replace) 的邏輯切換（例如自動排版）。
2. 在 `submitNote` 中，考慮實作從筆記內頁提取真實縮圖，取代目前的透明佔位圖。
3. 測試 Claude Code / ChatGPT MCP 整合。

## ⚠️ 注意事項
- npm publish 在 workspace 內會 JSON 解析錯誤，需從暫存目錄發布
- Token 24h 過期，重登：`loilonote login`
- `opencode mcp list` 可查看所有 MCP 狀態，無 restart 子命令，重載需重開 terminal 或改設定觸發

## 🕐 最後更新
- 時間：2026-07-31 00:45
- 更新者：Antigravity Agent (協作 OpenCode)
- Git push：✅ 已推（包含 append/submit 的變更）
