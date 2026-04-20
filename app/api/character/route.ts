// [DNA_PATCH_START] 完整替換 character/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";
import Replicate from "replicate";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const ipRequestMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  const requests = ipRequestMap.get(ip) || [];
  const recent = requests.filter(t => now - t < windowMs);
  recent.push(now);
  ipRequestMap.set(ip, recent);
  return recent.length <= maxRequests;
}

function getTodayString(): string {
  return new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
    }

    // [DNA_PATCH_START] 加入 omniRefs
const { prompt, image, mode, userEmail, videoPrompt, aspectRatio, duration, videoModel, refundCredits, batchPrompts, omniRefs } = await req.json();
// [DNA_PATCH_END]

    // [DNA_PATCH_START] 退點功能
    if (refundCredits && userEmail) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('email', userEmail)
        .maybeSingle();
      if (userProfile) {
        await supabase
          .from('profiles')
          .update({ credits: (userProfile.credits ?? 0) + refundCredits })
          .eq('email', userEmail);
        return NextResponse.json({ success: true, refunded: refundCredits });
      }
    }
    // [DNA_PATCH_END]

    if (!userEmail || userEmail === "null") {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('credits, plan, daily_image_count, daily_image_date, daily_video_count, daily_video_date, locked_character')
      .eq('email', userEmail)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ error: "找不到用戶資料" }, { status: 404 });
    }

    const currentCredits = userProfile.credits ?? 0;
    const userPlan = userProfile.plan || 'free';

    // [DNA_PATCH_START] 批次生成：提前攔截，不走一般生成流程
    if (batchPrompts && Array.isArray(batchPrompts) && batchPrompts.length > 0) {
      const batchCost = batchPrompts.length;
      if (currentCredits < batchCost) {
        return NextResponse.json({ error: `點數不足！批次生成 ${batchCost} 張需要 ${batchCost} 點` }, { status: 403 });
      }
      const lockedCharacter = userProfile.locked_character || null;
      if (!lockedCharacter) {
        return NextResponse.json({ error: "批次生成必須先鎖定角色" }, { status: 400 });
      }
      let imageValid = false;
      try {
        const checkRes = await fetch(lockedCharacter, { method: "HEAD" });
        imageValid = checkRes.ok;
      } catch { imageValid = false; }
      if (!imageValid) {
        return NextResponse.json({ error: "鎖定角色圖片已失效，請重新鎖定角色" }, { status: 400 });
      }
      await supabase.from('profiles').update({ credits: currentCredits - batchCost }).eq('email', userEmail);
      const predictions = await Promise.all(
        batchPrompts.map(async (item: { prompt: string; note?: string }) => {
          const finalPrompt = `${item.prompt}${item.note ? ', ' + item.note : ''}, same person from reference image`;
          const pred = await replicate.predictions.create({
            model: "black-forest-labs/flux-kontext-pro",
            input: { prompt: finalPrompt, input_image: lockedCharacter, aspect_ratio: "1:1", output_format: "png" }
          });
          return { ...pred, isKontextPro: true };
        })
      );
      return NextResponse.json({ batch: true, predictions, batchCost });
    }
    // [DNA_PATCH_END]
    const requiredCredits = (mode === 'video' || mode === 'text2video') ? 4 : 1;
    if (currentCredits < requiredCredits) {
      return NextResponse.json({ error: mode === 'video' ? "點數不足！影片生成需要至少 4 點" : "點數不足！請前往購買點數" }, { status: 403 });
    }
// [DNA_PATCH_START] 免費用戶每日影片限制
    if ((mode === 'video' || mode === 'text2video') && userPlan === 'free') {
      const today = getTodayString();
      const lastVideoDate = userProfile.daily_video_date || '';
      const dailyVideoCount = lastVideoDate === today ? (userProfile.daily_video_count || 0) : 0;
      if (dailyVideoCount >= 1) {
        return NextResponse.json({
          error: `免費用戶每天最多生成 1 支影片，明天 00:00（台灣時間）重置，或升級方案繼續使用！`
        }, { status: 403 });
      }
      await supabase
        .from('profiles')
        .update({ daily_video_count: dailyVideoCount + 1, daily_video_date: today })
        .eq('email', userEmail);
    }
    // [DNA_PATCH_END]
    if (userPlan === 'free' && mode !== 'video' && mode !== 'text2video') {
      const today = getTodayString();
      const lastDate = userProfile.daily_image_date || '';
      const dailyCount = lastDate === today ? (userProfile.daily_image_count || 0) : 0;
      if (dailyCount >= 2) {
        return NextResponse.json({ 
          error: `免費用戶每天最多生成 2 張圖片，明天 00:00（台灣時間）重置，或升級方案繼續使用！` 
        }, { status: 403 });
      }
      await supabase
        .from('profiles')
        .update({ daily_image_count: dailyCount + 1, daily_image_date: today })
        .eq('email', userEmail);
    }

    // [DNA_PATCH_START] 影片費用計算（含 Seedance 2.0 溢價）
