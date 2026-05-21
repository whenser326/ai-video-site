import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gallery_id = searchParams.get("gallery_id");
  if (!gallery_id) return NextResponse.json({ error: "缺少gallery_id" }, { status: 400 });

  const { data, error } = await supabase
    .from("gallery_comments")
    .select("id, user_email, content, created_at")
    .eq("gallery_id", gallery_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { gallery_id, user_email, content } = body;

  if (!gallery_id || !user_email || !content?.trim()) {
    return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
  }
  if (content.trim().length > 200) {
    return NextResponse.json({ error: "留言不能超過200字" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("gallery_comments")
    .insert({ gallery_id, user_email, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}