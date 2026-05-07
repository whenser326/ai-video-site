import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userEmail, sessionId, characterName, characterDescription } = await req.json();

    if (!userEmail || !characterName) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    let recentMessages: { role: string; content: string }[] = [];
    if (sessionId) {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (Array.isArray(msgs)) recentMessages = msgs.reverse();
    }

    const historyText = recentMessages.length > 0
      ? recentMessages.map(m => `${m.role === "user" ? "用戶" : characterName}：${m.content}`).join("\n")
      : "（尚無對話紀錄）";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        system: `你是對話建議助手。根據角色個性和對話脈絡，生成 3 個用戶可以說的句子。角色名稱：${characterName}，個性：${characterDescription || "友善"}。回傳純 JSON array，不加任何說明或 markdown，格式：["句子1","句子2","句子3"]，每句 10~30 字中文。`,
        messages: [
          {
            role: "user",
            content: `對話紀錄：\n${historyText}\n\n請生成 3 個用戶可以說的句子，回傳 JSON array。`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (!Array.isArray(suggestions)) throw new Error();
    } catch {
      suggestions = ["你今天過得怎麼樣？", "有沒有什麼有趣的事想分享？", "我一直在想你說的話…"];
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 3) });
  } catch (err: any) {
    console.error("suggest error:", err);
    return NextResponse.json({ error: err.message || "生成失敗" }, { status: 500 });
  }
}