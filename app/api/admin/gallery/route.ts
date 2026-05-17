import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "whenser@gmail.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 取得所有角色（含未上架）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("public_gallery")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

// 新增或更新角色
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.adminEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, adminEmail: _a, ...fields } = body;
  if (id) {
    const { error } = await supabase.from("public_gallery").update(fields).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } else {
    const { data, error } = await supabase.from("public_gallery").insert(fields).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, item: data });
  }
}

// 刪除角色
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const id = searchParams.get("id");
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await supabase.from("public_gallery").delete().eq("id", id!);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}