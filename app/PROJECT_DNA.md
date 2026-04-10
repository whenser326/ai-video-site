🧬 Project DNA: AI Character Studio (STRICT - DO NOT MODIFY)
1. 溝通與開發準則 (Absolute Rules)

禁止美化：不准修飾語氣、不准加客套話、不准過度包裝。
精確執行：嚴格遵守細節。
格式要求：所有解決方案必須以「代碼塊」呈現，支援一鍵複製。
用白話說明每個修改，把使用者當程式白癡。
若使用者有網站功能上的問題，須以高階顧問的腳色反問以避免思考誤區

2. 代碼維護防禦機制 (Anti-Corruption Rules)

禁止全檔案覆蓋：除非使用者要求，否則禁止回傳整個檔案。
錨點定位法：修改時必須註明 // [DNA_PATCH_START] 與 // [DNA_PATCH_END]，僅回傳變更部分。
注意：// [DNA_PATCH_START] 標記只能放在 TypeScript 邏輯區，不能放在 JSX return 區塊內，否則會顯示在畫面上。
禁止簡化：嚴格禁止刪除任何 useEffect、localStorage、Polling 或點數同步邏輯。
防呆檢查：處理 history.map 前必須使用 Array.isArray(history) 進行強制檢查。
貼上程式碼注意：從聊天介面複製含有 `<a` 標籤的程式碼時，`<a` 可能會被吃掉，貼上後需手動確認。

3. 專案核心

