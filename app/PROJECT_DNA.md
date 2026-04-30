🧬 Project DNA: AI Character Studio (STRICT - DO NOT MODIFY)

1. 溝通與開發準則 (Absolute Rules)

新視窗收到 PROJECT_DNA.md 後，禁止總結內容，只需回覆「已讀取 PROJECT_DNA.md，遵守所有規則，請開始。」
禁止美化：不准修飾語氣、不准加客套話、不准過度包裝。
精確執行：嚴格遵守細節。
格式要求：所有解決方案必須以「代碼塊」呈現，支援一鍵複製。
用白話說明每個修改，把使用者當程式白癡。
若使用者有網站功能上的問題，須以高階顧問的腳色反問以避免思考誤區

緊急排查順序（出現任何錯誤必須先做）：
1. 先讀錯誤訊息，找根本原因，禁止猜測
2. Turbopack FATAL error → 先執行 type C:\Users\123\AppData\Local\Temp\next-panic-*.log 讀 panic log
3. 確認根本原因後，只改一個檔案，改完確認，再改下一個
4. 禁止在沒確認根本原因前執行任何 git push 部署
5. 禁止用 PowerShell > 重導向寫入任何檔案，會產生 UTF-16 LE 編碼

git 部署注意事項：
- globals.css 不在 git 追蹤中，每次必須用 git add -f app/globals.css 強制加入
- 所有 commit 前先用 git status 確認哪些檔案有變更，再用 git add 加入
- 不確定時用 git add -A 加入所有變更，再 commit

對話視窗管理原則：
- 超過 30 個來回時，Claude 必須主動提醒「對話已達 XX 來回，建議考慮開新視窗」
- 貼入完整大型檔案（如整個 page.tsx）算 5 個來回
- 出現第一個錯誤時，Claude 必須提醒是否需要換視窗
- 換不換視窗由使用者自行決定，Claude 只負責提醒
- 新視窗開始時必須貼入 PROJECT_DNA.md + 相關程式碼，否則 Claude 禁止開始開發
DNA 更新防呆：每次新增規則前，必須先搜尋 DNA 是否有相關舊規則，有則直接修改舊規則，禁止新增重複或矛盾的條目。例如靈感畫廊防呆從四行改五行，必須修改第41行，不能另外新增一條。

2. 代碼維護防禦機制 (Anti-Corruption Rules)

禁止全檔案覆蓋：除非符合以下任一條件，否則禁止回傳整個檔案：
- 使用者明確要求
- 修改範圍超過原檔案 50%（此情況應整個覆蓋，不強制拆錨點）
錨點定位法：修改時必須註明 // [DNA_PATCH_START] 與 // [DNA_PATCH_END]，僅回傳變更部分。
注意：// [DNA_PATCH_START] 標記只能放在 TypeScript 邏輯區，不能放在 JSX return 區塊內，否則會顯示在畫面上。
禁止簡化：嚴格禁止刪除任何 useEffect、localStorage、Polling 或點數同步邏輯。
防呆檢查：處理 history.map 前必須使用 Array.isArray(history) 進行強制檢查。
貼上程式碼注意：從聊天介面複製含有 `<a` 標籤的程式碼時，`<a` 可能會被吃掉，貼上後需手動確認。
靈感畫廊防呆：`galleryItems.map` 的 onClick 必須永遠包含 `setPrompt`、`setTranslatedPrompt(null)`、`setUseTranslated(false)`、`setActiveStep(6)`、捲動到 step6-section 共五個動作，缺一不可。捲動方式：getElementById('step6-section').scrollIntoView({ behavior:'smooth', block:'center' })，找不到元素才 fallback 用 window.scrollTo({ top:0 })
TTS 試聽防呆：ttsCache、ttsPreviewCount、TTS_MAX_PREVIEW 三個變數禁止移除，切換聲音的 onClick 必須先查 ttsCache 再決定是否呼叫 API
TTS 字數三層防護：
- 前端 maxLength 依影片秒數動態調整（5秒=30字/10秒=55字）
- 前端超過上限禁用試聽按鈕（紅字提示）
- 後端 /api/tts/route.ts 超過上限直接回 400，不呼叫 ElevenLabs
- fetch TTS 時必須帶入 videoDuration 參數
TTS 試聽防呆更新：
- ttsPreviewCount 改為「每部影片各自計數」，新影片生成完成後歸零
- ttsCache 改為整個 session 共用，換影片不清除（用戶可重聽舊聲音）
- 超過次數點新聲音 → alert「本影片試聽次數已用完」
- 已 cache 的聲音永遠可重聽，不受次數限制
後台補點功能：
- app/admin/members/page.tsx 會員列表新增「補點」按鈕
- app/api/admin/adjust-credits/route.ts 新增補點 API
- credit_adjustments 資料表記錄補點紀錄（admin_email, user_email, amount, reason, created_at）
- 正數補點、負數扣點，最低不低於 0
主頁互動流程防呆：
- generationMode state 控制四種模式（image/video/upload/text2video）
- prompt 組合順序：[selectedStyle, selectedPersona, selectedScene, selectedShot, prompt].filter(Boolean).join(", ")
- Step 5 鏡頭選擇只在 generationMode !== "image" 時顯示
- selectedPersonality + selectedJob + customPersonality 只存入角色資料（description 欄位），不拼入 prompt
- 收藏角色時必須帶入 description: [selectedPersonality, selectedJob, customPersonality].filter(Boolean).join("・")
- Steps 2/3/4 自訂輸入框與標籤互斥：有選標籤則隱藏輸入框，有輸入則清空對應標籤
- 自訂輸入框偵測中文自動顯示翻譯按鈕，採用翻譯後取代原文
- prompt 組合順序：[selectedStyle, selectedPersona || customPersona, selectedScene || customScene, selectedShot, prompt].filter(Boolean).join(", ")
未被 git 追蹤的重要檔案清單（損壞無法還原，需特別保護）：
- app/globals.css → 內容見第 13 節備忘，損壞會導致全站樣式異常
- 加入 git 追蹤指令：git add -f app/globals.css
- 修改此類檔案前必須先備份內容到 PROJECT_DNA.md
後台批量刪帳號功能：
- app/admin/members/page.tsx 會員列表新增勾選框和批量刪除按鈕
- app/api/admin/delete-users/route.ts 新增刪帳號 API
- 勾選後出現紅色操作列，顯示已選數量和批量刪除按鈕
- 刪除範圍：profiles、user_generations、saved_characters、checkin_logs 四個表
- 管理員權限驗證：只有 whenser@gmail.com 才能執行
後台批量刪帳號補充說明：
- app/admin/members/page.tsx 勾選框改用 profiles.id 作為唯一識別（避免重複 email 錯位問題）
- MemberProfile interface 已加入 id: string 欄位
- app/api/admin/members/route.ts select 已加入 id 欄位回傳
- app/api/admin/delete-users/route.ts 目前仍用 email 刪除（同 email 全刪），[繼續觀察是否改用 id]
- next.config.ts 已加入 turbopack: {} 解決 next-pwa webpack 衝突導致 Vercel build 失敗問題
- Vercel build 失敗時先去 Vercel Deployments 看 Build Logs，不要猜測
- git show HEAD --name-only 可確認本次 commit 包含哪些檔案
- git log --all --full-history -- <檔案路徑> 可確認檔案是否在 git 歷史中
Email 正規化防薅羊毛：
- app/api/auth/[...nextauth]/route.ts 的 signIn callback 加入 Gmail +. 漏洞防護
- 正規化邏輯：移除 + 後綴和所有點，比對是否已有相同正規化帳號
- 有重複則拒絕登入（return false）

