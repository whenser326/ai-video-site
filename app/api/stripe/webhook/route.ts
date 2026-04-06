// [DNA_PATCH_START] 完整替換 app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 不同方案對應的歷史保存上限
const PLAN_HISTORY_LIMIT: Record<string, number> = {
  free: 5,
  starter: 5,
  standard: 10,
  pro: 30,
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // [DNA_PATCH_START]
    const { email, plan, credits, referral_code } = session.metadata!;
    // [DNA_PATCH_END]
    const addCredits = parseInt(credits);

   // [DNA_PATCH_START]
    // 取得現有點數與 referred_by
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, referred_by")
      .eq("email", email)
      .single();

    const currentCredits = profile?.credits ?? 0;

    // [DNA_PATCH_START]
    // 更新點數、方案、歷史保存上限，首次付費時記錄介紹人
    await supabase
      .from("profiles")
      .update({
        credits: currentCredits + addCredits,
        plan: plan,
        history_limit: PLAN_HISTORY_LIMIT[plan] ?? 5,
        ...(referral_code && !profile?.referred_by ? { referred_by: referral_code } : {}),
      })
      .eq("email", email);
    // [DNA_PATCH_END]

    // 分潤邏輯：如果這個用戶是被人介紹來的
    if (profile?.referred_by) {
      // 從 admin_settings 取得對應方案的分潤點數
      const { data: setting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", `referral_credits_${plan}`)
        .single();

      const bonusCredits = parseInt(setting?.value || "0");

      if (bonusCredits > 0) {
        // 取得介紹人現有點數
        const { data: referrer } = await supabase
          .from("profiles")
          .select("credits, referral_credits_earned")
          .eq("referral_code", profile.referred_by)
          .single();

        if (referrer) {
          // 給介紹人加點數
          await supabase
            .from("profiles")
            .update({
              credits: (referrer.credits ?? 0) + bonusCredits,
              referral_credits_earned: (referrer.referral_credits_earned ?? 0) + bonusCredits,
            })
            .eq("referral_code", profile.referred_by);

          // 寫入分潤紀錄
          await supabase.from("referral_logs").insert({
            referrer_email: referrer ? profile.referred_by : "unknown",
            referred_email: email,
            plan: plan,
            credits_awarded: bonusCredits,
          });
        }
      }
    }
    // [DNA_PATCH_END]
  }

  return NextResponse.json({ received: true });
}
// [DNA_PATCH_END]