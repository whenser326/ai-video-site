# 💼 DNA_BIZ.md — 主站商業（談主站時與 DNA_CORE.md 一起貼）

---

## 定價方案

| 方案 | 點數 | 售價 | 圖片 | 影片 | 角色一致性 | 批次生成 | 語音合成 | Wav2Lip | Kling Avatar | 每日圖片 | 歷史紀錄 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 🆓 免費 | 5點 | $0 | 1點 | 4-6點/支(僅Kling) | ✅ | ❌ | ❌ | ❌ | ❌ | 2張/天,1影片/天 | 5筆 |
| 🌱 入門包 | 30點 | $250 NTD | 1點 | 6點/支 | ✅ | 2張 | 8點/次 | 10點/次 | 10點/次 | 無限 | 30天/5筆 |
| ⭐ 標準包 | 80點 | $450 NTD | 1點 | 5點/支 | ✅ | 4張 | 7點/次 | 9點/次 | 9點/次 | 無限 | 30天/10筆 |
| 🚀 專業包 | 200點 | $799 NTD | 1點 | 4點/支 | ✅ | 6張 | 6點/次 | 8點/次 | 8點/次 | 無限 | 90天/30筆 |

Seedance 2.0 點數定價（越高方案越便宜）：
- 入門：5秒/17點・10秒/27點
- 標準：5秒/15點・10秒/25點
- 專業：5秒/13點・10秒/21點

Seedance 2.0 + Omni-Reference 點數：入門+6點、標準+5點、專業+4點（固定加費）

文字生成影片不帶 omniRefs，Seedance 費用使用無 Omni 基本定價（入門5秒17點/10秒27點・標準5秒15點/10秒25點・專業5秒13點/10秒21點）

TTS 下載扣點：入門 8點、標準 7點、專業 6點
Wav2Lip 合成到影片扣點：入門 10點、標準 9點、專業 8點
對用戶顯示合計：入門 18點/次、標準 16點/次、專業 14點/次

---

## 金流（藍新 NewebPay）

金流主力：藍新金流（NewebPay）（審核已通過）
藍新商店代號：MS1827821756
藍新 HashKey/HashIV：已寫入 .env.local（NEWEBPAY_MERCHANT_ID / NEWEBPAY_HASH_KEY / NEWEBPAY_HASH_IV）

API 清單：
- Checkout API：app/api/newebpay/checkout/route.ts（已完成）
- Notify API：app/api/newebpay/notify/route.ts（付款成功自動加點數+更新plan+更新history_limit+分潤）
- Return API：app/api/newebpay/return/route.ts（付款完成跳轉回/pricing?success=1）

PLAN_BONUS_CREDITS（今日限定加贈）：starter:5, standard:7, pro:10
addCredits = PLAN_CREDITS + PLAN_BONUS_CREDITS，付款成功後自動入帳

支援付款方式：信用卡、ATM、WebATM、超商條碼、超商代碼、銀聯卡
藍新 notify 用 POST formData 傳送，不是 JSON，必須用 req.formData() 解析
藍新 AES 解密後需 `.replace(/\x00+$/, "").trim()` 去除 padding
藍新 MerchantOrderNo 長度上限 30 字元，改用 pending_orders 資料表暫存訂單資訊

Apple Pay：網域驗證已完成（public/.well-known + API route + next.config.ts rewrites），等藍新回覆幕後支付授權文件

已放棄：
- Stripe：不支援台灣商家收款
- 綠界 ECPay：申請未通過

---

## 後台功能

- app/admin/members/page.tsx：會員列表、補點、批量刪除、排序
- app/api/admin/adjust-credits/route.ts：補點 API（正數補點、負數扣點，最低不低於 0）
- app/api/admin/delete-users/route.ts：刪帳號 API（管理員權限：只有 whenser@gmail.com 才能執行）
- 刪除範圍：profiles、user_generations、saved_characters、checkin_logs 四個表
- 會員列表用 profiles.id 作為唯一識別
- 後台會員管理排序（2026/04/30）：生成次數和註冊日期表頭可點擊排序，sortField / sortDir state
- /admin/models：模型追蹤頁面（搜尋、標記、熱度、比對測試）
- /admin/feedback：留言管理（查詢+回覆）
- admin_settings 影片點數 key 清單（共15個）：見 DNA_TECH.md

