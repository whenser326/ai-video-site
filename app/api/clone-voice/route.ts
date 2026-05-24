import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audioFile") as File | null;
    const email = formData.get("email") as string | null;
    const characterId = formData.get("characterId") as string | null;

    if (!audioFile || !email) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    // 確認為付費用戶
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("email", email)
      .single();

    if (!profile || profile.plan === "free") {
      return NextResponse.json({ error: "此功能僅限付費用戶使用" }, { status: 403 });
    }

    // 呼叫 ElevenLabs IVC
    const elevenlabsForm = new FormData();
    elevenlabsForm.append("name", `clone_${email}_${Date.now()}`);
    elevenlabsForm.append("files", audioFile, audioFile.name);
    elevenlabsForm.append("remove_background_noise", "false");

    const elvRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: elevenlabsForm,
    });

    if (!elvRes.ok) {
      const err = await elvRes.text();
      console.error("ElevenLabs IVC error:", err);
      return NextResponse.json({ error: "聲音克隆失敗，請確認音頻格式正確" }, { status: 500 });
    }

    const elvData = await elvRes.json();
    const voiceId: string = elvData.voice_id;

    if (!voiceId) {
      return NextResponse.json({ error: "克隆回傳格式異常" }, { status: 500 });
    }

    // 若有帶 characterId，寫入 saved_characters.voice_id
    if (characterId) {
      await supabase
        .from("saved_characters")
        .update({ voice_id: voiceId })
        .eq("id", Number(characterId))
        .eq("user_email", email);
    }

    return NextResponse.json({ success: true, voice_id: voiceId });
  } catch (e) {
    console.error("clone-voice error:", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}