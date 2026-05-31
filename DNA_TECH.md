# 🔧 DNA_TECH.md — 技術細節（修程式時與 DNA_CORE.md 一起貼）

---

## 資料庫（Supabase）

表格：profiles（欄位：id, created_at, email, credits, plan, daily_image_count, daily_image_date, daily_video_count, daily_video_date, history_limit, referral_code, referred_by, referral_credits_earned, locked_character, checkin_last_date, checkin_streak, birthday）
profiles.birthday：TEXT，格式 MM-DD（月份-日期各兩位），用戶生日，選填，設定入口在每日簽到頁
表格：user_generations（欄位：id, user_email, image_url, video_url, prompt, status, created_at, character_id）
表格：saved_characters（欄位：id, user_email, name, image_url, description, voice_id, created_at）
SaveCharacterModal 關係標籤快選（2026/05/10）：app/components/SaveCharacterModal.tsx，六個標籤（初戀/前輩/青梅竹馬/命中注定/契約戀人/死對頭），state: selectedRelation，選完自動帶入 description 最前面
表格：admin_settings（欄位：key, value, updated_at）
admin_settings 的 key 欄位已加 UNIQUE constraint（admin_settings_key_unique），upsert onConflict:"key" 才能正確運作（2026/05/10 修正）
表格：referral_logs（欄位：id, referrer_email, referred_email, plan, credits_awarded, created_at）
表格：model_tracker（欄位：id, model_id, model_name, status, note, created_at, updated_at）
表格：pending_orders（欄位：id, order_no, email, plan, referral_code, created_at）
表格：checkin_logs（欄位：id, email, ip, checkin_date, streak, credits_earned, created_at）
表格：feedback_messages（欄位：見 API）
表格：credit_adjustments（欄位：admin_email, user_email, amount, reason, created_at）
RLS：大部分表已停用，用 Service Role Key。chat_sessions 和 chat_messages 原本開啟導致 insert 失敗，2026/05/20 已關閉。
admin_settings 整張表初始為空，後台儲存才會逐一寫入各 key。注意：upsert onConflict:"key" 需要 UNIQUE constraint 存在才能運作（已建立 admin_settings_key_unique）。首次部署時必須先執行初始化 SQL 把所有 key 寫入，否則後台儲存會靜默失敗只存入部分 key（已知：未初始化時只有 adult_section_enabled 能成功寫入）。初始化 SQL 已記錄於開發紀錄，執行後再按一次後台「儲存設定」即可正常運作。
plan 預設值：free
新用戶自動建立 profiles 並給 5 點
Storage bucket：character-images（Public，已設定 allow all policy）
表格：chat_messages（欄位：id, session_id, user_email, role, character_id(text), content, created_at）
表格：chat_sessions（欄位：id, user_email, character_ids(text[]), background_story, is_group, created_at, updated_at）
chat_sessions 和 chat_messages 的 RLS 已關閉（2026/05/20，原本開著導致 insert 失敗）
chat_messages.character_id 從 uuid 改為 text（2026/05/20，saved_characters.id 為 integer 非 uuid）
chat_sessions.character_ids 從 uuid[] 改為 text[]（2026/05/20，同上原因）
表格：public_gallery（欄位：id, name, age, personality_tags(text[]), story, story_type(short/mid/long), image_url, video_url, like_count_min, like_count_max, chat_count_min, chat_count_max, is_featured, is_active, sort_order, model_label, created_at, actual_chat_count, gender, appearance）
profiles 表新增欄位：chat_count（已使用對話次數，預設0）

---

## AI 模型

圖片生成：black-forest-labs/flux-1.1-pro（約 $0.04/張）
圖片生成備選評估：GPT Image 2（OpenAI，4K寫實質感，競品 ChatArt 主打，中期列入評估，目前 Flux 1.1 Pro 為主力）
影片生成：kwaivgi/kling-v3-omni-video（約 $0.28/支，mode: "standard"）
角色一致性：black-forest-labs/flux-kontext-pro（已串接，免費付費均可用）
影片生成第二選擇：bytedance/seedance-2.0（Replicate，1080p，原生音訊，約 $1.26/支）
影片生成第三選擇（快速版）：bytedance/seedance-2.0-fast
TTS 語音合成：ElevenLabs Multilingual v2（已串接，Starter 方案，60,000字/月）
動作參考影片：kwaivgi/kling-v3-motion-control（套用參考影片動作到角色照片，image_orientation: "image" 角色面向以照片為準，沿用 Kling 5秒點數定價）
嘴型同步：kwaivgi/kling-lip-sync（$0.014/秒輸出影片）
說話影片（Avatar）：kwaivgi/kling-avatar-v2（Standard $0.056/秒・Pro $0.115/秒，圖片+音頻直接生成說話影片，不需先有影片）

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

說話影片合計扣點：TTS + Avatar 兩段合計，入門 18點/次・標準 16點/次・專業 14點/次（tts_credits + wav2lip_credits）

---

## UI 互動邏輯防呆

進度條：圖片 60 秒倒數，影片 120 秒倒數
影片超過 120 秒顯示「排隊中...」提示，繼續 polling 不中斷
Gallery 依方案等級顯示：免費5筆、付費方案50筆（同時受天數限制）
localStorage (key: last_prediction_${userEmail}) 保持最後一次生成狀態（依帳號分開）
鎖定角色不再用 localStorage，改存於 profiles.locked_character 欄位，透過 /api/user/credits 讀取（2026/05/08 修正）

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
- selectedPersonality + selectedJob + customPersonality 只存入角色資料（description 欄位），不拼入 prompt（刻意設計：Flux 對中文個性詞理解有限，個性標籤的作用是存入 description 供聊天室 system prompt 使用，不影響生圖表情；FACS 表情對照只用於後台產圖和聊天室自拍，禁止在六步驟生圖 prompt 加入表情描述）
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

key 清單（共40個，後台沒設定時 route.ts 有 fallback 預設值）：
- N03 推薦里程碑 key（共3個）：`referral_milestone_1/2/3`（JSON格式 {"count":N,"credits":N}）
- N04 優惠控制 key（共10個）：`promo_countdown_end`、`promo_banner_text`、`promo_firstbuy_text`、`promo_countdown_text`、`promo_badge_starter/standard/pro`、`promo_quota_starter/standard/pro`
- 影片點數 key（共12個）：`kling_5s/10s_starter/standard/pro`、`seedance_5s/10s_starter/standard/pro`
- Omni 加費 key（共3個）：`omni_extra_starter/standard/pro`
- Avatar 說話影片點數 key（共3個）：`wav2lip_credits_starter/standard/pro`（預設 10/9/8）（注意：程式統一用 wav2lip_credits，不是 kling_avatar_credits）
- 動作參考影片限制 key（共3個）：`motion_max_size_mb`（預設30）、`motion_min_duration_sec`（預設5）、`motion_max_duration_sec`（預設10）
- 方案點數 key（共3個）：`plan_credits_starter/standard/pro`（預設 30/80/200）
- 方案售價 key（共3個）：`plan_price_starter/standard/pro`（預設 250/450/799）
- 方案加贈點數 key（共3個）：`plan_bonus_credits_starter/standard/pro`（預設 5/7/10）

---

## 影片生成 API 路由
- /api/character：主要影片/圖片生成（Kling、Seedance、Flux）
- /api/upload-video：上傳動作參考影片到 Supabase Storage character-images bucket（從 admin_settings 動態讀取大小/時長限制）
- /api/motion-control：呼叫 Kling Motion Control 模型，免費用戶不開放，沿用 Kling 5秒點數
- /api/admin/gallery：後台角色上架管理（GET 取得列表、POST 新增或更新、DELETE 刪除）
- /api/admin/gallery/generate：AI 隨機產生角色資料（Claude Haiku，回傳 name/age/gender/personality_tags/story，年齡18-40，姓氏從20個台灣常見姓氏隨機選）
- /api/admin/gallery/generate-image：後台專用產圖（Replicate flux-1.1-pro，不扣用戶點數，不受每日限制）。GET polling成功後自動上傳Supabase Storage回傳permanentUrl，加隨機seed防臉孔重複。注意：舊資料若為Replicate臨時URL（約24小時過期）需重新產圖修復。

---

