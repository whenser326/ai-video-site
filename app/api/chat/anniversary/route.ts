import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const characterId = req.nextUrl.searchParams.get("characterId");
  if (!email || !characterId) return NextResponse.json({ firstChatMMDD: null });

  // 查這個 user + character 最早的 chat_session
  const { data } = await supabase
    .from("chat_sessions")
    .select("created_at")
    .eq("user_email", email)
    .contains("character_ids", [characterId])
    .eq("is_group", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!data?.created_at) return NextResponse.json({ firstChatMMDD: null });

  const d = new Date(data.created_at);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return NextResponse.json({ firstChatMMDD: `${mm}-${dd}` });
}