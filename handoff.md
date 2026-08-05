# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。

## ⏯️ 目前做到哪
目前已實作了自動攔截 `401 Unauthorized` 錯誤並透過 CDP 進行背景刷新 Token 的機制 (`refreshAuthToken`)。
目前已實作了自動攔截 `401 Unauthorized` 錯誤並透過 CDP 進行背景刷新 Token 的機制 (`refreshAuthToken`)。
緊接著我們實作了 MCP Resources 介面，註冊了 4 個 `loilonote://` 資源端點（課程、筆記清單、單篇筆記、作業箱），讓 AI 能夠直接將內容庫作為上下文讀取。
並且我們進一步實作了 MCP Prompts 介面，提供了 `loilonote_review_submission` 與 `loilonote_summarize_note` 兩個指令範本，能自動載入指定筆記並附加老師/助教的系統提示，實現一鍵自動批改與摘要。
最後，我們實作了「班級成員名單 API」，並加入了強制性的「去識別化（Anonymization）」機制。透過 Regex 擷取學生座號，統一將姓名替換為 `stuXX` 的代號（例如：stu01），保障個資安全，同時供 AI 與教師無縫對照。

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
1. 利用班級名單實作「批次批改作業」的自動化腳本或進階指令。
2. 視需要將 Token 傳遞方式從 Query String 改為 HTTP Authorization Header（需先驗證所有 API 端點支援）。
3. 考慮加入 e2e 測試腳本（模擬 MCP 協議）以保障未來重構安全性。

## ⚠️ 注意事項
- npm publish 在 workspace 內會 JSON 解析錯誤，需從暫存目錄發布
- `opencode mcp list` 可查看所有 MCP 狀態，無 restart 子命令，重載需重開 terminal 或改設定觸發

## 🕐 最後更新
- 時間：2026-07-31 10:04
- 更新者：Antigravity Agent (協作 OpenCode)
- Git push：已推 (v0.2.0 發布完成)
