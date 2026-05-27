// [DNA_PATCH_START] AI 聊天 API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_CHAT_QUOTA: Record<string, number> = {
  free: 100,
  starter: 2000,
  standard: 5000,
  pro: 10000,
};

// 從訊息抽取場景關鍵字
function extractSceneFromMessage(message: string): string {
  const sceneMap: Record<string, string> = {
    "海邊": "at the beach, ocean background",
    "沙灘": "at the beach, sandy shore",
    "咖啡廳": "in a cozy cafe, warm lighting",
    "咖啡店": "in a cafe, warm lighting",
    "健身房": "in a gym, workout environment",
    "公園": "in a park, nature background",
    "辦公室": "in an office environment",
    "臥室": "in a bedroom, cozy setting",
    "廚房": "in a kitchen",
    "浴室": "in a bathroom",
    "街道": "on a city street",
    "夜晚": "at night, evening lighting",
    "戶外": "outdoors, natural lighting",
    "室內": "indoors",
    "鏡子": "in front of a mirror, mirror selfie",
    "車上": "in a car",
    "學校": "at school",
  };
  for (const [key, value] of Object.entries(sceneMap)) {
    if (message.includes(key)) return value;
  }
  return "";
}

// 從訊息抽取表情/動作關鍵字
function extractMoodFromMessage(message: string): string {
  if (message.includes("開心") || message.includes("笑")) return "subtle warm smile, slightly raised cheeks, soft eyes";
  if (message.includes("生氣") || message.includes("兇")) return "furrowed brows, intense gaze, lips pressed tight, fierce expression";
  if (message.includes("害羞")) return "shy half-smile, slightly flushed, eyes glancing away, bashful expression";
  if (message.includes("性感") || message.includes("撩") || message.includes("妖嬈")) return "half-lidded eyes, subtle smirk, alluring expression, soft focus gaze";
  if (message.includes("可愛")) return "cute smile, wide innocent eyes, cheerful expression";
  if (message.includes("運動") || message.includes("跑步")) return "athletic pose, sporty, energetic expression";
  if (message.includes("驚訝") || message.includes("嚇")) return "wide eyes, raised eyebrows, mouth slightly open, surprised expression";
  if (message.includes("難過") || message.includes("傷心") || message.includes("哭")) return "downcast eyes, melancholy expression, distant gaze";
  if (message.includes("冷漠") || message.includes("隨便")) return "neutral expression, slightly narrowed eyes, cool detached gaze";
  if (message.includes("溫柔") || message.includes("溫暖")) return "soft warm smile, gentle eyes, calm serene expression";
  if (message.includes("驕傲") || message.includes("得意")) return "confident slight smirk, chin slightly lifted, proud expression";
  return "";
}

