import { NextResponse } from "next/server";
import Replicate from "replicate";
export const maxDuration = 60;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const ADMIN_EMAIL = "whenser@gmail.com";

export async function POST(req: Request) {
  try {
    const { adminEmail, modelId, mode, prompt, image, aspectRatio, duration, customParams } = await req.json();

    if (adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "無權限" }, { status: 401 });
    }

    if (!modelId || !mode || !prompt) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    let prediction;

    // [DNA_PATCH_START]
    if (mode === "image") {
      prediction = await replicate.predictions.create({
        model: modelId,
        input: {
          prompt,
          aspect_ratio: aspectRatio || "1:1",
          output_format: "png",
          ...customParams,
        }
      });
    }
 else if (mode === "image-to-video") {
      prediction = await replicate.predictions.create({
        model: modelId,
        input: {
          prompt,
          image: image || undefined,
          start_image: image || undefined,
          duration: duration || 5,
          aspect_ratio: aspectRatio || "1:1",
          mode: "standard",
          ...customParams,
        }
      });
    } else if (mode === "text-to-video") {
      prediction = await replicate.predictions.create({
        model: modelId,
        input: {
          prompt,
          duration: duration || 5,
          aspect_ratio: aspectRatio || "1:1",
          ...customParams,
        }
      });
    }

    return NextResponse.json({ predictionId: prediction?.id, modelId, startTime: Date.now() });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  try {
    const prediction = await replicate.predictions.get(id);
    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}