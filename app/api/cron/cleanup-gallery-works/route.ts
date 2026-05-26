import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // 驗證 Vercel Cron 授權
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  // 查出所有過期作品
  const { data: expired, error } = await supabase
    .from("gallery_works")
    .select("id, image_url, video_url")
    .not("expires_at", "is", null)
    .lt("expires_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // 從 Supabase Storage 刪檔
  const urlToPath = (url: string) => {
    const match = url.match(/character-images\/(.+)$/);
    return match ? match[1] : null;
  };

  const pathsToDelete: string[] = [];
  for (const work of expired) {
    if (work.image_url) { const p = urlToPath(work.image_url); if (p) pathsToDelete.push(p); }
    if (work.video_url) { const p = urlToPath(work.video_url); if (p) pathsToDelete.push(p); }
  }

  if (pathsToDelete.length > 0) {
    await supabase.storage.from("character-images").remove(pathsToDelete);
  }

  // 從 DB 刪記錄
  const expiredIds = expired.map(w => w.id);
  await supabase.from("gallery_works").delete().in("id", expiredIds);

  console.log(`[cron] cleanup-gallery-works: 刪除 ${expired.length} 筆過期作品`);
  return NextResponse.json({ deleted: expired.length });
}