---

## SEO 規範

- SEO keywords meta tag 對 Google 無效（2009年起），真正有效的是 og:title/og:description
- Vercel 預設網址 SEO 意義不大，等綁自訂域名後再認真優化
- 換域名後必須同步更新：NEXTAUTH_URL、Google OAuth 授權URI、藍新金流 Notify URL / Return URL
- 綁定後提交 Google Search Console 驗證所有權、提交 sitemap（/sitemap.xml）

---

## 待完成項目

## AI 聊天功能規格（2026/05/01 定案）

對話次數（終身累計，單人+群組共用同一計數器）：
- 免費：100次
- 入門包：2,000次
- 標準包：5,000次
- 專業包：10,000次
- 次數用完後改用點數扣（1點/次），UI顯示提示
- 計費模型：claude-haiku-4-5

群組聊天上限：
- 免費：不開放
- 入門/標準：最多3個角色
- 專業：最多5個角色
- 計費方式：幾個角色回覆算幾次（方案B）
- 回覆順序：隨機
- 角色間可互相回應

AI 自拍：扣1點，在聊天中要求角色傳照片，Flux Kontext Pro 生成
AI 自拍實作：/api/chat/route.ts 的 detectSelfieIntent 函式負責偵測，回傳 selfieIntent("photo"|"video"|null) 和 selfiePrompt（根據聊天紀錄推斷場景）
照片生成：/api/generate-image → Flux 1.1 Pro，扣1點
影片生成：先生成照片 → /api/upload-image 上傳 Supabase → /api/character mode:video Kling，依方案扣點
AI 自拍場景：用戶可在對話中指定場景（例如「在海邊自拍」），生成時帶入場景描述

AI 自拍媒體類型與扣點：
- 照片：Flux Kontext Pro 生成，扣1點
- 影片（5秒）：Kling 生成，入門6點・標準5點・專業4點
- 用戶可指定類型，例如「拍張照片」vs「錄一段影片給我」
- 生成時在聊天室顯示文字提示「📸 生成中，扣X點」，完成後直接回傳圖片/影片，不需確認

用戶上傳媒體：
- ✅ 輸入列旁📎按鈕，支援上傳圖片（已完成）
- ✅ 上傳後存入 Supabase Storage character-images bucket（已完成，API：/api/upload-chat-image）
- ✅ 圖片傳給 Claude vision 功能，角色可看圖回應（已完成，chat route 支援 imageUrl 參數）
- 影片暫不支援 vision，僅顯示在聊天室

後台需新增 admin_settings key：
新增 API：
- /api/upload-chat-image：接收 FormData（file+email），上傳到 character-images bucket，回傳永久 URL
- /api/user/save-generation：存作品到 user_generations 表（image_url、character_id、status:'done'）
- chat_cost_per_extra（次數用完後每次扣點，預設1）

✅ 角色個性：saved_characters 表已有 description 欄位（角色個性描述），建角色時填寫，聊天時帶入 system prompt（已完成）

聊天體驗優化（待實作）：
- ✅ 打字延遲：收到 API 回應後延遲 2-5 秒（隨機）再顯示訊息，模擬真人打字（已完成）
- ✅ 打字中動畫：延遲期間顯示三點跳動動畫（已完成）
- ✅ 群組回覆順序：一次只有一個角色回覆，每個角色之間間隔 2-5 秒隨機延遲，順序隨機（已完成）

## 競品分析與功能規劃參考（2026/05 更新）