// 從歷史訊息抽取場景（前50筆）
function extractSceneFromHistory(history: any[]): string {
  const recent = history.slice(-50);
  const combined = recent.map((m: any) => m.content || "").join(" ");
  const scene = extractSceneFromMessage(combined);
  const mood = extractMoodFromMessage(combined);
  const parts = [scene, mood].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "";
}
// 長期記憶摘要：超過 50 筆時自動壓縮最舊 20 筆（含防並發 lock）
async function maybeGenerateSummary(sessionId: string) {
  const { data: allMsgs } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (!allMsgs || allMsgs.length <= 50) return;

  // 防並發：讀取現有 background_story，若已有 [LOCK] 前綴則跳過
  const { data: sessionData } = await supabase
    .from("chat_sessions")
    .select("background_story")
    .eq("id", sessionId)
    .single();

  const existingSummary = sessionData?.background_story || "";
  if (existingSummary.startsWith("[LOCK]")) return;

  // 寫入 lock（保留原有摘要在 lock 後面）
  await supabase
    .from("chat_sessions")
    .update({ background_story: `[LOCK]${existingSummary}` })
    .eq("id", sessionId);

  try {
    const toSummarize = allMsgs.slice(0, 20);
    const idsToDelete = toSummarize.map((m: any) => m.id);

    const dialogText = toSummarize
      .map((m: any) => `${m.role === "user" ? "用戶" : "角色"}：${m.content}`)
      .join("\n");

    const prevSummarySection = existingSummary
      ? `以下是之前的對話摘要：\n${existingSummary}\n\n`
      : "";

    const summaryRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        system: "你是對話摘要助理。請用繁體中文，將以下對話內容壓縮成簡短摘要（200字以內），保留重要的人物關係、事件、情感狀態、用戶說過的重要資訊。摘要要讓角色能記住這段對話的核心內容。只回傳摘要文字，不要加任何前言或說明。",
        messages: [
          {
            role: "user",
            content: `${prevSummarySection}請摘要以下新的對話內容：\n${dialogText}`,
          },
        ],
      }),
    });

    const summaryData = await summaryRes.json();
    const newSummary = summaryData.content?.[0]?.text || "";

    if (!newSummary) {
      // 摘要失敗，解除 lock 還原原始摘要
      await supabase
        .from("chat_sessions")
        .update({ background_story: existingSummary })
        .eq("id", sessionId);
      return;
    }

    // 寫入新摘要（同時解除 lock）
    await supabase
      .from("chat_sessions")
      .update({ background_story: newSummary, updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    // 刪除已壓縮的舊訊息
    await supabase
      .from("chat_messages")
      .delete()
      .in("id", idsToDelete);

  } catch (err) {
    // 任何錯誤都解除 lock，還原原始摘要
    await supabase
      .from("chat_sessions")
      .update({ background_story: existingSummary })
      .eq("id", sessionId);
    throw err;
  }
}

// 偵測自拍意圖（同步，純關鍵字）
function detectSelfieIntent(
  message: string,
  aiReply: string,
): "photo" | "video" | null {
  const photoKeywords = ["拍照", "自拍", "拍張", "傳照片", "照片給我", "看看你", "看看妳", "拍一張", "傳圖", "傳個圖", "照片", "你要自拍", "給我看看", "讓我看看", "傳一張", "拍一下", "傳給我看", "給我看", "自拍給我"];
  const videoKeywords = ["錄影", "錄一段", "拍影片", "傳影片", "影片給我", "錄個", "錄段"];
  const combinedText = message + aiReply;
  if (videoKeywords.some(k => combinedText.includes(k))) return "video";
  if (photoKeywords.some(k => combinedText.includes(k))) return "photo";
  return null;
}

