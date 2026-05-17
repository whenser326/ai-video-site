import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const ADMIN_EMAIL = "whenser@gmail.com";
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.adminEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const prediction = await replicate.predictions.create({
    model: "black-forest-labs/flux-1.1-pro",
    input: {
      prompt: body.prompt + ", photorealistic, real person, 8k, professional photography, cinematic lighting",
      aspect_ratio: "2:3",
      output_format: "png",
    }
  });
  return NextResponse.json(prediction);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });
  const prediction = await replicate.predictions.get(id);
  return NextResponse.json(prediction);
}