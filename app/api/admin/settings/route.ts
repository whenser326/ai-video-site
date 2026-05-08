import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ADMIN_EMAIL = "whenser@gmail.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settingsRows } = await supabase
    .from("admin_settings")
    .select("key, value")
    // [DNA_PATCH_START]
    .in("key", [
      "referral_credits_starter", "referral_credits_standard", "referral_credits_pro",
      "plan_credits_starter", "plan_credits_standard", "plan_credits_pro",
      "plan_price_starter", "plan_price_standard", "plan_price_pro",
      "tts_credits_starter", "tts_credits_standard", "tts_credits_pro",
      "wav2lip_credits_starter", "wav2lip_credits_standard", "wav2lip_credits_pro",
      "kling_5s_starter", "kling_5s_standard", "kling_5s_pro",
      "kling_10s_starter", "kling_10s_standard", "kling_10s_pro",
      "seedance_5s_starter", "seedance_5s_standard", "seedance_5s_pro",
      "seedance_10s_starter", "seedance_10s_standard", "seedance_10s_pro",
      "omni_extra_starter", "omni_extra_standard", "omni_extra_pro",
    ]);
    // [DNA_PATCH_END]

  const settings: Record<string, string> = {};
  (settingsRows || []).forEach((row) => { settings[row.key] = row.value; });

  const { data: logs } = await supabase
    .from("referral_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ settings, logs: logs || [] });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // [DNA_PATCH_START]
  const keys = [
    "referral_credits_starter", "referral_credits_standard", "referral_credits_pro",
    "plan_credits_starter", "plan_credits_standard", "plan_credits_pro",
    "plan_price_starter", "plan_price_standard", "plan_price_pro",
    "tts_credits_starter", "tts_credits_standard", "tts_credits_pro",
    "wav2lip_credits_starter", "wav2lip_credits_standard", "wav2lip_credits_pro",
      "kling_5s_starter", "kling_5s_standard", "kling_5s_pro",
      "kling_10s_starter", "kling_10s_standard", "kling_10s_pro",
      "seedance_5s_starter", "seedance_5s_standard", "seedance_5s_pro",
      "seedance_10s_starter", "seedance_10s_standard", "seedance_10s_pro",
      "omni_extra_starter", "omni_extra_standard", "omni_extra_pro",
  ];
  // [DNA_PATCH_END]

  for (const key of keys) {
    if (body[key] !== undefined) {
      // 先嘗試 update，沒影響任何 row 才 insert
      const { data: updated, error: updateError } = await supabase
        .from("admin_settings")
        .update({ value: String(body[key]), updated_at: new Date().toISOString() })
        .eq("key", key)
        .select();

      if (updateError) console.error(`update failed for key=${key}:`, updateError);

      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
          .from("admin_settings")
          .insert({ key, value: String(body[key]), updated_at: new Date().toISOString() });
        if (insertError) console.error(`insert failed for key=${key}:`, insertError);
      }
    }
  }

  return NextResponse.json({ ok: true });
}