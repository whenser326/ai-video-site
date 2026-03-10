export async function POST(req: Request) {

  const body = await req.json();
  const prompt = body.prompt;

  console.log("生成影片內容:", prompt);

  return Response.json({
    video: "/demo.mp4"
  });

}