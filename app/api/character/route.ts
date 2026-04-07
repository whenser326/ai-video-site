// [DNA_PATCH_START] 完整替換 character/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";
import Replicate from "replicate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Rate limiting：記憶體存每個 IP 的請求時間
const ipRequestMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分鐘視窗
  const maxRequests = 10; // 每分鐘最多10次請求

  const requests = ipRequestMap.get(ip) || [];
  const recent = requests.filter(t => now - t < windowMs);
  recent.push(now);
  ipRequestMap.set(ip, recent);

  return recent.length <= maxRequests;
}

// 取得今天日期字串（台灣時區）
function getTodayString(): string {
  return new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
}

export async function POST(req: Request) {
  try {
    // IP Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
    }

    // [DNA_PATCH_START]
    const { prompt, image, mode, userEmail, videoPrompt, aspectRatio, duration, videoModel } = await req.json();
    // [DNA_PATCH_END]

    // 必須登入才能使用
    if (!userEmail || userEmail === "null") {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    // 取得用戶資料
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('credits, plan, daily_image_count, daily_image_date, locked_character')
      .eq('email', userEmail)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ error: "找不到用戶資料" }, { status: 404 });
    }

    const currentCredits = userProfile.credits ?? 0;
    const userPlan = userProfile.plan || 'free';

    // 點數不足檢查
    const requiredCredits = mode === 'video' ? 4 : 1;
if (currentCredits < requiredCredits) {
  return NextResponse.json({ error: mode === 'video' ? "點數不足！影片生成需要至少 4 點" : "點數不足！請前往購買點數" }, { status: 403 });
}

    // 免費用戶每日圖片生成限制（每天最多2張）
    if (userPlan === 'free' && mode !== 'video') {
      const today = getTodayString();
      const lastDate = userProfile.daily_image_date || '';
      const dailyCount = lastDate === today ? (userProfile.daily_image_count || 0) : 0;

      if (dailyCount >= 2) {
        const tomorrow = new Date(new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }));
        tomorrow.setDate(tomorrow.getDate() + 1);
        return NextResponse.json({ 
          error: `免費用戶每天最多生成 2 張圖片，明天 00:00（台灣時間）重置，或升級方案繼續使用！` 
        }, { status: 403 });
      }

      // 更新每日計數
      await supabase
        .from('profiles')
        .update({ 
          daily_image_count: dailyCount + 1,
          daily_image_date: today
        })
        .eq('email', userEmail);
    }

    // 扣除點數
    await supabase
      .from('profiles')
      .update({ credits: currentCredits - 1 })
      .eq('email', userEmail);

    let prediction;

    // [DNA_PATCH_START]
    if (mode === "video") {
      if (videoModel === "seedance") {
        prediction = await replicate.predictions.create({
          model: "bytedance/seedance-1.5-pro",
          input: {
            image: image,
            prompt: videoPrompt || "animate this character with smooth natural motion, cinematic quality",
            duration: duration || 5,
            aspect_ratio: aspectRatio || "1:1",
            resolution: "720p",
            generate_audio: false,
          }
        });
      } else {
        prediction = await replicate.predictions.create({
          model: "kwaivgi/kling-v3-omni-video",
          input: {
            start_image: image,
            prompt: videoPrompt || "animate this character with smooth natural motion, cinematic quality",
            duration: duration || 5,
            aspect_ratio: aspectRatio || "1:1",
            mode: "standard"
          }
        });
      }
    // [DNA_PATCH_END]
    } else {
      const lockedCharacter = userProfile.locked_character || null;
      if (lockedCharacter) {
        const lockedPrompt = `${prompt || "standing naturally"}, same person from reference image`;
        prediction = await replicate.predictions.create({
          model: "black-forest-labs/flux-kontext-pro",
          input: {
            prompt: lockedPrompt,
            input_image: lockedCharacter,
            aspect_ratio: "1:1",
            output_format: "png",
          }
        });
      } else {
        prediction = await replicate.predictions.create({
          model: "black-forest-labs/flux-1.1-pro",
          input: { 
            prompt: prompt || "AI Character",
            aspect_ratio: "1:1",
            output_format: "png"
          }
        });
      }
    }

    return NextResponse.json(prediction);

  } catch (error: any) {
    console.error("API 執行出錯:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "缺少 Prediction ID" }, { status: 400 });
  }

  try {
    const prediction = await replicate.predictions.get(id);
    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// [DNA_PATCH_END]