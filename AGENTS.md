# Loilonote cli（專案藍圖）

> 本檔為跨 Agent 通用的專案藍圖（AGENTS.md 開放標準）。任何 Agent 的每個 session 都應先讀本檔＋`handoff.md`。

## 專案簡介
構思與生成連接 Loilonote 的 MCP 或 CLI 工具。

## 關鍵時程
暫無。

## 目標與路線圖
- [ ] 階段一：需求探索與技術調查
- [ ] 階段二：MCP/CLI 架構設計與實作

## 資料夾結構
（專案初始化時為空目錄，結構隨開發進度更新）

## 同步層級（本專案初始化至第 3 層級）

| 層級 | 平台 | 位置 | 讀取時機 |
|------|------|------|---------|
| L1 | 本地 | `AGENTS.md`＋`handoff.md` | 每個 session |
| L2 | GitHub | samcct-bit/loilonote-cli | 指定時 |
| L3 | Obsidian | Loilonote cli/專案工作流程.md | 有需要時 |
| Obsidian Vault | 本地 | d:\antigravity\2026antigravity\SecondBrain\SecondBrain | — |

## 工作約定
- 任何 Agent、任何電腦：**開工先讀 `handoff.md`，收工必更新 `handoff.md`**
- 修改共用檔案前先讀最新內容，避免覆蓋其他 Agent 的變更
- 所有回應與文件使用繁體中文
- 修改前先確認計畫，優先保留原有資料結構
