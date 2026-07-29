# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
互動式登入流程實作完成（支援瀏覽器自動開啟 + JS 片段貼上擷取 token）。媒體資源提取完成（pdf/picture 的 remote_id）。中文編碼為 PowerShell 限制，程式本身正確。

### CLI 命令（10 個）
```
login           互動式登入（打開瀏覽器 → 貼 JS → 自動擷取 token）
login --token   直接指定 token（自動驗證有效性）
course list     課程列表（依班級分組）
course get      課程詳情（教師+學生數+當前作業）
course students 學生名單
note list       筆記列表
note get        下載原始 ZIP
note inspect    解析結構（卡片類型/數量/gadget）
note text       提取純文字
note assets     提取媒體資源 remote_id
submissions     繳交作業列表
```

### MCP Tools（8 個）
course_list, note_list, note_info, note_inspect, note_text,
note_download, submission_list

## 🚦 目前狀態
功能完整。10 命令 + 8 tools，全 TypeScript 零錯誤。

## ➡️ 下一步
1. 實作 OAuth PKCE 全自動登入（從 Google OAuth 直接取得 token）
2. 處理 note note 的圖片/picture 內容提取（目前只取 remote_id）
3. 考慮使用 Playwright 實現無需手動操作的登入流程

## 🕐 最後更新
- 時間：2026-07-29 23:09
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：✅ 已推（samcct-bit/loilonote-cli）