IP 限流：
- middleware.ts 在根目錄（與 app、package.json 同層）
- 攔截 /api/auth/callback 路徑
- 同一 IP 24小時內最多建立 3 個帳號

每次開始開發前必須先確認現有 page.tsx 包含哪些已完成功能，禁止在沒確認的情況下直接覆蓋或修改，避免已完成功能被蓋掉
簽到防呆：同帳號每天只能簽一次（比對 checkin_last_date）、同 IP 每天只能一個帳號簽到（比對 checkin_logs）
簽到獎勵：每日+1點，連續第7天+3點，第14天+5點，第21天+5點，第30天+10點
簽到時區：台灣時區（Asia/Taipei），用 toLocaleDateString("en-CA") 取得 YYYY-MM-DD 格式
page.tsx 已知 TypeScript 舊錯誤（4個，不理會）：
- validator.ts: Property 'id' is missing in type Promise<{id:string;}>
- route.ts[Ln 170]: Unterminated string literal
- route.ts[Ln 171]: ')' expected
- route.ts[Ln 27]: 'id' is declared here
以上四個是舊錯誤，每次對話不需理會，不需排查
鎖定角色防呆（2026/04/29）：
- 鎖定角色按鈕 onClick 完成後，必須用 data.url 比對 savedCharacters，有符合者自動 setLockedCharacterId(matched.id)，無符合者 setLockedCharacterId(null)
- lockedCharacterId 決定批次生成和單張生成是否歸類到角色相簿
- 從歷史/結果區按鎖定角色，系統不會自動知道屬於哪個收藏角色，需靠比對 savedCharacters 來自動帶入
- 想讓批次生成歸類相簿，必須確保 lockedCharacterId 有值（從收藏列表鎖定，或比對成功）

3. 專案核心

