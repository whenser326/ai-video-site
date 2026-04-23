import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;
  if (!email) return NextResponse.json({ error: "缺少 email" }, { status: 400 });

  // 取得用戶 IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // 台灣時區今天日期
  const todayTW = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });

  // 取得用戶資料
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits, checkin_last_date, checkin_streak")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "找不到用戶" }, { status: 404 });
  }

  // 已經簽到過了
  if (profile.checkin_last_date === todayTW) {
    return NextResponse.json({ error: "今日已簽到", already: true }, { status: 400 });
  }

  // IP 防濫用：檢查今天同 IP 是否已有人簽到
  const { data: ipCheck } = await supabase
    .from("checkin_logs")
    .select("id")
    .eq("ip", ip)
    .eq("checkin_date", todayTW)
    .limit(1);

  if (ipCheck && ipCheck.length > 0) {
    return NextResponse.json({ error: "此網路今日已有帳號簽到，請使用手機網路簽到", ipBlocked: true }, { status: 400 });
  }

  // 計算連續天數
  const lastDate = profile.checkin_last_date;
  const yesterdayTW = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })
  );
  yesterdayTW.setDate(yesterdayTW.getDate() - 1);
  const yesterdayStr = yesterdayTW.toLocaleDateString("en-CA");

  let newStreak = lastDate === yesterdayStr ? (profile.checkin_streak || 0) + 1 : 1;

  // 計算獎勵點數
  let bonusCredits = 0;
  if (newStreak === 7) bonusCredits = 3;
  if (newStreak === 30) bonusCredits = 10;
  const totalCredits = 1 + bonusCredits;

  // 更新 profiles
  await supabase
    .from("profiles")
    .update({
      credits: profile.credits + totalCredits,
      checkin_last_date: todayTW,
      checkin_streak: newStreak,
    })
    .eq("email", email);

  // 寫入 checkin_logs
  await supabase.from("checkin_logs").insert({
    email,
    ip,
    checkin_date: todayTW,
    streak: newStreak,
    credits_earned: totalCredits,
  });

  return NextResponse.json({
    success: true,
    streak: newStreak,
    creditsEarned: totalCredits,
    bonusCredits,
  });
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "缺少 email" }, { status: 400 });

  const todayTW = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("checkin_last_date, checkin_streak")
    .eq("email", email)
    .single();

  return NextResponse.json({
    checkin_last_date: profile?.checkin_last_date || null,
    checkin_streak: profile?.checkin_streak || 0,
    already: profile?.checkin_last_date === todayTW,
  });
}