// [DNA_PATCH_START] Seedance 費用重新定價（越高方案越便宜）+ Omni 加費
const hasOmniRef = Array.isArray(omniRefs) && omniRefs.length > 0;
const omniExtra = hasOmniRef
  ? (userPlan === 'starter' ? 6 : userPlan === 'standard' ? 5 : userPlan === 'pro' ? 4 : 4)
  : 0;
const seedance2Cost = (userPlan === 'starter'
  ? (duration === 10 ? 27 : 17)
  : userPlan === 'standard'
  ? (duration === 10 ? 25 : 15)
  : userPlan === 'pro'
  ? (duration === 10 ? 21 : 13)
  : (duration === 10 ? 21 : 13)) + omniExtra;
// [DNA_PATCH_END]

// text2video 不帶圖片，Seedance 費用不加 omniExtra（固定無 Omni）
const seedance2TextCost = userPlan === 'starter'
  ? (duration === 10 ? 27 : 17)
  : userPlan === 'standard'
  ? (duration === 10 ? 25 : 15)
  : (duration === 10 ? 21 : 13);

const creditCost = (mode === 'video' || mode === 'text2video')
  ? (videoModel === 'seedance'
      ? (mode === 'text2video' ? seedance2TextCost : seedance2Cost)
      : (duration === 10 ? 6 : 4))
  : 1;
// [DNA_PATCH_END]

    await supabase
      .from('profiles')
      .update({ credits: currentCredits - creditCost })
      .eq('email', userEmail);

    let prediction;

    // [DNA_PATCH_START] 文字生成影片（純文字，不需要圖片）
    if (mode === "text2video") {
      if (userPlan === 'free') {
        await supabase.from('profiles').update({ credits: currentCredits }).eq('email', userEmail);
        return NextResponse.json({ error: "文字生成影片為付費功能，請先升級方案" }, { status: 403 });
      }
      if (videoModel === "seedance") {
        prediction = await replicate.predictions.create({
          model: "bytedance/seedance-2.0",
          input: {
            prompt: videoPrompt || "cinematic scene, smooth motion, high quality",
            duration: duration || 5,
            aspect_ratio: aspectRatio || "16:9",
            resolution: "720p",
            generate_audio: true,
          },
        });
      } else {
        prediction = await replicate.predictions.create({
          model: "kwaivgi/kling-v3-omni-video",
          input: {
            prompt: videoPrompt || "cinematic scene, smooth motion, high quality",
            duration: duration || 5,
            aspect_ratio: aspectRatio || "16:9",
            mode: "standard",
          },
        });
      }
      return NextResponse.json(prediction);
    }
    // [DNA_PATCH_END]
    if (mode === "video") {
      if (videoModel === "seedance") {
        // [DNA_PATCH_START] Seedance + Omni-Reference
const seedanceInput: any = {
  image: image,
  prompt: videoPrompt || "animate this character with smooth natural motion, cinematic quality",
  duration: duration || 5,
  aspect_ratio: aspectRatio || "1:1",
  resolution: "720p",
  generate_audio: true,
};
if (hasOmniRef && Array.isArray(omniRefs)) {
  seedanceInput.reference_images = omniRefs.filter(Boolean);
}
prediction = await replicate.predictions.create({
  model: "bytedance/seedance-2.0",
  input: seedanceInput,
});
// [DNA_PATCH_END]
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
    } else {
      const lockedCharacter = userProfile.locked_character || null;
      if (lockedCharacter) {
        let imageValid = false;
        try {
          const checkRes = await fetch(lockedCharacter, { method: "HEAD" });
          imageValid = checkRes.ok;
        } catch { imageValid = false; }

        if (!imageValid) {
          // 圖片失效退點
          await supabase
            .from('profiles')
            .update({ credits: currentCredits })
            .eq('email', userEmail);
          return NextResponse.json({ error: "鎖定角色圖片已失效，請重新鎖定角色，點數已退還" }, { status: 400 });
        }

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
        // [DNA_PATCH_START] 標記這是 kontext-pro，讓前端知道可以 retry
        return NextResponse.json({ ...prediction, isKontextPro: true, creditCost });
        // [DNA_PATCH_END]
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
    if (prediction.status === "failed") {
      console.error("❌ Prediction FAILED", {
        id: prediction.id,
        model: prediction.model,
        error: prediction.error,
        logs: prediction.logs,
      });
    }
    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// [DNA_PATCH_END]