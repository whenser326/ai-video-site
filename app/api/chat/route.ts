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
  if (message.includes("開心") || message.includes("笑")) return "smiling happily";
  if (message.includes("生氣") || message.includes("兇")) return "serious expression";
  if (message.includes("害羞")) return "shy expression, blushing";
  if (message.includes("性感") || message.includes("撩")) return "confident sexy pose";
  if (message.includes("可愛")) return "cute expression";
  if (message.includes("運動") || message.includes("跑步")) return "athletic pose, sporty";
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
// 長期記憶摘要：超過 50 筆時自動壓縮最舊 20 筆
async function maybeGenerateSummary(sessionId: string) {
  const { data: allMsgs } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (!allMsgs || allMsgs.length <= 50) return;

  // 取最舊的 20 筆準備壓縮
  const toSummarize = allMsgs.slice(0, 20);
  const idsToDelete = toSummarize.map((m: any) => m.id);

  // 讀取現有摘要（累加用）
  const { data: sessionData } = await supabase
    .from("chat_sessions")
    .select("background_story")
    .eq("id", sessionId)
    .single();
  const existingSummary = sessionData?.background_story || "";

  // 組成摘要用的對話文字
  const dialogText = toSummarize
    .map((m: any) => `${m.role === "user" ? "用戶" : "角色"}：${m.content}`)
    .join("\n");

  const prevSummarySection = existingSummary
    ? `以下是之前的對話摘要：\n${existingSummary}\n\n`
    : "";

  // 呼叫 Claude Haiku 生成摘要（不計 chat_count、不扣點）
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

  if (!newSummary) return;

  // 更新 background_story
  await supabase
    .from("chat_sessions")
    .update({ background_story: newSummary, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  // 刪除已壓縮的舊訊息
  await supabase
    .from("chat_messages")
    .delete()
    .in("id", idsToDelete);
}

// 偵測自拍意圖 + 從對話組場景 prompt
function detectSelfieIntent(
  message: string,
  aiReply: string,
  characterName: string,
  characterDesc: string,
  characterImageUrl: string,
  history: any[]
): { intent: "photo" | "video" | null; selfiePrompt: string | null; characterImageUrl: string } {
  const photoKeywords = ["拍照", "自拍", "拍張", "傳照片", "照片給我", "看看你", "看看妳", "拍一張", "傳圖", "傳個圖", "照片"];
  const videoKeywords = ["錄影", "錄一段", "拍影片", "傳影片", "影片給我", "錄個", "錄段"];

  const combinedText = message + aiReply;

  let intent: "photo" | "video" | null = null;
  if (videoKeywords.some(k => combinedText.includes(k))) {
    intent = "video";
  } else if (photoKeywords.some(k => combinedText.includes(k))) {
    intent = "photo";
  }

  if (!intent) return { intent: null, selfiePrompt: null, characterImageUrl };

  // 優先從當前訊息抓場景，找不到才從歷史抓
  const currentScene = extractSceneFromMessage(combinedText);
  const currentMood = extractMoodFromMessage(combinedText);
  const historyContext = extractSceneFromHistory(history);

  const scenePart = currentScene || (historyContext ? historyContext : "casual indoor setting, natural lighting");
  const moodPart = currentMood || "natural expression, relaxed";
  const desc = characterDesc || "attractive person";

  const selfiePrompt = `${desc}, ${moodPart}, selfie photo, ${scenePart}, high quality, realistic`;

  return { intent, selfiePrompt, characterImageUrl };
}

export async function POST(req: NextRequest) {
  const { userEmail, characterId, sessionId, message, characters, imageUrl: chatImageUrl, isAutoMessage } = await req.json();

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
    creditCost = characters ? characters.length : 1;
  }

  let characterList: any[] = [];
  if (characters && characters.length > 0) {
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
      .order("created_at", { ascending: true })
      .limit(20);
    history = msgs || [];

    const { data: sessionData } = await supabase
      .from("chat_sessions")
      .select("background_story")
      .eq("id", sessionId)
      .single();
    backgroundStory = sessionData?.background_story || null;
  }

  const isGroup = characterList.length > 1;

  const shuffledChars = isGroup
    ? [...characterList].sort(() => Math.random() - 0.5)
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
    const charSystem = `${memoryPrefix}你扮演「${char.name}」。${personality} 請用繁體中文自然回應，語氣和用詞要符合角色個性，保持一致性。你是一個真實存在的人，不是AI，不要承認自己是AI或語言模型。當用戶要求自拍時，你可以假裝正在拍照，用文字描述拍照的情境，系統會自動生成照片。在回覆中可以自然穿插括號旁白描述你的動作、表情或心情（例如：（她微微一笑，視線落在遠方）），讓對話更有畫面感和沉浸感。旁白用（全形括號）包覆，與對話內容自然融合，不要太頻繁，約每2-3則穿插一次。${isGroup ? `這是群組對話，其他角色：${characterList.filter(c => c.id !== char.id).map(c => c.name).join("、")}。你們有各自不同的個性，可以互相回應但要保持自己的風格。` : ""}${autoPrompt} ${randomLength}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        system: charSystem,
        messages,
      }),
    });

    const claudeData = await claudeRes.json();
    const reply = claudeData.content?.[0]?.text || "（無回應）";

    // 同時傳入 AI 回應內容，讓場景更準確
    const { intent, selfiePrompt, characterImageUrl } = detectSelfieIntent(
      message,
      reply,
      char.name,
      char.description || "",
      char.image_url || "",
      history
    );

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
    const { data: newSession } = await supabase
      .from("chat_sessions")
      .insert({
        user_email: userEmail,
        character_ids: characterList.map(c => c.id),
        is_group: isGroup,
      })
      .select()
      .single();
    finalSessionId = newSession?.id;
  }

  if (finalSessionId) {
    const inserts = [
      { session_id: finalSessionId, user_email: userEmail, role: "user", content: message },
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

  await supabase
    .from("profiles")
    .update({
      chat_count: chatCount + (isGroup ? characterList.length : 1),
      credits: isOverQuota ? profile.credits - creditCost : profile.credits,
    })
    .eq("email", userEmail);

  // 非同步觸發摘要（不阻塞回應，不影響速度）
  if (finalSessionId) {
    maybeGenerateSummary(finalSessionId).catch(() => {});
  }

  return NextResponse.json({
    sessionId: finalSessionId,
    responses,
    isOverQuota,
    creditCost,
    remainingQuota: Math.max(quota - chatCount - 1, 0),
  });
}
// [DNA_PATCH_END]