// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, { priceId: string; credits: number; plan: string }> = {
  starter:  { priceId: process.env.STRIPE_PRICE_STARTER!,  credits: 30,  plan: "starter" },
  standard: { priceId: process.env.STRIPE_PRICE_STANDARD!, credits: 80,  plan: "standard" },
  pro:      { priceId: process.env.STRIPE_PRICE_PRO!,      credits: 200, plan: "pro" },
};

export async function POST(req: NextRequest) {
  try {
    // [DNA_PATCH_START]
    const { plan, email, referralCode } = await req.json();
    // [DNA_PATCH_END]
    const item = PRICE_MAP[plan];
    if (!item) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: item.priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/pricing?success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?cancel=1`,
      customer_email: email,
      // [DNA_PATCH_START]
      metadata: { plan: item.plan, credits: String(item.credits), email, referral_code: referralCode || "" },
      // [DNA_PATCH_END]
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}