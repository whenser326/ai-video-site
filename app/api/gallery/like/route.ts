import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { galleryId, userEmail, action } = await req.json();
  if (!galleryId || !userEmail || !action) {
    return NextResponse.json({ error: "缺少參數" }, { status: 400 });
  }

  if (action === "like") {
    await supabase.rpc("add_gallery_like", {
      p_gallery_id: galleryId,
      p_user_email: userEmail,
    });
  } else if (action === "unlike") {
    await supabase.rpc("remove_gallery_like", {
      p_gallery_id: galleryId,
      p_user_email: userEmail,
    });
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const galleryId = searchParams.get("galleryId");
  const userEmail = searchParams.get("userEmail");
  if (!galleryId || !userEmail) {
    return NextResponse.json({ hasLiked: false });
  }

  const { data } = await supabase
    .from("gallery_likes")
    .select("id")
    .eq("gallery_id", galleryId)
    .eq("user_email", userEmail)
    .maybeSingle();

  return NextResponse.json({ hasLiked: !!data });
}