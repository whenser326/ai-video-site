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

### 鉚接點規則（2026/05/03 新增）
- 每次給程式碼修改，必須提供完整可搜尋的鉚接點（找到 XXX 改成 XXX）
- 鉚接點必須包含足夠上下文讓使用者能唯一定位，禁止只說「找到這行」而不給完整內容
- 若修改範圍跨多行，鉚接點必須包含起始行和結束行的完整內容
- 每次修改必須明確說明是哪個檔案

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
- 新視窗開始時必須貼入 DNA_CORE.md + DNA_TECH.md + DNA_BIZ.md（三份全貼，缺一不可），否則 Claude 禁止開始開發
- 修改任何涉及 middleware.ts、auth route、防濫用機制、API 路由、資料庫、AI 模型的程式碼前，Claude 必須先確認已讀取 DNA_TECH.md，未讀取則拒絕動手並要求使用者補貼
- 修改 GlobalHeader.tsx 前，必須先確認已讀取 DNA_TECH.md 的「GlobalHeader 規範」章節
- 修改任何聊天相關檔案（/chat/[characterId]/page.tsx、/chat/group/page.tsx、/chat/default/[characterId]/page.tsx、/chat/default-group/page.tsx、/chat/gallery/[id]/page.tsx、/api/chat/route.ts）前，必須先確認已讀取 DNA_BIZ.md 的「AI 聊天功能規格」章節
- 修改 app/guide/page.tsx 或 app/pricing/page.tsx 的「為什麼我們不一樣」區塊前，必須先確認 app/data/whyDifferent.ts，兩個頁面共用同一份資料，只改 whyDifferent.ts 即可
- Onboarding Modal（page.tsx）不自動跳出，只由「使用指南」按鈕手動觸發（GlobalHeader 的 open-onboarding 事件）。付費用戶登入時自動寫入 localStorage 標記跳過。localStorage key 格式：`onboarding_done_${email}_${today}`，today 用 `toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })`，凌晨 12 點自動重置
- 修改 /api/chat/route.ts 的 charSystem prompt 前，必須先確認「角色旁白動作描述」格式規範（見 DNA_TECH.md「角色旁白動作描述」），禁止改變括號格式
- 新增聊天相關功能前，必須先確認 DNA_TECH.md「聊天記憶系統」章節，確保不破壞現有 sessionId localStorage 機制

### DNA 更新防呆
每次新增規則前，必須先搜尋 DNA 是否有相關舊規則，有則直接修改舊規則，禁止新增重複或矛盾的條目。
DNA 更新一律只給鉚接點（找到 XXX 改成 XXX），禁止整份輸出。

---

## 2. 代碼維護防禦機制（Anti-Corruption Rules）

**禁止全檔案覆蓋**：除非符合以下任一條件，否則禁止回傳整個檔案：
- 使用者明確要求
- 修改範圍超過原檔案 50%（此情況應整個覆蓋，不強制拆錨點）

**錨點定位法**：修改時必須註明 `// [DNA_PATCH_START]` 與 `// [DNA_PATCH_END]`，僅回傳變更部分。
注意：`// [DNA_PATCH_START]` 標記只能放在 TypeScript 邏輯區，不能放在 JSX return 區塊內，否則會顯示在畫面上。

**禁止簡化**：嚴格禁止刪除任何 useEffect、localStorage、Polling 或點數同步邏輯。

**防呆檢查**：處理 history.map 前必須使用 `Array.isArray(history)` 進行強制檢查。

**API 參數檢查**：每次新增呼叫 API 的程式碼前，必須先確認該 API 需要哪些必要參數（如 userEmail、plan 等），禁止在沒確認的情況下直接呼叫，避免因漏帶參數導致 API 回傳空值或錯誤。

**影響範圍確認**：每次給程式碼修改前，必須主動檢查：
1. 新功能呼叫哪些現有 API，確認參數有無衝突
2. 前後端資料流是否完整
3. 在回覆最後加上：「影響範圍確認：這個修改會影響到 XXX，需要同步注意 YYY」

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
靈感畫廊卡片背景：#111（黑色），不可用深綠，確保在深綠背景上有足夠層次對比
全域 Header 元件：app/components/GlobalHeader.tsx
Vercel 部署網址：https://ai-video-site-psi.vercel.app
GitHub：whenser326/ai-video-site

