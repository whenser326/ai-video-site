# 💼 DNA_BIZ.md — 主站商業（談主站時與 DNA_CORE.md 一起貼）

---

## 定價方案

| 方案 | 點數 | 售價 | 圖片 | 影片 | 角色一致性 | 批次生成 | 語音合成 | Wav2Lip | 每日圖片 | 歷史紀錄 |
|---|---|---|---|---|---|---|---|---|---|---|
| 🆓 免費 | 5點 | $0 | 1點 | 4-6點/支(僅Kling) | ✅ | ❌ | ❌ | ❌ | 2張/天,1影片/天 | 5筆 |
| 🌱 入門包 | 30點 | $250 NTD | 1點 | 6點/支 | ✅ | 2張 | 8點/次 | 10點/次 | 無限 | 30天/5筆 |
| ⭐ 標準包 | 80點 | $450 NTD | 1點 | 5點/支 | ✅ | 4張 | 7點/次 | 9點/次 | 無限 | 30天/10筆 |
| 🚀 專業包 | 200點 | $799 NTD | 1點 | 4點/支 | ✅ | 6張 | 6點/次 | 8點/次 | 無限 | 90天/30筆 |

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
