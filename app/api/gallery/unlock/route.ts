import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET：查詢是否已解鎖
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const galleryId = searchParams.get("galleryId");
  const userEmail = searchParams.get("userEmail");
  if (!galleryId || !userEmail) {
    return NextResponse.json({ hasUnlocked: false });
  }
  const { data } = await supabase
    .from("gallery_unlocks")
    .select("id")
    .eq("gallery_id", galleryId)
    .eq("user_email", userEmail)
    .maybeSingle();
  return NextResponse.json({ hasUnlocked: !!data });
}

// POST：解鎖（扣點 + 寫入）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }
  const { galleryId } = await req.json();
  if (!galleryId) {
    return NextResponse.json({ error: "缺少 galleryId" }, { status: 400 });
  }
  const userEmail = session.user.email;

  // 查是否已解鎖
  const { data: existing } = await supabase
    .from("gallery_unlocks")
    .select("id")
    .eq("gallery_id", galleryId)
    .eq("user_email", userEmail)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "已解鎖" }, { status: 409 });
  }

  // 讀取解鎖點數
  const { data: setting } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "unlock_story_credits")
    .maybeSingle();
  const cost = parseInt(setting?.value ?? "3");

  // 查用戶點數
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, plan")
    .eq("email", userEmail)
    .single();
  if (!profile) {
    return NextResponse.json({ error: "找不到用戶" }, { status: 404 });
  }
  if (profile.plan === "free") {
    return NextResponse.json({ error: "免費用戶無法解鎖，請升級方案" }, { status: 403 });
  }
  if (profile.credits < cost) {
    return NextResponse.json({ error: `點數不足，需要 ${cost} 點` }, { status: 402 });
  }

  // 扣點
  const { error: deductError } = await supabase
    .from("profiles")
    .update({ credits: profile.credits - cost })
    .eq("email", userEmail);
  if (deductError) {
    return NextResponse.json({ error: "扣點失敗" }, { status: 500 });
  }

  // 寫入解鎖紀錄
  const { error: insertError } = await supabase
    .from("gallery_unlocks")
    .insert({ gallery_id: galleryId, user_email: userEmail });
  if (insertError) {
    // 扣點成功但寫入失敗，退還點數
    await supabase
      .from("profiles")
      .update({ credits: profile.credits })
      .eq("email", userEmail);
    return NextResponse.json({ error: "解鎖紀錄寫入失敗" }, { status: 500 });
  }

  // 讀取 hidden_story
  const { data: galleryItem } = await supabase
    .from("public_gallery")
    .select("hidden_story")
    .eq("id", galleryId)
    .single();

  return NextResponse.json({
    ok: true,
    hiddenStory: galleryItem?.hidden_story ?? "",
    cost,
    newCredits: profile.credits - cost,
  });
}