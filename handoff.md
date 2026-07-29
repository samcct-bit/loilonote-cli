# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。

## ⏯️ 目前做到哪
Repo 已公開（https://github.com/samcct-bit/loilonote-cli），MCP 自包含打包完成，README/MIT License 就緒。任何人可 `npm install -g github:samcct-bit/loilonote-cli` 一鍵安裝。

## 🚦 目前狀態
可發布使用。10 CLI 命令 + 8 MCP tools + CDP 自動登入，全 TypeScript 零錯誤。OpenCode 已可透過 MCP 直接操作 Loilonote。

## ➡️ 下一步
1. 在新機器上測試 `npm install -g github:samcct-bit/loilonote-cli` 安裝流程
2. 測試其他 AI Agent（Claude Code / ChatGPT）的 MCP 整合
3. （可選）發布到 npm registry：`npm publish --access public`

## ⚠️ 注意事項
- API base: `https://n.loilo.tv/api/`，auth_token 放 URL query param
- Token 效期 24 小時，無 refresh，過期需重登
- 筆記內容為 ZIP 二進位（非 JSON），內含 version/header/body
- MCP server 為 stdio transport，需 AI Host 啟動子行程
- CDP 登入需要 Chrome 瀏覽器

## 🕐 最後更新
- 時間：2026-07-30 01:37
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：✅ 已推（samcct-bit/loilonote-cli，公開）
