// [DNA_PATCH_START] 完整替換 app/api/history/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json([]);

    // 先查該用戶的 history_limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('email', email)
      .maybeSingle();

    // [DNA_PATCH_START] 依方案決定保存天數 + 筆數 + 自動清理
    const plan = profile?.plan || 'free';

    const retentionDays = plan === 'pro' ? 90 : plan === 'standard' || plan === 'starter' ? 30 : 7;
    const retentionLimit = plan === 'pro' ? 30 : plan === 'standard' ? 10 : 5;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // 自動清理：刪除超過保存期限的紀錄
    await supabase
      .from('user_generations')
      .delete()
      .eq('user_email', email)
      .lt('created_at', cutoffDate.toISOString());

    const { data, error } = await supabase
      .from('user_generations')
      .select('image_url')
      .eq('user_email', email)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(retentionLimit);
    // [DNA_PATCH_END]

    if (error) {
      console.error('Supabase Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const historyUrls = data.map(item => item.image_url);
    return NextResponse.json(historyUrls);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user_email, image_url, prompt } = await req.json();

    if (!user_email || !image_url) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_generations')
      .insert([{ user_email, image_url, prompt, status: 'succeeded' }]);

    if (error) {
      console.error('寫入歷史失敗:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
// [DNA_PATCH_END]