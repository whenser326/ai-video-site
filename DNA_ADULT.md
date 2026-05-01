# 🔞 DNA_ADULT.md — 成人站（談成人站時與 DNA_CORE.md 一起貼）

---

## 成人站核心架構

- 獨立網域、獨立服務、獨立金流，通過身份驗證後才能購買成人點數
- 主站資料（角色/圖片）可移轉至成人站，不涉及金流
- 成人站點數與主站點數完全分離，無移轉機制
- 網站架設於海外伺服器、公司登記於海外（愛沙尼亞或賽普勒斯）、金流走海外帳戶
- 注意：成人站禁止上架 App Store，走獨立網域 + PWA 路線
- 注意：畫質好不等於大賣，流量和 AI 對話功能是留住用戶的核心，需評估是否加入對話功能

---

## 技術選型

- 圖片：Flux Dev 無審查微調版（Atlas Cloud API）
- 影片：Wan Spicy（Atlas Cloud API，約 $0.01/秒，5秒約 $0.05-0.15）
- 角色一致性：開源影片模型目前尚未成熟，崩壞率 30-50%，需退點機制
- 影片成本是圖片 10-20 倍，定價需精準，初期建議圖片站先行
- 影片功能等開源模型成熟後再上（預計 6-12 個月後，崩壞率需降至可接受水準）

---

## 成人站金流申請進度（2026/05/01）

| 金流 | 狀態 | 備註 |
|---|---|---|
| NOWPayments | ✅ 帳號已建立 | ⚠️ 待補 USDT TRC-20 錢包地址（等 MAX KYC 通過） |
| NexaPay | ✅ 商家後台已建立（nexapay.one） | ⚠️ 待補 USDT TRC-20 錢包地址 |
| SubscribeStar | ✅ 頁面建立（subscribestar.adult/consistentflow-ai）Email已驗證，審核中 | ⚠️ Payout待Paxum驗證完成後填入 |
| MAX | ✅ 帳號已建立 | ⚠️ KYC審核中（Lv1審核中/Lv2已提交）→ 通過後取得TRC-20地址填入NOWPayments+NexaPay |
| Paxum | ✅ 帳號已註冊（whenserjp@gmail.com） | ⚠️ 身份驗證待完成（需護照，台灣身分證不支援Jumio） |

出金路線：
- SubscribeStar → Paxum → 台灣銀行
- NOWPayments/NexaPay → USDT → MAX → 台幣出金

絕對不能用：Stripe、PayPal（Mastercard/Visa 網路明確禁止成人內容）
Crypto.com 不支援 USDT TRC-20，已排除
SubscribeStar 對帳單顯示「Subscribestar」，NexaPay 用戶收到穩定幣需自行換台幣
Chargeback 控制：加密貨幣無 Chargeback，信用卡金流需控制在 0.75% 以下

---

## 成人站上線優先順序

1. 法律評估（海外公司架構確認）
2. NOWPayments ✅ 帳號已建立，待補 USDT TRC-20 錢包地址（等 MAX KYC 通過）
3. Atlas Cloud 申請，測試 Wan Spicy / Flux Dev 無審查 API 串接
4. 成人站圖片功能先上，驗證用戶付費意願
5. 影片功能等開源模型成熟後再上（預計 6-12 個月後）
6. 愛沙尼亞 e-Residency 公司成立後申請 Segpay 信用卡金流
7. 營收穩定後評估遷移至 RunPod Serverless 自建 GPU 架構

---

## 多語系規劃

- 主力：英文（市場最大、法律風險最低）
- 次要：德文（德國成人內容合法化完善，有助歐洲金流申請）
- 次要：日文（消費力強，但 AI 生成成人內容法規仍在討論中）
- 補充：中文（可做但行銷上低調，不主動推台灣市場）
- 技術：Next.js i18n 內建支援，JSON 管理靜態翻譯，工程量不大

---

## 行銷管道

- 成人站：Meta 廣告完全禁止，只能走成人廣告網路
- TrafficJunky（OurDream 在用）/ ExoClick / TrafficStars
- 成人廣告網路不需要粉絲專頁，直接投放網址即可
- 多語系策略：網站以英文+德文+日文+中文為主介面，吸引歐美日市場，有助於歐洲金流申請審核通過率

---

## 競品分析（OurDream.ai，2026/04）

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

---

## 台灣法規確認（2026/05/01）

- AI生成成人內容目前無專法，處於法規空窗期（人工智慧基本法2025/12通過，細則12-18個月後才出）
- 合法經營條件：年齡驗證（18歲確認）+ 付費驗證 + 禁止硬蕊內容（暴力/人獸交）
- 最大風險來自伺服器所在國、金流公司、目標市場法規，德國市場法規最友善
- AI 生成人物圖片在 Apple 審核屬敏感領域，上架前需法律評估
- 綠界不支援成人內容，主站金流與成人站金流必須完全分離
- 點數不能移轉（法律風險），但主站角色和資料可移轉到成人站

---

## 待完成項目

- ⬜ 成人站架構規劃（獨立網域、獨立服務、獨立金流）
- ⬜ 成人站身份驗證系統（上傳身份證、後台審核、adult_verified欄位）
- ⬜ 成人站獨立點數系統（adult_credits欄位，與主站完全分離）
- ⬜ 後台成人驗證審核頁面（一鍵通過/拒絕）
- ⬜ 後台手動發成人點數功能
- ⬜ 主站資料移轉至成人站（角色/圖片/歷史，驗證通過後開放）
- ⬜ 成人站金流串接（SubscribeStar主力 + NexaPay補充）
- ⬜ MAX KYC → 取得 TRC-20 地址 → 填入 NOWPayments + NexaPay
- ⬜ Paxum 身份驗證完成（需護照）→ 填入 SubscribeStar Payout
- ⬜ Atlas Cloud 申請，測試 API 串接
- ⬜ 愛沙尼亞 e-Residency 公司成立 → 申請 Segpay 信用卡金流
