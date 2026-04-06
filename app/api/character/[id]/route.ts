// 這段程式碼的作用：讓網頁可以問電腦「那張圖畫好了沒？」
import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 向 Replicate 總部查詢這張圖的狀態
    const prediction = await replicate.predictions.get(params.id);
    
    return NextResponse.json({ 
      status: prediction.status, // 會回傳：處理中、成功 或 失敗
      output: prediction.output  // 成功後，這裡會有圖片網址
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}