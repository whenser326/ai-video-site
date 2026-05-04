import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const email = formData.get('email') as string;
    if (!file || !email) return NextResponse.json({ error: '缺少參數' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `chat-${email}-${Date.now()}.png`;

    const { error } = await supabase.storage
      .from('character-images')
      .upload(fileName, buffer, { contentType: file.type || 'image/png', upsert: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data } = supabase.storage.from('character-images').getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}