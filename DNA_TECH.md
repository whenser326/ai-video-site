# 🔧 DNA_TECH.md — 技術細節（修程式時與 DNA_CORE.md 一起貼）

---

## 資料庫（Supabase）

表格：profiles（欄位：id, created_at, email, credits, plan, daily_image_count, daily_image_date, daily_video_count, daily_video_date, history_limit, referral_code, referred_by, referral_credits_earned, locked_character, checkin_last_date, checkin_streak）
表格：user_generations（欄位：id, user_email, image_url, video_url, prompt, status, created_at, character_id）
表格：saved_characters（欄位：id, user_email, name, image_url, description, voice_id, created_at）
表格：admin_settings（欄位：key, value, updated_at）
表格：referral_logs（欄位：id, referrer_email, referred_email, plan, credits_awarded, created_at）
表格：model_tracker（欄位：id, model_id, model_name, status, note, created_at, updated_at）
表格：pending_orders（欄位：id, order_no, email, plan, referral_code, created_at）
表格：checkin_logs（欄位：id, email, ip, checkin_date, streak, credits_earned, created_at）
表格：feedback_messages（欄位：見 API）
表格：credit_adjustments（欄位：admin_email, user_email, amount, reason, created_at）
RLS：已停用，用 Service Role Key
plan 預設值：free
新用戶自動建立 profiles 並給 5 點
Storage bucket：character-images（Public，已設定 allow all policy）
表格：chat_messages（欄位：id, session_id, user_email, role, character_id, content, created_at）
表格：chat_sessions（欄位：id, user_email, character_ids, background_story, is_group, created_at, updated_at）
profiles 表新增欄位：chat_count（已使用對話次數，預設0）

---

## AI 模型

圖片生成：black-forest-labs/flux-1.1-pro（約 $0.04/張）
影片生成：kwaivgi/kling-v3-omni-video（約 $0.28/支，mode: "standard"）
角色一致性：black-forest-labs/flux-kontext-pro（已串接，免費付費均可用）
影片生成第二選擇：bytedance/seedance-2.0（Replicate，1080p，原生音訊，約 $1.26/支）
影片生成第三選擇（快速版）：bytedance/seedance-2.0-fast
TTS 語音合成：ElevenLabs Multilingual v2（已串接，Starter 方案，60,000字/月）
嘴型同步：kwaivgi/kling-lip-sync（$0.014/秒輸出影片）
說話影片（Avatar）：kwaivgi/kling-avatar-v2（Standard $0.056/秒・Pro $0.115/秒，圖片+音頻直接生成說話影片，不需先有影片）
說話影片（Avatar）：kwaivgi/kling-avatar-v2（Standard $0.056/秒・Pro $0.115/秒，圖片+音頻直接生成說話影片）

Seedance 2.0 費用對照：5秒約$1.26 USD，10秒約$2.00 USD（比 Kling 貴約4.5倍）
Kling 3.0 的 mode 必須用 "standard" 不能用 "std"
flux-kontext-pro 和 flux-1.1-pro 支援比例：1:1/16:9/9:16/4:3/3:4/3:2/2:3/4:5/5:4/21:9/9:21
Flux Kontext Pro output_format 只支援 "jpg" 或 "png"，不支援 "webp"
Flux Kontext Pro E006 錯誤為模型內部不穩定，已加 retry 機制（最多2次）

TTS Voice IDs：
- male-1: qwKjxMVO8wNg6qaKKH1k（專業）
- male-2: kbrsaic1zriFXx1pgRYN（溫暖）
- male-3: 42bu2zNrjJXYzreZrTEu（成熟）
- male-4: agczkAUlHLowaNnL72Cc（旁白）
- male-5: z1etx2H6NQWq1LH6oqJA（深沉）
- female-1: 0Aj540a9UWvQPWdx9Zq4（低沉）
- female-2: hkfHEbBvdQFNX4uWHqRF（甜美）
- female-3: r6qgCCGI7RWKXCagm158（清晰）
- female-4: 9DMBSOAnMDPiFAsz1ZGK（活潑）
- female-5: GgmlugwQ4LYXBbEXENWm（溫柔）

聊天模型：claude-haiku-4-5（透過 Anthropic API 直接呼叫）

---

## UI 互動邏輯防呆

