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

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('email', email)
      .maybeSingle();

    const plan = profile?.plan || 'free';

    const retentionDays = plan === 'pro' ? 90 : plan === 'standard' || plan === 'starter' ? 30 : 7;
    const retentionLimit = plan === 'pro' ? 50 : plan === 'standard' ? 50 : plan === 'starter' ? 50 : 5;

    // [DNA_PATCH_START] 影片獨立清理天數：免費3天，付費7天
    const videoRetentionDays = plan === 'free' ? 3 : 7;
    const videoCutoffDate = new Date();
    videoCutoffDate.setDate(videoCutoffDate.getDate() - videoRetentionDays);

    await supabase
      .from('user_generations')
      .delete()
      .eq('user_email', email)
      .not('video_url', 'is', null)
      .lt('created_at', videoCutoffDate.toISOString());
    // [DNA_PATCH_END]

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await supabase
      .from('user_generations')
      .delete()
      .eq('user_email', email)
      .not('image_url', 'is', null)
      .is('video_url', null)
      .lt('created_at', cutoffDate.toISOString());

    const characterId = searchParams.get('character_id');

    let query = supabase
      .from('user_generations')
      .select('id, image_url, video_url, prompt, character_id, created_at')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (characterId) {
      query = query.eq('character_id', characterId);
    } else {
      query = query
        .gte('created_at', cutoffDate.toISOString())
        .limit(retentionLimit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user_email, image_url, video_url, prompt, character_id } = await req.json();

    if (!user_email || (!image_url && !video_url)) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_generations')
      .insert([{ user_email, image_url, video_url, prompt, status: 'succeeded', character_id: character_id || null }]);

    if (error) {
      console.error('寫入歷史失敗:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // [DNA_PATCH_START] 累計總生成次數（不受 history 清理影響）
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_generations')
      .eq('email', user_email)
      .maybeSingle();
    if (profile) {
      await supabase
        .from('profiles')
        .update({ total_generations: (profile.total_generations || 0) + 1 })
        .eq('email', user_email);
    }
    // [DNA_PATCH_END]

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    if (!id || !email) return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
    await supabase
      .from('user_generations')
      .delete()
      .eq('id', id)
      .eq('user_email', email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 });
  }
}
// [DNA_PATCH_END]