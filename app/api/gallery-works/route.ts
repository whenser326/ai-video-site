import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_EXPIRY_DAYS: Record<string, number | null> = {
  free: 3,
  starter: null,
  standard: null,
  pro: null,
};

// POST：儲存作品到 gallery_works
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { galleryId, userEmail, imageUrl, videoUrl, workType } = body;

  if (!galleryId || !userEmail || !workType) {
    return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
  }

  // 查方案
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("email", userEmail)
    .single();

  const plan = profile?.plan || "free";
  const expiryDays = PLAN_EXPIRY_DAYS[plan] ?? 3;

  const expiresAt = expiryDays !== null
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("gallery_works")
    .insert({
      gallery_id: galleryId,
      user_email: userEmail,
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      work_type: workType,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id, expiresAt });
}

// DELETE：刪除作品（權限：免費不能刪，入門/標準只能刪自己，pro/admin 可刪任何人）
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const userEmail = searchParams.get("email");

  if (!id || !userEmail) {
    return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("email", userEmail)
    .single();

  const plan = profile?.plan || "free";
  const isAdmin = userEmail === "whenser@gmail.com";
  const isPro = plan === "pro";

  // 查作品
  const { data: work } = await supabase
    .from("gallery_works")
    .select("id, user_email, image_url, video_url")
    .eq("id", id)
    .single();

  if (!work) return NextResponse.json({ error: "找不到作品" }, { status: 404 });

  // 免費用戶不能刪
  if (plan === "free" && !isAdmin) {
    return NextResponse.json({ error: "免費用戶無法刪除作品" }, { status: 403 });
  }

  // 入門/標準只能刪自己的
  if (!isAdmin && !isPro && work.user_email !== userEmail) {
    return NextResponse.json({ error: "無權限刪除此作品" }, { status: 403 });
  }

  // 從 Supabase Storage 刪檔
  const urlToPath = (url: string) => {
    const match = url.match(/character-images\/(.+)$/);
    return match ? match[1] : null;
  };

  const pathsToDelete: string[] = [];
  if (work.image_url) { const p = urlToPath(work.image_url); if (p) pathsToDelete.push(p); }
  if (work.video_url) { const p = urlToPath(work.video_url); if (p) pathsToDelete.push(p); }

  if (pathsToDelete.length > 0) {
    await supabase.storage.from("character-images").remove(pathsToDelete);
  }

  await supabase.from("gallery_works").delete().eq("id", id);
  return NextResponse.json({ success: true });
}

// GET：讀取某角色的作品列表
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const galleryId = searchParams.get("galleryId");
  const userEmail = searchParams.get("email");

  if (!galleryId) return NextResponse.json({ error: "缺少 galleryId" }, { status: 400 });

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("gallery_works")
    .select("id, user_email, image_url, video_url, work_type, expires_at, created_at")
    .eq("gallery_id", galleryId)
    .or(`expires_at.is.null,expires_at.gt.${now}`) // 過濾已過期
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 查詢者的方案（判斷前端要不要模糊第4張之後）
  let viewerPlan = "free";
  if (userEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("email", userEmail)
      .single();
    viewerPlan = profile?.plan || "free";
  }

  return NextResponse.json({ works: data, viewerPlan });
}