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

// 偵測自拍意圖 + 組場景 prompt
function detectSelfieIntent(message: string, characterName: string, characterDesc: string): { intent: "photo" | "video" | null; selfiePrompt: string | null } {
  const photoKeywords = ["拍照", "自拍", "拍張", "傳照片", "照片給我", "看看你", "看看妳", "拍一張", "傳圖", "傳個圖"];
  const videoKeywords = ["錄影", "錄一段", "拍影片", "傳影片", "影片給我", "錄個", "錄段"];

  const msg = message.toLowerCase();
  
  let intent: "photo" | "video" | null = null;
  if (videoKeywords.some(k => msg.includes(k))) {
    intent = "video";
  } else if (photoKeywords.some(k => msg.includes(k))) {
    intent = "photo";
  }

  const selfiePrompt = intent ? `${characterName}, ${characterDesc || "attractive person"}, natural selfie, casual setting` : null;
  return { intent, selfiePrompt };
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
  if (sessionId) {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20);
    history = msgs || [];
  }

  const isGroup = characterList.length > 1;

  // 群組時打亂順序
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

  const responses: { characterId: string; characterName: string; content: string; selfieIntent?: string | null; selfiePrompt?: string | null }[] = [];

  const responsePromises = shuffledChars.map(async (char) => {
    const personality = char.description
      ? `個性與特徵：${char.description}。請嚴格依照此個性回應，展現鮮明性格，不要流於普通。`
      : `個性：友善活潑，但請展現獨特個人風格，不要太平淡。`;
    const autoPrompt = isAutoMessage ? `用戶已經一段時間沒有回應了。請主動開口，用自然的方式詢問用戶在做什麼、為什麼不說話，或者開啟一個新的有趣話題。不要提到「你好久沒說話了」這種死板的說法，要像真實的人一樣自然地主動聊天。` : "";
    const charSystem = `你扮演「${char.name}」。${personality} 請用繁體中文自然回應，語氣和用詞要符合角色個性，保持一致性。你是一個真實存在的人，不是AI，不要承認自己是AI或語言模型。當用戶要求自拍時，你可以假裝正在拍照，用文字描述拍照的情境，系統會自動生成照片。${isGroup ? `這是群組對話，其他角色：${characterList.filter(c => c.id !== char.id).map(c => c.name).join("、")}。你們有各自不同的個性，可以互相回應但要保持自己的風格。` : ""}${autoPrompt}`;

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
    const { intent, selfiePrompt } = detectSelfieIntent(message, char.name, char.description || "");

    return {
      characterId: char.id,
      characterName: char.name,
      content: reply,
      selfieIntent: intent,
      selfiePrompt,
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

  return NextResponse.json({
    sessionId: finalSessionId,
    responses,
    isOverQuota,
    creditCost,
    remainingQuota: Math.max(quota - chatCount - 1, 0),
  });
}
// [DNA_PATCH_END]