## AI 表情描述對照表（FACS → Flux/Kling 自然語言）
以下為情緒對應的 Flux 1.1 Pro / Kling 3.0 可理解描述，用於後台產圖 prompt 和 selfie prompt 撰寫：
- 開心/微笑：`subtle warm smile, slightly raised cheeks, soft eyes`
- 驚訝/震驚：`wide eyes, raised eyebrows, mouth slightly open, surprised expression`
- 生氣/憤怒：`furrowed brows, intense gaze, lips pressed tight, fierce expression`
- 悲傷/難過：`downcast eyes, slightly raised inner brows, corners of mouth pulled down, melancholy expression`
- 害羞/靦腆：`shy half-smile, slightly flushed, eyes glancing away, bashful expression`
- 冷漠/距離感：`neutral expression, slightly narrowed eyes, cool detached gaze`
- 妖嬈/魅惑：`half-lidded eyes, subtle smirk, alluring expression, soft focus gaze`

## FACS 表情整合範圍（2026/05/27）
- ✅ 後台產圖（/api/admin/gallery/generate-image）：根據 personality_tags 自動對應表情，找不到符合標籤 fallback 用 natural relaxed expression
- ✅ 聊天室自拍 fallback（extractMoodFromMessage）：11種關鍵字對應 FACS 自然語言描述，取代舊版薄弱的7個對應
- ✅ 聊天室自拍姿勢池（buildSelfiePrompt）：七種攝影姿勢隨機選取，Claude 主路徑作為參考建議，fallback 直接帶入
- ✅ 六步驟創作 Step 4 動態環境標籤：新增5個動態場景（強風動態/暴雨電影感/沙漠風暴/櫻花飄落/雷雨夜）
- ❌ 六步驟創角色（selectedPersonality）：刻意不加，原因見上方設計決策說明

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

## 聊天記憶系統（2026/05 競品分析後規劃）

### 現有記憶機制
- sessionId 存入 localStorage（key: `chat_session_${email}_${characterId}` 單人 / `chat_session_group_${email}` 群組 / `chat_session_gallery_${email}_${galleryId}` gallery角色）
- 重開聊天室自動帶入上次 sessionId，延續對話歷史
- 每次呼叫 /api/chat 帶入最近20筆歷史（chat_messages 表）

### ✅ 長期記憶摘要系統（2026/05/07 已完成）
- 觸發條件：session 累計超過 50 筆時自動觸發
- 摘要邏輯：呼叫 Claude Haiku，將最舊 20 筆壓縮存入 chat_sessions.background_story
- 防並發：寫入前檢查 background_story 是否有 [LOCK] 前綴，有則跳過；摘要過程中寫入 [LOCK] 前綴，完成後覆蓋為新摘要（解鎖），任何錯誤都在 catch 還原並解鎖
- 使用方式：每次呼叫 /api/chat 先讀 background_story，有值則插入 charSystem 最前面「【對話背景摘要】...」
- 摘要後刪除：已壓縮的 20 筆從 chat_messages 刪除
- 不計 chat_count、不扣點數
- 函式名稱：maybeGenerateSummary(sessionId)，非同步觸發不阻塞回應
- 注意：修改此區塊前確認 backgroundStory / memoryPrefix / maybeGenerateSummary 三者都存在，缺一報 ts(2304)
- 注意：讀取 backgroundStory 時必須過濾 [LOCK] 前綴：`rawStory?.startsWith("[LOCK]") ? rawStory.slice(6) : rawStory`
- Supabase DELETE 為原子操作：摘要進行中（LOCK 期間）若有並發讀取 chat_messages，不會讀到正在被刪除的訊息，race condition 風險低，無需額外防護。

### ✅ 聊天推薦台詞功能（2026/05/07 已完成）
- 位置：聊天輸入欄旁「💬」按鈕
- 功能：點擊後呼叫 /api/chat/suggest，帶入 sessionId、characterName、characterDescription，回傳 3 個符合角色個性的開場白選項
- 顯示：輸入欄上方彈出小卡片，點選後填入輸入欄（不自動送出）
- 扣點：不扣點（純 UI 輔助）
- API：app/api/chat/suggest/route.ts（fetch 直接呼叫 Anthropic API，不用 SDK）
- 涵蓋：單人聊天室、群組聊天室、預設角色聊天室

### ✅ 現實時間感知（2026/05/10 已完成）
- 在 charSystem 加入當前台灣時間和時段（早上/下午/晚上/深夜）
- 角色可自然融入時間感（深夜說「都這麼晚了」，早上說「早安」），不強制每次提
- 實作：`const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false })`
- timeHint 插入 charSystem 的旁白描述之後、isGroup 判斷之前
- 不需新功能，只需更新 /api/chat/route.ts 的 charSystem prompt
- 在 charSystem 加入：「在回覆中可以自然穿插括號旁白描述你的動作、表情或心情（例如：（他微微一笑，視線落在遠方）），讓對話更有畫面感和沉浸感。旁白用括號包覆，與對話內容自然融合，不要太頻繁，約每2-3則穿插一次。」
- 注意：旁白格式用（全形括號），避免與程式邏輯衝突
- 禁止移除或修改括號旁白 prompt，格式必須用（全形括號）
### ✅ 聊天室對話搜尋（已完成）
- 位置：四個聊天室頂部右側 🔍 按鈕（單人/群組/預設角色單人/預設角色群組）
- 功能：輸入關鍵字，在 messages state 中純前端篩選，高亮匹配訊息（目前匹配亮綠框 ring-2、其他匹配淡綠框 ring-1）並自動捲動
- 搜尋結果顯示「第 X / Y 筆」，↑↓ 切換，✕ 關閉
- 相關 state：searchOpen / searchQuery / searchIndex / searchInputRef / messageRefs
- 不需新 API，不影響 sessionId / autoMessageTimer
### ✅ 預設角色系統（2026/05/07 已完成）
- DEFAULT_CHARACTERS 陣列寫死在三個檔案：app/characters/page.tsx、app/chat/default/[characterId]/page.tsx、app/chat/default-group/page.tsx
- 單人路由：/chat/default/[characterId]
- 群組路由：/chat/default-group?ids=default-f1,default-m3
- 不支援自拍（偵測到關鍵字回傳付費提示文字），header 顯示「無自拍」小字
- 支援記憶（DB 修復後自動生效，2026/05/20）
- sessionId localStorage key：chat_session_default_${email}_${characterId}（單人）/ chat_session_default_group_${email}_${ids}（群組）
- /api/chat 新增 defaultCharacter / defaultCharacters 參數，優先於 saved_characters 查詢
- 中期待實作：後台管理頁面讓圖片可上傳替換
- 預設角色區塊預設收合，點標題列展開/收起（defaultExpanded state）
- 預設角色聊天室 header 顯示「無記憶・無自拍」小字提示（2026/05/20）

### ✅ 聊天室風格面板（2026/05/10 已完成，2026/05/20 位置統一）
- 位置：輸入列旁 🎨 按鈕，點擊展開/收合；面板統一放在輸入列下方（showSuggest 之後）
- 面板上半：顯示角色底層設定（名稱/個性/聲線，群組版顯示所有參與角色）
- 面板下半：口吻（療癒/毒舌/刺激）+ 文風（直白/文藝/輕小說）同一排，中間豎線區隔
- state：showStylePanel / chatStyle / writingStyle
- 傳遞：handleSend body 帶入 chatStyle / writingStyle → /api/chat/route.ts 注入 system prompt 末尾
- 涵蓋：單人自建、群組自建、預設角色單人、預設角色群組、gallery 五個聊天室
- route.ts：styleMap / writingMap / styleHint / writingHint 四個變數，禁止移除

### ✅ 訊息回覆 + 群組 @Tag（2026/05/11 已完成）
- 回覆功能：四個聊天室新增 `replyTo` state（{ characterName, content }），assistant 氣泡下方顯示「↩ 回覆」按鈕，點擊後輸入框上方顯示引用卡片，送出時 message 拼入「（回覆 XXX：「前30字...」）\n用戶訊息」，顯示訊息加「↩ 回覆 XXX：」前綴，送出後清除 replyTo
- @Tag 功能（群組自建+預設群組）：新增 `tagMenu` state，輸入框 onChange 偵測結尾為 @ 時自動展開角色選單，點選插入 @角色名；訊息氣泡下方額外顯示「@ Tag」按鈕可快速插入；handleSend 送出時用 IIFE 偵測 message 包含哪個 @角色名 傳 taggedCharacter；送出後清除 tagMenu
- API（/api/chat/route.ts）：body 新增 `taggedCharacter` 參數，shuffledChars 邏輯：有 taggedCharacter 時 filter 只留該角色，找不到時 fallback 隨機；單人聊天不受影響