### 台灣主要競品現況
- **Bloomi**（社交#19，4.8分，949則）：最大亮點是「AI自拍指定場景＋服裝」＋最多15角色群聊＋長期記憶。廣告主打「無審查」「尺度超大」。我們的自拍功能已涵蓋，但群聊上限（專業5個）比它少。
- **Chatto**（娛樂#47，4.8分）：業界唯一讓用戶自選 AI 模型（DeepSeek R1 / Gemini / Claude）。有語音通話、專屬記憶、影音互動。模型透明度是差異化賣點。
- **Floze**（台灣本土，4.3分，1807則）：純文字小說風格，角色市場豐富，開發者積極回覆用戶。用戶最大抱怨：愛心（虛擬貨幣）消耗太快、強烈要求月費制、記憶錯亂。
- **ReelTalk**（娛樂#162，5.0分）：短劇式敘事，有「AI推薦台詞」按鈕幫助用戶不冷場，用戶可選擇劇情走向。適合不知道說什麼的新手用戶。
- **Crushie AI**（娛樂#34，4.5分，2792則）：記憶力強、無審查NSFW、訂閱制CP值高（Standard $5.99/月）。用戶抱怨：記憶10則後崩壞、角色人設後期崩潰、重複對話高。
- **ParadiseAI**（娛樂#105，4.2分）：公開角色市場、月費制有無限暢聊。用戶抱怨：防色情內容、封面設計不夠吸引人、金幣給太少。
- **MiraiMind**（娛樂#29，4.4分）：日系風格、世界觀建構、群組5角色、角色「內心想法」功能。用戶抱怨：記憶15-20則就清空、虛擬貨幣每日過期強迫消費。
- **Pazzy**：語音陪伴為主，FB/IG廣告大量投放台灣市場。

### 從競品提煉的待實作功能（近期優先）
- ⬜ **聊天對話搜尋功能**（Floze / Crushie 用戶強烈要求）：聊天室頂部加搜尋圖示，可用關鍵字搜尋歷史訊息，解決「要往上翻很久」的問題。
- ⬜ **記憶摘要系統**（所有競品共同致命傷）：當對話超過20則時，自動呼叫 Claude 生成對話摘要存入 chat_sessions 的 background_story 欄位，下次對話帶入 system prompt，解決長對話記憶崩壞問題。這是目前所有競品最大的用戶痛點，率先解決可成為最強差異點。
- ⬜ **動作參考影片上傳**（對標 Viggle AI，近期優先）：在「線C 上傳照片轉影片」流程中，新增「上傳動作參考影片」選項。用戶同時上傳一張角色照片 + 一段動作參考影片（如舞蹈），Kling 生成角色套用該動作的影片。技術上現有 Kling 架構已可支援，不需新模型。實作位置：主頁 upload 模式新增第二個上傳區，參數帶入 reference_video。

### 從競品提煉的待實作功能（中期）
- ⬜ **聊天推薦台詞按鈕**（對標 ReelTalk）：輸入欄旁加「💬 推薦開場白」，根據角色個性和當前對話context動態生成3個回話選項讓用戶點選，解決新手冷場問題。實作：呼叫 /api/chat 帶 mode:'suggest' 參數，回傳3個選項，點選後直接填入輸入欄。
- ⬜ **角色旁白動作描述**（對標 MiraiMind「內心想法」）：在 system prompt 加入指引，讓角色在回覆中自然穿插括號旁白描述動作和心情（例如：「（他微微一笑，眼神閃過一絲溫柔）」），增加沉浸感。不需要額外功能，只需更新 charSystem prompt。
- ⬜ **聊天室顯示當前AI模型名稱**（對標 Chatto 透明度）：在聊天室頂部或設定小字顯示「Claude Haiku」，增加用戶信任感。
- ⬜ **公開角色市場**（對標 ParadiseAI / Floze）：用戶可選擇公開自己建立的角色，其他用戶可瀏覽和使用。需 public_gallery 資料表，角色三選項（私人/匿名/公開），預設私人。已列入中期規劃，優先度提升。
- ⬜ **AI語音通話模式**（對標 Chatto）：用戶點擊通話按鈕，進入語音對話介面，TTS 即時朗讀角色回覆。需評估 ElevenLabs streaming API。