進度條：圖片 60 秒倒數，影片 120 秒倒數
影片超過 120 秒顯示「排隊中...」提示，繼續 polling 不中斷
Gallery 依方案等級顯示：免費5筆、付費方案50筆（同時受天數限制）
localStorage (key: last_prediction_${userEmail}) 保持最後一次生成狀態（依帳號分開）
localStorage (key: locked_character) 儲存鎖定角色的 Supabase 永久 URL

**靈感畫廊防呆**：`galleryItems.map` 的 onClick 必須永遠包含：
1. `setPrompt`
2. `setTranslatedPrompt(null)`
3. `setUseTranslated(false)`
4. `setActiveStep(6)`
5. 捲動到 step6-section（`getElementById('step6-section').scrollIntoView({ behavior:'smooth', block:'center' })`，找不到才 fallback 用 `window.scrollTo({ top:0 })`）
缺一不可。靈感畫廊點擊無反應的 bug 已出現兩次，禁止移除捲動邏輯。

**TTS 試聽防呆**：ttsCache、ttsPreviewCount、TTS_MAX_PREVIEW 三個變數禁止移除，切換聲音的 onClick 必須先查 ttsCache 再決定是否呼叫 API。
- ttsPreviewCount 改為「每部影片各自計數」，新影片生成完成後歸零
- ttsCache 改為整個 session 共用，換影片不清除（用戶可重聽舊聲音）
- 超過次數點新聲音 → alert「本影片試聽次數已用完」
- 已 cache 的聲音永遠可重聽，不受次數限制

**TTS 字數三層防護**：
- 前端 maxLength 依影片秒數動態調整（5秒=30字/10秒=55字）
- 前端超過上限禁用試聽按鈕（紅字提示）
- 後端 /api/tts/route.ts 超過上限直接回 400，不呼叫 ElevenLabs
- fetch TTS 時必須帶入 videoDuration 參數

**主頁互動流程防呆**：
- generationMode state 控制四種模式（image/video/upload/text2video）
- prompt 組合順序：`[selectedStyle, selectedPersona || customPersona, selectedScene || customScene, selectedShot, prompt].filter(Boolean).join(", ")`
- Step 5 鏡頭選擇改為永遠顯示，圖片模式灰暗不可點，顯示「🔒 選影片模式才開放」
- selectedPersonality + selectedJob + customPersonality 只存入角色資料（description 欄位），不拼入 prompt
- 收藏角色時必須帶入 `description: [selectedPersonality, selectedJob, customPersonality].filter(Boolean).join("・")`
- Steps 2/3/4 自訂輸入框與標籤互斥：有選標籤則隱藏輸入框，有輸入則清空對應標籤
- 自訂輸入框偵測中文自動顯示翻譯按鈕，採用翻譯後取代原文

**鎖定角色防呆（2026/04/29）**：
- 鎖定角色按鈕 onClick 完成後，必須用 data.url 比對 savedCharacters，有符合者自動 setLockedCharacterId(matched.id)，無符合者 setLockedCharacterId(null)
- lockedCharacterId 決定批次生成和單張生成是否歸類到角色相簿
- 想讓批次生成歸類相簿，必須確保 lockedCharacterId 有值

**後台功能防呆**：
- 後台所有頁面標題禁止使用 `<h1>` 標籤，必須用 `<p>` 或 `<div>`，否則 globals.css 的 h1 樣式會導致標題變形
- GlobalHeader 的 `<div className="h-12" />` 佔位符不可移除，否則頁面內容會被 fixed header 蓋住
- state 宣告必須放在 return() 之前的邏輯區，不能插入 JSX 區塊內

**手機版注意**：
- 手機版自訂輸入框（Step 2-4）禁止用 `<input type="text">`，必須用 `<textarea rows={2} className="...resize-none leading-relaxed">`，否則手機版 placeholder 長文字會被截斷

---

## 後台 admin_settings key 清單

影片點數 key（共15個，後台沒設定時 route.ts 有 fallback 預設值）：
`kling_5s/10s_starter/standard/pro`、`seedance_5s/10s_starter/standard/pro`、`omni_extra_starter/standard/pro`、`kling_avatar_credits_starter/standard/pro`（Avatar 說話影片點數，預設 10/9/8）

---

## 自拍生成規範
- 使用 flux-kontext-pro，帶入 char.image_url 鎖定臉孔
- 走 /api/character，參數用 selfieCharacterImage（不是 lockedCharacter）
- triggerSelfie 用 msgId 定位，不用 index
- /api/character 參數職責：
  - lockedCharacter = 首頁用戶手動鎖定的角色
  - selfieCharacterImage = 聊天室自拍專用，優先權高於 lockedCharacter