### ✅ 聊天內容揭露（2026/05/07 已完成）
- 頂部固定小字：所有聊天室頂部顯示「支援曖昧互動，明確露骨內容由 AI 自動過濾」
- 每日提示框：進入聊天室檢查 localStorage key「chat_notice_seen_${今日日期}」，每天第一次進入顯示，隔天重置
- 涵蓋範圍：單人聊天室、群組聊天室（預設角色聊天室頂部小字已內建，不另加提示框）
- guide 頁面：差異化區塊和線B展開內容均有說明

---

## 新功能資料庫需求（從競品分析衍生）

chat_sessions 表新增欄位（已有 background_story，確認可直接使用）：
- background_story：TEXT，存對話摘要，已存在

chat_messages 表可能新增：
- is_summarized：BOOLEAN，標記已被壓縮進摘要的訊息，預設 false
- 或直接刪除已摘要訊息（更簡單，建議此方案）

public_characters 表（待建立，公開角色市場用）：
- id, original_character_id, user_email, name, image_url, description, voice_id, tags, is_anonymous, like_count, created_at
- 對應 saved_characters，用戶選擇公開後複製一份到此表
- 需建立時機：公開角色市場功能開發時

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
簽到獎勵：每日轉盤隨機1-5點（1點65%/2點25%/3點5%/4點4%/5點1%，期望值約1.41點），連續第7天+3點，第14天+5點，第21天+5點，第30天+10點
簽到額外獎勵（待實作）：免費用戶簽到當日影片額度 +1（從1支→2支），不累積、不轉點數，當日有效
簽到時區：台灣時區（Asia/Taipei），用 toLocaleDateString("en-CA") 取得 YYYY-MM-DD 格式

---

## 已知問題備忘

- Supabase RLS 已停用，用 Service Role Key
- history 變數在所有地方強制 Array.isArray 檢查
- Replicate 圖片 URL 有效期約 24 小時，鎖定角色時已改為上傳到 Supabase Storage 永久保存
- /api/upload-image 支援兩種輸入格式：https URL（fetch下載再上傳）和 base64 Data URL（直接decode上傳），2026/05/11 修正
- Upload Modal 的本機上傳圖片（主圖、omniRef1/2/3）皆為 base64，送出生成前必須先呼叫 /api/upload-image 換成 https URL，再傳給 Replicate，禁止直接傳 base64 給任何 Replicate 模型
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
- Android/iOS App 內建瀏覽器（Line/FB/IG/Threads）登入出現 disallowed_useragent 是 Google OAuth 限制，叫用戶改用 Safari 或 Chrome；Landing Page CTA 登入按鈕已加 InApp 瀏覽器偵測提示（偵測 Threads|FBAN|FBAV|Instagram|Line\/|MicroMessenger）
- 主頁 page.tsx 的 `<main>` 必須保留 `bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]`，否則背景漸層消失
- 圖片比例 state 名稱：imageRatio，預設 "1:1"，透過 handleSubmit 傳入 character/route.ts
- Kling 影片比例受參考圖影響，根本解法是生圖時就選好目標比例，不做裁切
- 儲存成果按鈕改為 downloadFile（不用 window.open，iOS Safari 新分頁無法顯示 Supabase 圖片）
- Hero 影片不放在 public/ 資料夾（git 無法追蹤 mp4），改用 Supabase Storage CDN 托管
- Hero 影片 URL（首頁）: https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/hero-home.mp4
Hero 影片 URL（角色生成頁）: https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/hero.mp4
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
群組聊天主動發話 timer 的 useEffect dependencies 必須是 [started, selectedIds, session, sessionId, characters]，禁止放 loading，否則 loading 變化會不斷重啟 timer 導致角色永遠不主動發話
triggerSelfie 生成自拍照片/影片成功後，必須呼叫 /api/history POST 存入歷史（prompt: "AI 自拍" 或 "AI 自拍影片"），否則歷史頁看不到自拍紀錄
說話影片 Modal 必須顯示文字長度警告（超過 55 中文字提示 TTS 將截斷），單人和群組聊天室均需
Seedance E005 錯誤：Replicate bytedance/seedance-2.0 不支援真實人臉輸入，上傳真實照片會觸發 E005 封鎖。Upload Modal 線路五（高精度角色影片）已在 UI 標示⚠️警告，用戶自行評估風險
Upload Modal 直接生成流程（2026/05/12 重構）：handleUploadDirect 函式負責執行，直接用原圖傳給 Kling 或 Seedance，不再有 Flux Kontext 鎖臉步驟。multi_reference 走 seedance，其他三個功能走 kling
scrollIntoView 補漏：Upload Modal 生成按鈕 onClick 關閉 Modal 後需加 setTimeout(() => progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300)，此行在修改一已確認但尚未貼入
wav2lip/route.ts 仍在使用中（TtsModal.tsx 依賴），不可刪除，待評估是否遷移至 kling-avatar
TtsModal 新增 mediaUrl prop，優先用 mediaUrl，沒有才用 prediction?.output
聊天室 triggerSelfie 呼叫 /api/generate-image 必須帶 userEmail 參數，否則 output 回傳空物件 {}
聊天室 triggerSelfie 的 selfieIntent 型別必須用 `r.selfieIntent === "photo" || r.selfieIntent === "video"` 做判斷，再 as "photo" | "video" 轉型，才能正確呼叫 triggerSelfie
✅ 自拍偵測 detectSelfieIntent 已升級為 Claude 推斷（見本視窗記錄），舊關鍵字純比對邏輯已棄用
群組聊天多角色 Claude 呼叫改為 Promise.all 並行，大幅降低 timeout 風險
Vercel 已升級為 Pro 方案（$20 USD/月，timeout 60 秒）（2026/05/05）
ANTHROPIC_API_KEY 必須在 Vercel Environment Variables 設定，否則聊天 API 回傳「（無回應）」
GlobalHeader 「使用指南」改為直接跳 /guide，不再觸發 open-onboarding 事件（open-onboarding 只有首頁 page.tsx 有監聽）
群組聊天 plan 判斷必須等 API 回傳後才執行（planLoaded state），否則付費用戶會被短暫顯示封鎖畫面
聊天室自拍影片生成提示：`🎬 影片生成中，扣4-6點..\n請耐心等候，不要關閉視窗！`（單人自建+群組自建聊天室）
預設角色聊天室（單人/群組）：照片關鍵字和影片關鍵字分開攔截，顯示對應付費提示（照片📸/影片🎬），不支援實際自拍生成

---

## profiles 表新增欄位（2026/05/08）

- `total_generations` (integer, default 0)：用戶累計總生成次數
- 寫入時機：`/api/history` POST 時自動 +1
- 用途：後台 `/admin/members` 統計用，獨立於 user_generations 表
- **重要**：user_generations 表會被 `/api/history` GET 自動清理（免費影片3天/付費影片7天/圖片7-90天），所以後台統計**不能**直接 count user_generations，必須讀 profiles.total_generations
- 已回填過去歷史資料（2026/05/08 一次性 SQL 更新）

## 鎖定角色機制（2026/05/08 修正）

- 鎖定角色綁定帳號，存於 `profiles.locked_character` 欄位
- 前端讀取必須走 `/api/user/credits` 拿（會回傳 locked_character），**禁止讀 localStorage**
- localStorage 已不再使用，避免跨帳號污染（同瀏覽器多帳號會看到別人的鎖定角色）

## 日期格式統一（2026/05/08）

