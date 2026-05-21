import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "whenser@gmail.com";
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.adminEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

const appearanceDesc = body.appearance ? `${body.appearance}, ` : "";
  const seed = Math.floor(Math.random() * 2147483647);

  const diversifiers = [
    "freckles on nose", "strong brow", "dimples", "sharp cheekbones",
    "full lips", "thin lips", "button nose", "aquiline nose",
    "deep-set eyes", "wide-set eyes", "upturned eyes", "hooded eyes",
    "gap teeth", "defined jawline", "soft round face", "angular face",
  ];
  const hairStyles = [
    "short pixie cut", "chin-length bob", "curly medium hair", "wavy shoulder-length hair",
    "tight curls", "braided hair", "asymmetric short hair", "layered medium hair",
    "straight short hair", "voluminous curly hair", "side-swept bangs", "undercut",
  ];
  const faceTypes = [
    "round face", "square jawline", "heart-shaped face", "long oval face",
    "wide forehead", "strong chin", "prominent cheekbones", "soft round cheeks",
  ];
  const skinTones = [
    "warm golden tan skin", "light olive complexion", "deep brown skin",
    "fair skin with warm undertone", "medium caramel skin", "cool beige complexion",
  ];
  const lightingStyles = [
    "soft natural window light", "golden hour sunlight", "studio rim lighting",
    "overcast outdoor light", "warm cafe lighting", "cool blue morning light",
  ];

  const randomFeature = diversifiers[Math.floor(Math.random() * diversifiers.length)];
  const randomHair = hairStyles[Math.floor(Math.random() * hairStyles.length)];
  const randomFace = faceTypes[Math.floor(Math.random() * faceTypes.length)];
  const randomSkin = skinTones[Math.floor(Math.random() * skinTones.length)];
  const randomLighting = lightingStyles[Math.floor(Math.random() * lightingStyles.length)];

  const prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-1.1-pro",
    input: {
      prompt: `${appearanceDesc}${randomHair}, ${randomFace}, ${randomSkin}, ${randomFeature}, ${body.prompt ? body.prompt + ", " : ""}${randomLighting}, photorealistic, real person, 8k, professional photography, highly distinctive unique facial features, unique individual appearance`,
      aspect_ratio: "2:3",
      output_format: "png",
      seed: seed,
    },
  });
  return NextResponse.json(prediction);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });

  const prediction = await replicate.predictions.get(id);

  // 產圖成功後自動上傳到 Supabase Storage
  if (prediction.status === "succeeded" && prediction.output) {
    const replicateUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;

    if (typeof replicateUrl === "string" && replicateUrl.startsWith("http")) {
      try {
        // 下載圖片
        const imgRes = await fetch(replicateUrl);
        const buffer = await imgRes.arrayBuffer();
        const fileName = `gallery-${Date.now()}.png`;

        // 上傳到 Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("character-images")
          .upload(fileName, Buffer.from(buffer), {
            contentType: "image/png",
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("character-images")
            .getPublicUrl(fileName);

          // 回傳帶有永久 URL 的 prediction
          return NextResponse.json({
            ...prediction,
            permanentUrl: urlData.publicUrl,
          });
        }
      } catch (e) {
        // 上傳失敗就回傳原本的 prediction，前台自行處理
        console.error("Upload to Supabase failed:", e);
      }
    }
  }

  return NextResponse.json(prediction);
}