專案名稱：Consistent Flow — AI Character Studio
框架：Next.js 14 (App Router), Turbopack, Tailwind CSS
主頁：app/page.tsx
付費方案頁：app/pricing/page.tsx
成人專區：app/adult/page.tsx（Coming Soon）
後端 API：app/api/character/route.ts
視覺配色：深綠 (#0d2318 → #2d5a3d)，亮綠 (#89f5a2)，圓角現代 UI
全域 Header 元件：app/components/GlobalHeader.tsx（LOGO左側、點數徽章、漢堡選單含我的角色/儲值點數/推薦賺點/意見回饋/登出）
Header RWD：手機版漢堡選單展開 Drawer，電腦版（sm以上）直接橫排顯示，點數徽章永遠可見
成人站規劃：獨立網域、獨立服務、獨立金流，通過身份驗證後才能購買成人點數及移轉主站資料

4. 資料庫 (Supabase)

表格：profiles（欄位：id, created_at, email, credits, plan, daily_image_count, daily_image_date, daily_video_count, daily_video_date, history_limit, referral_code, referred_by, referral_credits_earned, locked_character）
表格：user_generations（欄位：id, user_email, image_url, video_url, prompt, status, created_at, character_id）
表格：saved_characters（欄位：id, user_email, name, image_url, description, created_at）
RLS：已停用
plan 預設值：free
新用戶自動建立 profiles 並給 5 點
Storage bucket：character-images（Public，已設定 allow all policy）
表格：admin_settings（欄位：key, value, updated_at）
表格：referral_logs（欄位：id, referrer_email, referred_email, plan, credits_awarded, created_at）
表格：model_tracker（欄位：id, model_id, model_name, status, note, created_at, updated_at）
表格：pending_orders（欄位：id, order_no, email, plan, referral_code, created_at）
表格：checkin_logs（欄位：id, email, ip, checkin_date, streak, credits_earned, created_at）
profiles 新增欄位：checkin_last_date（date）、checkin_streak（int4, default 0）

5. 定價方案

方案 | 點數 | 售價 | 圖片 | 影片 | 角色一致性 | 批次生成 | 語音合成 | Wav2Lip | 每日圖片 | 歷史紀錄
🆓 免費 | 5點 | $0 | 1點 | 4-6點/支(僅Kling) | ✅ | ❌ | ❌ | ❌ | 2張/天,1影片/天 | 5筆
🌱 入門包 | 30點 | $250 NTD | 1點 | 6點/支 | ✅ | 2張 | 8點/次 | 10點/次 | 無限 | 30天/5筆
⭐ 標準包 | 80點 | $450 NTD | 1點 | 5點/支 | ✅ | 4張 | 7點/次 | 9點/次 | 無限 | 30天/10筆
🚀 專業包 | 200點 | $799 NTD | 1點 | 4點/支 | ✅ | 6張 | 6點/次 | 8點/次 | 無限 | 90天/30筆

6. AI 模型

圖片生成：black-forest-labs/flux-1.1-pro（約 $0.04/張）
影片生成：kwaivgi/kling-v3-omni-video（約 $0.28/支，mode: "standard"）
角色一致性：black-forest-labs/flux-kontext-pro（已串接，免費付費均可用）
影片生成第二選擇：bytedance/seedance-2.0（Replicate，1080p，原生音訊，約 $1.26/支）
影片生成第三選擇（快速版）：bytedance/seedance-2.0-fast（Replicate，較便宜）
TTS 語音合成：ElevenLabs Multilingual v2（已串接，Starter 方案）
Seedance 2.0 費用對照：5秒約$1.26 USD，10秒約$2.00 USD（比 Kling 貴約4.5倍）
嘴型同步：kwaivgi/kling-lip-sync（$0.014/秒輸出影片）

7. UI 互動邏輯

進度條：圖片 60 秒倒數，影片 120 秒倒數
影片超過 120 秒顯示「排隊中...」提示，繼續 polling 不中斷
Gallery 依方案等級顯示：免費5筆、付費方案50筆（同時受天數限制）
localStorage (key: last_prediction_${userEmail}) 保持最後一次生成狀態（依帳號分開）
localStorage (key: locked_character) 儲存鎖定角色的 Supabase 永久 URL
免費用戶：每天最多生成 2 張圖片 + 1 支影片（分別有獨立計數，明天00:00台灣時間重置）
鎖定角色狀態列：Steps 上方顯示縮圖 + 鎖定中文字，解除鎖定後即時消失
批次生成：付費用戶專屬，必須鎖定角色，依方案限制張數，每張獨立 prompt + 備註，依序生成即時顯示，失敗自動 retry 最多2次，全部失敗退點，完成後自動儲存到角色相簿
付費用戶結果區操作（一排三顆按鈕）：
「🎯 鎖定角色」→ 上傳圖片到 Supabase Storage → 儲存永久 URL → localStorage 同步
上傳照片生影片時自動鎖定：生成影片按鈕觸發時自動執行鎖定流程，無需用戶手動按鎖定按鈕
「⭐ 收藏角色」→ 輸入名稱 → 存入 saved_characters 表（含 description 個性職業）
「🎭 批次生成」→ 必須已鎖定角色，付費專屬，點擊開啟 Modal
第二排按鈕：解除鎖定（有鎖定才顯示）+ 上傳照片轉影片
「🎬 轉成影片」→ 彈出比例/秒數/模型選項 Modal → 生成影片
「🎙️ 語音合成」→ 選聲音 → 輸入台詞 → 免費試聽 → 滿意後下載扣點（僅影片生成後顯示，付費專屬）
影片生成後顯示警告：「⚠️ 影片保存僅3天(付費7天)，請立即下載保存」
鎖定按鈕點擊後顯示「🔄 鎖定中...」提示，避免用戶誤以為當機
Flux Kontext Pro 失敗（E006）自動 retry 最多 2 次，顯示黃色提示訊息，全部失敗退還點數
推薦賺點橫幅：顯示在結果區操作按鈕下方，點擊開啟推薦賺點 Modal
推薦賺點 Modal：顯示專屬介紹碼、一鍵複製介紹碼/連結、三方案獎勵對照（從 admin_settings 動態抓取）
分享按鈕：手機跳系統選單（Web Share API，支援 FB/IG/Threads/LINE 等），電腦版下載圖片+開 FB
靈感畫廊：優先顯示用戶歷史圖片（最多4張），不足補固定圖，合計8張
語音合成（角色配音）規則：
- 免費用戶：不開放（按鈕不顯示）
- 付費用戶：每部影片各自免費試聽 3 次，已試聽的聲音暫存於 ttsCache（session 共用），重複播放不消耗次數，換新影片只歸零計數不清 cache
- TTS 字數上限依影片秒數動態調整：5秒影片30字，10秒影片55字
- 下載語音才扣點：入門 8點、標準 7點、專業 6點
- 合成到影片（Wav2Lip）才扣點：入門 10點、標準 9點、專業 8點
- 對用戶顯示合計：入門 18點/次、標準 16點/次、專業 14點/次
- ttsCache 結構：Record<voiceId, base64音檔>，切換聲音時先查暫存
主頁互動流程（已完成）：
Hero 影片區：頁面最頂端，16:9 佔位符，影片就緒後換 /hero.mp4（1200×675px，無聲循環）
Step 1：模式選擇（生成角色圖片 / 圖片轉影片 / 上傳照片轉影片 / 文字生成影片 Coming Soon）
Step 2：角色人設（風格選擇 + 人設第一層標籤，手風琴展開）
Step 3：個性職業（個性7個 + 職業10個標籤，存入角色資料不拼入 prompt，手風琴展開）
Step 4：選場景（8個場景標籤，拼入 prompt，手風琴展開）
Step 5：鏡頭角度（5個鏡頭標籤，影片模式限定才顯示，手風琴展開）
Step 6：補充細節（自由輸入框，選填，顯示已選標籤摘要，支援中翻英）
設計原則：標籤最多4-5個同時生效，圖片轉影片模式隱藏角色標籤層，已選標籤折疊後顯示縮略在標頭
GlobalHeader RWD 設計：
- LOGO 左側（/logo.png），點數徽章永遠顯示在右側
- 手機版：漢堡選單（三條線），點擊展開 Drawer 收納所有功能按鈕
- 電腦版（sm以上）：功能按鈕直接橫排顯示，不需漢堡
- 漢堡動畫：展開時三條線變 X，關閉時還原
- 點外部自動關閉 Drawer（useRef + mousedown 事件）
- 點數從 GlobalHeader 自己抓 API，不依賴 page.tsx 傳遞
影片模型選擇卡片式 UI：Kling 3.0（推薦，綠色）vs Seedance 2.0（高畫質溢價，橘色），兩個 Modal 均已更新（轉影片 Modal + 上傳圖片 Modal）
Seedance 2.0 點數定價（越高方案越便宜）：入門 5秒/17點・10秒/27點，標準 5秒/15點・10秒/25點，專業 5秒/13點・10秒/21點
Seedance 2.0 + Omni-Reference 點數定價（額外加費，API成本不變純利）：入門 5秒/23點・10秒/33點，標準 5秒/20點・10秒/30點，專業 5秒/17點・10秒/25點
Omni-Reference 定價邏輯：入門+6點、標準+5點、專業+4點（固定加費，不管上傳幾張參考圖）
Toast 通知：鎖定角色/上傳照片生影片改用底部固定 Toast 取代 alert，state 為 showToast/toastMessage，z-index 9999，顯示 8 秒自動消失，含 ✕ 關閉按鈕，上傳照片生影片時自動鎖定角色並顯示 Toast「✅ 已自動鎖定此角色，後續生成將套用同一張臉」，影片結果區有鎖定時顯示「🔓 解除鎖定角色」按鈕
免費用戶影片限制：每天最多1支，只能用 Kling，Seedance 按鈕用 {plan !== 'free' && (...)} 隱藏
批次生成429錯誤：偵測到 429/throttled/Too Many 顯示「生成請求太頻繁，請等待5秒後重試」，原因是網站主 Replicate 帳戶餘額低於$10導致限流，非程式bug

8. 金流

目前：Stripe 已確認不支援台灣商家收款，放棄使用
目前：綠界 ECPay 申請未通過，放棄使用
金流主力：藍新金流（NewebPay）（審核已通過，商店代號：MS1827821756，可開始串接）
藍新商店代號：MS1827821756
藍新 HashKey/HashIV：已寫入 .env.local（變數名稱：NEWEBPAY_MERCHANT_ID / NEWEBPAY_HASH_KEY / NEWEBPAY_HASH_IV）
Checkout API：app/api/newebpay/checkout/route.ts（藍新，已完成）
Notify API：app/api/newebpay/notify/route.ts（付款成功自動加點數+更新plan+更新history_limit+分潤）
Return API：app/api/newebpay/return/route.ts（付款完成跳轉回/pricing?success=1）
圖片上傳 API：app/api/upload-image/route.ts
退點 API：POST /api/character 帶 { refundCredits, userEmail } 即退點
成人站金流規劃：
- 架構前提：網站架設於海外伺服器、公司登記於海外（愛沙尼亞或賽普勒斯）、金流走海外帳戶，不受台灣法律管轄
- 提領路線：NOWPayments → USDT → 幣安/MAX → 換台幣出金，或透過 Payoneer 收款後轉台灣帳戶
- 絕對不能用：Stripe、PayPal（Mastercard/Visa 網路明確禁止成人內容）
- 主力（立即可用）：NOWPayments（加密貨幣，0.5% 手續費，300+幣種，明確支援成人平台，無 Chargeback 風險，台灣主體即可申請）
- 補充：SubscribeStar（個人可申請，信用卡訂閱制，約10%手續費）
- 補充：NexaPay（免申請，信用卡付款收穩定幣，1-3%手續費）
- 中期目標：成立愛沙尼亞 e-Residency 公司（線上申請，數天完成，0%保留利潤企業稅），開通後申請 Segpay 或 Verotel 信用卡金流
- 長期備用：CCBill（業界最穩定，需美國或歐洲公司主體）
- Chargeback 控制：加密貨幣無 Chargeback，信用卡金流需控制在 0.75% 以下，超標即凍結帳戶，資金扣留 90-180 天
- 多語系策略：網站以英文+德文+日文為主介面，吸引歐美日市場，有助於歐洲金流申請審核通過率
- 成人站點數與主站點數完全分離，無移轉機制
- 主站資料（角色/圖片）可移轉至成人站，不涉及金流
廣告投放管道：
- 成人站：Meta 廣告完全禁止，只能走成人廣告網路：TrafficJunky（OurDream 在用）/ ExoClick / TrafficStars
- 成人廣告網路不需要粉絲專頁，直接投放網址即可

9. 防濫用機制

IP Rate Limiting：每分鐘最多 10 次請求（記憶體存儲）
免費用戶每日圖片限制：每天最多 2 張（daily_image_count + daily_image_date 欄位）
免費用戶每日影片限制：每天最多 1 支（daily_video_count + daily_video_date 欄位），有點數也不能超過
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
STRIPE_PRICE_STARTER=price_1TGH0...
STRIPE_PRICE_STANDARD=price_1TGJ1...
STRIPE_PRICE_PRO=price_1TGJ2...
ELEVENLABS_API_KEY=sk_529a4...
NEWEBPAY_MERCHANT_ID=MS1...
NEWEBPAY_HASH_KEY=YW7pY...
NEWEBPAY_HASH_IV=PCf...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAC-_FUGtx2UlyaYF（已設定於 Vercel，備用）
TURNSTILE_SECRET_KEY=（已設定於 Vercel Sensitive，備用，需要時去 Cloudflare Turnstile 查看）

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
✅ Stripe 金流串接（沙盒測試通過，待換藍新）
✅ 角色一致性功能（Flux Kontext Pro，免費付費均可用）
✅ 鎖定角色圖片永久存到 Supabase Storage
✅ 上傳圖片轉影片（付費用戶專屬，含法律聲明視窗）
✅ 影片比例選擇（1:1, 16:9, 9:16, 4:3, 3:4）
✅ 影片秒數選擇（5秒/10秒）
✅ 推薦賺點系統（referral_code、referral_logs 表、介紹碼獎勵）
✅ 推薦賺點 Modal（專屬介紹碼+連結一鍵複製，獎勵從後台動態抓取）
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
✅ Vercel 部署上線（網址：https://ai-video-site-psi.vercel.app）
✅ GitHub 程式碼同步（whenser326/ai-video-site）
✅ Google OAuth 設定 Vercel 網址授權
✅ 鎖定角色改存 Supabase profiles.locked_character 欄位（綁定帳號，不跨帳號共用）
✅ 影片 Modal 加入動作指令輸入框
✅ /api/user/save-locked-character/route.ts 新增
✅ profiles 表新增 locked_character 欄位
✅ profiles 表新增 daily_video_count + daily_video_date 欄位
✅ 免費用戶開放鎖定角色（每日限額內可用）
✅ 免費用戶開放上傳照片轉影片
✅ 解除角色鎖定按鈕（結果區第二排）
✅ 中文自動翻譯英文（輸入框偵測中文，旁邊出現翻譯按鈕，確認後採用）
✅ 影片依秒數正確扣點（Kling 5秒=4點/10秒=6點，Seedance 5秒=4點/10秒=8點）
✅ 點數不足時依生成類型顯示對應錯誤訊息（影片需至少4點）
✅ 免費用戶每日限制提示改為「明天00:00（台灣時間）重置」
✅ localStorage 依帳號分開存儲（key: last_prediction_${email}）
✅ 防止切換視窗時覆蓋當前圖片（useRef hasLoadedFromStorage）
✅ SessionProvider 加 refetchOnWindowFocus={false}
✅ 圖片生成後自動上傳 Supabase Storage 永久保存（await 確保順序正確）
✅ 影片 URL 寫入 user_generations.video_url 欄位
✅ 影片永久保存至 Supabase Storage（video_url 為永久連結）
✅ vercel.json 設定 maxDuration 60秒
✅ Vercel Function Region 改為 Tokyo (hnd1)
✅ /api/user/clear-locked-character/route.ts 新增
✅ /api/translate/route.ts 新增（Google 免費翻譯 API）
✅ 鎖定角色狀態列（Steps 上方顯示縮圖+文字，鎖定/解除即時更新不需F5）
✅ 歷史作品區即時更新（生成完成後自動刷新，不需F5）
✅ 歷史作品區付費方案顯示50筆
✅ 歷史作品支援影片（🎬圖示顯示）
✅ Flux Kontext Pro E006 失敗自動 retry 最多2次 + 全部失敗退點
✅ 影片生成後顯示「不保存至歷史」警告（黃色醒目樣式）
✅ 鎖定按鈕點擊後顯示「🔄 鎖定中...」載入提示
✅ 退點 API（POST /api/character 帶 refundCredits 參數）
✅ 鎖定角色圖片失效時自動退點
✅ checkStatus 加入 genType 參數（解決影片/圖片 state race condition）
✅ 影片 Modal 動作指令翻譯功能（偵測中文自動顯示翻譯按鈕）
✅ 上傳圖片轉影片提示詞翻譯功能
✅ 靈感畫廊 Tab 切換（靈感畫廊/我的歷史，預設顯示靈感畫廊）
✅ 靈感畫廊動態內容（優先顯示用戶歷史圖片最多4張，不足補固定圖合計8張）
✅ 手機版 RWD 優化（GlobalHeader 漢堡選單，LOGO左側，點數徽章常駐）
✅ 角色命名收藏功能（saved_characters 表、/api/saved-characters/route.ts、免費1個/入門標準3個/專業無限）
✅ 一鍵分享（手機 Web Share API 系統選單，電腦下載+開FB）
✅ TTS 語音合成（ElevenLabs Multilingual v2，付費專屬，免費試聽後下載扣點）
✅ TTS 10種聲音（5男5女，全部支援中文普通話/台灣腔）
✅ TTS 字數限制依影片秒數動態調整（5秒=30字/10秒=55字），三層防護
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
✅ 我的角色頁面（/characters，列表+詳情）
✅ 角色詳情頁（/characters/[id]，身份卡+作品相簿+快速操作）
✅ 作品相簿（圖片/影片點擊大圖預覽）
✅ 生成時自動歸檔到鎖定角色（character_id 欄位）
✅ GlobalHeader 改版（LOGO左側 + 點數徽章常駐 + 漢堡選單 RWD，電腦版橫排）
✅ saved_characters 新增 description 欄位
✅ user_generations 新增 character_id 欄位
✅ 後台 session 驗證加強（改用 getServerSession，不再用 URL email 參數）
✅ authOptions 從 next-auth route 正確 export
✅ 後台模型追蹤頁面（/admin/models）
✅ Replicate 模型搜尋 API（/api/admin/models/search）
✅ 模型標記功能（觀察中/待測試/已採用/不適用）+ Supabase 儲存
✅ 模型熱度指標（超熱門/熱門/上升中/新模型）
✅ 模型名稱可點擊跳 Replicate 頁面
✅ 同類現用模型對比標示
✅ model_tracker 資料表新增
✅ SEO 設定（metadata title/description/keywords/og/twitter/robots）
✅ 批次生成（付費用戶，依方案限張數，必須鎖定角色，依序生成，失敗retry+退點，自動歸檔角色相簿）
✅ 批次生成每張 prompt + 備註欄位均支援中翻英
✅ 後台會員統計頁面（/admin/members，總人數/今日新增/方案分布/生成次數，支援搜尋過濾）
✅ 站內留言板（用戶發送+查看留言，管理員後台回覆，站內紅點通知，不透過 Email）
✅ 後台留言管理頁面（/admin/feedback，未讀標示/篩選/即時回覆）
✅ feedback_messages 資料表新增
✅ /api/feedback/route.ts（用戶送出+查詢）
✅ /api/feedback/read/route.ts（標記已讀）
✅ /api/admin/feedback/route.ts（後台查詢+回覆）
✅ /api/admin/members/route.ts（會員統計）
✅ 模型追蹤頁搜尋框（在已抓回結果中即時過濾）
✅ 模型比對測試工具（/admin/models/compare，支援圖片/圖生影片/文字生影片）
✅ 比對頁從追蹤清單選模型 Modal（顯示待測試/觀察中/已採用）
✅ 比對頁 prompt 中翻英功能
✅ 比對頁自訂參數欄位（JSON格式，對應不同模型參數）
✅ 目前使用中模型快速加入比對（+比對按鈕）
✅ 比對模型選擇用 sessionStorage 暫存（關分頁自動清除）
✅ TTS 試聽改為每部影片各自3次，cache session 共用
✅ 後台會員管理新增補點功能（正負數、選填備註、紀錄寫入 credit_adjustments）
✅ 後台會員頁底部新增補點紀錄區塊（最近50筆，正數黃色/負數紅色，有紀錄才顯示）
✅ 後台點數設定新增 TTS 下載點數、Wav2Lip 合成點數（入門/標準/專業可調）
✅ 後台點數設定新增影片生成點數（Kling 5秒/10秒、Seedance 5秒/10秒、Omni加費，入門/標準/專業可調）
✅ Kling/Seedance/Omni 點數改為從 admin_settings 動態抓取（route.ts + pricing頁面同步）
✅ pricing 頁面影片費用改為動態顯示（從 settings-public API 抓取，後台改一次前台自動同步）
✅ settings-public API 新增影片點數 key 回傳
✅ 後台所有頁面標題從 h1 改為 p（修正 globals.css h1 樣式導致後台標題變形問題）
✅ 主頁 Hero 佔位符（16:9 深綠佔位，預留 /hero.mp4 位置）
✅ 主頁 Step 1 模式選擇（4個模式 2×2 格線，文字生成影片 Coming Soon）
✅ 主頁 Steps 2–6 手風琴流程（角色人設/個性職業/選場景/鏡頭角度/補充細節）
✅ 主頁 prompt 組合邏輯（風格+人設+場景+鏡頭+自由輸入自動拼接）
✅ 收藏角色時帶入個性職業寫入 description 欄位
✅ 結果區按鈕整合（鎖定/收藏/批次一排，解除鎖定+上傳轉影片第二排）
✅ Steps 2–4 自訂輸入框（與標籤互斥，支援中翻英）
✅ GlobalHeader 漢堡選單 X 按鈕修正（hamburgerRef 排除點外部關閉衝突）
✅ Seedance 2.0 串接（bytedance/seedance-2.0，1080p，generate_audio: true）
✅ 影片模型選擇升級為卡片式 UI（含差異說明與點數提示）
✅ Seedance 2.0 溢價點數計算（依 userPlan 動態計算）
⚠️ 聯絡表單 + Cloudflare Turnstile 已開發但已還原（聯絡頁改回靜態版本）
✅ Omni-Reference 功能已完整合併到主線 page.tsx（兩個 Modal 均支援）
✅ Seedance 2.0 定價重新設計（越高方案越便宜，入門17點/標準15點/專業13點）
✅ Seedance 2.0 Omni-Reference 多參考圖功能（三槽位：第二角色/場景風格/動作參考）
✅ 影片生成失敗時顯示 alert 錯誤提示（不再沉默失敗）
✅ 兩個影片 Modal 加入 overflow-y-auto max-h-[90vh] 支援捲動
✅ 手機版 Step 2-4 自訂輸入框改為 textarea rows={2}（解決 placeholder 文字被截斷問題）
✅ 文字生成影片功能串接（Step 1 第四選項，Kling + Seedance，付費限定）
✅ 文字生成影片 Modal（模型選擇/比例/秒數/描述輸入/中翻英，付費限定，免費用戶點擊顯示升級提示）
✅ handleText2Video 函式（mode: "text2video"，不需圖片，直接呼叫 Kling 或 Seedance）
✅ route.ts 新增 text2video 分支（付費驗證、Seedance 無 Omni 定價、Kling 純文字生成）
✅ 頁面載入 API 順序優化：credits 優先載入，saved-characters 延遲 400ms 打，避免同時三支 API 競爭
✅ 結果區按鈕 UI 美化（鎖定/收藏/批次漸層升級，批次按鈕顯示限制原因，解除鎖定加紅色 hover，推薦橫幅加 icon 底色）
✅ 藍新金流程式碼串接完成（checkout/notify/return三支API + pending_orders資料表）
✅ pricing/page.tsx handleBuy 從Stripe改為藍新隱藏表單POST
✅ 各路由加入 loading.tsx（app/、app/pricing/、app/characters/）
✅ next.config.ts 加入圖片快取（Supabase + Replicate remotePatterns，minimumCacheTTL 30天）
✅ Apple Pay 網域驗證完成（public/.well-known + API route + next.config.ts rewrites）
✅ 首屏效能優化：gallery lazy img + history 延遲1.5秒載入
✅ 藍新金流加入 ATM/WebATM/超商條碼/超商代碼/銀聯卡 付款選項
✅ page.tsx Code Splitting 完成（7個Modal拆成獨立元件，dynamic import懶載入）
   - app/components/BatchModal.tsx / TtsModal.tsx / ReferralModal.tsx / SaveCharacterModal.tsx / VideoSettingsModal.tsx / Text2VideoModal.tsx
✅ 鎖定角色按鈕刪除 btn.textContent DOM 操作，改靠縮圖列顯示鎖定狀態
✅ STEP 編號重整（選擇模式無編號，STEP 1角色風格/STEP 2外貌特徵/STEP 3個性職業/STEP 4場景選擇/STEP 5鏡頭角度/STEP 6補充細節）
✅ STEP 2 外貌特徵新增（髮色/眼睛/身材標籤+自訂輸入含中文翻譯，存入description不進prompt，選填）
✅ STEP 5 鏡頭角度改為永遠顯示，圖片模式灰暗不可點，顯示「🔒 選影片模式才開放」
✅ 每日簽到功能上線（app/checkin/page.tsx + app/api/checkin/route.ts）
✅ GlobalHeader 漢堡選單加入「📅 每日簽到」入口
✅ 簽到獎勵改為7/14/21/30天四個里程碑（7天+3點/14天+5點/21天+5點/30天+10點）
✅ 三頁返回首頁按鈕統一規格（characters/pricing/checkin，膠囊樣式「← 返回首頁」）
✅ 圖片比例選擇功能（1:1/16:9/9:16/4:3/3:4，生成時直接套用，flux-kontext-pro和flux-1.1-pro均支援）
✅ 影片生成後自動捲到進度條（progressRef + scrollIntoView）
✅ 儲存成果 genType race condition 修正（checkStatus 完成後強制 setGenType）
✅ 手機下載提示文字（長按圖片/影片可直接儲存到相簿）
✅ 首頁 Hero 循環影片上線（Supabase CDN，URL: https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/hero.mp4）
✅ downloadFile 改用 genType 判斷副檔名（genType === "video" → mp4，否則 png）
✅ 儲存成果提示文字：長按圖片可存相簿，影片請點儲存成果下載

12. 待完成項目（下一步）


⬜ 藍新信用卡審核通過後實測付款流程
⬜ 審核通過後移除舊 Stripe 相關程式碼（app/api/stripe/）— 暫緩，短期不上架 App，此條等 PWA 方向確認後再決定
⬜ Vercel 升級為付費版 Pro（$20 USD/月）— 預計 2026 年 5 月底前完成（網站已正式上線有商業收費，Hobby 條款禁止商業用途）
⬜ 成人站架構規劃（獨立網域、獨立服務、獨立金流）
⬜ 成人站身份驗證系統（上傳身份證、後台審核、adult_verified欄位）
⬜ 成人站獨立點數系統（adult_credits欄位，與主站完全分離）
⬜ 後台成人驗證審核頁面（一鍵通過/拒絕）
⬜ 後台手動發成人點數功能
⬜ 主站資料移轉至成人站（角色/圖片/歷史，驗證通過後開放）
⬜ 成人站金流串接（SubscribeStar主力 + NexaPay補充）
⬜ 購買自訂域名（建議 consistentflow.com，在 Namecheap 或 GoDaddy 購買，約 NT$400-600/年）
⬜ Vercel 綁定自訂域名（Vercel Dashboard → Project → Settings → Domains）
⬜ NEXTAUTH_URL 環境變數改為正式域名
⬜ Google OAuth 授權網址加入正式域名（Google Cloud Console → 憑證 → 授權重新導向 URI）
⬜ 綁定後提交 Google Search Console 驗證所有權
⬜ Search Console 提交 sitemap（Next.js 可自動產生 /sitemap.xml）
⬜ SEO metadata 優化（og:title / og:description 改為正式內容）
⬜ 等待藍新回覆 Apple Pay 幕後支付授權串接文件
⬜ 藍新信用卡/Google Pay/Samsung Pay/WebATM/ATM 審核通過後實測付款流程

13. 已知問題備忘

Kling 3.0 的 mode 必須用 "standard" 不能用 "std"
Supabase RLS 已停用，用 Service Role Key
history 變數在所有地方強制 Array.isArray 檢查
Stripe Webhook 本地測試用 stripe listen --forward-to localhost:3000/api/stripe/webhook
上線後 Webhook URL 要改成 Vercel 網址
Replicate 圖片 URL 有效期約 24 小時，鎖定角色時已改為上傳到 Supabase Storage 永久保存
影片已永久保存至 Supabase Storage（upload-image API 同時處理圖片和影片）
// [DNA_PATCH_START] 標記不能放在 JSX return 區塊內，否則會顯示在畫面上
從聊天介面複製含 `<a` 標籤的程式碼時，`<a` 可能被吃掉，貼上後需手動確認
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
角色詳情頁手機版頂部 padding 需 pt-24，電腦版 pt-16
character_id 歸檔依賴 lockedCharacterId state，需在收藏角色列表載入後才能正確對應
模型追蹤 route.ts 必須放在 app/api/admin/models/，不能放在 app/admin/models/
authOptions 必須從 app/api/auth/[...nextauth]/route.ts export 才能給其他 API 使用
成人專區按鈕已暫時隱藏（等綠界審核通過後再規劃）
綠界不支援成人內容，主站金流與成人站金流必須完全分離
點數不能移轉（法律風險），但主站角色和資料可移轉到成人站
SubscribeStar 對帳單顯示「Subscribestar」，NexaPay 用戶收到穩定幣需自行換台幣
批次生成建議：同一套衣服+不同姿勢效果最穩，換衣服或換風格臉部可能飄移
免費用戶每日影片限制邏輯：在點數檢查之前先攔截，有點數也只能生1支
每日簽到實作時注意：需防多帳號濫用，建議加 IP + Google帳號雙重驗證
靈感畫廊點擊無反應：onClick 必須捲動到 step6-section，此 bug 已出現兩次，禁止移除捲動邏輯
手機版自訂輸入框（Step 2-4）禁止用 <input type="text">，必須用 <textarea rows={2} className="...resize-none leading-relaxed">，否則手機版 placeholder 長文字會被截斷
文字生成影片不帶 omniRefs，Seedance 費用使用無 Omni 基本定價（入門5秒17點/10秒27點・標準5秒15點/10秒25點・專業5秒13點/10秒21點）
SEO keywords meta tag 對 Google 無效（2009年起），真正有效的是 og:title/og:description
Vercel 預設網址 SEO 意義不大，等綁自訂域名後再認真優化
換域名後必須同步更新：NEXTAUTH_URL、Google OAuth 授權URI、藍新金流 Notify URL / Return URL
主頁 page.tsx 的 <main> 必須保留 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]，否則背景漸層消失
後台所有頁面標題禁止使用 <h1> 標籤，必須用 <p> 或 <div>，否則 globals.css 的 h1 樣式會導致標題變形（scaleY/scaleX/text-stroke）
admin_settings 影片點數 key 清單：kling_5s/10s_starter/standard/pro、seedance_5s/10s_starter/standard/pro、omni_extra_starter/standard/pro（共15個，後台沒設定時 route.ts 有 fallback 預設值）
GlobalHeader 的 <div className="h-12" /> 佔位符不可移除，否則頁面內容會被 fixed header 蓋住
state 宣告必須放在 return() 之前的邏輯區，不能插入 JSX 區塊內（曾發生 activeStep 等 state 被誤插入 JSX 導致大量 TS 錯誤）
Cloudflare Turnstile Site Key：0x4AAAAAC-_FUGtx2UlyaYF（公開無妨）
Cloudflare Turnstile Secret Key：已設定於 Vercel，換網域後需至 Cloudflare → Turnstile → AI Character Studio Contact → Add Hostnames 加入新網域
Turnstile Sensitive 變數無法套用 Development 環境，只能 Production + Preview
globals.css 編碼問題：
- globals.css 不在 git 追蹤中（never committed）
- 絕對不能用 PowerShell 的 > 重導向來寫 CSS 檔案，會產生 UTF-16 LE 編碼，Turbopack 讀不了
- 正確做法：直接在 VSCode 手動編輯，存檔時確認右下角是 UTF-8
- globals.css 正確內容只需一行：@import "tailwindcss";
- 若出現 FATAL Turbopack error，先用 type 指令讀 panic log 找根本原因，不要亂改其他檔案

