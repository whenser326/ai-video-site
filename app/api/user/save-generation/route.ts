import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, imageUrl, characterId } = await req.json();
    if (!email || !imageUrl) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_generations')
      .insert({
        user_email: email,
        image_url: imageUrl,
        character_id: characterId || null,
        status: 'done',
      });

    if (error) {
      console.error('save-generation error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}