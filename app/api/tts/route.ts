// [DNA_PATCH_START] TTS 語音合成 API
import { NextRequest, NextResponse } from "next/server";

const VOICE_MAP: Record<string, string> = {
  "male-1": "qwKjxMVO8wNg6qaKKH1k",   // Aliby - 專業男聲
  "male-2": "kbrsaic1zriFXx1pgRYN",   // Evan - 溫暖男聲
  "male-3": "42bu2zNrjJXYzreZrTEu",   // Liu Junnan - 成熟男聲
  "male-4": "agczkAUlHLowaNnL72Cc",   // Adrian - 旁白男聲
  "male-5": "z1etx2H6NQWq1LH6oqJA",   // Wilson - 深沉男聲
  "female-1": "0Aj540a9UWvQPWdx9Zq4", // Jane - 低沉女聲
  "female-2": "hkfHEbBvdQFNX4uWHqRF", // Stacy - 甜美女聲
  "female-3": "r6qgCCGI7RWKXCagm158", // Anna Su - 清晰女聲
  "female-4": "9DMBSOAnMDPiFAsz1ZGK", // Xiaoxi - 活潑女聲
  "female-5": "GgmlugwQ4LYXBbEXENWm", // Maya - 溫柔女聲
};

export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json();

  if (!text) return NextResponse.json({ error: "缺少文字" }, { status: 400 });

  // 字數限制：中文150字 / 英文300字
  const isChinese = /[\u4e00-\u9fff]/.test(text);
  const limit = isChinese ? 150 : 300;
  const trimmedText = text.slice(0, limit);

  const voice = VOICE_MAP[voiceId] || VOICE_MAP["gentle-female"];

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: trimmedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "TTS 失敗: " + err }, { status: 500 });
    }

    const audioBuffer = await res.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({ audio: base64Audio, trimmed: text.length > limit });
  } catch (err) {
    return NextResponse.json({ error: "TTS 連線失敗" }, { status: 500 });
  }
}
// [DNA_PATCH_END]