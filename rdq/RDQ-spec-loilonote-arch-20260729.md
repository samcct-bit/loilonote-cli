---
rdq_version: 1
task: Loilonote MCP/CLI 架構設計文件
domain: dev
date: 2026-07-29
status: confirmed
telemetry:
  mode: lite
  rounds: 1
  questions: 4
  q4_adopted: 3
  revisions: 0
downstream: self
---

# RDQ 需求規格：Loilonote 技術調查與架構設計

## 一句話任務
調查 Loilonote API／認證機制／MCP 協定，產出一份架構設計文件，作為後續開發 CLI 與 MCP Server 的藍圖。

## ✅ 已確認
- 產出為**架構設計文件**（Ⅰ），不是直接寫程式（Ⅲ）
- 最終要發佈為開源套件（npm/pip），給其他開發者安裝使用（Ⅲ）
- 起點為**完全從零摸索** Loilonote，無已知 API 或文件（Ⅲ）
- 第一版就建立 config 檔結構與 README，寫清安裝、認證、設定步驟（Ⅳ）
- 先盤點有無現成資源：MCP 實作範例、Loilonote 第三方工具、日本 EdTech API 模式（Ⅳ）
- Auth token 一律走環境變數或 config 檔，不進 git repo，架構圖標明 token 流向（Ⅳ）

## ❓ 假設（未確認，已採預設值，隨時可推翻）
- Loilonote 使用標準 OAuth 2.0（Google/Apple/Microsoft）→ 預設採 OAuth 2.0 + PKCE
- CLI 為單人使用，無併發需求 → 預設單機本地執行
- 跨平台支援 Windows/macOS/Linux → 預設 Node.js 或 Python 實作
- 無特定死線 → 預設以品質優先
- 開發者自備 Loilonote 帳號，工具不代管帳號 → 預設本機認證流程
- Loilonote 資料存在雲端，工具端不做資料持久化 → 預設無本地資料庫
- API 若有付費方案可接受小額，但預設先以免費方案調查

## ➕ 已採納（象限Ⅳ）
- 第一版就做 config 檔 + README，寫清安裝／認證／設定
- 先盤點現成資源：MCP 範例、Loilonote 第三方、日本 EdTech 模式
- Auth token 一律走環境變數，不做進 repo

## ❌ 排除項（明確不做）
- 先出架構粗胚再細化（未勾選）——直接出完整架構設計文件
- 明確定義本次不做什麼（未勾選）——不在本文件中界定範圍邊界

## 📋 一段式需求規格
針對 **Loilonote** 平台進行技術調查，範圍包含三軸：Loilonote 的 **API 介面**（endpoint、資料格式、請求方式）、**認證機制**（OAuth 流程、token 管理、session 維持）、以及 **MCP 協定規格**（如何將上述封裝為標準 MCP Server）。起點為完全從零摸索，需先盤點有無現成資源（MCP 實作範例、Loilonote 第三方工具、日本 EdTech API 模式）。產出為一份**架構設計文件**，定義模組劃分、API 層、認證層、CLI 與 MCP Server 雙介面設計，最終要能發佈為開源套件給其他開發者安裝使用。文件中須包含 config 檔結構與 README 雛形，token 管理一律走環境變數，不進版本控制。

## ✔ 驗收條件
- [ ] 架構設計文件涵蓋 API 層、認證層、CLI 介面、MCP Server 四模組
- [ ] 明確標示 token 流向，auth 策略完整（OAuth、token 存放、過期處理）
- [ ] 文件包含 config 結構定義與 README 安裝步驟雛形
- [ ] 盤點現成資源章節，列出可參考的 MCP 實作、Loilonote 第三方、EdTech 模式
