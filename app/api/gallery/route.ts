import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // 單筆查詢（聊天室用）
  if (id) {
    const { data, error } = await supabase
      .from("public_gallery")
      .select("id, name, age, personality_tags, story, story_type, image_url, video_url, actual_chat_count, like_count_min, like_count_max, chat_count_min, chat_count_max")
      .eq("id", id)
      .eq("is_active", true)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  }

  const tab = searchParams.get("tab") || "hot";
  const tag = searchParams.get("tag") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("public_gallery")
    .select("id, name, age, gender, personality_tags, story, story_type, image_url, video_url, like_count_min, like_count_max, chat_count_min, chat_count_max, is_featured, model_label, actual_chat_count, sort_order, created_at")
    .eq("is_active", true);

  if (tag) {
    query = query.contains("personality_tags", [tag]);
  }

  if (tab === "new") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("sort_order", { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}