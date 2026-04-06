// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, email } = await req.json();

    // 從 Replicate URL 下載圖片
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上傳到 Supabase Storage
    const fileName = `${email}-${Date.now()}.png`;
    const { error } = await supabase.storage
      .from("character-images")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (error) throw error;

    // 取得永久公開 URL
    const { data } = supabase.storage
      .from("character-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}