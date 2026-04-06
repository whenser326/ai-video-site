import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, url } = await req.json();
    if (!email || !url) return NextResponse.json({ error: "缺少參數" }, { status: 400 });

    await supabase
      .from('profiles')
      .update({ locked_character: url })
      .eq('email', email);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}