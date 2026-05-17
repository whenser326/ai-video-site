import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "whenser@gmail.com";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.adminEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const storyLength = body.storyLength || 'mid';
  const lengthHint = storyLength === 'short' ? '20字以內' : storyLength === 'mid' ? '100字以內' : '200字以內';
  const gender = Math.random() > 0.5 ? '女性' : '男性';
  const age = Math.floor(Math.random() * 23) + 18;
  const surnames = ['陳','林','黃','張','李','王','吳','劉','蔡','楊','許','鄭','謝','洪','郭','邱','曾','廖','賴','徐'];
  const surname = surnames[Math.floor(Math.random() * surnames.length)];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `請生成一個虛構的AI角色，用繁體中文，只回傳純JSON，不要任何說明文字。

限制條件：
- 性別：${gender}
- 年齡：${age}歲（固定用這個數字）
- 姓氏固定用「${surname}」開頭
- 故事長度：${lengthHint}

回傳格式：{"name":"姓名","age":${age},"personality_tags":["標籤1","標籤2"],"story":"故事"}`
        }]
      })
    });

    const data = await res.json();
    const raw = data.content?.[0]?.text || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const character = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return NextResponse.json({ character: { ...character, gender } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}