# 交接檔（handoff.md）

> 任何 Agent、任何電腦接手前**必讀**；收工時**必更新**。本檔只放交接必需的精簡資訊，詳細脈絡放 Obsidian（若有 L3）。

## ⏯️ 目前做到哪
Monorepo 專案骨架已建立（npm workspaces），三個 package（core/cli/mcp）編譯通過。MCP SDK v2 + zod v4 相容性已確認。

## 🚦 目前狀態
專案骨架就緒，TypeScript 編譯零錯誤。下一步需實際 Loilonote API 端點才能讓 client 真正運作。

## ➡️ 下一步
1. 用 Chrome DevTools 攔截 loilonote.app 的 HTTP 請求，取得真實 API endpoint 與 token 格式
2. 將逆向結果寫入 core 套件的 client.ts（替換 TODO 標記）
3. 實作 auth.ts 的 OAuth / Cookie 登入流程

## ⚠️ 注意事項
- RDQ 規格卡：`rdq/RDQ-spec-loilonote-arch-20260729.md`
- 架構設計文件：`docs/architecture.md`
- MCP SDK 使用 v2.0.0 + zod v4.4.3（非 v3）
- Loilonote JS bundle 被 CDN 防盜連保護（403），需瀏覽器手動攔截

## 🕐 最後更新
- 時間：2026-07-29 23:09
- 更新者：OpenCode @ LAPTOP-5SNCALUU
- Git push：✅ 已推（samcct-bit/loilonote-cli）
