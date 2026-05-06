// app/api/motion-control/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { userEmail, image, motionVideoUrl, prompt, aspectRatio, duration } = await req.json();

    if (!userEmail || userEmail === 'null') {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }
    if (!image) {
      return NextResponse.json({ error: '缺少角色圖片' }, { status: 400 });
    }
    if (!motionVideoUrl) {
      return NextResponse.json({ error: '缺少動作參考影片' }, { status: 400 });
    }

    // 讀取用戶資料
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('credits, plan, daily_video_count, daily_video_date')
      .eq('email', userEmail)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ error: '找不到用戶資料' }, { status: 404 });
    }

    const currentCredits = userProfile.credits ?? 0;
    const userPlan = userProfile.plan || 'free';

    // 免費用戶不開放
    if (userPlan === 'free') {
      return NextResponse.json({ error: '動作參考影片為付費功能，請先升級方案' }, { status: 403 });
    }

    // 從 admin_settings 讀取 kling 5秒點數
    const { data: settingsRows } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['kling_5s_starter', 'kling_5s_standard', 'kling_5s_pro']);

    const vs: Record<string, number> = {};
    (settingsRows || []).forEach(r => { vs[r.key] = parseInt(r.value) || 0; });

    // 沿用 kling 5秒定價：入門6點 / 標準5點 / 專業4點
    const planKey = userPlan === 'pro' ? 'pro' : userPlan === 'standard' ? 'standard' : 'starter';
    const creditCost = vs[`kling_5s_${planKey}`] || (userPlan === 'pro' ? 4 : userPlan === 'standard' ? 5 : 6);

    if (currentCredits < creditCost) {
      return NextResponse.json({
        error: `點數不足！Motion Control 需要 ${creditCost} 點，你目前有 ${currentCredits} 點。`,
        showUpgradeHint: true,
      }, { status: 403 });
    }

    // 扣點
    await supabase
      .from('profiles')
      .update({ credits: currentCredits - creditCost })
      .eq('email', userEmail);

    // 呼叫 Kling Motion Control
    const prediction = await replicate.predictions.create({
      model: 'kwaivgi/kling-v3-motion-control',
      input: {
        image: image,
        video: motionVideoUrl,
        prompt: prompt || 'animate this character following the motion reference, cinematic quality',
        image_orientation: 'image',
        duration: duration || 5,
        aspect_ratio: aspectRatio || '1:1',
        mode: 'standard',
      },
    });

    return NextResponse.json({ ...prediction, creditCost });

  } catch (error: any) {
    console.error('motion-control error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少 Prediction ID' }, { status: 400 });
  }

  try {
    const prediction = await replicate.predictions.get(id);
    return NextResponse.json(prediction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}