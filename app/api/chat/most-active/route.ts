import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ characterId: null });

  const { data } = await supabase
    .from("chat_messages")
    .select("character_id")
    .eq("session_id", sessionId)
    .eq("role", "assistant")
    .not("character_id", "is", null);

  if (!data || data.length === 0) return NextResponse.json({ characterId: null });

  // 統計每個 character_id 出現次數
  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.character_id) {
      counts[row.character_id] = (counts[row.character_id] || 0) + 1;
    }
  }
  const mostActive = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return NextResponse.json({ characterId: mostActive?.[0] || null });
}