## 自拍觸發流程
群組聊天：
1. 用戶說自拍關鍵字 → 觸發條件達成
2. 從所有角色隨機選一位，延遲 30秒~3分鐘後才發訊息
3. 查該角色前50筆歷史訊息，抽取穿著/背景/正在做的事
4. 找不到相關描述才由 AI 主動描述
5. 發訊息後立即產圖

單人聊天：
1. 用戶說自拍關鍵字 → 觸發條件達成
2. 延遲 3~10秒後發訊息
3. 同上第3-5步

注意：自拍延遲期間不觸發 chat API，是獨立流程

---

## globals.css 規範（血淚教訓）

globals.css 從未被 git 追蹤，需要用 `git add -f app/globals.css` 才能強制加入。
絕對不能用 PowerShell 的 `>` 重導向來寫 CSS 檔案，會產生 UTF-16 LE 編碼，Turbopack 讀不了。
正確做法：直接在 VSCode 手動編輯，存檔時確認右下角是 UTF-8。

globals.css 正確完整內容如下（缺一不可）：
```css
@import "tailwindcss";

html {
  font-family: var(--font-geist-sans), sans-serif;
}

h1 {
  font-weight: 1000;
  letter-spacing: 0.06em;
  -webkit-text-stroke: 1px white;
  font-size: 2rem;
  transform: scaleY(1.2) scaleX(1.1);
  display: inline-block;
}
```

---

## 字型規範（2026/04/19 血淚教訓）

- layout.tsx 字型必須用 next/font/google 的 Geist + Geist_Mono，禁止換成 geist 套件
- 禁止安裝 geist 套件，裝了會跟 next/font/google 衝突導致全站字型異常

---

## GlobalHeader 規範

- 未登入時 if (!session) 不能直接 return null，必須顯示登入按鈕，否則登出後無法重新登入
- 登入按鈕必須用 `signIn("google", {}, { prompt: "select_account" })`，不能用 `signIn("google")`
- 登出按鈕必須用 `signOut({ callbackUrl: "/" })`，不能用 `signOut()`
- 點數從 GlobalHeader 自己抓 API，不依賴 page.tsx 傳遞
- 漢堡選單 X 按鈕修正：hamburgerRef 排除點外部關閉衝突

---

## 防濫用機制

IP Rate Limiting：每分鐘最多 10 次請求（記憶體存儲）
免費用戶每日圖片限制：每天最多 2 張（daily_image_count + daily_image_date 欄位）
免費用戶每日影片限制：每天最多 1 支，有點數也不能超過，在點數檢查之前先攔截
必須登入才能呼叫 API（無 session 回傳 401）
Replicate 預付點數制（用完自動停止，無超支風險）
歷史紀錄自動清理：每次查詢歷史時自動刪除超過保存期限的紀錄
TTS 字數上限：中文150字/英文300字，超過自動截斷

Email 正規化防薅羊毛：
- app/api/auth/[...nextauth]/route.ts 的 signIn callback 加入 Gmail +. 漏洞防護
- 正規化邏輯：移除 + 後綴和所有點，比對是否已有相同正規化帳號
- 有重複則拒絕登入（return false）
- 注意：查重複時不能加 if (normalized !== user.email) 判斷，否則沒有 . 或 + 的 email 會直接跳過查重複，導致同一個 email 可重複註冊
- Supabase profiles 表已加 UNIQUE constraint on email（2026/05/03），資料庫層雙重防護
- 加 constraint 前需先清理重複資料：DELETE FROM profiles WHERE id IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) AS rn FROM profiles) t WHERE rn > 1)

IP 限流：
- middleware.ts 在根目錄（與 app、package.json 同層）
- 攔截 /api/auth/callback 路徑
- IP 帳號建立限制已移除（2026/05/03），middleware 現在只做 pass-through
- 防重複帳號改由 auth/[...nextauth]/route.ts 的 signIn callback 處理（Gmail normalize 檢查）

簽到防呆：同帳號每天只能簽一次（比對 checkin_last_date）、同 IP 每天只能一個帳號簽到（比對 checkin_logs）
簽到獎勵：每日+1點，連續第7天+3點，第14天+5點，第21天+5點，第30天+10點
簽到時區：台灣時區（Asia/Taipei），用 toLocaleDateString("en-CA") 取得 YYYY-MM-DD 格式

---

