// app/api/upload-video/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const email = formData.get('email') as string | null;

    if (!file || !email) {
      return NextResponse.json({ error: '缺少檔案或用戶信箱' }, { status: 400 });
    }

    // 從 admin_settings 動態讀取限制
    const { data: settingsRows } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['motion_max_size_mb', 'motion_min_duration_sec', 'motion_max_duration_sec']);

    const settings: Record<string, number> = {};
    (settingsRows || []).forEach(r => { settings[r.key] = parseFloat(r.value) || 0; });

    const maxSizeMb = settings['motion_max_size_mb'] || 30;
    const minDurationSec = settings['motion_min_duration_sec'] || 5;
    const maxDurationSec = settings['motion_max_duration_sec'] || 10;

    // 檢查檔案大小
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `影片檔案過大，最大允許 ${maxSizeMb}MB` },
        { status: 400 }
      );
    }

    // 檢查 MIME type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: '只支援影片格式（MP4）' },
        { status: 400 }
      );
    }

    // 上傳到 Supabase Storage character-images bucket
    const timestamp = Date.now();
    const safeEmail = email.replace(/[@.]/g, '_');
    const fileName = `motion/${safeEmail}_${timestamp}.mp4`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(fileName, buffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: '上傳失敗：' + uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('character-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      minDurationSec,
      maxDurationSec,
      maxSizeMb,
    });

  } catch (error: any) {
    console.error('upload-video error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}