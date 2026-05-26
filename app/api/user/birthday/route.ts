import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET：讀取生日
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "缺少 email" }, { status: 400 });
  const { data } = await supabase
    .from("profiles")
    .select("birthday")
    .eq("email", email)
    .single();
  return NextResponse.json({ birthday: data?.birthday || "" });
}

// POST：更新生日
export async function POST(req: NextRequest) {
  const { email, birthday } = await req.json();
  if (!email) return NextResponse.json({ error: "缺少 email" }, { status: 400 });
  // 驗證格式 MM-DD
  if (birthday && !/^\d{2}-\d{2}$/.test(birthday)) {
    return NextResponse.json({ error: "格式錯誤，請用 MM-DD" }, { status: 400 });
  }
  // 先查是否已有生日
  const { data: existing } = await supabase
    .from("profiles")
    .select("birthday")
    .eq("email", email)
    .single();

  if (existing?.birthday) {
    return NextResponse.json({ error: "生日已設定，無法修改" }, { status: 403 });
  }

  await supabase
    .from("profiles")
    .update({ birthday: birthday || null })
    .eq("email", email);
  return NextResponse.json({ ok: true });
}