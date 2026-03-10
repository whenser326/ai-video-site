"use client";
import { useState } from "react";

export default function Home() {

  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  async function generateVideo() {

  const res = await fetch("/api/video", {
    method: "POST",
    body: JSON.stringify({
      prompt: prompt
    })
  });

  const data = await res.json();
setVideoUrl(data.video);
  alert("影片生成完成");

}

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "Arial"
    }}>

      <h1>AI Video Generator</h1>

      <input
        type="text"
        placeholder="輸入你想生成的影片內容..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{
          padding: "10px",
          width: "300px",
          marginTop: "20px"
        }}
      />

      <button
        onClick={generateVideo}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          fontSize: "16px"
        }}
      >
        生成影片
      </button>

      {videoUrl && (
  <video
    controls
    width="400"
    style={{ marginTop: "30px" }}
  >
    <source src={videoUrl} type="video/mp4" />
  </video>
)}

    </div>
  );
}