字型問題（2026/04/19 血淚教訓）：
- layout.tsx 字型必須用 next/font/google 的 Geist + Geist_Mono，禁止換成 geist 套件
- 禁止安裝 geist 套件，裝了會跟 next/font/google 衝突導致全站字型異常
- globals.css 從未被 git 追蹤，內容如下，缺一不可：

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

- 禁止用 PowerShell > 重導向寫入 globals.css，會產生 UTF-16 LE 編碼導致 Turbopack FATAL error
- 若出現 Turbopack FATAL error，先讀 panic log：type C:\Users\123\AppData\Local\Temp\next-panic-*.log
globals.css 不在 git 追蹤中，需要用 git add -f app/globals.css 才能強制加入
GlobalHeader 未登入狀態：if (!session) 不能直接 return null，必須顯示登入按鈕，否則登出後無法重新登入。已修正為未登入時顯示 LOGO + 「使用 Google 登入」按鈕（justify-between 左LOGO右登入）。
GlobalHeader 登入按鈕必須用 signIn("google", {}, { prompt: "select_account" })，不能用 signIn("google")，否則手機版會強制使用已登入的 Google 帳號，無法切換其他帳號
GlobalHeader 登出按鈕必須用 signOut({ callbackUrl: "/" })，不能用 signOut()，否則登出後再登入不會跳選帳號畫面
BUG 修正記錄（2026/04/19）：
- 未登入畫面 LOGO 消失：GlobalHeader if (!session) 分支缺少 LOGO，改為 justify-between 左放LOGO右放登入按鈕
- 未登入顯示鎖定角色列：localStorage 讀取必須包在 if (session?.user?.email) 內，否則未登入也會讀到舊值
- 未登入靈感畫廊空白：galleryItems 的 useState 初始值必須放固定圖，不能依賴 useEffect 填入，否則未登入時永遠是空陣列
- 轉成影片按鈕 disabled：disabled 條件禁止加入 genType === "video"，影片生成完後 genType 不會重置導致按鈕永遠卡死，只保留 loading 和 credits <= 0 兩個條件
- useEffect 禁止巢狀：不能在一個 useEffect 內部再寫另一個 useEffect，會觸發 React error #321
- PowerShell 部署固定格式是四行（含 globals.css）：
git add -f app/globals.css
git add -A
git commit -m "說明"
git push
setTimeout 內的 fetch 必須用 session?.user?.email（optional chaining），不能用 session.user.email，否則 TypeScript 報 ts(18048) 錯誤
藍新 MerchantOrderNo 長度上限 30 字元，禁止把 email 編碼塞入，改用 pending_orders 資料表暫存訂單資訊
藍新 notify 用 POST formData 傳送，不是 JSON，必須用 req.formData() 解析
藍新 AES 解密後需 .replace(/\x00+$/, "").trim() 去除 padding
Apple Pay 幕後支付需完成網域驗證才能啟用，驗證檔放在 public/.well-known/apple-developer-merchantid-domain-association.txt，透過 app/api/apple-pay-verify/route.ts 讀取並回傳，next.config.ts 加 rewrites 將 /.well-known/apple-developer-merchantid-domain-association 導向 /api/apple-pay-verify
Code Splitting 注意（2026/04/23）：
- VideoSettingsModal.tsx 的 videoModel/setVideoModel props 型別必須是 "kling" | "seedance"，不能用 string
- page.tsx dynamic import 只能寫一次，不能重複貼入
- Android 用 App 內建瀏覽器登入出現 disallowed_useragent 是 Google OAuth 限制，叫用戶改用 Chrome，不需改程式碼
BUG 修正（2026/04/23）：
- 鎖定按鈕解除後殘留「🔄 鎖定中...」：刪除 if (btn) btn.textContent = '🔄 鎖定中...' 這行即可修復
內建瀏覽器登入問題（2026/04/23）：
- 從 LINE/FB/IG/WhatsApp/Twitter 內建瀏覽器點連結進來會出現 disallowed_useragent，Google 擋掉非標準瀏覽器登入
- 修法：GlobalHeader.tsx 登入按鈕 onClick 偵測 ua，包含 Line/ / FBAN / FBAV / Instagram / WhatsApp / Twitter 任一字串即觸發
- 偵測到內建瀏覽器時，自動在網址後加 openExternalBrowser=1，跳出去用外部瀏覽器開啟
- 變數名稱：isInAppBrowser
flux-kontext-pro 和 flux-1.1-pro 支援比例：1:1/16:9/9:16/4:3/3:4/3:2/2:3/4:5/5:4/21:9/9:21
圖片比例 state 名稱：imageRatio，預設 "1:1"，透過 handleSubmit 傳入 character/route.ts
Kling 影片比例受參考圖影響，根本解法是生圖時就選好目標比例，不做裁切
儲存成果按鈕改為 downloadFile（不用 window.open，iOS Safari 新分頁無法顯示 Supabase 圖片）
Hero 影片不放在 public/ 資料夾（git 無法追蹤 mp4），改用 Supabase Storage CDN 托管
hero.mp4 位於 character-images bucket，更換影片直接在 Supabase Storage 覆蓋上傳即可，不需要改程式碼
Hero 影片 <video> 標籤必須有 absolute inset-0，否則無法填滿容器
Splash 入場動畫（2026/04/24）：
- 觸發條件：credits !== null 時立刻結束，最長等 2500ms 強制結束
- 背景色：#163d20（與首頁漸層起點略有差異，消費者感知不到）
- LOGO 圖：public/logo-splash.png（400×400，原圖壓縮自 IMG_0260.png）
- LOGO 顯示：圓形裁切（border-radius:50% + overflow:hidden）
- 動畫元素：旋轉光環、掃光、logoPulse 發光、雙掃描線、文字 textGlow、三點跳動、底部閃爍線
- state：pageReady / splashDone（禁止移除）
- 蓋板淡出：opacity transition 0.7s，onTransitionEnd 後 setSplashDone(true) 從 DOM 移除

