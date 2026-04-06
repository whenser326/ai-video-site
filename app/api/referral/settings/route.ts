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
      "referral_credits_starter",
      "referral_credits_standard",
      "referral_credits_pro",
    ]);

  const settings: Record<string, string> = {};
  (data || []).forEach((row) => { settings[row.key] = row.value; });

  return NextResponse.json({ settings });
}