- 所有 API 寫入 `daily_image_date`、`daily_video_date`、`checkin_last_date` 等日期欄位，**統一使用 `toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })`**（YYYY-MM-DD 格式）
- 禁止使用 `'zh-TW'`，會產出 `2026/5/8` 與其他 API 不一致

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
- / 首頁（已登入：GallerySection瀑布流畫廊 / 未登入：Landing Page）
- /create 創作工作室（六步驟生成，原主頁功能移至此）
- /gallery/[id] 角色詳細頁（M02，2026/05/21完成）
- /characters 我的角色（新建）
- /chat/[characterId] 單人聊天（新建）
- /chat/group 群組聊天（新建）
- /guide 使用指南（新建，2026/05/07 新增青藍色「為什麼我們不一樣？」差異化區塊，位於四條主線下方、點數方案上方，內容以陣列管理）
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
- Landing 行銷語言方向（待正式文案確定後更新）：「記得你說過的每一件事」/「你的角色，只有你有」/「圖片＋影片＋說話影片一站完成」

首次登入 Onboarding：
- 彈窗選三條主線（創作/聊天/快速產出）
- 選完帶到對應功能
- 可跳過

/characters 頁面：
- 收藏角色列表（卡片點擊展開B2選單）
- B2選單：生成/聊天/鎖定
- 群組聊天入口（選角色→開始）

/guide 使用指南：
- 四條主線上方新增「🌐 社群功能」可折疊區塊（探索角色/角色詳細頁/投稿角色）（2026/05/22）
- 四條主線流程圖（含聊天相關主線）
- 每步驟顯示點數成本
- 底部補充說明聊天計費規則
- 「為什麼我們不一樣？」差異化區塊（青藍色，共10條，資料來源 app/data/whyDifferent.ts）

/chat/[characterId]：單人聊天頁（已建立）
/chat/group：群組聊天頁（已建立）
/guide：使用指南頁（已建立）

