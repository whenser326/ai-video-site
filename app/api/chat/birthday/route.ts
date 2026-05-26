import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userEmail, characterId, prompt, generateImage } = await req.json();
  if (!userEmail || !characterId || !prompt) {
    return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
  }

  // 取得角色資料
  const { data: char } = await supabase
    .from("saved_characters")
    .select("*")
    .eq("id", characterId)
    .single();

  if (!char) return NextResponse.json({ error: "找不到角色" }, { status: 404 });

  // 呼叫 Claude 生成祝福文字
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system: `你扮演「${char.name}」。${char.description ? `個性：${char.description}。` : ""}請用符合角色個性的語氣完成以下任務，用繁體中文回應。`,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const claudeData = await claudeRes.json();
  const text = claudeData.content?.[0]?.text || "";

  // 生日才生圖（前端輪詢模式，立刻回傳 predictionId）
  let predictionId: string | null = null;
  if (generateImage && char.image_url) {
    const birthdayVariants = [
      `${char.description || "attractive person"}, birthday celebration, holding a small birthday cake with candles, confetti falling, joyful expression, selfie photo, high quality, realistic`,
      `${char.description || "attractive person"}, birthday celebration, holding a birthday cake, colorful balloons, confetti falling, joyful expression, selfie photo, high quality, realistic`,
    ];
    const selfiePrompt = birthdayVariants[Math.floor(Math.random() * birthdayVariants.length)];

    const repRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify({
        input: {
          prompt: selfiePrompt,
          input_image: char.image_url,
          output_format: "jpg",
          aspect_ratio: "1:1",
        },
      }),
    });
    const repData = await repRes.json();
    predictionId = repData.id || null;
  }

  return NextResponse.json({
    text,
    characterName: char.name,
    predictionId, // 前端拿這個去輪詢
  });
}