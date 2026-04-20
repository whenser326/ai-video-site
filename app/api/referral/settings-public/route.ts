import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data } = await supabase
    .from("admin_settings")
    .select("key, value")
    .in("key", [
      "plan_price_starter", "plan_price_standard", "plan_price_pro",
      "kling_5s_starter", "kling_5s_standard", "kling_5s_pro",
      "seedance_5s_starter", "seedance_5s_standard", "seedance_5s_pro",
      "omni_extra_starter", "omni_extra_standard", "omni_extra_pro",
      "tts_credits_starter", "tts_credits_standard", "tts_credits_pro",
      "wav2lip_credits_starter", "wav2lip_credits_standard", "wav2lip_credits_pro",
    ]);

  const settings: Record<string, string> = {};
  (data || []).forEach((row) => { settings[row.key] = row.value; });

  return NextResponse.json({ settings });
}