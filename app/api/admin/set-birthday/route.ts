import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "whenser@gmail.com";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { adminEmail, userEmail, birthday } = await req.json();
  if (adminEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userEmail) {
    return NextResponse.json({ error: "缺少 userEmail" }, { status: 400 });
  }
  if (birthday && !/^\d{2}-\d{2}$/.test(birthday)) {
    return NextResponse.json({ error: "格式錯誤，請用 MM-DD" }, { status: 400 });
  }
  await supabase
    .from("profiles")
    .update({ birthday: birthday || null })
    .eq("email", userEmail);
  return NextResponse.json({ ok: true });
}