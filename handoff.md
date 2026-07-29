# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。

## ⏯️ 目前做到哪
Antigravity 修復全域安裝 Bug（bin 指向 + hashbang），CLI/MCP 已分離為兩個獨立指令。Repo 已同步。

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
全域安裝測試通過（`loilonote --help` 正常），可對外發布使用。

## ➡️ 下一步
1. 測試 `npm install -g github:samcct-bit/loilonote-cli` 從零安裝流程
2. 測試其他 AI Agent（Claude Code / ChatGPT）的 MCP 整合
3. 補完 CLI 的 `loilonote config` 命令（目前無獨立 config 管理）

## 🕐 最後更新
- 時間：2026-07-30 01:37
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：✅ 已推（samcct-bit/loilonote-cli，公開）
