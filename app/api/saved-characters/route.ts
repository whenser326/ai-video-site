// [DNA_PATCH_START] 角色收藏 API
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 取得收藏上限
async function getLimit(plan: string): Promise<number> {
  const keyMap: Record<string, string> = {
    starter: "saved_characters_limit_starter",
    standard: "saved_characters_limit_standard",
    pro: "saved_characters_limit_pro",
    free: "1",
  };
  if (plan === "free") return 1;
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", keyMap[plan])
    .single();
  return parseInt(data?.value || "3");
}

// GET：取得用戶收藏列表
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json([]);
  const { data } = await supabase
    .from("saved_characters")
    .select("*")
    .eq("user_email", email)
    .order("created_at", { ascending: false });
  return NextResponse.json(data || []);
}

// POST：新增收藏
export async function POST(req: NextRequest) {
  const { email, name, image_url, plan, description, voice_id } = await req.json();
  if (!email || !image_url) return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });

  // 檢查數量上限
  const limit = await getLimit(plan || "free");
  const { count } = await supabase
    .from("saved_characters")
    .select("*", { count: "exact", head: true })
    .eq("user_email", email);

  if ((count || 0) >= limit) {
    return NextResponse.json({ error: `已達收藏上限（${limit}個），請先刪除舊角色` }, { status: 400 });
  }

  // 檢查名稱重複
  const finalName = name || "未命名角色";
  const { data: existing } = await supabase
    .from("saved_characters")
    .select("id")
    .eq("user_email", email)
    .eq("name", finalName)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: `已有同名角色「${finalName}」，請換一個名字` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_characters")
    .insert({ user_email: email, name: finalName, image_url, description: description || null, voice_id: voice_id || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "收藏失敗" }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// DELETE：刪除收藏（支援 query string）
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const email = req.nextUrl.searchParams.get("email");
  if (!id || !email) return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  await supabase.from("saved_characters").delete().eq("id", id).eq("user_email", email);
  return NextResponse.json({ success: true });
}
// [DNA_PATCH_END]