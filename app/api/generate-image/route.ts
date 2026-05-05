import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { prompt, gender, style, userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ error: "缺少 userEmail" }, { status: 400 });
    }

    // 扣點確認
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("email", userEmail)
      .single();

    if (!profile || profile.credits < 1) {
      return NextResponse.json({ error: "點數不足" }, { status: 400 });
    }

    const fullPrompt = gender || style
      ? `${gender ?? ""}, ${style ?? ""}, ${prompt}`
      : prompt;

    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: { prompt: fullPrompt },
      }
    );

    // output 可能是 string、string[]、ReadableStream
    let imageUrl: string | null = null;
    if (typeof output === "string") {
      imageUrl = output;
    } else if (Array.isArray(output) && typeof output[0] === "string") {
      imageUrl = output[0];
    } else if (output && typeof (output as any).url === "function") {
      imageUrl = (output as any).url();
    } else if (output && typeof (output as any).toString === "function") {
      const str = String(output);
      if (str.startsWith("http")) imageUrl = str;
    }

    if (!imageUrl) {
      console.error("generate-image: output 無法解析", output);
      return NextResponse.json({ error: "圖片生成失敗，output 格式異常" }, { status: 500 });
    }

    // 扣1點
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("email", userEmail);

    return NextResponse.json({ output: imageUrl });

  } catch (error: any) {
    console.error("generate-image error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}