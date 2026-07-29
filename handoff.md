# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
CLI 三命令全線實測通過（course list / note list / submissions）。API client 已對齊真實 n.loilo.tv 端點。

### 已驗證端點（實測成功）
- `GET /api/courses/v3` → 課程列表（按班級分組）
- `GET /api/courses/:id/submissions/v2` → 繳交作業列表
- `GET /api/notes/v2?course_id=X` → 筆記列表（含縮圖）
- `GET /api/notes/:id` → 筆記內容（ZIP 二進位）
- `POST /api/apps/authenticate` → 驗證用（未實測）

## 🚦 目前狀態
Core/client 已可用。CLI 三個命令驗證通過。MCP server 待重構。

## ➡️ 下一步
1. 重構 MCP server 對齊新 API（course/note/submission tools）
2. 實作 ZIP 筆記內容解析（loilonote 內部格式）
3. 處理 note get 的圖片/卡片/多媒體內容提取

## ⚠️ 注意事項
- API base: `https://n.loilo.tv/api/`
- auth_token 放 URL query param，24h 有效
- 筆記內容為 ZIP 二進位檔（非 JSON）

## 🕐 最後更新
- 時間：2026-07-29 23:09
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：✅ 已推（samcct-bit/loilonote-cli）
