# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。

## ⏯️ 目前做到哪
Antigravity 已推送 v0.1.4（`feat(mcp): implement updateNote with batch upload & backup mechanism`），含新的 RDQ 規格卡 `RDQ-spec-modify-note-20260730.md`。本地已 pull 同步。

## 🚦 目前狀態
npm v0.1.4 已發布（含 updateNote 功能）。OpenCode MCP loilonote 連線正常。

## ➡️ 下一步
1. 測試 updateNote 新功能
2. 在另一台電腦從零測試全域安裝
3. 測試 Claude Code / ChatGPT MCP 整合

## ⚠️ 注意事項
- npm publish 在 workspace 內會 JSON 解析錯誤，需從暫存目錄發布
- Token 24h 過期，重登：`loilonote login`
- `opencode mcp list` 可查看所有 MCP 狀態，無 restart 子命令，重載需重開 terminal 或改設定觸發

## 🕐 最後更新
- 時間：2026-07-30 23:10
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：無變更，不需推
