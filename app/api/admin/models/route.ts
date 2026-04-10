// [DNA_PATCH_START] 模型追蹤 API
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_EMAIL = "whenser@gmail.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("model_tracker")
    .select("*")
    .order("updated_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { model_id, model_name, status, note } = await req.json();

  if (!model_id) {
    return NextResponse.json({ error: "缺少 model_id" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("model_tracker")
    .select("id")
    .eq("model_id", model_id)
    .maybeSingle();

  if (existing) {
    const updates: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (note !== undefined) updates.note = note;

    await supabase
      .from("model_tracker")
      .update(updates)
      .eq("model_id", model_id);
  } else {
    await supabase
      .from("model_tracker")
      .insert([{ model_id, model_name, status: status || "none", note: note || "" }]);
  }

  return NextResponse.json({ ok: true });
}
// [DNA_PATCH_END]