### 行銷差異化定位（從競品缺點找機會）
- 主打「記得你說過的每一件事」——記憶延續是所有競品最大痛點，我們的 sessionId localStorage 已領先，記憶摘要系統完成後更要強調
- 主打「你的角色，只有你有」——用戶自建角色天生差異化，對比 Blush 角色全部相似被罵
- 主打「圖片＋影片＋說話影片一站完成」——功能廣度已超過所有台灣競品
- 避免主打「無審查/尺度」——Bloomi 走這條路，和我們定位不同，且 App Store 風險高
- 每日簽到＋推薦賺點要在聊天室內更明顯提示，降低用戶「點數焦慮」（Floze/Crushie 最大流失原因）

✅ /api/history DELETE method（已完成，query string: id+email）
✅ /api/saved-characters：POST 新增名稱重複檢查、description 欄位寫入；DELETE 改為 query string
✅ saved_characters 表新增 voice_id 欄位（角色預設聲音，建角色時設定）
✅ /api/kling-avatar/route.ts：Kling Avatar V2 說話影片 API（POST 生成・GET polling）
✅ 說話影片全站整合：單人聊天室・群組聊天室・主站 TtsModal・角色作品頁・主頁圖片結果區
✅ 群組聊天 AI 自拍圖片/影片存入相簿時跳出角色選擇器（AI 自拍自動歸屬發言角色）
✅ 建角色時可設定預設聲音（voice_id），聊天室說話影片自動帶入
✅ 聊天室停聊 60 秒後角色主動發話（單人+群組）
✅ Vercel 升級 Pro（$20 USD/月）（2026/05/05）
✅ 每日簽到可兌換額外1次影片生成次數（免費用戶專屬，簽到後當日影片額度從1支→2支，不累積到隔天）
- ⬜ 藍新信用卡/Google Pay/Samsung Pay/WebATM/ATM 審核通過後實測付款流程
- ⬜ 購買自訂域名（建議 consistentflow.com，約 NT$400-600/年）
- ⬜ Vercel 綁定自訂域名
- ⬜ NEXTAUTH_URL 環境變數改為正式域名
- ⬜ Google OAuth 授權網址加入正式域名
- ⬜ 等待藍新回覆 Apple Pay 幕後支付授權串接文件
- ✅ Vercel 升級為付費版 Pro（$20 USD/月）— 已完成（2026/05/05）

---

## 未來功能規劃（中期）

- ⬜ 成人專區正式上線
- ⬜ 自訓角色模型（用戶上傳10-20張圖訓練專屬模型）
- ⬜ 公開角色市場（含匿名選項，需 public_gallery 資料表；角色三選項：私人/匿名公開/公開分享，預設私人）——優先度從低提升至中，對標 ParadiseAI / Floze 的角色市場生態
- ⬜ PWA 支援（讓用戶可將網站加到手機桌面，體驗接近 App，零上架成本）
- ⬜ 多語系支援（英文/德文/日文/中文，使用 next-intl）
- ⬜ React Native App（前端重寫，後端 API 與 Supabase 完全共用）

## 未來功能規劃（長期）

- ⬜ Live Portrait 動態呼吸效果（串接 LivePortrait API）
- ⬜ API 開放（讓第三方開發者串接）
- ⬜ App Store 上架評估（主站非成人版本，需法律評估）
- App Store 短期不建議：Apple/Google 抽成 30%、審核成本高、需維護雙套金流。建議先完成 PWA。

---

## 推薦賺點系統

- referral_code、referral_logs 表、介紹碼獎勵
- /api/referral/settings-public/route.ts（公開方案價格查詢 API）
- pricing 頁面介紹碼自動讀取 URL ref 參數，存入 localStorage（關頁面後仍記住，付款後自動清除）
- 推薦賺點 Modal：顯示專屬介紹碼、一鍵複製介紹碼/連結、三方案獎勵對照（從 admin_settings 動態抓取）