專案名稱：Consistent Flow — AI Character Studio
框架：Next.js 14 (App Router), Turbopack, Tailwind CSS
主頁：app/page.tsx
付費方案頁：app/pricing/page.tsx
成人專區：app/adult/page.tsx（Coming Soon）
後端 API：app/api/character/route.ts
視覺配色：深綠 (#0d2318 → #2d5a3d)，亮綠 (#89f5a2)，圓角現代 UI
全域 Header 元件：app/components/GlobalHeader.tsx（含儲值點數、推薦賺點、意見回饋按鈕）

4. 資料庫 (Supabase)

表格：profiles（欄位：id, created_at, email, credits, plan, daily_image_count, daily_image_date, history_limit, referral_code, referred_by, referral_credits_earned, locked_character）
表格：user_generations（欄位：id, user_email, image_url, video_url, prompt, status, created_at）
表格：saved_characters（欄位：id, user_email, name, image_url, created_at）
RLS：已停用
plan 預設值：free
新用戶自動建立 profiles 並給 5 點
Storage bucket：character-images（Public，已設定 allow all policy）
表格：admin_settings（欄位：key, value, updated_at）
表格：referral_logs（欄位：id, referrer_email, referred_email, plan, credits_awarded, created_at）

5. 定價方案
方案 | 點數 | 售價(NTD) | 圖片 | 影片 | 語音合成 | 角色收藏 | 歷史保存
🆓 免費 | 5點 | $0 | 1點 | ❌ | ❌ | 1個 | 7天/5筆
🌱 入門包 | 30點 | NT$250 | 1點 | 6點/支 | 8點/次 | 3個 | 30天/50筆
⭐ 標準包 | 80點 | NT$450 | 1點 | 5點/支 | 7點/次 | 3個 | 30天/50筆
🚀 專業包 | 200點 | NT$799 | 1點 | 4點/支 | 6點/次 | 無限 | 90天/50筆

6. AI 模型

圖片生成：black-forest-labs/flux-1.1-pro（約 $0.04/張）
影片生成：kwaivgi/kling-v3-omni-video（約 $0.28/支，mode: "standard"）
角色一致性（付費功能）：black-forest-labs/flux-kontext-pro（已串接）
影片生成第二選擇：bytedance/seedance-1.5-pro（Replicate，含音訊同步）
TTS 語音合成：ElevenLabs Multilingual v2（已串接，Starter 方案）
注意：Seedance 2.0 官方 API 尚未開放（截至 2026/4），等開放後再串接
嘴型同步：kwaivgi/kling-lip-sync（$0.014/秒輸出影片）

7. UI 互動邏輯

進度條：圖片 60 秒倒數，影片 120 秒倒數
影片超過 120 秒顯示「排隊中...」提示，繼續 polling 不中斷
Gallery 依方案等級顯示：免費5筆、付費方案50筆（同時受天數限制）
localStorage (key: last_prediction_${userEmail}) 保持最後一次生成狀態（依帳號分開）
localStorage (key: locked_character) 儲存鎖定角色的 Supabase 永久 URL
角色風格選擇：動漫/寫實/油畫/遊戲/素描，點選後自動拼入 prompt
免費用戶：每天最多生成 2 張圖片（超過顯示錯誤訊息，明天00:00台灣時間重置）
鎖定角色狀態列：輸入框上方顯示縮圖 + 鎖定中文字，解除鎖定後即時消失
付費用戶：
「🎯 鎖定此角色」→ 上傳圖片到 Supabase Storage → 儲存永久 URL → localStorage 同步
「🎬 轉成影片」→ 彈出比例/秒數/模型選項 Modal → 生成影片
「📁 上傳圖片轉影片」→ 法律聲明 → 上傳圖片 → 選比例/秒數 → 生成影片
「⭐ 收藏此角色」→ 輸入名稱 → 存入 saved_characters 表
「🎙️ 語音合成」→ 選聲音 → 輸入台詞 → 免費試聽 → 滿意後下載扣點（僅影片生成後顯示，付費專屬）
影片生成後顯示警告：「⚠️ 影片不會保存至歷史紀錄，請立即下載保存」
鎖定按鈕點擊後顯示「🔄 鎖定中...」提示，避免用戶誤以為當機
Flux Kontext Pro 失敗（E006）自動 retry 最多 2 次，顯示黃色提示訊息，全部失敗退還點數
成人專區入口：顯示在鎖定角色/上傳影片按鈕下方，點擊進入 /adult
推薦賺點橫幅：顯示在成人專區按鈕下方，點擊開啟推薦賺點 Modal
推薦賺點 Modal：顯示專屬介紹碼、一鍵複製介紹碼/連結、三方案獎勵對照（從 admin_settings 動態抓取）
分享按鈕：手機跳系統選單（Web Share API，支援 FB/IG/Threads/LINE 等），電腦版下載圖片+開 FB
靈感畫廊：優先顯示用戶歷史圖片（最多4張），不足補固定圖，合計8張
手機版 RWD：右上角點數/登出直排顯示，標題字體縮小，padding 優化

8. 金流

目前：Stripe 已確認不支援台灣商家收款，放棄使用
金流主力：改走綠界 ECPay（申請中，待審核通過後串接）
綠界審核需要：大門門牌照片、營業場所照片、產品展示截圖、身分證正反面
Checkout API：app/api/stripe/checkout/route.ts（待換成綠界）
Webhook：app/api/stripe/webhook/route.ts（付款成功自動加點數+更新plan+更新history_limit）
圖片上傳 API：app/api/upload-image/route.ts
退點 API：POST /api/character 帶 { refundCredits, userEmail } 即退點
Stripe Price IDs（沙盒）：
入門包：price_1TGH0OAhme0aGntHGmDHuxR8
標準包：price_1TGJ1KAhme0aGntHzNOHQHfF
專業包：price_1TGJ2KAhme0aGntH48ertjOZ

9. 防濫用機制

IP Rate Limiting：每分鐘最多 10 次請求（記憶體存儲）
免費用戶每日圖片限制：每天最多 2 張（daily_image_count + daily_image_date 欄位）
必須登入才能呼叫 API（無 session 回傳 401）
Replicate 預付點數制（用完自動停止，無超支風險）
歷史紀錄自動清理：每次查詢歷史時自動刪除超過保存期限的紀錄
鎖定角色圖片失效時自動退點並回傳錯誤訊息
TTS 字數上限：中文150字/英文300字，超過自動截斷

10. .env.local 必要欄位

REPLICATE_API_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_1TGH0OAhme0aGntHGmDHuxR8
STRIPE_PRICE_STANDARD=price_1TGJ1KAhme0aGntHzNOHQHfF
STRIPE_PRICE_PRO=price_1TGJ2KAhme0aGntH48ertjOZ
ELEVENLABS_API_KEY=

11. 已完成功能清單

✅ Google 登入
✅ 圖片生成（Flux 1.1 Pro）
✅ 影片生成（Kling 3.0，mode: "standard"，支援比例和秒數選擇）
✅ 點數扣除與顯示
✅ 新用戶自動給 5 點
✅ 歷史紀錄寫入與顯示（依方案：天數+筆數雙重限制，自動清理過期資料）
✅ 進度條倒數（影片塞車時顯示排隊提示）
✅ 付費方案頁面（/pricing）
✅ profiles 表加 plan/daily_image_count/daily_image_date/history_limit 欄位
✅ LOGO（pricing 頁與首頁均有漸隱效果）
✅ Stripe 金流串接（沙盒測試通過，待換綠界）
✅ 角色一致性功能（Flux Kontext Pro，付費用戶專屬）
✅ 鎖定角色圖片永久存到 Supabase Storage
✅ 上傳圖片轉影片（付費用戶專屬，含法律聲明視窗）
✅ 影片比例選擇（1:1, 16:9, 9:16, 4:3, 3:4）
✅ 影片秒數選擇（5秒/10秒）
✅ suppressHydrationWarning 修正
✅ 免費用戶每日圖片限制（每天最多2張）
✅ IP Rate Limiting 防濫用
✅ 全域 Header（儲值點數按鈕 + 推薦賺點按鈕 + 意見回饋按鈕）
✅ 角色風格選擇（動漫/寫實/油畫/遊戲/素描）
✅ 成人專區 Coming Soon 頁面（/adult）
✅ Kling 3.0 標示改為粉亮橘色
✅ .gitignore 安全確認（.env.local 不會上傳）
✅ 分潤機制（介紹碼自動產生、結帳時輸入介紹碼、付款後自動給介紹人點數）
✅ 分潤紀錄表（referral_logs）
✅ 後台 /admin（分潤點數設定、方案售價設定、分潤紀錄查看）
✅ 後台保護（只有 whenser@gmail.com 可進入）
✅ GlobalHeader 在 /admin 隱藏（ConditionalHeader 元件）
✅ Kling 3.0 + Seedance 1.5 Pro 雙模型選擇（影片 Modal 下拉切換）
✅ TypeScript CSS import 錯誤修復（custom.d.ts）
✅ 推薦賺點 Modal（介紹碼顯示、一鍵複製、三方案獎勵對照，動態抓取 admin_settings）
✅ GlobalHeader 加「推薦賺點」按鈕
✅ 主頁推薦賺點橫幅（位於成人專區按鈕下方）
✅ /api/referral/settings/route.ts（公開分潤點數查詢 API）
✅ /api/referral/settings-public/route.ts（公開方案價格查詢 API）
✅ /api/user/credits 補回傳 referral_code 欄位
✅ pricing 頁面價格改為台幣（NT$250/NT$450/NT$799）
✅ pricing 頁面價格連動後台 admin_settings（動態抓取，不再寫死）
✅ pricing 頁面功能描述更新（歷史紀錄天數+筆數、影片費用優惠）
✅ admin 後台幣別改為 NTD，Stripe 說明改為綠界
✅ 歷史紀錄依方案天數+筆數雙重限制（免費7天/5筆、付費方案50筆）
✅ 歷史紀錄自動清理超過期限的資料（每次查詢時觸發）
✅ pricing 頁面介紹碼自動讀取 URL ref 參數
✅ 介紹碼存入 localStorage（關頁面後仍記住，付款後自動清除）
✅ pricing 頁面介紹碼說明文字更新
✅ Vercel 部署上線（網址：https://ai-video-site-psi.vercel.app）
✅ GitHub 程式碼同步（whenser326/ai-video-site）
✅ Google OAuth 設定 Vercel 網址授權
✅ 鎖定角色改存 Supabase profiles.locked_character 欄位（綁定帳號，不跨帳號共用）
✅ 影片 Modal 加入動作指令輸入框
✅ /api/user/save-locked-character/route.ts 新增
✅ profiles 表新增 locked_character 欄位
✅ 免費用戶開放鎖定角色（每日限額內可用）
✅ 免費用戶開放上傳照片轉影片
✅ 解除角色鎖定按鈕
✅ 中文自動翻譯英文（輸入框偵測中文，旁邊出現翻譯按鈕，確認後採用）
✅ 鎖定角色提示文字（格式建議 + 英文建議）
✅ 影片依秒數正確扣點（Kling 5秒=4點/10秒=6點，Seedance 5秒=4點/10秒=8點）
✅ 點數不足時依生成類型顯示對應錯誤訊息（影片需至少4點）
✅ 免費用戶每日限制提示改為「明天00:00（台灣時間）重置」
✅ localStorage 依帳號分開存儲（key: last_prediction_${email}）
✅ 防止切換視窗時覆蓋當前圖片（useRef hasLoadedFromStorage）
✅ SessionProvider 加 refetchOnWindowFocus={false}
✅ 圖片生成後自動上傳 Supabase Storage 永久保存（await 確保順序正確）
✅ 影片 URL 寫入 user_generations.video_url 欄位
✅ vercel.json 設定 maxDuration 60秒
✅ Vercel Function Region 改為 Tokyo (hnd1)
✅ /api/user/clear-locked-character/route.ts 新增
✅ /api/translate/route.ts 新增（Google 免費翻譯 API）
✅ 鎖定角色狀態列（輸入框上方顯示縮圖+文字，鎖定/解除即時更新不需F5）
✅ 歷史作品區即時更新（生成完成後自動刷新，不需F5）
✅ 歷史作品區付費方案顯示50筆
✅ 歷史作品支援影片（🎬圖示顯示）
✅ Flux Kontext Pro E006 失敗自動 retry 最多2次 + 全部失敗退點
✅ 影片生成後顯示「不保存至歷史」警告（黃色醒目樣式）
✅ 鎖定按鈕點擊後顯示「🔄 鎖定中...」載入提示
✅ 退點 API（POST /api/character 帶 refundCredits 參數）
✅ 鎖定角色圖片失效時自動退點
✅ checkStatus 加入 genType 參數（解決影片/圖片 state race condition）
✅ 影片警告樣式加大加粗（黃色邊框+醒目字體）
✅ 影片 Modal 動作指令翻譯功能（偵測中文自動顯示翻譯按鈕）
✅ 上傳圖片轉影片提示詞翻譯功能
✅ 影片永久保存至 Supabase Storage（video_url 改為永久連結）
✅ handleSubmit checkStatus genType 修正（圖片生成正確傳 "image"）
✅ 影片警告訊息置中顯示修正
✅ 靈感畫廊 Tab 切換（靈感畫廊/我的歷史，預設顯示靈感畫廊）
✅ 靈感畫廊動態內容（優先顯示用戶歷史圖片最多4張，不足補固定圖合計8張）
✅ 影片生成超時提示文字優化
✅ 輸入框提示文字更新（說明支援中文+翻譯按鈕引導）
✅ 手機版 RWD 優化（右上角直排、標題縮小、padding 調整）
✅ 角色命名收藏功能（saved_characters 表、/api/saved-characters/route.ts、免費1個/入門標準3個/專業無限）
✅ 一鍵分享（手機 Web Share API 系統選單，電腦下載+開FB）
✅ TTS 語音合成（ElevenLabs Multilingual v2，付費專屬，免費試聽後下載扣點）
✅ TTS 10種聲音（5男5女，全部支援中文普通話/台灣腔）
✅ TTS 字數限制（中文150字/英文300字自動截斷）
✅ /api/tts/route.ts 新增
✅ admin_settings 新增 TTS 點數設定（tts_credits_starter/standard/pro）
✅ admin_settings 新增角色收藏上限設定（saved_characters_limit_starter/standard/pro）
✅ Wav2Lip 影片語音合成（kwaivgi/kling-lip-sync，TTS試聽滿意後合成到影片）
✅ 合成到影片獨立扣點（後台可調：wav2lip_credits_starter/standard/pro）
✅ 合成失敗自動退點
✅ 合成進度條（120秒倒數，超時顯示警告提示）
✅ TTS 試聽進度條（60秒倒數）
✅ 合成成功後顯示影片預覽 + 下載按鈕 + 關閉視窗按鈕
✅ 正面人臉警告提示（合成區塊明顯橘色警告）
✅ /api/wav2lip/route.ts 新增

12. 待完成項目（下一步）

⬜ 綠界金流串接（待審核通過）

13. 已知問題備忘

Kling 3.0 的 mode 必須用 "standard" 不能用 "std"
Supabase RLS 已停用，用 Service Role Key
history 變數在所有地方強制 Array.isArray 檢查
Stripe Webhook 本地測試用 stripe listen --forward-to localhost:3000/api/stripe/webhook
上線後 Webhook URL 要改成 Vercel 網址
Replicate 圖片 URL 有效期約 24 小時，鎖定角色時已改為上傳到 Supabase Storage 永久保存
Replicate 影片 URL 有效期約數小時，目前不永久保存影片，用戶需自行下載
// [DNA_PATCH_START] 標記不能放在 JSX return 區塊內，否則會顯示在畫面上
從聊天介面複製含 `<a` 標籤的程式碼時，`<a` 可能被吃掉，貼上後需手動確認
綠界申請需商家類別選「其他」→「其他」，販售網址填 Vercel 網址
admin_settings route.ts 需放在 app/api/admin/settings/route.ts（曾建立到錯誤位置）
PowerShell 不支援 rm -rf，改用 Remove-Item -Recurse -Force .next
後台驗證用 URL email 參數（GET）和 body.adminEmail（POST），非 getServerSession
settings-public route.ts 需放在 app/api/referral/settings-public/route.ts（與 settings 同層，曾建立到錯誤位置）
next.config.ts 的 eslint 設定會產生警告但不影響運作
app/character/page.tsx 原本誤放 API route 程式碼含明文 Token，已清空並由 GitHub 自動停用舊 Token
NEXTAUTH_URL 在 Vercel 環境變數需設為 https://ai-video-site-psi.vercel.app
鎖定角色使用 Flux Kontext Pro，Vercel Hobby 方案 timeout 限制，已設 maxDuration=60 + vercel.json
localStorage key 格式：last_prediction_${userEmail}，依帳號分開存儲
localStorage key：locked_character，存鎖定角色 Supabase Storage 永久 URL
圖片生成成功後自動上傳 Supabase Storage，await 確保寫入歷史前完成上傳
鎖定角色 prompt 前綴：${prompt}, same person from reference image
Flux Kontext Pro output_format 只支援 "jpg" 或 "png"，不支援 "webp"
Flux Kontext Pro E006 錯誤為模型內部不穩定，已加 retry 機制（最多2次）
退點邏輯：POST /api/character 帶 { refundCredits: number, userEmail: string } 即退點，不需另開 API
checkStatus 需傳入 currentGenType 參數避免 React state race condition，handleSubmit 傳 "image"，handleGenerateVideo 傳 "video"，polling retry 傳 currentGenType
ElevenLabs Starter 方案：60,000字/月（Multilingual v2），已訂閱
TTS Voice IDs：male-1(qwKjxMVO8wNg6qaKKH1k/專業), male-2(kbrsaic1zriFXx1pgRYN/溫暖), male-3(42bu2zNrjJXYzreZrTEu/成熟), male-4(agczkAUlHLowaNnL72Cc/旁白), male-5(z1etx2H6NQWq1LH6oqJA/深沉), female-1(0Aj540a9UWvQPWdx9Zq4/低沉), female-2(hkfHEbBvdQFNX4uWHqRF/甜美), female-3(r6qgCCGI7RWKXCagm158/清晰), female-4(9DMBSOAnMDPiFAsz1ZGK/活潑), female-5(GgmlugwQ4LYXBbEXENWm/溫柔)
TTS 試聽免費，下載才扣點（入門8點/標準7點/專業6點）
Wav2Lip 使用 kwaivgi/kling-lip-sync，需要影片包含清晰正面人臉，側臉或無臉會失敗退點
音訊上傳到 Supabase Storage（character-images bucket）後才傳給 Kling Lip Sync
ttsSeconds / wav2lipSeconds 各自獨立計時，useEffect 監聽對應 loading state

14. 未來功能規劃（優先順序）

短期：
⬜ 批次生成（付費用戶一次生成多張不同 pose）

中期：
⬜ 自訓角色模型（用戶上傳10-20張圖訓練專屬模型）

長期：
⬜ Live Portrait 動態呼吸效果（串接 LivePortrait API）
⬜ API 開放（讓第三方開發者串接）
⬜ 成人專區正式上線