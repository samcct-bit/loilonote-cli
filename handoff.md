# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。

## ⏯️ 目前做到哪
三套件 v0.1.3 已發布至 npm（@samcct-bit scope）。npm bin 驗證通過，`loilonote --help` / `loilonote-mcp` 全域可用。READMILF + .gitattributes 已補全。
已逆向工程找出 Loilonote 上傳 API (`POST /api/notes/upload`) 並實作了 `updateNote`、`backupNote` 與打包機制。
MCP Server 新增了 `loilonote_note_update` 覆寫寫入功能。

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
loilonote-mcp                # 啟動 MCP Server（給 AI Agent）
```

## 🚦 目前狀態
可安裝使用。`npm install -g @samcct-bit/loilonote-cli` 即可。OpenCode MCP 已配置。
10 CLI 命令 + 9 MCP tools（新增修改寫入功能） + CDP 自動登入。
安全機制：每次透過 MCP 寫入筆記前，都會自動在本地 `~/.loilonote/backups/` 產生完整 ZIP 備份。

## ➡️ 下一步
1. 在另一台電腦從零測試 `npm install -g @samcct-bit/loilonote-cli`
2. 測試 Claude Code / ChatGPT MCP 整合
3. 收集使用者回饋，優化卡片新增 (append) 與覆寫 (replace) 的邏輯切換。

## ⚠️ 注意事項
- npm publish 在 workspace 內會 JSON 解析錯誤，需從暫存目錄發布
- edit 工具會在 package.json version 欄位多插一個逗號，publish 前需檢查
- 全域安裝時 `loilonote --version` 顯示 root package.json 版本（0.1.0），子套件實際為 0.1.3
- Token 24h 過期，重登：`loilonote login`

## 🕐 最後更新
- 時間：2026-07-30 12:05
- 更新者：Antigravity Agent (協作 OpenCode)
- Git push：✅ 已推（samcct-bit/loilonote-cli，公開）
