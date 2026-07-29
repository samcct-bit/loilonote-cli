# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。

## ⏯️ 目前做到哪
npm scope 已從 @loilonote 更換為 @samcct-bit。Antigravity 修復了全域安裝 Bug 與 CLI/MCP 分離。

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
可發布使用。10 CLI 命令 + 8 MCP tools + CDP 自動登入，全 TypeScript 零錯誤。
已成功將 scope 改為 `@samcct-bit` 並發布至 npm registry。

## ➡️ 下一步
1. 測試其他 AI Agent（Claude Code / ChatGPT / Cursor 等）透過 `npx -y @samcct-bit/loilonote-mcp` 的掛載整合
2. 持續擴充新的 Loilonote API 或功能（如發布作業、修改筆記等）
3. 收集使用者回饋，進行後續改版

## 🕐 最後更新
- 時間：2026-07-30 01:37
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：✅ 已推（samcct-bit/loilonote-cli，公開）
