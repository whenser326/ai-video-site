# 🧬 DNA_CORE.md — 每次對話必貼（溝通準則 + 防禦機制）

> 修程式 → 貼此檔 + DNA_TECH.md
> 談主站商業 → 貼此檔 + DNA_BIZ.md
> 談成人站 → 貼此檔 + DNA_ADULT.md

---

## 1. 溝通與開發準則（Absolute Rules）

新視窗收到 DNA_CORE.md 後，禁止總結內容，只需回覆「已讀取 DNA_CORE.md，遵守所有規則，請開始。」
禁止美化：不准修飾語氣、不准加客套話、不准過度包裝。
精確執行：嚴格遵守細節。
格式要求：所有解決方案必須以「代碼塊」呈現，支援一鍵複製。
用白話說明每個修改，把使用者當程式白癡。
若使用者有網站功能上的問題，須以高階顧問的角色反問以避免思考誤區。

### 緊急排查順序（出現任何錯誤必須先做）
1. 先讀錯誤訊息，找根本原因，禁止猜測
2. Turbopack FATAL error → 先執行 `type C:\Users\123\AppData\Local\Temp\next-panic-*.log` 讀 panic log
3. 確認根本原因後，只改一個檔案，改完確認，再改下一個
4. 禁止在沒確認根本原因前執行任何 git push 部署
5. 禁止用 PowerShell `>` 重導向寫入任何檔案，會產生 UTF-16 LE 編碼

### git 部署注意事項
- globals.css 不在 git 追蹤中，每次必須用 `git add -f app/globals.css` 強制加入
- 所有 commit 前先用 `git status` 確認哪些檔案有變更，再用 `git add` 加入
- 不確定時用 `git add -A` 加入所有變更，再 commit
- PowerShell 部署固定格式是四行（含 globals.css）：
```
git add -f app/globals.css
git add -A
git commit -m "說明"
git push
```

### 對話視窗管理原則
- 超過 30 個來回時，Claude 必須主動提醒「對話已達 XX 來回，建議考慮開新視窗」
- 貼入完整大型檔案（如整個 page.tsx）算 5 個來回
- 出現第一個錯誤時，Claude 必須提醒是否需要換視窗
- 換不換視窗由使用者自行決定，Claude 只負責提醒
- 新視窗開始時必須貼入 DNA_CORE.md + 相關 DNA 分檔 + 相關程式碼，否則 Claude 禁止開始開發

### DNA 更新防呆
每次新增規則前，必須先搜尋 DNA 是否有相關舊規則，有則直接修改舊規則，禁止新增重複或矛盾的條目。

---

## 2. 代碼維護防禦機制（Anti-Corruption Rules）

**禁止全檔案覆蓋**：除非符合以下任一條件，否則禁止回傳整個檔案：
- 使用者明確要求
- 修改範圍超過原檔案 50%（此情況應整個覆蓋，不強制拆錨點）

**錨點定位法**：修改時必須註明 `// [DNA_PATCH_START]` 與 `// [DNA_PATCH_END]`，僅回傳變更部分。
注意：`// [DNA_PATCH_START]` 標記只能放在 TypeScript 邏輯區，不能放在 JSX return 區塊內，否則會顯示在畫面上。

**禁止簡化**：嚴格禁止刪除任何 useEffect、localStorage、Polling 或點數同步邏輯。

**防呆檢查**：處理 history.map 前必須使用 `Array.isArray(history)` 進行強制檢查。

**貼上程式碼注意**：從聊天介面複製含有 `<a` 標籤的程式碼時，`<a` 可能會被吃掉，貼上後需手動確認。

每次開始開發前必須先確認現有 page.tsx 包含哪些已完成功能，禁止在沒確認的情況下直接覆蓋或修改，避免已完成功能被蓋掉。

---

## 3. 專案核心

專案名稱：Consistent Flow — AI Character Studio
框架：Next.js 14 (App Router), Turbopack, Tailwind CSS
主頁：app/page.tsx
付費方案頁：app/pricing/page.tsx
成人專區：app/adult/page.tsx（Coming Soon）
後端 API：app/api/character/route.ts
視覺配色：深綠 (#0d2318 → #2d5a3d)，亮綠 (#89f5a2)，圓角現代 UI
全域 Header 元件：app/components/GlobalHeader.tsx
Vercel 部署網址：https://ai-video-site-psi.vercel.app
GitHub：whenser326/ai-video-site

未被 git 追蹤的重要檔案（損壞無法還原）：
- `app/globals.css` → 損壞會導致全站樣式異常，加入指令：`git add -f app/globals.css`

---

## 4. 已知舊錯誤（每次對話不需理會，不需排查）

page.tsx 已知 TypeScript 舊錯誤（4個）：
- validator.ts: Property 'id' is missing in type Promise<{id:string;}>
- route.ts[Ln 170]: Unterminated string literal
- route.ts[Ln 171]: ')' expected
- route.ts[Ln 27]: 'id' is declared here
