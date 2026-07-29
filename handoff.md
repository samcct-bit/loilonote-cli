# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
API client 完整可用。CLI 支援 9 個命令，MCP server 8 個 tools。筆記 ZIP 解析完成（支援結構檢視與文字提取）。

### 已驗證命令（全線實測通過）
```
loilonote login --token <t>     loilonote course list
loilonote course get <id>       loilonote course students <id>
loilonote note list <cId>       loilonote note get <id>
loilonote note inspect <id>     loilonote note text <id>
loilonote submissions <id>      loilonote config
```

### MCP Tools（8 個）
```
course_list, note_list, note_info, note_inspect, note_text,
note_download, submission_list
```

## 🚦 目前狀態
Core/CLI/MCP 三套件全部可用，TypeScript 零錯誤。已實測連線。

## ➡️ 下一步
1. 解決 PowerShell/終端中文編碼顯示問題
2. 補完 note 的 pdf 類型解析（目前僅支援 title/picture）
3. 實作 OAuth PKCE 自動登入流程（取代手動複製 token）

## 🕐 最後更新
- 時間：2026-07-29 23:09
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：✅ 已推（samcct-bit/loilonote-cli）
