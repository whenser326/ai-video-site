import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, message, turnstileToken } = await req.json();

    // 驗證 Turnstile token
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: "驗證失敗，請重新整理再試" }, { status: 400 });
    }

    // 寄信到你的 Email（用 Supabase 記錄或直接寄信）
    // 目前先存到 Supabase feedback_messages 表
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    await supabase.from('feedback_messages').insert({
      user_email: email,
      message: `【聯絡我們】姓名：${name}\n\n${message}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}