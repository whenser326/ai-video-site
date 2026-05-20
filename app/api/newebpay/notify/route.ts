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
    
    // [DNA_PATCH_START] 驗證 TradeSha 防偽造
    const tradeSha = formData.get("TradeSha") as string;
    const expectedSha = crypto
      .createHash("sha256")
      .update(`HashKey=${HASH_KEY}&${tradeInfo}&HashIV=${HASH_IV}`)
      .digest("hex")
      .toUpperCase();
    if (tradeSha !== expectedSha) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    // [DNA_PATCH_END]
    // AES 解密
    const decrypted = aesDecrypt(tradeInfo);
    const params = new URLSearchParams(decrypted);
    const merchantOrderNo = params.get("MerchantOrderNo") || "";

    // 從 pending_orders 查訂單資訊
    const { data: order } = await supabase
      .from("pending_orders")
      .select("email, plan, referral_code")
      .eq("order_no", merchantOrderNo)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
// [DNA_PATCH_START] 防重複：先檢查是否已有 payment_logs 紀錄
    const { data: existingLog } = await supabase
      .from("payment_logs")
      .select("id")
      .eq("order_no", merchantOrderNo)
      .single();

    if (existingLog) {
      return NextResponse.json({ received: true }); // 已處理過，直接回傳成功
    }

    await supabase.from("payment_logs").insert({
      order_no: merchantOrderNo,
      email: order.email,
      plan: order.plan,
    });
    // [DNA_PATCH_END]
    const { email, plan, referral_code } = order;

    // 取得現有 profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, referred_by")
      .eq("email", email)
      .single();

    // 從 admin_settings 動態讀取點數（有 fallback 預設值）
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

    // 更新點數、方案、歷史上限
    await supabase
      .from("profiles")
      .update({
        credits: currentCredits + addCredits,
        plan: plan,
        history_limit: PLAN_HISTORY_LIMIT[plan] ?? 5,
        ...(referral_code && !profile?.referred_by ? { referred_by: referral_code } : {}),
      })
      .eq("email", email);

    // 分潤邏輯
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

    // 里程碑自動發放（非同步，不阻塞主流程）
    checkAndAwardMilestones(email).catch(() => {});

    // 刪除已處理的訂單
    await supabase
      .from("pending_orders")
      .delete()
      .eq("order_no", merchantOrderNo);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// 里程碑檢查與發放（防重複由 DB unique index 保證）
async function checkAndAwardMilestones(email: string) {
  const DEFAULT_MILESTONES = [
    { index: 1, count: 1, credits: 5 },
    { index: 2, count: 3, credits: 15 },
    { index: 3, count: 5, credits: 30 },
  ];

  // 讀里程碑設定
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

  // 查成功推薦數（以 referrer_email 為 email 的 referral_logs 筆數）
  // 注意：這裡是找推薦人 = email 的紀錄，即剛才這筆付款者的推薦人不算
  // 里程碑是給「推薦別人」的獎勵，查的是 referrer_email = email
  const { count: referralCount } = await supabase
    .from("referral_logs")
    .select("referred_email", { count: "exact" })
    .eq("referrer_email", email);

  if (!referralCount || referralCount === 0) return;

  // 查已發放紀錄
  const { data: claimed } = await supabase
    .from("referral_milestone_logs")
    .select("milestone_index")
    .eq("email", email);

  const claimedSet = new Set((claimed ?? []).map((r: any) => r.milestone_index));

  // 逐一檢查並發放
  for (const m of milestones) {
    if (referralCount >= m.count && !claimedSet.has(m.index)) {
      // 嘗試寫入 milestone_logs（unique index 防重複）
      const { error } = await supabase
        .from("referral_milestone_logs")
        .insert({ email, milestone_index: m.index, credits_awarded: m.credits });

      // error 代表已被其他請求搶先寫入，跳過
      if (error) continue;

      // 發點數
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