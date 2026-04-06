🧬 Project DNA: AI Character Studio (STRICT - DO NOT MODIFY)
1. 溝通與開發準則 (Absolute Rules)

禁止美化：不准修飾語氣、不准加客套話、不准過度包裝。
精確執行：嚴格遵守細節。
格式要求：所有解決方案必須以「代碼塊」呈現，支援一鍵複製。
用白話說明每個修改，把使用者當程式白癡。

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

表格：profiles（欄位：id, created_at, email, credits, plan, daily_image_count, daily_image_date, history_limit, referral_code, referred_by, referral_credits_earned）
表格：user_generations（欄位：id, user_email, image_url, prompt, status, created_at）
RLS：已停用
plan 預設值：free
新用戶自動建立 profiles 並給 5 點
Storage bucket：character-images（Public，已設定 allow all policy）
表格：admin_settings（欄位：key, value, updated_at）
表格：referral_logs（欄位：id, referrer_email, referred_email, plan, credits_awarded, created_at）

5. 定價方案
方案 | 點數 | 售價(NTD) | 圖片 | 影片 | 歷史保存
🆓 免費 | 5點 | $0 | 1點 | ❌ | 7天/5筆
🌱 入門包 | 30點 | NT$250 | 1點 | 6點/支 | 30天/5筆
⭐ 標準包 | 80點 | NT$450 | 1點 | 5點/支 | 30天/10筆
🚀 專業包 | 200點 | NT$799 | 1點 | 4點/支 | 90天/30筆

6. AI 模型

圖片生成：black-forest-labs/flux-1.1-pro（約 $0.04/張）
影片生成：kwaivgi/kling-v3-omni-video（約 $0.28/支，mode: "standard"）
角色一致性（付費功能）：black-forest-labs/flux-kontext-pro（已串接）
影片生成第二選擇：bytedance/seedance-1.5-pro（Replicate，含音訊同步）
注意：Seedance 2.0 官方 API 尚未開放（截至 2026/4），等開放後再串接

7. UI 互動邏輯

進度條：圖片 30 秒倒數，影片 120 秒倒數
影片超過 120 秒顯示「排隊中...」提示，繼續 polling 不中斷
Gallery 依方案等級顯示：免費/入門5筆、標準10筆、專業30筆（同時受天數限制）
localStorage (key: last_prediction) 保持最後一次生成狀態
localStorage (key: locked_character) 儲存鎖定角色的 Supabase 永久 URL
角色風格選擇：動漫/寫實/油畫/遊戲/素描，點選後自動拼入 prompt
免費用戶：每天最多生成 2 張圖片（超過顯示錯誤訊息）
免費用戶：「角色一致性」和「上傳圖片轉影片」按鈕顯示鎖定，點擊導向 /pricing
付費用戶：
「🎯 鎖定此角色」→ 上傳圖片到 Supabase Storage → 儲存永久 URL
「🎬 轉成影片」→ 彈出比例/秒數選項 Modal → 生成影片
「📁 上傳圖片轉影片」→ 法律聲明 → 上傳圖片 → 選比例/秒數 → 生成影片
成人專區入口：顯示在鎖定角色/上傳影片按鈕下方，點擊進入 /adult
推薦賺點橫幅：顯示在成人專區按鈕下方，點擊開啟推薦賺點 Modal
推薦賺點 Modal：顯示專屬介紹碼、一鍵複製介紹碼/連結、三方案獎勵對照（從 admin_settings 動態抓取）

8. 金流

目前：Stripe 已確認不支援台灣商家收款，放棄使用
金流主力：改走綠界 ECPay（申請中，待審核通過後串接）
綠界審核需要：大門門牌照片、營業場所照片、產品展示截圖、身分證正反面
Checkout API：app/api/stripe/checkout/route.ts（待換成綠界）
Webhook：app/api/stripe/webhook/route.ts（付款成功自動加點數+更新plan+更新history_limit）
圖片上傳 API：app/api/upload-image/route.ts
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
✅ 歷史紀錄依方案天數+筆數雙重限制（免費7天/5筆、入門標準30天/5-10筆、專業90天/30筆）
✅ 歷史紀錄自動清理超過期限的資料（每次查詢時觸發）
✅ pricing 頁面介紹碼自動讀取 URL ref 參數
✅ 介紹碼存入 localStorage（關頁面後仍記住，付款後自動清除）
✅ pricing 頁面介紹碼說明文字更新

12. 待完成項目（下一步）

鎖定角色按鈕下方加提示文字
中文輸入自動翻譯成英文（或 UI 提示用英文）
鎖定角色跨帳號問題測試確認（需兩個帳號驗證）
Kling vs Seedance 使用情境說明加到 UI
綠界審核通過 → 串接綠界金流（取代 Stripe）
部署上線 Vercel
設定 Vercel 上的 Webhook URL
成人專區正式開放（待日後規劃）
Seedance 2.0 串接（待官方 API 開放）


13. 已知問題備忘

Kling 3.0 的 mode 必須用 "standard" 不能用 "std"
Supabase RLS 已停用，用 Service Role Key
history 變數在所有地方強制 Array.isArray 檢查
Stripe Webhook 本地測試用 stripe listen --forward-to localhost:3000/api/stripe/webhook
上線後 Webhook URL 要改成 Vercel 網址
Replicate 圖片 URL 有效期約 24 小時，鎖定角色時已改為上傳到 Supabase Storage 永久保存
// [DNA_PATCH_START] 標記不能放在 JSX return 區塊內，否則會顯示在畫面上
從聊天介面複製含 `<a` 標籤的程式碼時，`<a` 可能被吃掉，貼上後需手動確認
綠界申請需商家類別選「其他」→「其他」，販售網址填 Vercel 網址
admin_settings route.ts 需放在 app/api/admin/settings/route.ts（曾建立到錯誤位置）
PowerShell 不支援 rm -rf，改用 Remove-Item -Recurse -Force .next
後台驗證用 URL email 參數（GET）和 body.adminEmail（POST），非 getServerSession
settings-public route.ts 需放在 app/api/referral/settings-public/route.ts（與 settings 同層，曾建立到錯誤位置）