## 已知問題備忘

- Supabase RLS 已停用，用 Service Role Key
- history 變數在所有地方強制 Array.isArray 檢查
- Replicate 圖片 URL 有效期約 24 小時，鎖定角色時已改為上傳到 Supabase Storage 永久保存
- `// [DNA_PATCH_START]` 標記不能放在 JSX return 區塊內，否則會顯示在畫面上
- 從聊天介面複製含 `<a` 標籤的程式碼時，`<a` 可能被吃掉，貼上後需手動確認
- PowerShell 不支援 rm -rf，改用 `Remove-Item -Recurse -Force .next`
- next.config.ts 已加入 turbopack: {} 解決 next-pwa webpack 衝突導致 Vercel build 失敗問題
- Vercel build 失敗時先去 Vercel Deployments 看 Build Logs，不要猜測
- setTimeout 內的 fetch 必須用 session?.user?.email（optional chaining），不能用 session.user.email
- useEffect 禁止巢狀：不能在一個 useEffect 內部再寫另一個 useEffect，會觸發 React error #321
- checkStatus 需傳入 currentGenType 參數避免 React state race condition
- NEXTAUTH_URL 在 Vercel 環境變數需設為 https://ai-video-site-psi.vercel.app
- admin_settings route.ts 需放在 app/api/admin/settings/route.ts
- settings-public route.ts 需放在 app/api/referral/settings-public/route.ts
- 模型追蹤 route.ts 必須放在 app/api/admin/models/，不能放在 app/admin/models/
- authOptions 必須從 app/api/auth/[...nextauth]/route.ts export 才能給其他 API 使用
- Android 用 App 內建瀏覽器登入出現 disallowed_useragent 是 Google OAuth 限制，叫用戶改用 Chrome
- 主頁 page.tsx 的 `<main>` 必須保留 `bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]`，否則背景漸層消失
- 圖片比例 state 名稱：imageRatio，預設 "1:1"，透過 handleSubmit 傳入 character/route.ts
- Kling 影片比例受參考圖影響，根本解法是生圖時就選好目標比例，不做裁切
- 儲存成果按鈕改為 downloadFile（不用 window.open，iOS Safari 新分頁無法顯示 Supabase 圖片）
- Hero 影片不放在 public/ 資料夾（git 無法追蹤 mp4），改用 Supabase Storage CDN 托管
- Hero 影片 URL: https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/hero.mp4
- Hero 影片 `<video>` 標籤必須有 absolute inset-0，否則無法填滿容器
- Cloudflare Turnstile Site Key：0x4AAAAAC-_FUGtx2UlyaYF（公開無妨）
- Turnstile Sensitive 變數無法套用 Development 環境，只能 Production + Preview
- Flux Kontext Pro 失敗（E006）自動 retry 最多 2 次，顯示黃色提示訊息，全部失敗退還點數
- 批次生成429錯誤：偵測到 429/throttled/Too Many 顯示「生成請求太頻繁，請等待5秒後重試」，原因是 Replicate 帳戶餘額低於$10導致限流
浮動優惠卡片防呆（2026/05/01）：
- 顯示對象：未登入用戶 + plan === 'free' 的免費用戶，付費用戶不顯示
- 觸發時機：進首頁 2.5 秒後滑入（配合 Splash 動畫結束）
- useEffect dependency array 必須固定長度：用 [session === null ? 'loggedout' : plan, credits] 寫法，禁止直接放 [session, credits, plan]，否則 React 報「array changed size between renders」錯誤
- PromoTimer 子元件必須定義在 export default function Home() 之外（檔案上方）
- globals.css 需加入 @keyframes promoFlicker 和 @keyframes promoSlideUp，加完記得 git add -f app/globals.css
- 推薦 badge 用橘紅漸層：background: 'linear-gradient(90deg,#ff6b2b,#ff3d3d)'，白字
- 關閉後不再出現（當次 session，重新整理會再跑）
- 鎖定按鈕解除後殘留「🔄 鎖定中...」：刪除 `if (btn) btn.textContent = '🔄 鎖定中...'` 這行即可修復
- 藍新 MerchantOrderNo 長度上限 30 字元，禁止把 email 編碼塞入，改用 pending_orders 資料表暫存
- 藍新 notify 用 POST formData 傳送，不是 JSON，必須用 req.formData() 解析
- 藍新 AES 解密後需 `.replace(/\x00+$/, "").trim()` 去除 padding
- Code Splitting：VideoSettingsModal.tsx 的 videoModel/setVideoModel props 型別必須是 "kling" | "seedance"，不能用 string
- page.tsx dynamic import 只能寫一次，不能重複貼入
- SEO keywords meta tag 對 Google 無效（2009年起），真正有效的是 og:title/og:description
- 換域名後必須同步更新：NEXTAUTH_URL、Google OAuth 授權URI、藍新金流 Notify URL / Return URL
聊天頁面（/chat/[characterId]、/chat/group）必須用 h-screen + overflow-hidden，否則 Footer 會撐破畫面
wav2lip/route.ts 支援 mediaUrl 參數（圖片或影片皆可），向下相容舊的 videoUrl 參數
TtsModal 新增 mediaUrl prop，優先用 mediaUrl，沒有才用 prediction?.output
聊天室 triggerSelfie 呼叫 /api/generate-image 必須帶 userEmail 參數，否則 output 回傳空物件 {}
聊天室 triggerSelfie 的 selfieIntent 型別必須用 `r.selfieIntent === "photo" || r.selfieIntent === "video"` 做判斷，再 as "photo" | "video" 轉型，才能正確呼叫 triggerSelfie
/api/chat/route.ts 的自拍偵測改為關鍵字比對（detectSelfieIntent 為同步函式），不再呼叫 Claude API，避免 timeout
群組聊天多角色 Claude 呼叫改為 Promise.all 並行，大幅降低 timeout 風險
Vercel 已升級為 Pro 方案（$20 USD/月，timeout 60 秒）（2026/05/05）
ANTHROPIC_API_KEY 必須在 Vercel Environment Variables 設定，否則聊天 API 回傳「（無回應）」
GlobalHeader 「使用指南」改為直接跳 /guide，不再觸發 open-onboarding 事件（open-onboarding 只有首頁 page.tsx 有監聽）
群組聊天 plan 判斷必須等 API 回傳後才執行（planLoaded state），否則付費用戶會被短暫顯示封鎖畫面
聊天室停聊 60 秒後，隨機選一個角色主動發話（autoMessageTimerRef），用戶發話後重置 timer

