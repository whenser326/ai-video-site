// [DNA_PATCH_START] Kling Avatar V2 說話影片 API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { imageUrl, audioBase64, prompt, mode, userEmail, plan } = await req.json();

  if (!imageUrl || !audioBase64 || !userEmail) {
    return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
  }

  // 1. 從 admin_settings 抓點數設定
  const { data: settings } = await supabase
    .from("admin_settings")
    .select("key, value")
    .in("key", ["kling_avatar_credits_starter", "kling_avatar_credits_standard", "kling_avatar_credits_pro"]);

  const settingsMap: Record<string, number> = {};
  (settings || []).forEach((s: any) => { settingsMap[s.key] = parseInt(s.value); });

  // 預設點數：入門10、標準9、專業8（與 Wav2Lip 相同）
  const creditCost =
    plan === "starter" ? (settingsMap["kling_avatar_credits_starter"] || 10) :
    plan === "standard" ? (settingsMap["kling_avatar_credits_standard"] || 9) :
    (settingsMap["kling_avatar_credits_pro"] || 8);

  // 2. 檢查點數
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("email", userEmail)
    .single();

  if (!profile || profile.credits < creditCost) {
    return NextResponse.json({ error: `點數不足，需要 ${creditCost} 點` }, { status: 400 });
  }

  // 3. 先扣點
  await supabase
    .from("profiles")
    .update({ credits: profile.credits - creditCost })
    .eq("email", userEmail);

  // 4. 把 base64 音頻上傳到 Supabase Storage
  let audioPublicUrl = "";
  try {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioFileName = `${userEmail}-avatar-tts-${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("character-images")
      .upload(audioFileName, audioBuffer, { contentType: "audio/mpeg", upsert: true });

    if (uploadError) throw new Error("音頻上傳失敗");

    const { data: urlData } = supabase.storage
      .from("character-images")
      .getPublicUrl(audioFileName);
    audioPublicUrl = urlData.publicUrl;
  } catch {
    await supabase
      .from("profiles")
      .update({ credits: profile.credits })
      .eq("email", userEmail);
    return NextResponse.json({ error: "音頻處理失敗，點數已退還" }, { status: 500 });
  }

  // 5. 呼叫 Replicate Kling Avatar V2
  try {
    const replicateRes = await fetch("https://api.replicate.com/v1/models/kwaivgi/kling-avatar-v2/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
      },
      body: JSON.stringify({
        input: {
          image: imageUrl,
          audio: audioPublicUrl,
          prompt: prompt || "natural talking",
          mode: mode || "std",
        },
      }),
    });

    const prediction = await replicateRes.json();

    if (!prediction.id) throw new Error("Replicate 啟動失敗");

    return NextResponse.json({ id: prediction.id, creditCost });
  } catch {
    await supabase
      .from("profiles")
      .update({ credits: profile.credits })
      .eq("email", userEmail);
    return NextResponse.json({ error: "生成啟動失敗，點數已退還" }, { status: 500 });
  }
}

// Polling 狀態檢查
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少參數" }, { status: 400 });

  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
  });
  const data = await res.json();

  return NextResponse.json({
    status: data.status,
    output: data.output,
    error: data.error,
  });
}
// [DNA_PATCH_END]