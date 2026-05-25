import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { characterName, characterDescription } = await req.json();
  if (!characterName) return NextResponse.json({ error: "缺少角色名稱" }, { status: 400 });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 150,
      system: `你扮演「${characterName}」。${characterDescription ? `個性：${characterDescription}。` : ""}請用符合角色個性的語氣，用繁體中文完成以下任務。`,
      messages: [{ role: "user", content: "今天是用戶的生日！用角色個性說出一段真摯的生日祝福，要有角色的個性特色，讓人感受到角色真的記得，1-2句話。" }],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return NextResponse.json({ text });
}