---

## Splash 入場動畫（2026/04/24）

- 觸發條件：credits !== null 時立刻結束，最長等 2500ms 強制結束
- 背景色：#163d20
- LOGO 圖：public/logo-splash.png（400×400）
- state：pageReady / splashDone（禁止移除）
- 蓋板淡出：opacity transition 0.7s，onTransitionEnd 後 setSplashDone(true) 從 DOM 移除

---

## UI/UX 架構（2026/05/01 定案）

頁面結構：
- / 創作工作室（現有主頁優化）
- /characters 我的角色（新建）
- /chat/[characterId] 單人聊天（新建）
- /chat/group 群組聊天（新建）
- /guide 使用指南（新建）
- /pricing 定價（優化）

Header 結構（已登入）：
- 左：Logo
- 中：🎨創作 / 💬我的角色（兩個主導航）
- 右：點數 / 升級按鈕 / ☰收合選單
- 收合選單內容：每日簽到、推薦賺點、意見回饋、使用指南、登出

Header 結構（未登入）：
- 左：Logo
- 右：定價方案 / 使用Google登入

未登入首頁新增 Landing 區塊：
- Hero + 三亮點（生成角色/即時對話/說話影片）+ CTA

首次登入 Onboarding：
- 彈窗選三條主線（創作/聊天/快速產出）
- 選完帶到對應功能
- 可跳過

/characters 頁面：
- 收藏角色列表（卡片點擊展開B2選單）
- B2選單：生成/聊天/鎖定
- 群組聊天入口（選角色→開始）

/guide 使用指南：
- 三條主線流程圖
- 每步驟顯示點數成本
- 底部補充說明聊天計費規則

/chat/[characterId]：單人聊天頁（已建立）
/chat/group：群組聊天頁（已建立）
/guide：使用指南頁（已建立）

## .env.local 必要欄位

```
REPLICATE_API_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ELEVENLABS_API_KEY=sk_529a4...
NEWEBPAY_MERCHANT_ID=MS1...
NEWEBPAY_HASH_KEY=YW7pY...
NEWEBPAY_HASH_IV=PCf...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAC-_FUGtx2UlyaYF
TURNSTILE_SECRET_KEY=（已設定於 Vercel Sensitive）
```
ANTHROPIC_API_KEY=sk-ant-你的金鑰