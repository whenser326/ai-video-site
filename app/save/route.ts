import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { image_url, video_url, prompt, user_email } = await req.json();

    // 1. 初始化 Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. 存入資料庫 (確認表格名稱是 saved_characters)
    const { error } = await supabase
      .from("saved_characters")
      .insert([{ image_url, video_url, prompt, user_email }]);

    if (error) {
      console.error("❌ 存檔失敗原因:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "伺服器發生錯誤" }, { status: 500 });
  }
}