未被 git 追蹤的重要檔案（損壞無法還原）：
- `app/globals.css` → 損壞會導致全站樣式異常，加入指令：`git add -f app/globals.css`

---

## 4. 已知舊錯誤（每次對話不需理會，不需排查）

admin_settings POST 寫入曾靜默失敗，根本原因是 key 欄位缺少 UNIQUE constraint，已修正（2026/05/10）
page.tsx 已知 TypeScript 舊錯誤（4個）：
- validator.ts: Property 'id' is missing in type Promise<{id:string;}>
- route.ts[Ln 170]: Unterminated string literal
- route.ts[Ln 171]: ')' expected
- route.ts[Ln 27]: 'id' is declared here

---

## 5. UI/UX 架構（2026/05/03 重構完成）

### GlobalHeader.tsx 已完成功能
- 未登入：Logo + 定價方案按鈕 + Google 登入按鈕（含 InApp 瀏覽器偵測 Line/FB/IG）
- 已登入桌面版：Logo + 主導覽（🎨 創作 / 💬 我的角色）+ 點數徽章 + 按鈕列 + 登出
- 已登入手機版：Logo + 點數徽章 + 漢堡按鈕 → Drawer 展開
- pricing 頁面：顯示完整 Header（與其他頁面相同）
- 漢堡 Drawer menuItems 順序：📖 使用指南 / 🎨 角色生成 / 🌐 探索角色 / 🎭 我的角色 / 📅 每日簽到 / 💳 儲值點數 / 🎁 推薦賺點 / 💬 意見回饋 / 🚪 登出
- 「使用指南」onClick：所有頁面一律 router.push('/guide')，不再觸發 open-onboarding 事件（open-onboarding 只有首頁 page.tsx 有監聽，已廢棄此行為）
- FeedbackModal + unreadCount 60秒輪詢

### page.tsx 未登入 Landing Page
- `useSession()` 需解構 `status`：`const { data: session, status } = useSession()`
- early return 順序：`if (status === 'loading') return null;` → `if (!session) return (...)`
- Landing 字型：layout.tsx `<head>` 已載入 Google Fonts Noto Sans TC（300/400/500/700/900）
- Landing 最外層 fontFamily：`"'Noto Sans TC', sans-serif"`
- 大標題 fontWeight: 300（細體）

### page.tsx Onboarding 引導框
- 只對 `plan === 'free'` 的新用戶顯示（付費帳號直接寫入 localStorage 標記）
- 條件：`credits` 載入完才判斷（避免 race condition）
- localStorage key：`onboarding_done_${session.user.email}_${today}`，today 用 `toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })`，凌晨 12 點自動重置（每日重新顯示）
- 監聽 CustomEvent('open-onboarding') 重新觸發：`setShowOnboarding(true); setOnboardingDismissed(false)`
- 優惠框（PromoCard）等 `showOnboarding` 為 false 後才啟動 2.5 秒計時器

### middleware.ts
- IP 限制邏輯已完全移除（原本每 IP 每天最多 3 個帳號的限制會誤傷正常用戶）
- 現在只做 pass-through：`return NextResponse.next()`
- 防重複帳號改由 auth/[...nextauth]/route.ts 的 signIn callback 處理（Gmail normalize 檢查）

/chat/[characterId] 聊天頁：h-screen + overflow-hidden，底部輸入列有「離開聊天室」紅色按鈕，📎上傳圖片按鈕，打字延遲2-5秒，AI自拍立即觸發（無延遲），🎬轉成影片Modal，sessionId 存 localStorage 重開延續對話
/chat/group 群組聊天頁：免費用戶封鎖，入門/標準最多3角色，專業最多5角色，群組回覆隨機順序+逐一顯示間隔2-5秒，AI自拍立即觸發（無延遲，接力自拍間隔3-10秒），sessionId 存 localStorage 重開延續對話
/guide 使用指南頁：頂部「🌐 社群功能」可折疊區塊（探索角色/角色詳細頁/投稿角色）、四條主線可展開、點數對照表、「為什麼我們不一樣？」差異化區塊（10條，共用 app/data/whyDifferent.ts）、底部「開始創作」按鈕
Onboarding 四選項（2026/05/22 更新）：生成AI角色→/create、🌐探索角色→/explore、和AI角色聊天或製作說話影片→/characters、上傳自己的照片轉影片→/create?upload=1（自動開啟 Upload Modal）