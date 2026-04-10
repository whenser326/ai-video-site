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
    .in("key", [
      "referral_credits_starter", "referral_credits_standard", "referral_credits_pro",
      "plan_credits_starter", "plan_credits_standard", "plan_credits_pro",
      "plan_price_starter", "plan_price_standard", "plan_price_pro",
    ]);

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

  const keys = [
    "referral_credits_starter", "referral_credits_standard", "referral_credits_pro",
    "plan_credits_starter", "plan_credits_standard", "plan_credits_pro",
    "plan_price_starter", "plan_price_standard", "plan_price_pro",
  ];

  for (const key of keys) {
    if (body[key] !== undefined) {
      await supabase
        .from("admin_settings")
        .upsert({ key, value: String(body[key]), updated_at: new Date().toISOString() });
    }
  }

  return NextResponse.json({ ok: true });
}