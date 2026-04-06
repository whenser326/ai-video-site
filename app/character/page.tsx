import { NextResponse } from "next/server";

// 💡 這裡貼上妳的 Replicate Token
const API_TOKEN = "r8_BjjFQgmbed2i5RmdmdVNaiIAUN5ReLS1iPHGA"; 
const headers = { 
  "Authorization": `Token ${API_TOKEN}`, 
  "Content-Type": "application/json" 
};

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // 1. 生成圖片
    const imgRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST", headers,
      body: JSON.stringify({ 
        version: "da77bc59ee60423279fd632efb4795ab731d9e3ca9705ef3341091fb989b7eaf", 
        input: { prompt: `${prompt}, high quality, realistic` } 
      })
    });
    let imgData = await imgRes.json();
    
    // 等待圖片完成
    while (imgData.status !== "succeeded") {
      if (imgData.status === "failed") throw new Error("圖片生成失敗");
      await new Promise(r => setTimeout(r, 2000));
      imgData = await (await fetch(imgData.urls.get, { headers })).json();
    }
    const imageUrl = imgData.output[0];

    // 2. 啟動影片任務 (但不等待，直接回傳 ID 給前端)
    const vidRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST", headers,
      body: JSON.stringify({ 
        version: "fbea361a377b46128cf37905a9707c02ccba8a1ef96b8c9dcf79f00994336da3", 
        input: { prompt: "realistic slight motion", image: imageUrl } 
      })
    });
    const prediction = await vidRes.json();

    return NextResponse.json({ image: imageUrl, prediction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 💡 前端會一直來這裡問：影片好了沒？
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, { headers });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}