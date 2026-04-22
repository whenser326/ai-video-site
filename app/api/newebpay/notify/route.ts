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
  return decrypted.replace(/\x00+$/, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const tradeInfo = formData.get("TradeInfo") as string;
    const status = formData.get("Status") as string;

    // 付款失敗直接回傳
    if (status !== "SUCCESS") {
      return NextResponse.json({ received: true });
    }

    // AES 解密
    const decrypted = aesDecrypt(tradeInfo);
    const params = new URLSearchParams(decrypted);

    const merchantOrderNo = params.get("MerchantOrderNo") || "";
    const amt = params.get("Amt") || "0";

    // 從 MerchantOrderNo 解析 plan / email / referralCode
    // 格式：CF{timestamp}_{plan}_{base64email}_{referralCode}
    const parts = merchantOrderNo.split("_");
    if (parts.length < 4) {
      return NextResponse.json({ error: "Invalid order format" }, { status: 400 });
    }

    const plan = parts[1];
    const email = Buffer.from(parts[2], "base64url").toString("utf8");
    const referralCode = parts[3] === "none" ? null : parts[3];

    // 取得現有 profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, referred_by")
      .eq("email", email)
      .single();

    const PLAN_CREDITS: Record<string, number> = {
      starter: 30,
      standard: 80,
      pro: 200,
    };

    const addCredits = PLAN_CREDITS[plan] ?? 0;
    const currentCredits = profile?.credits ?? 0;

    // 更新點數、方案、歷史上限
    await supabase
      .from("profiles")
      .update({
        credits: currentCredits + addCredits,
        plan: plan,
        history_limit: PLAN_HISTORY_LIMIT[plan] ?? 5,
        ...(referralCode && !profile?.referred_by ? { referred_by: referralCode } : {}),
      })
      .eq("email", email);

    // 分潤邏輯
    if (profile?.referred_by) {
      const { data: setting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", `referral_credits_${plan}`)
        .single();

      const bonusCredits = parseInt(setting?.value || "0");

      if (bonusCredits > 0) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("credits, referral_credits_earned")
          .eq("referral_code", profile.referred_by)
          .single();

        if (referrer) {
          await supabase
            .from("profiles")
            .update({
              credits: (referrer.credits ?? 0) + bonusCredits,
              referral_credits_earned: (referrer.referral_credits_earned ?? 0) + bonusCredits,
            })
            .eq("referral_code", profile.referred_by);

          await supabase.from("referral_logs").insert({
            referrer_email: profile.referred_by,
            referred_email: email,
            plan: plan,
            credits_awarded: bonusCredits,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}