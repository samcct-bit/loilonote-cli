# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。

## ⏯️ 目前做到哪
三套件 v0.1.3 已發布至 npm（@samcct-bit scope）。npm bin 驗證通過，`loilonote --help` / `loilonote-mcp` 全域可用。READMILF + .gitattributes 已補全。

## 🚦 目前狀態
可安裝使用。`npm install -g @samcct-bit/loilonote-cli` 即可。OpenCode MCP 已配置。

## ➡️ 下一步
1. 在另一台電腦從零測試 `npm install -g @samcct-bit/loilonote-cli`
2. 測試 Claude Code / ChatGPT MCP 整合
3. 擴充 Loilonote API（寫入操作：建立/修改筆記、發布作業）

## ⚠️ 注意事項
- npm publish 在 workspace 內會 JSON 解析錯誤，需從暫存目錄發布
- edit 工具會在 package.json version 欄位多插一個逗號，publish 前需檢查
- 全域安裝時 `loilonote --version` 顯示 root package.json 版本（0.1.0），子套件實際為 0.1.3
- Token 24h 過期，重登：`loilonote login`

## 🕐 最後更新
- 時間：2026-07-30 02:48
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：待推
