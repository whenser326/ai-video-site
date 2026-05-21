import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "whenser@gmail.com";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.adminEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 查詢最近30筆已使用職業，避免重複
  const { data: recentGallery } = await supabase
    .from('public_gallery')
    .select('personality_tags')
    .order('created_at', { ascending: false })
    .limit(30);

  const usedOccupations = (recentGallery || [])
    .map((g: any) => g.personality_tags?.[0])
    .filter(Boolean)
    .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
    .join('、');

  const occupationExclusion = usedOccupations
    ? `- 以下職業最近已使用過，本次絕對禁止使用：${usedOccupations}\n`
    : '';

  const storyLength = body.storyLength || 'mid';
  const lengthHint = storyLength === 'short' ? '20字以內' : storyLength === 'mid' ? '200字以內' : '400字以內';
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
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `請生成一個虛構的AI角色，用繁體中文，只回傳純JSON，不要任何說明文字。

限制條件：
- 性別：${gender}
- 年齡：${age}歲（固定用這個數字）
- 姓氏固定用「${surname}」開頭
- 故事長度：${lengthHint}
- appearance必須用英文描述，要非常具體且差異化，包含：
  1. 髮型髮色（例如：straight jet-black bob、wavy auburn shoulder-length、curly dark brown long hair）
  2. 臉型（例如：oval face、round face、heart-shaped face、square jawline）
  3. 眼睛特徵（例如：large almond eyes、narrow monolid eyes、deep-set eyes with thick lashes）
  4. 膚色（例如：fair porcelain skin、warm golden tan、light olive complexion）
  5. 其他特色（例如：high cheekbones、button nose、defined jawline、soft round cheeks）
  6. 表情氣質（例如：gentle warm smile、confident smirk、shy downward gaze）
- 每次產生的appearance必須跟之前完全不同，禁止重複用shoulder-length chestnut brown hair
- 髮色必須是亞洲人常見髮色（黑色/深棕色/深褐色），禁止使用blonde、platinum、silver、white、golden、ash等淺色系髮色
${occupationExclusion}- personality_tags 第一個標籤必須是職業，從以下清單隨機選一個「沒有被禁止」的職業：廚師、外科醫生、建築師、飛行員、刑警、音樂製作人、律師、電競選手、海洋研究員、釀酒師、街舞老師、紋身師、消防員、心理諮商師、登山嚮導、珠寶設計師、獸醫、氣象主播、調酒師、動畫導演、賽車手、潛水教練、馴獸師、爆破工程師、考古學家、義肢師、魔術師、戰地記者、密室設計師、茶藝師；若清單全被禁止則自由發揮罕見職業，減少使用學生、設計師、護士、老師、工程師、模特兒、攝影師
- personality_tags 第二個標籤是個性特質（例如：冷靜型、熱血型、神秘感、反差萌）

回傳格式：{"name":"姓名","age":${age},"personality_tags":["職業","個性標籤","選填第三標籤"],"story":"故事","appearance":"非常具體的外觀英文描述至少30個英文字"}`
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