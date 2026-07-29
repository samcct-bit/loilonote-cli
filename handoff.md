# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
API 逆向驗證完成。已根據真實 API（n.loilo.tv）重寫 core/cli/mcp 全部套件，編譯零錯誤。

### 關鍵發現（與初始猜測不同）
- API base: `https://n.loilo.tv/api/`（非 loilonote.app）
- 認證: `auth_token` 放 URL query param（非 Bearer header）
- 資料模型: course → submission → note（非 notebook → card）
- Token 效期: 24 小時，無 refresh token

## 🚦 目前狀態
Monorepo 骨架 + API client 都就緒，TypeScript 零錯誤。等待測試實際 API 呼叫。

## ➡️ 下一步
1. 用實際 token 測試 CLI 命令（`loilonote note list <courseId>`）
2. 補完 course/note 的詳細內容型別
3. 實作 note 內容讀取（卡片／多媒體內容）

## ⚠️ 注意事項
- MCP SDK v2.0.0 + zod v4.4.3
- API 認證用 `POST /api/apps/authenticate`（app_id + auth_token）
- auth_token 從 Google OAuth callback URL 取得
- Token 過期需重新登入（無 refresh 機制）

## 🕐 最後更新
- 時間：2026-07-29 23:09
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：✅ 已推（samcct-bit/loilonote-cli）
