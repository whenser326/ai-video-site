import { createClient } from '@supabase/supabase-js';
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  // 如果前端沒傳 Email 過來，直接回傳 0，不讓後端報錯
  if (!email || email === "null" || email === "undefined") {
    return NextResponse.json({ credits: 0 });
  }

  try {
    // 1. 查詢點數 (使用 maybeSingle 避免報錯)
    const { data, error } = await supabase
      .from('profiles')
      .select('credits, plan, referral_code')
      .eq('email', email)
      .maybeSingle();

    // 2. 如果資料庫完全沒這個人 (data 為空)，就幫他建立一個帳號並給 3 點
    if (!data) {
      console.log("新用戶登入，正在建立設定檔並發放免費 3 點...");
      // [DNA_PATCH_START]
      const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const referralCode = `${base}${random}`;

      const { data: newUser, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          email: email, 
          credits: 5,
          plan: 'free',
          history_limit: 5,
          referral_code: referralCode
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("建立用戶失敗:", insertError.message);
        return NextResponse.json({ credits: 5 });
      }
      return NextResponse.json({ credits: newUser?.credits || 3, plan: 'free', referral_code: referralCode });
      // [DNA_PATCH_END]
    }

    // 3. 正常回傳現有用戶的點數
    // [DNA_PATCH_START]
return NextResponse.json({ credits: data.credits, plan: data.plan || 'free', referral_code: data.referral_code });
// [DNA_PATCH_END]

  } catch (err: any) {
    console.error("點數 API 發生未知錯誤:", err.message);
    // 發生任何意外，保底回傳 0，不要讓網頁崩潰
    return NextResponse.json({ credits: 0 });
  }
}