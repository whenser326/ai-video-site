import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const MERCHANT_ID = process.env.NEWEBPAY_MERCHANT_ID!;
const HASH_KEY = process.env.NEWEBPAY_HASH_KEY!;
const HASH_IV = process.env.NEWEBPAY_HASH_IV!;
const NEWEBPAY_URL = "https://core.newebpay.com/MPG/mpg_gateway";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function aesEncrypt(data: string): string {
  const cipher = crypto.createCipheriv("aes-256-cbc", HASH_KEY, HASH_IV);
  return cipher.update(data, "utf8", "hex") + cipher.final("hex");
}

function shaEncrypt(data: string): string {
  return crypto
    .createHash("sha256")
    .update(`HashKey=${HASH_KEY}&${data}&HashIV=${HASH_IV}`)
    .digest("hex")
    .toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { plan, email, referralCode } = await req.json();
    if (!["starter", "standard", "pro"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // 從 admin_settings 動態讀取金額和點數
    const PLAN_LABEL: Record<string, string> = { starter: "入門包", standard: "標準包", pro: "專業包" };
    const DEFAULT_CREDITS: Record<string, number> = { starter: 30, standard: 80, pro: 200 };
    const DEFAULT_AMOUNT: Record<string, number> = { starter: 250, standard: 450, pro: 799 };

    const [creditsRow, priceRow] = await Promise.all([
      supabase.from("admin_settings").select("value").eq("key", `plan_credits_${plan}`).single(),
      supabase.from("admin_settings").select("value").eq("key", `plan_price_${plan}`).single(),
    ]);

    const credits = parseInt(creditsRow.data?.value || "") || DEFAULT_CREDITS[plan];
    const amount = parseInt(priceRow.data?.value || "") || DEFAULT_AMOUNT[plan];
    const item = { credits, amount, desc: `${PLAN_LABEL[plan]} ${credits}點` };

    // OrderNo 最多 30 字元：CF + 13位時間戳 = 15字元，安全
    const merchantOrderNo = `CF${Date.now()}`;
    const timeStamp = Math.floor(Date.now() / 1000);

    // 把訂單資訊存到 Supabase，notify 時用 OrderNo 查回來
    await supabase.from("pending_orders").insert({
      order_no: merchantOrderNo,
      email,
      plan,
      referral_code: referralCode || null,
    });

    const tradeInfo = new URLSearchParams({
      MerchantID: MERCHANT_ID,
      RespondType: "JSON",
      TimeStamp: String(timeStamp),
      Version: "2.0",
      MerchantOrderNo: merchantOrderNo,
      Amt: String(item.amount),
      ItemDesc: item.desc,
      Email: email,
      NotifyURL: `${process.env.NEXTAUTH_URL}/api/newebpay/notify`,
      ReturnURL: `${process.env.NEXTAUTH_URL}/api/newebpay/return`,
      ClientBackURL: `${process.env.NEXTAUTH_URL}/pricing?cancel=1`,
      LoginType: "0",
      CREDIT: "1",
      BARCODE: "1",
      CVS: "1",
      WEBATM: "1",
      ATM: "1",
      UNIONPAY: "1",
      APPLEPAY: "1",
    }).toString();

    const tradeInfoEncrypted = aesEncrypt(tradeInfo);
    const tradeSha = shaEncrypt(tradeInfoEncrypted);

    return NextResponse.json({
      url: NEWEBPAY_URL,
      MerchantID: MERCHANT_ID,
      TradeInfo: tradeInfoEncrypted,
      TradeSha: tradeSha,
      Version: "2.0",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}