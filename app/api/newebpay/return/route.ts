import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 付款完成後藍新用 POST 跳轉回來
  // 直接導向成功頁
  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/pricing?success=1`,
    { status: 303 }
  );
}