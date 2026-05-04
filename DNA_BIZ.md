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

角色個性：saved_characters 表需新增 description 欄位（角色個性描述），建角色時填寫，聊天時帶入 system prompt

聊天體驗優化（待實作）：
- ✅ 打字延遲：收到 API 回應後延遲 2-5 秒（隨機）再顯示訊息，模擬真人打字（已完成）
- ✅ 打字中動畫：延遲期間顯示三點跳動動畫（已完成）
- ✅ 群組回覆順序：一次只有一個角色回覆，每個角色之間間隔 2-5 秒隨機延遲，順序隨機（已完成）

競品參考（鴨答鴨答）：
- 長期記憶系統（向量資料庫，pgvector 或 Pinecone）
- 公開角色市場
- 創作者獎勵計畫
- 成人模式解鎖機制
- 以上功能技術上均可實作，列入中長期規劃

✅ /api/history DELETE method（已完成，query string: id+email）
✅ /api/saved-characters：POST 新增名稱重複檢查、description 欄位寫入；DELETE 改為 query string
✅ saved_characters 表新增 voice_id 欄位（角色預設聲音，建角色時設定）
✅ /api/kling-avatar/route.ts：Kling Avatar V2 說話影片 API（POST 生成・GET polling）
✅ 說話影片全站整合：單人聊天室・群組聊天室・主站 TtsModal・角色作品頁・主頁圖片結果區
✅ 群組聊天 AI 自拍圖片/影片存入相簿時跳出角色選擇器（AI 自拍自動歸屬發言角色）
- ⬜ 藍新信用卡/Google Pay/Samsung Pay/WebATM/ATM 審核通過後實測付款流程
- ⬜ 購買自訂域名（建議 consistentflow.com，約 NT$400-600/年）
- ⬜ Vercel 綁定自訂域名
- ⬜ NEXTAUTH_URL 環境變數改為正式域名
- ⬜ Google OAuth 授權網址加入正式域名
- ⬜ 等待藍新回覆 Apple Pay 幕後支付授權串接文件
- ⬜ Vercel 升級為付費版 Pro（$20 USD/月）— 預計 2026 年 5 月底前完成（Hobby 條款禁止商業用途）

---

## 未來功能規劃（中期）

- ⬜ 成人專區正式上線
- ⬜ 自訓角色模型（用戶上傳10-20張圖訓練專屬模型）
- ⬜ 公開畫廊（含匿名選項，需 public_gallery 資料表）
- ⬜ 角色公開/匿名分享功能（三選項：私人/匿名公開/公開分享，預設私人）
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