14. 未來功能規劃（優先順序）

中期：
⬜ 成人專區正式上線
⬜ 自訓角色模型（用戶上傳10-20張圖訓練專屬模型）
⬜ 公開畫廊（含匿名選項，需 public_gallery 資料表）
⬜ 角色公開/匿名分享功能（三選項：私人/匿名公開/公開分享，預設私人）
⬜ PWA 支援（讓用戶可將網站加到手機桌面，體驗接近 App，零上架成本）
⬜ 多語系支援（英文/德文/日文/中文，使用 next-intl，一次到位，有助成人站金流審核與 SEO）
⬜ React Native App（前端重寫，後端 API 與 Supabase 完全共用，無需改動）

長期：
⬜ Live Portrait 動態呼吸效果（串接 LivePortrait API）
⬜ API 開放（讓第三方開發者串接）
⬜ LPM 1.0（Anuttacon）— 即時雙向對話角色，一張圖生成即時會說話/聆聽/有表情的AI角色，支援無限長度，待API開放後評估串接，目前僅學術用途，無API
⬜ App Store 上架評估（主站非成人版本，需確保服務條款/網站內容完全不提成人相關字眼）
⬜ App Store 上架（短期不建議）— 原因：Apple/Google 抽成 30%、審核成本高、需維護雙套金流。建議先完成 PWA，等營收規模足夠再重新評估。
注意：成人站禁止上架 App Store，走獨立網域 + PWA 路線
注意：AI 生成人物圖片在 Apple 審核屬敏感領域，上架前需法律評估
成人站上線優先順序：
1. 法律評估（海外公司架構確認）
2. NOWPayments 帳號申請，測試 USDT 收款流程
3. Atlas Cloud 申請，測試 Wan Spicy / Flux Dev 無審查 API 串接
4. 成人站圖片功能先上，驗證用戶付費意願
5. 影片功能等開源模型成熟後再上（預計 6-12 個月後，崩壞率需降至可接受水準）
6. 愛沙尼亞 e-Residency 公司成立後申請 Segpay 信用卡金流
7. 營收穩定後評估遷移至 RunPod Serverless 自建 GPU 架構
成人站技術選型：
- 圖片：Flux Dev 無審查微調版（Atlas Cloud API）
- 影片：Wan Spicy（Atlas Cloud API，約 $0.01/秒，5秒約 $0.05-0.15）
- 影片成本是圖片 10-20 倍，定價需精準，初期建議圖片站先行
- 角色一致性：開源影片模型目前尚未成熟，崩壞率 30-50%，需退點機制
成人站競品分析（OurDream.ai，2026/04）：
- 公司架構：Dream Studio USA（紐約）+ TekTopia Ltd（賽普勒斯），雙主體架構（與我們規劃一致）
- 月流量：2500萬，9-12個月達成，靠 TrafficJunky 成人廣告網路買流量
- 金流：帳單顯示「Dream Studio」隱密處理，第三方處理器未公開（刻意模糊策略）
- 圖片模型：SD 1.5（老）→ 臉孔高度同質化，我們用 Flux Dev 有世代差距優勢
- 影片模型：專有模型，5-30 秒，品質普通
- 對話模型：DeepSeek V3（我們目前無 AI 對話功能，是劣勢）
- iOS App：閹割版（SFW only），真正 NSFW 功能只在網頁版，證實 PWA 路線正確
- 定價：月付 $19.99 / 年付 $9.99/月，點數制（DreamCoins），10天內耗盡是常見抱怨
- 主要缺點：SD 1.5 臉孔同質化、隱私政策不透明、聲音平板無情感
- 我們的差異化：Flux Dev 畫質、Flux Kontext Pro 即時角色一致性、ElevenLabs 聲音品質、主站角色無縫移轉
- 我們的定位：「角色創作工具」而非「AI 伴侶」，不正面競爭
- 行銷管道：成人站禁用 Meta 廣告，應走 TrafficJunky / ExoClick / TrafficStars
- 注意：畫質好不等於大賣，流量和 AI 對話功能是 OurDream 留住用戶的核心，需評估是否加入對話功能
多語系規劃（有助於金流審核與法律風險降低）：
- 主力：英文（市場最大、法律風險最低）
- 次要：德文（德國成人內容合法化完善，有助歐洲金流申請）
- 次要：日文（消費力強，但 AI 生成成人內容法規仍在討論中）
- 補充：中文（可做但行銷上低調，不主動推台灣市場）
- 技術：Next.js i18n 內建支援，JSON 管理靜態翻譯，工程量不大