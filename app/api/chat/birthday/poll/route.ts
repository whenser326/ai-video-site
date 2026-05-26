import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const characterId = searchParams.get("characterId");

  if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });

  const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
  });
  const pollData = await poll.json();

  if (pollData.status === "succeeded" && pollData.output) {
    const raw = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;

    // 上傳到 Supabase Storage 換永久 URL
    try {
      const imgRes = await fetch(raw);
      const imgBuffer = await imgRes.arrayBuffer();
      const fileName = `birthday_${characterId || "char"}_${Date.now()}.jpg`;
      await supabase.storage
        .from("character-images")
        .upload(fileName, imgBuffer, { contentType: "image/jpeg", upsert: true });
      const { data: urlData } = supabase.storage
        .from("character-images")
        .getPublicUrl(fileName);
      return NextResponse.json({ status: "succeeded", imageUrl: urlData.publicUrl });
    } catch {
      return NextResponse.json({ status: "succeeded", imageUrl: raw });
    }
  }

  if (pollData.status === "failed") {
    return NextResponse.json({ status: "failed" });
  }

  return NextResponse.json({ status: pollData.status });
}