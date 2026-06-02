import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const HASH_KEY = process.env.NEWEBPAY_HASH_KEY!;
const HASH_IV = process.env.NEWEBPAY_HASH_IV!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_HISTORY_LIMIT: Record<string, number> = {
  starter: 5,
  standard: 10,
  pro: 30,
};

function aesDecrypt(encrypted: string): string {
  const decipher = crypto.createDecipheriv("aes-256-cbc", HASH_KEY, HASH_IV);
  decipher.setAutoPadding(false);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  // 去除所有非可見字元（null bytes 和其他控制字元）
  return decrypted.replace(/[\x00-\x1F\x7F]+/g, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    console.log("[notify] HASH_KEY length:", HASH_KEY?.length, "HASH_IV length:", HASH_IV?.length);
    const formData = await req.formData();
    const tradeInfo = formData.get("TradeInfo") as string;
    const status = formData.get("Status") as string;
    console.log("[notify] status:", status, "tradeInfo length:", tradeInfo?.length);

    const tradeSha = formData.get("TradeSha") as string;
    const expectedSha = crypto
      .createHash("sha256")
      .update(`HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`)
      .digest("hex")
      .toUpperCase();
    console.log("[notify] tradeSha match:", tradeSha === expectedSha);
    if (tradeSha !== expectedSha) {
      console.log("[notify] SHA mismatch, expected:", expectedSha.slice(0,20), "got:", tradeSha?.slice(0,20));
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (status !== "SUCCESS") {
      return NextResponse.json({ received: true });
    }

    const decrypted = aesDecrypt(tradeInfo);
    console.log("[notify] decrypted ok, length:", decrypted.length);
    const parsed = JSON.parse(decrypted);
    const result = parsed.Result || parsed;
    const merchantOrderNo = result.MerchantOrderNo || "";
    console.log("[notify] merchantOrderNo:", JSON.stringify(merchantOrderNo));

    const { data: order } = await supabase
      .from("pending_orders")
      .select("email, plan, referral_code")
      .eq("order_no", merchantOrderNo)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: existingLog } = await supabase
      .from("payment_logs")
      .select("id")
      .eq("order_no", merchantOrderNo)
      .single();

    if (existingLog) {
      return NextResponse.json({ received: true });
    }

    await supabase.from("payment_logs").insert({
      order_no: merchantOrderNo,
      email: order.email,
      plan: order.plan,
    });

    const { email, plan, referral_code } = order;

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, referred_by")
      .eq("email", email)
      .single();

    const DEFAULT_CREDITS: Record<string, number> = { starter: 30, standard: 80, pro: 200 };
    const DEFAULT_BONUS: Record<string, number> = { starter: 5, standard: 7, pro: 10 };

    const [creditsRow, bonusRow] = await Promise.all([
      supabase.from("admin_settings").select("value").eq("key", `plan_credits_${plan}`).single(),
      supabase.from("admin_settings").select("value").eq("key", `plan_bonus_credits_${plan}`).single(),
    ]);

    const planCredits = parseInt(creditsRow.data?.value || "") || (DEFAULT_CREDITS[plan] ?? 0);
    const bonusCredits = parseInt(bonusRow.data?.value || "") || (DEFAULT_BONUS[plan] ?? 0);
    const addCredits = planCredits + bonusCredits;
    const currentCredits = profile?.credits ?? 0;
    console.log("[notify] plan:", plan, "planCredits:", planCredits, "bonus:", bonusCredits, "adding:", addCredits);

    await supabase
      .from("profiles")
      .update({
        credits: currentCredits + addCredits,
        plan: plan,
        history_limit: PLAN_HISTORY_LIMIT[plan] ?? 5,
        ...(referral_code && !profile?.referred_by ? { referred_by: referral_code } : {}),
      })
      .eq("email", email);

    console.log("[notify] credits updated successfully");

    if (profile?.referred_by) {
      const { data: setting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", `referral_credits_${plan}`)
        .single();

      const referralBonus = parseInt(setting?.value || "0");

      if (referralBonus > 0) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("credits, referral_credits_earned, email")
          .eq("referral_code", profile.referred_by)
          .single();

        if (referrer) {
          await supabase
            .from("profiles")
            .update({
              credits: (referrer.credits ?? 0) + referralBonus,
              referral_credits_earned: (referrer.referral_credits_earned ?? 0) + referralBonus,
            })
            .eq("referral_code", profile.referred_by);

          await supabase.from("referral_logs").insert({
            referrer_email: referrer.email,
            referred_email: email,
            plan: plan,
            credits_awarded: referralBonus,
          });
        }
      }
    }

    checkAndAwardMilestones(email).catch(() => {});

    await supabase
      .from("pending_orders")
      .delete()
      .eq("order_no", merchantOrderNo);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.log("[notify] ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function checkAndAwardMilestones(email: string) {
  const DEFAULT_MILESTONES = [
    { index: 1, count: 1, credits: 5 },
    { index: 2, count: 3, credits: 15 },
    { index: 3, count: 5, credits: 30 },
  ];

  const rows = await Promise.all([
    supabase.from("admin_settings").select("value").eq("key", "referral_milestone_1").single(),
    supabase.from("admin_settings").select("value").eq("key", "referral_milestone_2").single(),
    supabase.from("admin_settings").select("value").eq("key", "referral_milestone_3").single(),
  ]);

  const milestones = rows.map((r, i) => {
    try {
      const parsed = JSON.parse(r.data?.value || "");
      if (parsed.count && parsed.credits) return { index: i + 1, ...parsed };
    } catch {}
    return DEFAULT_MILESTONES[i];
  });

  const { count: referralCount } = await supabase
    .from("referral_logs")
    .select("referred_email", { count: "exact" })
    .eq("referrer_email", email);

  if (!referralCount || referralCount === 0) return;

  const { data: claimed } = await supabase
    .from("referral_milestone_logs")
    .select("milestone_index")
    .eq("email", email);

  const claimedSet = new Set((claimed ?? []).map((r: any) => r.milestone_index));

  for (const m of milestones) {
    if (referralCount >= m.count && !claimedSet.has(m.index)) {
      const { error } = await supabase
        .from("referral_milestone_logs")
        .insert({ email, milestone_index: m.index, credits_awarded: m.credits });

      if (error) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("email", email)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ credits: (profile.credits ?? 0) + m.credits })
          .eq("email", email);
      }
    }
  }
}