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

const PLAN_MAP: Record<string, { credits: number; amount: number; desc: string }> = {
  starter:  { credits: 30,  amount: 250, desc: "入門包 30點" },
  standard: { credits: 80,  amount: 450, desc: "標準包 80點" },
  pro:      { credits: 200, amount: 799, desc: "專業包 200點" },
};

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
    const item = PLAN_MAP[plan];
    if (!item) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

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