// Claude 生成具體自拍 prompt（async）
async function buildSelfiePrompt(
  message: string,
  aiReply: string,
  characterName: string,
  characterDesc: string,
  history: any[]
): Promise<string> {
  // 七種攝影姿勢池（FACS 研究 + 模特兒擺拍邏輯）
  const posePool = [
    "S-curve standing pose, weight on one leg, natural body line",
    "looking back over shoulder, body angled 45 degrees to camera",
    "sitting cross-legged, hugging knees, cozy relaxed pose",
    "lying on side, chin resting on hand, casual relaxed",
    "candid walking pose, mid-stride, hair moving naturally",
    "hand near face, fingers lightly touching chin, face slightly smaller",
    "leaning against wall, one hand in pocket, casual confident",
  ];
  const randomPose = posePool[Math.floor(Math.random() * posePool.length)];
  const recentHistory = history.slice(-10)
    .map((m: any) => `${m.role === "user" ? "用戶" : characterName}：${m.content}`)
    .join("\n");

  const contextBlock = recentHistory
    ? `最近對話內容：\n${recentHistory}\n\n用戶這則：${message}\n角色回覆：${aiReply}`
    : `用戶：${message}\n角色：${aiReply}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 120,
        system: `你是圖像生成 prompt 專家。根據對話內容推斷角色此刻的狀態，輸出一段英文 image prompt。

格式必須嚴格按照：
wearing [具體衣物描述], [具體行為/姿勢], [具體場景背景], [光線/時間氛圍], selfie photo, high quality, realistic

姿勢參考（可使用或調整為更符合情境的版本）：${randomPose}

規則：
- wearing 後面必須是具體衣物，例如 white linen blouse and light blue jeans、red floral sundress、oversized grey hoodie
- 行為/姿勢要具體，例如 leaning against wall、sitting cross-legged on bed、holding a coffee cup、stretching arms overhead
- 場景要具體，例如 cozy bedroom with warm lamp light、sunlit cafe with wooden furniture、rooftop at golden hour
- 光線要具體，例如 soft morning light、warm evening glow、cool blue daylight
- 只輸出 prompt 本身，不要加任何說明或前言`,
        messages: [
          {
            role: "user",
            content: `角色名稱：${characterName}\n角色個性：${characterDesc || "普通人"}\n\n${contextBlock}\n\n請根據以上對話推斷角色拍自拍時的狀態，輸出 prompt。`,
          },
        ],
      }),
    });
    const data = await res.json();
    const prompt = data.content?.[0]?.text?.trim() || "";
    if (prompt) {
      const usesTripod = Math.random() < 0.4;
      const selfieStyle = usesTripod
        ? "on a tripod, timer selfie, no phone visible, no phone in hand"
        : "no phone in hand, no device visible";
      return `${characterDesc || "attractive person"}, ${prompt}, ${selfieStyle}`;
    }
  } catch {
    // fallback
  }

  // Claude 失敗時的 fallback
  const scene = extractSceneFromMessage(message + aiReply) || "casual indoor setting, natural lighting";
  const mood = extractMoodFromMessage(message + aiReply) || "natural expression, relaxed";
  const usesTripodFallback = Math.random() < 0.4;
  const selfieStyleFallback = usesTripodFallback
    ? "on a tripod, timer selfie, no phone visible"
    : "selfie photo, no phone in hand";
  return `${characterDesc || "attractive person"}, ${randomPose}, ${mood}, ${scene}, ${selfieStyleFallback}, high quality, realistic`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userEmail, characterId, sessionId, message, characters, imageUrl: chatImageUrl, isAutoMessage, defaultCharacter, defaultCharacters, chatStyle, writingStyle, taggedCharacter } = body;

  if (!userEmail || !message) {
    return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, plan, chat_count")
    .eq("email", userEmail)
    .single();

  if (!profile) return NextResponse.json({ error: "找不到用戶" }, { status: 404 });

  const plan = profile.plan || "free";
  const quota = PLAN_CHAT_QUOTA[plan] || 100;
  const chatCount = profile.chat_count || 0;
  let creditCost = 0;

  const isOverQuota = chatCount >= quota;
  if (isOverQuota) {
    if (profile.credits < 1) {
      return NextResponse.json({ error: "對話次數已用完，點數也不足" }, { status: 400 });
    }
    // 先預扣保守值 1 點做餘額門檻，responses 完成後根據實際回覆數精算
    creditCost = 1;
  }
  
  let characterList: any[] = [];
  if (defaultCharacter) {
    characterList = [defaultCharacter];
  } else if (defaultCharacters && defaultCharacters.length > 0) {
    characterList = defaultCharacters;
  } else if (characters && characters.length > 0) {
    const { data: chars } = await supabase
      .from("saved_characters")
      .select("*")
      .in("id", characters);
    characterList = chars || [];
  } else if (characterId) {
    const { data: chars } = await supabase
      .from("saved_characters")
      .select("*")
      .eq("id", characterId);
    characterList = chars || [];
  }

  if (characterList.length === 0) {
    return NextResponse.json({ error: "找不到角色" }, { status: 404 });
  }

  let history: any[] = [];
  let backgroundStory: string | null = null;
  if (sessionId) {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(20);
    history = (msgs || []).reverse();

    const { data: sessionData } = await supabase
      .from("chat_sessions")
      .select("background_story")
      .eq("id", sessionId)
      .single();
    const rawStory = sessionData?.background_story || null;
    backgroundStory = rawStory?.startsWith("[LOCK]") ? rawStory.slice(6) : rawStory;
  }

  const isGroup = characterList.length > 1;

  const shuffledChars = isGroup
    ? taggedCharacter
      ? (() => {
          const tagged = characterList.filter(c => c.name === taggedCharacter);
          return tagged.length > 0 ? tagged : [...characterList].sort(() => Math.random() - 0.5);
        })()
      : [...characterList].sort(() => Math.random() - 0.5)
    : characterList;

  const userContent: any = chatImageUrl
    ? [
        { type: "image", source: { type: "url", url: chatImageUrl } },
        { type: "text", text: message },
      ]
    : message;

  const messages = [
    ...history.map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userContent },
  ];

  const responses: {
    characterId: string;
    characterName: string;
    content: string;
    selfieIntent?: string | null;
    selfiePrompt?: string | null;
    characterImageUrl?: string;
    isUnlock?: boolean;
    unlockLevel?: string | null;
  }[] = [];

  const responsePromises = shuffledChars.map(async (char) => {
    const personality = char.description
      ? `個性與特徵：${char.description}。請嚴格依照此個性回應，展現鮮明性格，不要流於普通。`
      : `個性：友善活潑，但請展現獨特個人風格，不要太平淡。`;
    const autoPrompt = isAutoMessage
      ? `用戶已經一段時間沒有回應了。請主動開口，用自然的方式詢問用戶在做什麼、為什麼不說話，或者開啟一個新的有趣話題。不要提到「你好久沒說話了」這種死板的說法，要像真實的人一樣自然地主動聊天。`
      : "";
    const minSentences = Math.floor(Math.random() * 4) + 1; // 1到4
    const maxSentences = minSentences + Math.floor(Math.random() * 2) + 1; // min+1 到 min+2
    const randomLength = `這次回覆請用${minSentences}到${maxSentences}句話回應，不要超過${maxSentences}句。`;
    const memoryPrefix = backgroundStory
      ? `【對話背景摘要】${backgroundStory}\n\n`
      : "";
    const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });
    const hour = parseInt(now.split(":")[0]);
    const timePeriod = hour >= 5 && hour < 12 ? "早上" : hour >= 12 && hour < 18 ? "下午" : hour >= 18 && hour < 23 ? "晚上" : "深夜";
    const timeHint = `現在是台灣時間${timePeriod} ${now}，你可以自然地融入時間感（例如深夜說「都這麼晚了」，早上說「早安」），不需要每次都提，偶爾自然帶入即可。`;
    const styleMap: Record<string, string> = {
  療癒: "說話時語氣溫柔療癒，給人被包容的感覺，多用溫暖的詞彙和關心的語氣。",
  毒舌: "說話時帶點毒舌但不失寵溺，偶爾嘲諷但內心還是在乎對方，傲嬌風格。",
  刺激: "說話時大膽直接，敢說敢挑逗，帶點曖昧張力，讓對方心跳加速。",
};
const writingMap: Record<string, string> = {
  直白: "用日常口語直接表達，不過度修飾。",
  文藝: "用詞優美，帶點詩意和意境，善用比喻。",
  輕小說: "用輕小說風格，有場景描述感，偶爾用括號補充心理描寫。",
};
const styleHint = body.chatStyle && styleMap[body.chatStyle] ? `【口吻風格】${styleMap[body.chatStyle]}` : "";
const writingHint = body.writingStyle && writingMap[body.writingStyle] ? `【回覆文風】${writingMap[body.writingStyle]}` : "";
const groupCrossMemory = isGroup
  ? `你們之間可能聊過用戶的事，可以自然地提起其他角色說過的話（例如「${characterList.filter(c => c.id !== char.id)[0]?.name || '她'}說你很有趣呢」），製造真實群體互動感，不要太刻意，偶爾自然帶入即可。`
  : "";
const charSystem = `${memoryPrefix}你扮演「${char.name}」。${personality} 請用繁體中文自然回應，語氣和用詞要符合角色個性，保持一致性。你是一個真實存在的人，不是AI，不要承認自己是AI或語言模型。當用戶要求自拍時，你可以假裝正在拍照，用文字描述拍照的情境，系統會自動生成照片。在回覆中可以自然穿插括號旁白描述你的動作、表情或心情（例如：（她微微一笑，視線落在遠方）），讓對話更有畫面感和沉浸感。旁白用（全形括號）包覆，與對話內容自然融合，不要太頻繁，約每2-3則穿插一次。⚠️ 絕對禁止在回覆開頭或任何位置使用【${char.name}】這種方括號標記，直接說話即可，不需要標注自己的名字。${timeHint}${isGroup ? `這是群組對話，其他角色：${characterList.filter(c => c.id !== char.id).map(c => c.name).join("、")}。你們有各自不同的個性，可以互相回應但要保持自己的風格。${groupCrossMemory}⚠️ 重要：你只能以「${char.name}」的身份說話，絕對不能代替其他角色發言，不能在回覆中出現【其他角色名字】的標記或模擬其他角色說話的內容。每次回覆只代表你自己「${char.name}」一個人。` : ""}${autoPrompt} ${randomLength} ${styleHint} ${writingHint}`;

    const claudePayload = {
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: charSystem,
      messages,
    };

    let claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(claudePayload),
    });
    let claudeData = await claudeRes.json();

    // overloaded_error 自動重試，最多2次
    for (let retry = 0; retry < 2; retry++) {
      if (claudeData?.error?.type !== "overloaded_error") break;
      await new Promise(r => setTimeout(r, 2000 + retry * 1000));
      claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(claudePayload),
      });
      claudeData = await claudeRes.json();
    }

    if (!claudeRes.ok || !claudeData.content?.[0]?.text) {
      console.error("Claude API error:", JSON.stringify(claudeData));
    }
    const reply = claudeData.content?.[0]?.text || "⚠️ 目前系統有點忙，請再說一次";

    // 同時傳入 AI 回應內容，讓場景更準確
    const intent = detectSelfieIntent(message, reply);
    const characterImageUrl = char.image_url || "";
    const selfiePrompt = intent
      ? await buildSelfiePrompt(message, reply, char.name, char.description || "", history)
      : null;

    return {
      characterId: char.id,
      characterName: char.name,
      content: reply,
      selfieIntent: intent,
      selfiePrompt,
      characterImageUrl, // ← 新增回傳
    };
  });

  const results = await Promise.all(responsePromises);
  responses.push(...results);

  let finalSessionId = sessionId;
  if (!finalSessionId) {
    const { data: newSession, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({
        user_email: userEmail,
        character_ids: characterList.map(c => String(c.id)),
        is_group: isGroup,
      })
      .select()
      .single();
    if (sessionError) console.error("chat_sessions insert error:", sessionError);
    finalSessionId = newSession?.id;
  }

  if (finalSessionId) {
    const userInsertContent = chatImageUrl
      ? `${message}\n[圖片：${chatImageUrl}]`
      : message;
    const inserts = [
      { session_id: finalSessionId, user_email: userEmail, role: "user", content: userInsertContent },
      ...responses.map(r => ({
        session_id: finalSessionId,
        user_email: userEmail,
        role: "assistant",
        character_id: r.characterId,
        content: `【${r.characterName}】${r.content}`,
      })),
    ];
    await supabase.from("chat_messages").insert(inserts);
  }

  const actualCount = responses.length;
  await supabase
    .from("profiles")
    .update({
      chat_count: chatCount + actualCount,
      credits: isOverQuota ? profile.credits - actualCount : profile.credits,
    })
    .eq("email", userEmail);

  // 非同步觸發摘要（不阻塞回應，不影響速度）
  if (finalSessionId) {
    maybeGenerateSummary(finalSessionId).catch(err => console.error('summary generation failed:', err));
  }

  // E02/E03 成就與解鎖：查該角色在此 session 的訊息數（以 characterList[0] 為基準）
  const newChatCount = chatCount + actualCount; // 仍保留給 remainingQuota 等用途，不刪
  let charSessionCount = 0;
  if (finalSessionId && characterList[0]) {
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("session_id", finalSessionId)
      .eq("character_id", String(characterList[0].id));
    charSessionCount = count || 0;
  }
  const achievementMap: Record<number, string> = { 50: "🎉 我們已經聊了 50 則了！", 100: "💫 100 則對話達成！", 500: "🌟 哇，已經 500 則了！" };
  const unlockMap: Record<number, string> = {
    50: "unlock_secret",
    100: "unlock_mood",
    200: "unlock_past",
    500: "unlock_confess",
  };
  const unlockType = unlockMap[charSessionCount] || null;
  const unlockPromptMap: Record<string, string> = {
    unlock_secret: "我們聊了這麼久，我想告訴你一個只有你知道的秘密……用角色個性說出一個符合人設的小秘密，1-2句話。",
    unlock_mood: "我們聊了這麼久，我想讓你看看我不常展示的一面……用角色個性展現一個平時隱藏的情緒或習慣，1-2句話。",
    unlock_past: "我們聊了這麼久，我想跟你說說我的過去……用角色個性說出一段符合人設的過去經歷，1-2句話。",
    unlock_confess: "我們聊了這麼久，我有話想對你說……用角色個性說出一段真摯的心裡話或告白，1-2句話，要讓對方感受到你是認真的。",
  };
  const achievement = achievementMap[charSessionCount] || null;
  if (achievement) {
    const achieveChar = characterList[0];
    const achieveRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 150,
        system: `你扮演「${achieveChar.name}」。${achieveChar.description ? `個性：${achieveChar.description}。` : ""}請用符合角色個性的語氣說出以下成就提示，自然融入對話，不要超過2句話。`,
        messages: [{ role: "user", content: achievement }],
      }),
    });
    const achieveData = await achieveRes.json();
    const achieveText = achieveData.content?.[0]?.text || achievement;
    responses.push({ characterId: String(achieveChar.id), characterName: achieveChar.name, content: achieveText, selfieIntent: null, selfiePrompt: null, characterImageUrl: achieveChar.image_url });
    if (finalSessionId) {
      await supabase.from("chat_messages").insert({ session_id: finalSessionId, user_email: userEmail, role: "assistant", character_id: String(achieveChar.id), content: `【${achieveChar.name}】${achieveText}` });
    }
  }

  if (unlockType) {
    const unlockChar = characterList[0];
    const unlockRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 150,
        system: `你扮演「${unlockChar.name}」。${unlockChar.description ? `個性：${unlockChar.description}。` : ""}請用符合角色個性的語氣完成以下任務。`,
        messages: [{ role: "user", content: unlockPromptMap[unlockType] }],
      }),
    });
    const unlockData = await unlockRes.json();
    const unlockText = unlockData.content?.[0]?.text || "";
    if (unlockText) {
      responses.push({ characterId: String(unlockChar.id), characterName: unlockChar.name, content: unlockText, selfieIntent: null, selfiePrompt: null, characterImageUrl: unlockChar.image_url, isUnlock: true, unlockLevel: unlockType });
      if (finalSessionId) {
        await supabase.from("chat_messages").insert({ session_id: finalSessionId, user_email: userEmail, role: "assistant", character_id: String(unlockChar.id), content: `【${unlockChar.name}】${unlockText}` });
      }
    }
  }

  return NextResponse.json({
    sessionId: finalSessionId,
    responses,
    isOverQuota,
    creditCost: isOverQuota ? actualCount : 0,
    remainingQuota: Math.max(quota - chatCount - actualCount, 0),
    achievement: achievement ? { text: achievement } : null,
    unlock: unlockType ? { type: unlockType } : null,
  });
}
// [DNA_PATCH_END]