## Upload Modal 五條線路（2026/05/11 重構）
- 線路一（說話影片）：照片 + 文字 → TTS → Kling Avatar
- 線路二（AI 自由發揮）：照片 → Kling，無 prompt
- 線路三（文字指定動作）：照片 + prompt → Kling
- 線路四（套用動作影片）：照片 + MP4 → Kling Motion Control，付費限定
- 線路五（高精度角色影片）：照片 + omniRef → Seedance，付費限定，真實人臉⚠️E005
- 所有線路不鎖臉，無 Flux Kontext Step 1
- handleUploadWithFaceLock 已重構為 handleUploadDirect
- 線路一新增 handleUploadAvatar 函式：前端 TTS → base64 音頻 → /api/kling-avatar → polling → setPrediction
- handleUploadAvatar 的 polling 用 avatarTimer（setInterval 每 3 秒 +3）更新 seconds，finally 清除
- avatarTimer 型別宣告：let avatarTimer: ReturnType<typeof setInterval> | undefined = undefined（不能用 null）
- Upload Modal 說話影片試聽：avatarTtsAudio / avatarTtsCache / avatarTtsPreviewCount / AVATAR_TTS_MAX_PREVIEW 四個 state，禁止移除
- 聲音選擇：10個（female-1~5 / male-1~5），女左男右兩欄排列，切換聲音時同步清空 avatarTtsAudio
- selectedFunction 型別：`"free_motion" | "motion_video" | "multi_reference" | "avatar"`
- 自動鎖定角色的 fetch 邏輯已移除（2026/05/12）

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
CRON_SECRET=（自訂隨機字串，Vercel Cron cleanup-gallery-works 驗證用）
✅ 自拍每日限制與內容違規錯誤訊息分開（2026/05/28）：三個聊天室（/chat/[characterId]、/chat/group、/chat/gallery/[id]）triggerSelfie 呼叫 /api/character 前先查 /api/user/credits 確認免費用戶每日額度，額度用完 throw new Error("DAILY_LIMIT")，catch 區塊新增 isDailyLimit 判斷，顯示「📅 今日自拍次數已達上限」；內容違規顯示「⚠️ 此圖片因內容涉及違規」；其他錯誤顯示原始訊息。
✅ 藍新 notify 解析修復（2026/05/28）：notify/route.ts 的 TradeInfo 解密後格式為 JSON（非 URLSearchParams），已改用 JSON.parse 解析，取 parsed.Result.MerchantOrderNo。修復前所有 notify 均回傳 404（order not found），點數無法自動入帳。yaomay1981@gmail.com 已手動補35點（入門包30+加贈5）。待下次真實付款確認自動入帳正常。
✅ mediaUrl 圖片渲染修復完成（已確認 2026/05/27）：app/chat/gallery/[id]/page.tsx、app/chat/default/[characterId]/page.tsx、app/chat/default-group/page.tsx 三個聊天室均已補齊 mediaUrl 欄位定義和氣泡渲染邏輯，上傳圖片可正常顯示。
✅ 所有聊天室訊息區背景色統一（2026/05/19）：bg-black（純黑），涵蓋單人/群組/預設單人/預設群組/gallery 五個聊天室
✅ 所有聊天室 textarea 輸入框內部背景色統一（2026/05/19）：bg-black，涵蓋五個聊天室
✅ 聊天室 isTyping 統一（2026/05/20）：五個聊天室均已加入 isTyping state，打字動畫改用 loading || isTyping 控制，API回來後立刻解鎖輸入，角色逐則顯示前才顯示打字動畫
✅ 聊天室風格面板位置統一（2026/05/20）：五個聊天室風格面板統一移至輸入列下方（showSuggest 之後）
✅ 聊天室上傳圖片補角色回應（2026/05/20）：五個聊天室 📎上傳圖片後均會呼叫 /api/chat 讓角色看圖回應
✅ 聊天室上傳圖片預覽（2026/05/20）：五個聊天室均已補上 mediaUrl 顯示，含 Message interface 補欄位、氣泡補渲染、setMessages 補 mediaUrl、replyTo 移到輸入列上方
✅ chat_count 精算修正（2026/05/25）：/api/chat/route.ts chat_count 改為 responses.length（實際回覆數），不再用 characterList.length（全部角色數）。超量 creditCost 採方案A：預扣1點保守值，responses 完成後用 actualCount 精算，若 actualCount > 1 則補扣差額（actualCount - 1）。補扣邏輯在 API responses 完成後執行；若 API timeout 或用戶斷線導致精算未執行，下次進入聊天室時點數以 /api/user/credits 最新值為準，不做額外對帳。newChatCount、remainingQuota、回傳 creditCost 均同步修正。
✅ 自拍等待追問功能（2026/05/25）：單人自建（/chat/[characterId]）和群組自建（/chat/group）的 triggerSelfie 加入 waitTimer，生成期間每60秒發一則等待訊息，最多3次，finally clearInterval 確保清除。
✅ 說話影片扣點修正（2026/05/25）：單人自建和群組自建聊天室說話影片 polling 成功後改為 fetch /api/user/credits 取得真實點數，移除假扣點 setCredits(prev => prev - avatarData.creditCost)。自拍照片/影片完成後同樣改為 fetch 真實點數。
✅ gallery 聊天室自拍提示文字修正（2026/05/25）：「需收藏角色才能用」改為「需自創角色才能用，去我的角色建立專屬角色」。
✅ 群組超量提示文字修正（2026/05/25）：底部「每次 -{selectedIds.length} 點」改為「每則回覆扣 1 點」，與實際邏輯一致。
✅ 群組聊天室聲音選項統一（2026/05/25）：/chat/group/page.tsx 說話影片 Modal 的 VOICE_OPTIONS label 格式改為與 VoiceSelector 一致（👩/👨 emoji + 中文描述），如「👩 低沉女聲」。
✅ GlobalHeader 新增「角色生成」按鈕（2026/05/20）：導向 /create，涵蓋桌面版和手機 Drawer
✅ 單人聊天室顏色統一（2026/05/20）：訊息區 bg-black、header 漸層改純黑、無圖時 bg-black/20、textarea bg-black
✅ gallery 聊天室新增📎上傳圖片功能（2026/05/19）：對標其他四個聊天室，呼叫 /api/upload-chat-image，帶入 defaultCharacter fakeChar 參數
✅ 後台產圖永久URL修正（2026/05/19）：generate-image/route.ts GET polling成功後自動下載上傳Supabase Storage，回傳permanentUrl。gallery/page.tsx優先用permanentUrl，fallback才用Replicate URL。舊資料若為Replicate臨時URL（約24小時過期）需重新產圖修復。
✅ 後台產圖差異化臉孔（2026/05/19 起持續優化至 2026/05/21）：
- generate-image/route.ts：隨機seed + randomFeature(16種) + randomHair(12種髮型) + randomFace(8種臉型) + randomSkin(6種膚色) + randomLighting(6種打光) + randomAngle(8種角度)
- generate/route.ts：appearance六維度描述，髮色限制為亞洲人常見色（禁止blonde/platinum/silver/white/golden/ash）
- gallery/page.tsx：imgPrompt帶入appearance + 職業對應場景+穿著(50種) + 體型(5種) + 表情(7種) + 細化年齡分段(20s/28/35/40/50)
- generate/route.ts：職業去重機制，查最近50筆已用職業注入prompt排除，職業清單擴充至50個
- generate/route.ts：max_tokens 500→1000，修復長故事偶爾當掉問題
- 故事字數：中故事100字→200字，長故事200字→400字（2026/05/21）
✅ admin_settings 新增key（2026/05/19，共13個）：referral_milestone_1/2/3（JSON {"count":N,"credits":N}）、promo_countdown_end、promo_banner_text、promo_firstbuy_text、promo_countdown_text、promo_badge_starter/standard/pro、promo_quota_starter/standard/pro
✅ Supabase 新表 referral_milestone_logs（2026/05/19）：欄位 id uuid PK, email text, milestone_index integer, credits_awarded integer, created_at timestamptz。UNIQUE INDEX referral_milestone_logs_unique on (email, milestone_index)。RLS停用。
✅ /api/referral/milestone/route.ts（2026/05/19）：GET 查詢推薦里程碑進度，回傳 referralCount + milestones 陣列（index/count/credits/claimed/reached）
✅ 聊天記憶系統修復（2026/05/20）：修復所有聊天室記憶完全失效的大 bug。根本原因：chat_sessions.character_ids 為 uuid[] 但 saved_characters.id 為 integer；chat_messages.character_id 為 uuid 同樣不相容；兩表 RLS 開著擋住 insert。修復：DB schema 改 text[]/text、RLS 關閉、/api/chat/route.ts 加 String(c.id) 轉型、history 讀取改 ascending:false + reverse() 確保帶入最新20筆。
✅ 預設角色聊天室補「無自拍」提示（2026/05/20）：default單人/default-group header 藍色「預設角色」標籤旁加「無自拍」小字，預設角色記憶已隨 DB 修復自動生效。
✅ M02 角色詳細頁（2026/05/21 完成）：新建 app/gallery/[id]/page.tsx，獨立角色詳細頁，含完整故事/標籤/喜歡次數/聊天次數/CTA按鈕。首頁 GallerySection 彈窗底部加「查看角色詳細頁面 →」按鈕。
✅ M03 留言區（2026/05/21 完成）：新建 Supabase 表 gallery_comments（id uuid PK, gallery_id uuid, user_email text, content text, created_at timestamptz），RLS停用，建 gallery_id 索引。新建 app/api/gallery/comments/route.ts（GET讀留言/POST新增）。留言區顯示在角色詳細頁底部，🗨️ 顯示真實留言數，email 自動遮罩。
✅ 喜歡/聊天次數跨頁一致（2026/05/21 完成）：GallerySection.tsx 和 gallery/[id]/page.tsx 統一改用 seededRandom(id+"_like"/_chat") 產生固定數字，同一角色在首頁卡片/彈窗/詳細頁顯示完全一致。gallery/route.ts 單筆查詢補齊 like_count_min/max/chat_count_min/max 欄位。
✅ 後台產圖年齡強化（2026/05/21 完成）：generate-image/route.ts 新增5段年齡 prompt 強化（18-29/30-39/40-49/50-59/60+），60歲以上強制加 deeply wrinkled/white or silver hair/age spots 等描述，放在 prompt 最前面確保模型優先識別。
✅ create/page.tsx 讀取 URL ?prompt= 參數（2026/05/21 完成）：新增 useSearchParams，頁面載入時自動帶入 prompt、setActiveStep(6)、捲動到 step6-section，解決「生成同款」跳轉後無帶入問題。
✅ 後台職業清單擴充（2026/05/21 完成）：generate/route.ts 職業清單從30個擴充至50個，去重查詢 limit 從30改為50。admin/gallery/page.tsx occupationScene 對照表補齊原本5個缺漏職業 + 新增20個職業，每個職業均包含場景背景和對應穿著描述。
✅ gallery 聊天室加詳情按鈕（2026/05/21 完成）：chat/gallery/[id]/page.tsx header 右側加入「詳情」按鈕，點擊跳轉 /gallery/[galleryId]。
✅ 角色詳細頁分享按鈕（2026/05/21 完成）：gallery/[id]/page.tsx 加入「🔗 分享角色」按鈕，點擊複製當前頁面 URL，顯示「✅ 已複製連結」2秒後還原。新增 copied state。
✅ Supabase 新表 gallery_comments（2026/05/21）：欄位 id uuid PK, gallery_id uuid, user_email text, content text, created_at timestamptz。RLS停用。建立 gallery_comments_gallery_id_idx 索引。新建 app/api/gallery/comments/route.ts（GET讀取留言/POST新增留言，200字上限，email遮罩顯示）。
✅ M01 探索角色頁（2026/05/22 完成）：新建 app/explore/page.tsx，含搜尋框（前端即時篩選）、排序Tab（熱門/最新）、性別篩選（全部/女性/男性，對應 public_gallery.gender 中文值）、標籤橫向滑動、精選橫向捲動、瀑布流2欄/3欄、IntersectionObserver 無限捲動（每次20筆）、免費第12張鎖定、置中Modal（同首頁邏輯含「查看詳細頁面→」）。GlobalHeader 新增「🌐 探索角色」入口（menuItems 第三位），路由 /explore。
✅ M04 公開角色投稿系統（2026/05/22 完成）：新建 public_characters 表（欄位：id uuid PK, original_character_id integer, user_email, name, image_url, description, voice_id, tags text[], visibility(private/anonymous/public), status(pending/approved/rejected), reject_reason, is_active bool, like_count int, created_at, source_public_character_id uuid）。RLS停用。投稿三步驟Modal（選角色→多選圖片→確認送出）在 GallerySection.tsx 虛線框觸發。投稿API：/api/public-characters/route.ts（POST投稿/PATCH審核，驗證方式用body/query string傳email而非getServerSession）。後台查詢API：/api/public-characters/admin/route.ts。核准時自動insert到public_gallery（source_public_character_id記錄來源）。退件時用admin_reply機制通知用戶。後台/admin/gallery新增「待審核」Tab，頁面載入即自動撈待審核數量。刪除public_gallery時若有source_public_character_id同步刪public_characters（在 /api/admin/gallery DELETE API 層手動執行，非 DB CASCADE，修改此 API 時需確保不漏掉此步驟）。
✅ public_characters表補gender欄位（2026/05/22）：ALTER TABLE public_characters ADD COLUMN IF NOT EXISTS gender text DEFAULT ''。GallerySection.tsx投稿Modal confirm步驟新增性別選擇（女性/男性/不設定），送出帶gender，route.ts核准insert到public_gallery時帶入item.gender。
✅ Claude API overload自動重試（2026/05/22）：/api/chat/route.ts偵測overloaded_error最多重試2次（第一次等2秒/第二次等3秒），全部失敗顯示「⚠️ 目前系統有點忙，請再說一次」，所有聊天室共用此修復。
✅ gallery聊天室loadingRef修復（2026/05/22）：app/chat/gallery/[id]/page.tsx新增loadingRef追蹤loading狀態，autoMessage timer改用loadingRef.current檢查，避免closure抓到舊值導致autoMessage和handleSend同時發送。
✅ 聊天室textarea改text-base（2026/05/22）：五個聊天室（gallery/single/group/default-single/default-group）textarea className從text-sm改為text-base（16px），防止iOS Safari因字體小於16px自動放大頁面導致畫面截斷問題。
✅ Bug修正三項（2026/05/24）：
- gallery聊天室actual_chat_count：改為每次聊天成功回應後+1（不再是進入時+1），涵蓋handleSend成功後呼叫/api/gallery/chat-count
- create/page.tsx PromoCard連動後台：新增promoBonus state，fetch /api/referral/settings-public動態讀取plan_bonus_credits_starter/standard/pro，JSX三處寫死數字改為state
- total_generations後端寫入：character/route.ts GET偵測succeeded時直接寫profiles.total_generations+1（帶email參數），history/route.ts POST移除重複+1邏輯，防止雙重計算
✅ E01角色間互相提起你（2026/05/24）：/api/chat/route.ts群組charSystem加入groupCrossMemory變數，群組對話中角色可自然提起其他角色說過關於用戶的事
✅ E02對話成就系統（2026/05/24）：/api/chat/route.ts在回應末尾檢查newChatCount，達到50/100/500則時觸發額外Claude呼叫，角色用人設語氣說出成就提示，responses額外push一則，回傳achievement欄位。⚠️ 2026/05/25修正：觸發條件改為charSessionCount（查chat_messages該角色在此session的訊息數），不再用全站累計newChatCount，各角色各自獨立計算。
✅ E03聊天解鎖機制（2026/05/24）：/api/chat/route.ts新增unlockMap（50/100/200/500則）、unlockType、unlockPromptMap四個等級，達標時觸發Claude生成解鎖內容，responses push isUnlock:true/unlockLevel欄位。前端三個聊天室（單人自建/群組/gallery）Message interface補isUnlock/unlockLevel欄位，setMessages帶入，氣泡渲染四種視覺風格：50則金色(unlock_secret)、100則紫色(unlock_mood)、200則藍色豎線(unlock_past)、500則金色+藍色豎線並排badge(unlock_confess)，均含「🔓 親密度解鎖」橫線分隔。⚠️ 2026/05/25修正：觸發條件同E02改為charSessionCount，各角色各自獨立計算。
✅ guide頁面社群功能區塊（2026/05/22）：四條主線上方新增「🌐 社群功能」可折疊區塊（探索角色/角色詳細頁/投稿角色）。
✅ Onboarding Modal 更新（2026/05/22）：新增「🌐 探索角色」選項，「生成AI角色」改跳 /create，「上傳照片轉影片」改跳 /create?upload=1。
✅ create/page.tsx 讀取 ?upload=1 參數（2026/05/22）：頁面載入時偵測 upload=1 自動開啟 Upload Modal。
✅ whyDifferent.ts 更新（2026/05/22）：新增第8條「🌐 探索角色社群」，目前共10條。
✅ /api/chat/route.ts 加錯誤 log（2026/05/22）：console.error("Claude API error:", ...) 方便 Vercel Logs 排查。

⚠️ 重要技術備忘（2026/05/22）：
- public_gallery.gender 值為中文（女性/男性），篩選時禁止用 female/male，否則篩選失效
- public_characters 表已有 gender 欄位（2026/05/22 補），投稿時需帶入
- Claude API overloaded_error 已有 retry 機制（/api/chat/route.ts），不需再另外處理
- 其他四個聊天室（非 gallery）的 loadingRef 問題理論上存在但尚未觀察到，低優先
⚠️ 重要技術備忘（2026/05/24新增，2026/05/25更新）：
- E02成就(achievement)和E03解鎖(unlock)是兩個獨立機制，同一則charSessionCount可能同時觸發（如50則同時是unlock_secret和achievement），需確認不衝突。注意：2026/05/25已改為charSessionCount，不再是newChatCount
- responses型別定義已補isUnlock/unlockLevel欄位，避免TS錯誤
- app/page.tsx的showPromoCard state和timer為死碼（JSX已移至create/page.tsx），不影響功能但可日後清理

✅ E04 免費用戶升級提示彈窗（2026/05/24）：五個聊天室（單人自建/群組/gallery/預設單人/預設群組）均已加入 showUpgradeModal state，第5/10/20則 assistant 回應後對 plan==="free" 用戶觸發，彈窗半硬擋（輸入框可見但有壓力），「先不了，繼續聊」可關閉。gallery/預設單人聊天室補讀 plan state（從 /api/user/credits 取得）。
✅ 首頁未登入可見瀑布流（2026/05/24）：app/page.tsx 移除 if(!session) return Landing Page 擋牆，未登入直接渲染首頁瀑布流。GallerySection.tsx 新增 isLoggedIn/onLoginRequest props，未登入點卡片第12張後或點「開始聊天」觸發登入提示 Modal（showLoginHint state），登入按鈕走 onLoginRequest callback from page.tsx。Splash 動畫新增未登入時也能結束的條件（session===null && status!=='loading'）。
## VoiceSelector 元件規範（待實作）
- 路徑：app/components/VoiceSelector.tsx
- 用途：統一管理聲線選擇，三個入口共用同一元件，日後新增/修改聲線只改此檔
- Props：selectedVoiceId(string) / onChange((voiceId:string)=>void) / userEmail(string) / plan(string) / characterId?(number)
- 三個引用入口：SaveCharacterModal.tsx（建角色）/ app/characters/page.tsx（角色設定）/ create/page.tsx Upload Modal（說話影片）
- 內容：10種預設聲線（現有）+ 克隆聲音選項（付費限定）+ 上傳新克隆入口
- 預設聲線清單統一維護於此元件，不再分散在各頁面

## Voice Cloning 規範（待實作）
- API：/api/clone-voice（POST：接收音頻檔 + email + characterId，呼叫 ElevenLabs IVC，回傳 voice_id 寫入 saved_characters.voice_id）
- ElevenLabs IVC endpoint：POST /v1/voices/ivc/create（multipart/form-data，files欄位傳音頻）
- 建議音頻：1-2分鐘清晰無背景噪音的MP3/WAV，128kbps以上
- 方案限制：入門以上才開放，免費用戶不可用
- 免責聲明：上傳前需勾選「本人聲音授權」checkbox
- 克隆voice_id存入saved_characters.voice_id，與現有預設聲線共用同一欄位
- 現有ElevenLabs方案：Starter（$5/月），IVC已包含，不需升級

## VoiceSelector 元件規範（已完成）
- 路徑：app/components/VoiceSelector.tsx
- 統一維護預設10種聲線（VOICE_OPTIONS export）、已克隆聲音列表、上傳新聲音克隆按鈕
- Props：selectedVoiceId / onChange / userEmail / plan / characterId?
- 三個引用入口：SaveCharacterModal.tsx / app/characters/page.tsx / app/create/page.tsx Upload Modal
- TtsModal.tsx 也已換成 VoiceSelector 元件
- 克隆聲音判斷：`!PRESET_VOICE_IDS.includes(ttsVoice)`，預設10個 id 在 TtsModal 內宣告為 PRESET_VOICE_IDS

## Voice Cloning 規範（已完成）
- API：app/api/clone-voice/route.ts
- ElevenLabs IVC 正確 endpoint：POST /v1/voices/add（不是 /v1/voices/ivc/create）
- 流程：接收 FormData（audioFile + email + characterId）→ 驗證付費用戶 → 呼叫 ElevenLabs → 寫入 saved_characters.voice_id → 回傳 voice_id
- CloneVoiceModal 內建錄音功能：MediaRecorder API，audioBitsPerSecond: 128000，echoCancellation + noiseSuppression 開啟
- iOS 需用 Safari，輸出 audio/mp4；Chrome 輸出 audio/webm;codecs=opus；副檔名由 recordedBlob.type 動態判斷
- 免責聲明勾選框必填才能送出

## TtsModal 克隆聲音規範（已完成）
- 克隆聲音試聽不受 TTS_MAX_PREVIEW 次數限制
- 選克隆聲音時隱藏「下載語音（扣N點）」按鈕
- 克隆聲音 voice_id 直接傳給 /api/tts，不經過 VOICE_MAP（/api/tts/route.ts 第33行：`const voice = VOICE_MAP[voiceId] || voiceId`）
- 台詞空白時顯示黃色提示文字，輸入後自動消失

✅ 聊天解鎖成就能見度提升（2026/05/25）：GallerySection.tsx 瀑布流卡片底部加「🔓 聊越多解鎖越多」標籤。gallery/[id]/page.tsx 詳細頁 CTA 按鈕下方加解鎖提示區塊。characters/page.tsx B2 選單「互動聊天」按鈕加🔓標籤。/chat/[characterId] 每日提示框加解鎖說明。guide/page.tsx 線B「開始聊天」加解鎖說明。
✅ 使用指南聲音克隆說明（2026/05/25）：guide/page.tsx 線A「加語音/說話影片」、線B「讓角色說話」、線C「說話影片」均加入聲音克隆說明文字。whyDifferent.ts 新增第11條聲音克隆差異化說明。
✅ E02/E03 觸發條件修正（2026/05/25）：/api/chat/route.ts 新增 charSessionCount，查 chat_messages 表該角色在此 session 的 assistant 訊息數。E02 achievement 和 E03 unlockType 均改用 charSessionCount 判斷，取代原本的全站累計 newChatCount（newChatCount 保留供 remainingQuota 計算，不再用於觸發判斷）。查詢在 chat_messages.insert 之後執行，包含本次剛插入的訊息。只對 characterList[0] 觸發，群組聊天行為不變。E02 成就和 E03 解鎖是兩個獨立機制，同一 charSessionCount 可能同時觸發（如 50 則同時是 unlock_secret 和 achievement），確認不衝突。
✅ E05 生日/紀念日系統（2026/05/25）：
- DB：profiles.birthday（TEXT，格式 MM-DD）已建立
- 設定入口：每日簽到頁（/checkin），選填，儲存後永久保存
- 觸發時機：進入聊天室時即時判斷（useEffect on mount），刻意不用 Vercel Cron（即時判斷更簡單且不需排程，用戶進入聊天室才有意義）
- 防重複 localStorage key 格式（各聊天室各自觸發）：
  - 單人自創：`birthday_msg_${email}_${characterId}_${today}`
  - 群組自創：`birthday_msg_${email}_group_${today}`
  - gallery：`birthday_msg_${email}_gallery_${galleryId}_${today}`
  - 預設單人：`birthday_msg_${email}_default_${characterId}_${today}`
  - 預設群組：`birthday_msg_${email}_default_group_${today}`
  - 紀念日：`anniversary_msg_${email}_${characterId}_${today}`
- 生日圖片：自創角色單人/群組才生圖，Flux Kontext Pro 鎖臉，免費不扣點，生成後上傳 Supabase Storage 換永久 URL
- 群組自創生日：在「開始聊天」按鈕 onClick 觸發（不在 useEffect，因為 useEffect 執行時 selectedIds 還是空陣列）。生日圖片 URL 由後端 /api/chat/birthday 從 saved_characters DB 查取，不依賴前端 characters state，時序安全。所有角色逐一送祝福（間隔1.5秒），聊最多的角色附圖（/api/chat/most-active 查詢），fallback 隨機
- 紀念日：只在自創單人聊天室觸發，查 chat_sessions.created_at 最早一筆同月同日，純文字，生日和紀念日同天各自獨立觸發
- gallery/default 聊天室：純文字生日訊息，不生圖，用 /api/chat/birthday-text
- 新增 API：
  - /api/user/birthday（GET 讀取/POST 更新 profiles.birthday，POST 有格式驗證 MM-DD）
  - /api/chat/birthday（POST，查 saved_characters 生文字+Flux Kontext Pro 生圖，只適用自創角色）
  - /api/chat/birthday-text（POST，純文字，不查 DB，適用 gallery/default 聊天室）
  - /api/chat/anniversary（GET，查 chat_sessions 最早建立日回傳 firstChatMMDD）
  - /api/chat/most-active（GET，查 chat_messages group by character_id 回傳最多的 characterId，只做 SELECT）
✅ 自拍 prompt 升級為 Claude 推斷（本視窗）：detectSelfieIntent 改為純關鍵字同步函式只回傳 intent，新增 async buildSelfiePrompt 函式呼叫 Claude Haiku 從最近10筆對話推斷具體 prompt，格式：wearing [衣物], [行為/姿勢], [場景], [光線], selfie photo, high quality, realistic，加 no phone in hand 防雙手持機。Claude 失敗時 fallback 用舊關鍵字邏輯。單人和群組均已套用（群組透過後端共用）。
✅ 自拍移除隨機延遲（本視窗）：單人（/chat/[characterId]）和群組（/chat/group）自拍觸發改為立刻執行，不再有 3-10 秒隨機延遲。提示文字統一為「📸 圖片生成上傳中，扣1點\n⚠️ 請勿關閉視窗！」和「🎬 影片生成中，扣4-6點\n⚠️ 請耐心等候，請勿關閉視窗！」。
✅ 群組自拍接力邏輯（本視窗）：selfieQueue 第一個立刻觸發，剩餘角色隨機選 1 到 N-1 個跟拍，每個間隔 3-10秒 + idx*1000ms 錯開，每次觸發前檢查 selfieLoading 冷卻。
✅ charSystem 禁止角色名標記（本視窗）：所有聊天室 charSystem 加入「⚠️ 絕對禁止在回覆開頭或任何位置使用【角色名】方括號標記」，解決單人/群組回覆重複出現【角色名】問題。群組另有「只能以自己身份說話，不能代替其他角色發言」禁令。
✅ replyTo 卡片位置修正（本視窗）：單人和群組聊天室 replyTo 預覽卡片從 flex 橫排內移到輸入區最外層 div 上方獨立顯示，防止擠壓 textarea。
✅ iOS 捲動衝突修正（本視窗）：五個聊天室訊息區 div 均加入 overscroll-contain，防止手指滑動時捲動事件傳播到外層頁面。
✅ 生日一次性鎖定（本視窗）：前端 checkin/page.tsx 已有生日時隱藏輸入欄改為純顯示；後端 /api/user/birthday POST 先查是否已有生日，有則回傳 403 拒絕。警告文字「⚠️ 注意！請勿隨意填寫！生日只能設定一次，設定後無法修改。」
✅ 後台管理員修改生日（本視窗）：新增 /api/admin/set-birthday/route.ts（POST，驗證 adminEmail），/api/admin/members/route.ts select 和 map 補 birthday 欄位，members/page.tsx 加 birthdayModal/birthdayValue/birthdayMsg state、🎂改生日按鈕、Modal。
✅ 生日圖前端輪詢重構（本視窗）：/api/chat/birthday/route.ts 改為啟動生圖後立刻回傳 predictionId，新增 /api/chat/birthday/poll/route.ts 前端每3秒輪詢，succeeded 後上傳 Supabase Storage 換永久 URL。單人和群組均已更新。
✅ 生日圖 prompt 隨機化（本視窗）：A款（holding a small birthday cake with candles）和 D款（holding a birthday cake + colorful balloons）各50%隨機。
✅ 後台產圖 prompt 多樣化（本視窗）：generate-image/route.ts 新增 makeupStyles 4種、ethnicFeatures 5種、雀斑20%機率，注入 prompt。
✅ 生日圖 prompt 隨機化（本視窗）：A款（holding a small birthday cake with candles + confetti）和 D款（holding a birthday cake + colorful balloons + confetti）各50%隨機，移除舊有 holding flowers / candlelight。
✅ 自拍冷卻機制（本視窗）：單人（/chat/[characterId]）和群組（/chat/group）自拍觸發前檢查 messages 是否有 selfieLoading:true，有則跳過，防止並行重複觸發。
✅ F系列公開作品相簿系統規則（2026/05/27）：
- 瀑布流卡片縮圖：最新3張
- 首頁Modal主圖輪播：原圖(index 0)+作品(index 1~N)，最多5張，galleryWorksMap.slice(0,5)
- 角色詳細頁(/gallery/[id])：主圖單張，下方作品相簿無限張，點縮圖換主圖，左上角「← 角色原圖」按鈕切回
- 刪除權限：只有管理員(whenser@gmail.com)和pro可刪，入門/標準不能刪
- 免費用戶作品expires_at=建立後+3天，詳細頁顯示「X天後過期／升級可永久保留」琥珀色提示
- 付費用戶expires_at=null，不顯示到期提示
- Vercel Cron cleanup-gallery-works每日台灣凌晨3點自動清理過期作品
✅ 自拍後追問限制（2026/05/27）：三個聊天室（單人自創/群組/gallery）加入 selfieActiveRef 和 selfieAutoMsgCountRef，自拍觸發後 autoMessage timer 最多追問3次後停止，自拍完成後 finally 重置兩個 ref，未觸發自拍時可無限追問。
✅ gallery 聊天室自拍功能完整上線（2026/05/27）：F1 完成，條件邏輯同自創單人，含 triggerSelfie/selfieLoading/imageUrl/videoUrl 渲染/存至公開相簿按鈕/F3 錯誤提示。
✅ 公開作品相簿系統（2026/05/27）：新表 gallery_works（欄位：id/gallery_id/user_email/image_url/video_url/work_type/expires_at/created_at），免費用戶 expires_at=建立後+3天，付費永久null，Vercel Cron 每日台灣凌晨3點清理過期作品。API：/api/gallery-works（GET/POST/DELETE），刪除權限：免費不能刪、入門/標準只能刪自己、pro和管理員可刪任何人。
✅ 首頁 GallerySection 卡片縮圖（2026/05/27）：卡片底部顯示該角色最新作品縮圖一排（最多4格），影片顯示▶圖示，批次讀取全部角色不限筆數。
✅ 首頁 Modal 作品相簿翻頁（2026/05/27）：Modal 內加作品相簿區，左右箭頭翻頁，顯示 X/Y 頁碼，modalWorkIdx state 切換角色時重置為0。
✅ 角色詳細頁作品相簿（2026/05/27）：gallery/[id]/page.tsx 底部加聊天作品相簿，主圖+縮圖列，免費用戶前3張可看第4張起模糊鎖定，付費永久角色不顯示剩餘天數，pro/管理員可刪除任何作品，入門/標準只能刪自己的。
✅ 角色詳細頁點讚持久化（2026/05/28）：gallery/[id]/page.tsx 點讚改為真實 DB 寫入。新增 gallery_likes 表（gallery_id/user_email UNIQUE），新增 add_gallery_like / remove_gallery_like 兩個 RPC function。新增 /api/gallery/like/route.ts（POST：like/unlike，GET：查詢該用戶是否已點讚）。進頁面時自動查詢點讚狀態，點讚/取消讚同步更新 public_gallery.like_count_min，失敗時前端自動還原。likeLoading 防止重複點擊。
✅ 腳架自拍模式（2026/05/27）：buildSelfiePrompt 40%機率產生腳架計時自拍（on a tripod, timer selfie, no phone visible），60%維持手持自拍，套用到所有聊天室。
✅ 自拍被拒絕錯誤提示（2026/05/27）：三個聊天室 triggerSelfie catch 區塊改為顯示明確錯誤訊息，涉及違規/露骨顯示「⚠️ 此圖片因內容涉及違規或過於露骨，已被系統拒絕，無法生成。」。
✅ 角色名過濾（2026/05/27）：三個聊天室（單人自創/群組/gallery）setMessages 加入 cleanContent = r.content.replace(/【[^】]*】/g, "").trim()，自動過濾 AI 回覆中的【角色名】標記。
✅ Vercel Cron cleanup-gallery-works（2026/05/27）：app/api/cron/cleanup-gallery-works/route.ts，vercel.json 加 crons schedule "0 19 * * *"（UTC，等於台灣凌晨3點），需 CRON_SECRET 環境變數。
✅ characters 頁面 UI 調整（2026/05/25）：角色卡片底色改全黑（bg-black）、卡片底部加「🔓 聊越多解鎖越多」小字、B2 選單底色改全黑（bg-black）、B2 選單拿掉互動聊天按鈕旁邊🔓標籤、B2 選單刪除角色按鈕下方加解鎖說明區塊（50/100/200/500則說明文字）。

⚠️ 重要技術備忘（2026/05/25新增）：
- /api/chat/birthday 只適用自創角色（查 saved_characters 表），gallery/default 聊天室必須用 /api/chat/birthday-text，否則找不到角色回 404
- 群組自創生日在「開始聊天」按鈕 onClick 觸發，不能放在 useEffect，因為 useEffect 執行時 selectedIds 還是空陣列
- /api/chat/most-active 只做 SELECT 不寫入，查詢快不影響體驗
- profiles.birthday 格式嚴格為 MM-DD，API 有正則驗證（/^\d{2}-\d{2}$/），前端輸入時需補零
✅ 自拍 polling 補 email（2026/05/28）：/chat/[characterId]/page.tsx 和 /chat/group/page.tsx 的 triggerSelfie polling 原本沒有帶 email 參數，導致 character/route.ts GET 的 total_generations +1 邏輯永遠不執行，後台生成次數顯示為0。兩個檔案各兩處 polling 均已補上 &email=${session?.user?.email}。create/page.tsx 原本就有帶，不受影響。
✅ 自拍照片/影片永久化修復（2026/05/25）：單人自建（/chat/[characterId]/page.tsx）和群組自建（/chat/group/page.tsx）的 triggerSelfie，照片生成後、存入歷史前，新增呼叫 /api/upload-image 上傳 Supabase Storage 換永久 URL（permanentImageUrl/permanentVideoUrl）。影片同樣在 polling succeeded 後上傳永久化。catch 有 fallback 用原始 URL，不影響主流程。修復前存入的是 Replicate/Kling 臨時 URL，約 24 小時後失效導致相簿圖片變問號。
✅ characters 頁面群組聊天區塊改全黑（2026/05/25）：bg-black/20 改 bg-black。

## 留存與付費轉換（E系列）
→ 規劃詳見 DNA_ROADMAP.md E 系列章節
✅ E06 隱藏故事解鎖系統（2026/05/28 完成）：public_gallery 新增 hidden_story 欄位（text）、新建 gallery_unlocks 表（id/gallery_id/user_email/created_at，UNIQUE on gallery_id+user_email，RLS停用）、admin_settings unlock_story_credits=3。/api/gallery/unlock/route.ts（GET查詢是否已解鎖/POST扣點+寫入，免費用戶回403，點數不足回402，解鎖後回傳hiddenStory+newCredits）。後台/admin/gallery編輯Modal新增hidden_story欄位+「✨ AI產生」按鈕（呼叫/api/admin/gallery/generate mode:hidden_story，Claude Haiku產800-1000字私密故事，可手動微調後儲存，顯示字數）。/api/admin/gallery/generate新增mode:hidden_story分支（不影響現有產角色邏輯）。前端/gallery/[id]/page.tsx：有hidden_story才顯示解鎖區塊，已解鎖顯示全文，未解鎖顯示扣點按鈕，解鎖狀態從/api/gallery/unlock GET查詢，費用從/api/referral/settings-public讀取unlock_story_credits。分等級隱藏故事列入長期觀察，待日後評估。
✅ E06 chat API 整合（2026/05/29）：gallery 聊天室 /api/chat 加入 galleryId 參數，判斷 gallery_unlocks 表，未解鎖注入迴避指令，已解鎖注入 hidden_story 至 charSystem。前端 handleSend 和上傳圖片兩個呼叫點均已補 galleryId。
✅ 管理員作品永久化修正（2026/05/29）：gallery-works/route.ts POST 加入 isAdmin 判斷，whenser@gmail.com 的作品 expires_at 固定為 null，不受 plan 影響。
✅ gallery 聊天室追問邏輯修正（2026/05/29）：selfieActiveRef + selfieAutoMsgCountRef 條件從 !selfieActiveRef.current || count < 3 改為 !(selfieActiveRef.current && count >= 3)，修復自拍後追問不停止的問題。
✅ 聊天回覆長度縮短（2026/05/29）：/api/chat/route.ts minSentences 改為1-2句，maxSentences 最多3句，max_tokens 從500降至300。
✅ history assistant 訊息去除【角色名】前綴（2026/05/29）：組 messages 時 assistant role 先 replace(/^【[^】]*】/, "") 再傳給 Claude，解決重複角色名問題。
✅ ConditionalFooter 元件（2026/05/29）：新建 app/components/ConditionalFooter.tsx，/chat/ 開頭和 /admin 路徑不顯示 Footer，解決 Footer 擠入聊天室導致輸入列被推擠問題。
✅ 點讚持久化修正（2026/05/29）：/api/gallery/like GET 新增回傳 likeCountMin，前端 gallery/[id]/page.tsx 改用 API 回傳的最新 like_count_min 當 seededRandom 基數，刷新後點讚數不再重置。
chat API 整合：gallery 聊天室判斷 gallery_unlocks，未解鎖加迴避指令，已解鎖注入 hidden_story 至 charSystem。前端需在 /api/chat body 傳入 galleryId 參數。
✅ VideoSettingsModal onGenerate closure 修正（本視窗）：onGenerate 改為 (refs, ratio, duration) 三參數，避免 React stale closure 導致影片比例不跟選的走。
✅ create/page.tsx Step 6 textarea value 補回（本視窗）：textarea 遺失 value={prompt} 受控屬性，已補回。清空按鈕邏輯（清空 prompt/translatedPrompt/selectedClothing/selectedAction）已存在且正確。