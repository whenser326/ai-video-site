"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [seconds, setSeconds] = useState(0);
  const VIDEO_COUNTDOWN = 120; // 影片預估 120 秒
const IMAGE_COUNTDOWN = 60; // 圖片預估 60 秒
  const [genType, setGenType] = useState<"image" | "video">("image");
  const [credits, setCredits] = useState<number | null>(null); // ✨ 點數狀態
  const [plan, setPlan] = useState<string>('free');
  const [showUploadModal, setShowUploadModal] = useState(false);
const [agreedToTerms, setAgreedToTerms] = useState(false);
const [termsChecked, setTermsChecked] = useState(false);
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const [videoPrompt, setVideoPrompt] = useState("");
const [videoRatio, setVideoRatio] = useState("1:1");
const [videoDuration, setVideoDuration] = useState(5);
const [showVideoModal, setShowVideoModal] = useState(false);
// [DNA_PATCH_START]
const [videoModel, setVideoModel] = useState<"kling" | "seedance">("kling");
// [DNA_PATCH_START] 翻譯相關狀態
const [translatedPrompt, setTranslatedPrompt] = useState<string | null>(null);
const [isTranslating, setIsTranslating] = useState(false);
const [useTranslated, setUseTranslated] = useState(false);
// [DNA_PATCH_END]
// [DNA_PATCH_START] 推薦賺點狀態
const [showReferralModal, setShowReferralModal] = useState(false);
const [referralCode, setReferralCode] = useState<string | null>(null);
const [referralCredits, setReferralCredits] = useState<{ starter: string; standard: string; pro: string } | null>(null);
const [copiedCode, setCopiedCode] = useState(false);
const [copiedLink, setCopiedLink] = useState(false);
// [DNA_PATCH_END]

  // 1. 初始化與點數同步
  useEffect(() => {
    const savedPrediction = localStorage.getItem("last_prediction");
    if (savedPrediction) setPrediction(JSON.parse(savedPrediction));
    
    if (session?.user?.email) {
      // 抓取歷史紀錄
      fetch(`/api/history?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => setHistory(data));

      // 抓取點數 (包含新用戶免費 3 張的邏輯應在後端 profiles 表格初始值設定為 3)
      fetch(`/api/user/credits?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
  setCredits(data.credits);
  setPlan(data.plan || 'free');
});
    }
  }, [session]);
  // [DNA_PATCH_START] 推薦賺點事件監聽 + 資料載入
useEffect(() => {
  const handler = () => setShowReferralModal(true);
  window.addEventListener("open-referral-modal", handler);
  return () => window.removeEventListener("open-referral-modal", handler);
}, []);

useEffect(() => {
  if (!showReferralModal) return;
  if (session?.user?.email && !referralCode) {
    fetch(`/api/user/credits?email=${session.user.email}`)
      .then(res => res.json())
      .then(data => { if (data.referral_code) setReferralCode(data.referral_code); });
  }
  if (!referralCredits) {
    fetch("/api/referral/settings")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setReferralCredits({
            starter: data.settings.referral_credits_starter || "?",
            standard: data.settings.referral_credits_standard || "?",
            pro: data.settings.referral_credits_pro || "?",
          });
        }
      });
  }
}, [showReferralModal]);
// [DNA_PATCH_END]

// ✨ 修正後的下載功能：支援 Flux Pro 圖片與影片
  const downloadFile = async (url: string) => {
    try {
      setLoading(true); // 下載大檔案時顯示一下載入狀態
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 自動判斷副檔名
      let extension = "png";
      if (url.includes(".mp4")) extension = "mp4";
      if (url.includes(".webp")) extension = "webp";
      if (url.includes(".jpg") || url.includes(".jpeg")) extension = "jpg";

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `ai-studio-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setLoading(false);
    } catch (err) { 
      console.error("下載失敗", err);
      // 如果 Blob 被瀏覽器擋掉，就用最原始的方法：在新分頁開啟
      window.open(url, '_blank'); 
      setLoading(false);
    }
  };

  // 3. 狀態檢查 (接通影片與圖片)
  const checkStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/character?id=${id}&email=${session?.user?.email}`);
      const data = await res.json();
      setSeconds(prev => prev + 2);

      if (data.status === "succeeded") {
        const finalUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        const formattedData = { ...data, output: finalUrl };
        
        setPrediction(formattedData);
        
        // 更新點數與歷史
        if (session?.user?.email) {
          fetch(`/api/history?email=${session.user.email}`).then(res => res.json()).then(data => setHistory(data));
          fetch(`/api/user/credits?email=${session.user.email}`).then(res => res.json()).then(data => setCredits(data.credits));
        }
// [DNA_PATCH_START] 寫入歷史紀錄
if (session?.user?.email && finalUrl && genType === "image") {
  fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_email: session.user.email,
      image_url: finalUrl,
      prompt: prompt,
    }),
  });
}
// [DNA_PATCH_END]
        localStorage.setItem("last_prediction", JSON.stringify(formattedData));
        setLoading(false);
        setSeconds(0);
      } else if (data.status === "failed") {
        setError("生成失敗，請檢查點數或重試");
        setLoading(false);
      } else {
        setTimeout(() => checkStatus(id), 2000);
      }
    } catch (err) { setLoading(false); }
  };

  // 4. 開始產圖
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setPrediction(null);
    setSeconds(0);
    setGenType("image");

    try {
      const lockedCharacter = session?.user?.email ? await fetch(`/api/user/credits?email=${session.user.email}`).then(r => r.json()).then(d => d.locked_character || null) : null;
      const res = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
  prompt: selectedStyle ? `${selectedStyle}, ${prompt}` : prompt,
  userEmail: session?.user?.email,
  lockedCharacter: lockedCharacter || null,
}),
      });
      const data = await res.json();
      if (data.id) checkStatus(data.id);
      else { setError(data.error || "啟動失敗"); setLoading(false); }
    } catch (err) { setError("連線失敗"); setLoading(false); }
  };

  // [DNA_PATCH_START] 翻譯函式
const hasChinese = (text: string) => /[\u4e00-\u9fff]/.test(text);

const handleTranslate = async () => {
  if (!prompt.trim() || !hasChinese(prompt)) return;
  setIsTranslating(true);
  setTranslatedPrompt(null);
  setUseTranslated(false);
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: prompt }),
    });
    const data = await res.json();
    if (data.translated) setTranslatedPrompt(data.translated);
  } catch {
    // 翻譯失敗靜默處理
  } finally {
    setIsTranslating(false);
  }
};
// [DNA_PATCH_END]
  // 5. ✨ 接通影片生成
// [DNA_PATCH_START]
  const handleGenerateVideo = async (imageUrl: string, prompt?: string, ratio?: string, duration?: number, model?: string) => {
  // [DNA_PATCH_END]
    setLoading(true);
    setError("");
    setSeconds(0);
    setGenType("video");

    try {
      const res = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: imageUrl, 
          mode: "video", 
          userEmail: session?.user?.email,
          videoPrompt: prompt || "animate this character with smooth natural motion, cinematic quality",
          videoModel: model || "kling",
          aspectRatio: ratio || "1:1",
          duration: duration || 5,
       }),
      });
      const data = await res.json();
      if (data.id) checkStatus(data.id);
      else { setError(data.error || "影片啟動失敗"); setLoading(false); }
    } catch (err) { setError("影片連線失敗"); setLoading(false); }
  };

return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] relative overflow-y-auto">
      
      {/* 背景裝飾光暈 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#89f5a2]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4ade80]/8 rounded-full blur-[100px]" />
      </div>

      {/* 登入與點數顯示區 */}
      <div className="absolute top-5 right-5 z-50 flex flex-col items-end gap-1.5">
        {session ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-[#89f5a2]/30 text-white text-xs font-bold">
                <span className="w-2 h-2 bg-[#89f5a2] rounded-full animate-pulse inline-block" />
                {credits !== null ? credits : "..."} 點
              </div>
              <button onClick={() => signOut()} className="px-3 py-1.5 bg-black/30 backdrop-blur-md text-white/70 rounded-full border border-white/10 text-xs hover:bg-white/10 transition-colors">登出</button>
            </div>
            <span className="text-white/30 text-[10px] pr-1">{session.user?.email}</span>
          </>
        ) : (
          <button onClick={() => signIn("google")} className="flex items-center gap-2 px-5 py-2 bg-[#89f5a2] text-[#0d2318] rounded-full font-bold shadow-lg shadow-[#89f5a2]/20 text-sm hover:bg-[#72e88d] transition-colors">
            <span>🔑</span> Google 登入 <span className="text-[#1a3a25]/60 text-xs font-normal">送 3 點</span>
          </button>
        )}
      </div>

      {/* 主卡片 */}
      <div className="w-full max-w-lg mt-16 mb-8 relative z-10">
        
{/* [DNA_PATCH_START] 標題區加入 LOGO */}
<div className="text-center mb-8">
  <div
    className="relative w-full max-w-xs mx-auto mb-2"
    style={{
      height: '180px',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 50% 50%, black 30%, transparent 80%)',
      maskImage: 'radial-gradient(ellipse 75% 100% at 50% 50%, black 30%, transparent 80%)',
    }}
  >
    <img src="/logo.png" alt="Consistent Flow" className="w-full h-full object-contain" />
  </div>
  <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">AI Character Studio</h1>
  <p className="text-white/40 text-sm mt-2 font-medium tracking-widest uppercase">高精度角色生成平台</p>
</div>
{/* [DNA_PATCH_END] */}

        {/* 輸入卡片 */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* 風格選擇 */}
<div className="mb-3">
  <p className="text-white/40 text-xs mb-2 font-bold tracking-wider uppercase">角色風格</p>
  <div className="flex gap-2 flex-wrap">
    {[
      { label: "🎨 動漫", value: "anime style, cel shading, vibrant colors" },
      { label: "📸 寫實", value: "photorealistic, hyperdetailed, cinematic lighting" },
      { label: "🖼️ 油畫", value: "oil painting, classical art style, textured brushstrokes" },
      { label: "🎮 遊戲", value: "game character, 3D render, Unreal Engine style" },
      { label: "✏️ 素描", value: "pencil sketch, black and white illustration, detailed lineart" },
    ].map((style) => (
      <button
        key={style.value}
        type="button"
        onClick={() => setSelectedStyle(selectedStyle === style.value ? "" : style.value)}
        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
          selectedStyle === style.value
            ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
            : "bg-white/5 text-white/50 border-white/10 hover:border-[#89f5a2]/40 hover:text-white/70"
        }`}
      >
        {style.label}
      </button>
    ))}
  </div>
</div>

{/* [DNA_PATCH_START] textarea + 翻譯按鈕 + 翻譯確認 + 提示文字 */}
<div className="relative">
  <textarea
    value={prompt}
    onChange={(e) => {
      setPrompt(e.target.value);
      setTranslatedPrompt(null);
      setUseTranslated(false);
    }}
    placeholder="描述你想生成的角色，建議英文效果更準&#10;格式：場景 + 角色關鍵字&#10;例：a fierce warrior elf girl with silver hair, standing in a forest"
    className="w-full p-4 rounded-2xl bg-white/8 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#89f5a2]/40 focus:border-[#89f5a2]/40 text-sm resize-none transition-all"
    rows={4}
  />
  <div className="absolute bottom-3 right-3 flex items-center gap-2">
    {hasChinese(prompt) && !translatedPrompt && (
      <button
        type="button"
        onClick={handleTranslate}
        disabled={isTranslating}
        className="px-2 py-1 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-xs rounded-lg font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-40"
      >
        {isTranslating ? "翻譯中..." : "🌐 翻譯成英文"}
      </button>
    )}
    <span className="text-white/20 text-xs">{prompt.length}/500</span>
  </div>
</div>

{/* 翻譯結果確認 */}
{translatedPrompt && (
  <div className="bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-xl p-3 space-y-2">
    <p className="text-white/40 text-xs font-bold tracking-wider uppercase">🌐 翻譯結果</p>
    <p className="text-[#89f5a2] text-sm font-medium">{translatedPrompt}</p>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => { setPrompt(translatedPrompt); setTranslatedPrompt(null); setUseTranslated(true); }}
        className="flex-1 py-1.5 bg-[#89f5a2] text-[#0d2318] rounded-lg text-xs font-black hover:opacity-90 transition-all"
      >
        ✅ 採用翻譯
      </button>
      <button
        type="button"
        onClick={() => { setTranslatedPrompt(null); setUseTranslated(false); }}
        className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
      >
        略過
      </button>
    </div>
  </div>
)}

{/* 提示文字 */}
<div className="px-1 space-y-0.5">
  <p className="text-white/30 text-xs">💡 格式建議：<span className="text-white/50">場景描述 + 角色關鍵字</span></p>
  <p className="text-white/25 text-xs">偵測到中文時可點「翻譯成英文」自動轉換</p>
</div>
{/* [DNA_PATCH_END] */}
            <button
              type="submit"
              disabled={loading || (credits !== null && credits <= 0)}
              className="w-full py-4 bg-gradient-to-r from-[#89f5a2] to-[#4ade80] hover:from-[#72e88d] hover:to-[#3ccf6e] text-[#0d2318] rounded-2xl font-black text-lg shadow-lg shadow-[#89f5a2]/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading && genType === "image" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0d2318]/40 border-t-[#0d2318] rounded-full animate-spin inline-block" />
                  正在構思角色...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">✨ 開始生成角色 <span className="text-[#0d2318]/60 text-sm font-bold">1 點</span></span>
              )}
            </button>
          </form>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-2xl text-center text-sm font-bold backdrop-blur-sm">
            ⚠️ {error}
          </div>
        )}

        {/* 進度條 */}
        {loading && (
          <div className="mt-4 p-5 bg-black/25 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[#89f5a2] text-xs font-black tracking-widest uppercase">
                {genType === "image" ? "🎨 Image Rendering" : "🎥 Video Animating"}
              </span>
              <span className="text-white/60 text-xs font-mono">
  {genType === "video" && seconds >= 120 
    ? "⏳ 排隊中..." 
    : `剩餘約 ${Math.max((genType === "video" ? 120 : 30) - seconds, 0)} 秒`}
</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#89f5a2] to-[#4ade80] rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((seconds / (genType === "video" ? 120 : 30)) * 100, 95)}%` }}
              />
            </div>
            <p className="text-white/25 text-[10px] text-center mt-2">
              {genType === "video" 
  ? seconds >= 120 
    ? "⚠️ 目前影片需求較多，正在排隊中，請繼續耐心等候，請勿關閉頁面" 
    : "影片生成約需 60～120 秒，請耐心等候"
  : "圖片生成約需 15～30 秒"}
            </p>
          </div>
        )}

        {/* 結果顯示區 */}
        {prediction?.output && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              
              {/* 標籤列 */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-2 h-2 bg-[#89f5a2] rounded-full" />
                <span className="text-white/50 text-xs font-bold uppercase tracking-widest">
                  {genType === "video" ? "Generated Video" : "Generated Image"}
                </span>
              </div>

              {/* 媒體內容 */}
              <div className="p-3">
                {genType === "video" || prediction.output.includes('.mp4') ? (
                  <video src={prediction.output} controls autoPlay loop className="rounded-2xl w-full shadow-xl" />
                ) : (
                  <img src={prediction.output} alt="Result" className="rounded-2xl w-full shadow-xl" />
                )}
              </div>

              {/* 操作按鈕 */}
              <div className="grid grid-cols-2 gap-3 p-4 pt-1">
                <button
                  onClick={() => downloadFile(prediction.output)}
                  className="flex items-center justify-center gap-2 py-3 bg-white text-[#0d2318] rounded-xl font-bold text-sm shadow-md hover:bg-[#89f5a2] transition-colors"
                >
                  ⬇️ 儲存成果
                </button>

                <button
                  onClick={() => setShowVideoModal(true)}
                  disabled={loading || (credits !== null && credits <= 0) || genType === "video"}
                  className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white rounded-xl border border-white/15 text-sm font-bold disabled:opacity-25 hover:bg-white/10 transition-colors"
                >
                  {loading && genType === "video" ? (
                    <><span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin inline-block" /> 生成中...</>
                  ) : (
                    <><span>🎬 轉成影片</span><span className="text-white/40 text-xs">Kling 3.0 · 4-6點</span></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
{/* [DNA_PATCH_START] 角色一致性按鈕 + 上傳圖片轉影片 */}
{prediction?.output && !genType.includes('video') && (
  <div className="mt-3 px-4 space-y-2">
    {plan === 'free' ? (
      <>
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/upload-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: prediction.output, email: session?.user?.email }),
              });
              const data = await res.json();
              if (data.url) {
                await fetch("/api/user/save-locked-character", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: session?.user?.email ?? '', url: data.url }),
                });
                setError('');
                alert('✅ 角色已鎖定！下次生成將保持同一角色外觀（每日限額內）');
              } else {
                alert('鎖定失敗，請重試');
              }
            } catch (err) {
              alert('鎖定失敗，請重試');
            }
          }}
          className="w-full py-3 bg-gradient-to-r from-[#89f5a2]/20 to-[#4ade80]/20 border border-[#89f5a2]/40 text-[#89f5a2] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-[#89f5a2]/30 transition-all"
        >
          🎯 鎖定此角色（每日限額內可用）
        </button>
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full py-3 bg-gradient-to-r from-[#89f5a2]/20 to-[#4ade80]/20 border border-[#89f5a2]/40 text-[#89f5a2] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-[#89f5a2]/30 transition-all"
        >
          📁 上傳照片轉影片（每日限額內可用）
        </button>
      </>
    ) : (
      <>
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/upload-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: prediction.output, email: session?.user?.email }),
              });
              const data = await res.json();
              if (data.url) {
  await fetch("/api/user/save-locked-character", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: session?.user?.email ?? '', url: data.url }),
  });
  setError('');
  alert('✅ 角色已鎖定！下次生成將保持同一角色外觀');
} else {
  alert('鎖定失敗，請重試');
}
            } catch (err) {
              alert('鎖定失敗，請重試');
            }
          }}
          className="w-full py-3 bg-gradient-to-r from-[#89f5a2]/20 to-[#4ade80]/20 border border-[#89f5a2]/40 text-[#89f5a2] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-[#89f5a2]/30 transition-all"
        >
          🎯 鎖定此角色（一致性生成）
        </button>
        {/* [DNA_PATCH_START] 解除鎖定按鈕 */}
<button
  onClick={async () => {
    if (!confirm('確定要解除鎖定角色嗎？')) return;
    await fetch("/api/user/clear-locked-character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session?.user?.email }),
    });
    alert('✅ 已解除鎖定，下次生成將創造新角色');
  }}
  className="w-full py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
>
  🔓 解除角色鎖定
</button>
{/* [DNA_PATCH_END] */}
        
        <button
  onClick={() => setShowUploadModal(true)}
  className="w-full py-3 bg-gradient-to-r from-[#89f5a2]/20 to-[#4ade80]/20 border border-[#89f5a2]/40 text-[#89f5a2] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-[#89f5a2]/30 transition-all"
>
          📁 上傳圖片轉影片
        </button>
      </>
    )}
    {/* [DNA_PATCH_START] 鎖定角色提示文字 */}
<div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1">
  <p className="text-white/50 text-xs font-bold">💡 生成提示建議</p>
  <p className="text-white/35 text-xs">格式：<span className="text-white/55">場景描述 + 角色關鍵字</span></p>
  <p className="text-white/25 text-xs">例：standing in a neon city, wearing red armor</p>
  <p className="text-white/25 text-xs">建議英文輸入，或用上方翻譯按鈕轉換</p>
</div>
{/* [DNA_PATCH_END] */}
    <p className="text-white/70 text-xs tracking-wider text-center pt-1">✨ 想讓你的角色突破界限？</p>
<a href="/adult" className="w-full py-3.5 bg-red-900/20 border border-red-500/20 rounded-xl text-red-300/60 text-base font-bold flex items-center justify-center gap-2 hover:bg-red-900/30 hover:text-red-300/80 transition-all">
  🔞成人專區<span className="text-red-300/30">Coming Soon</span>
</a>
<button
  onClick={() => setShowReferralModal(true)}
  className="w-full flex items-center gap-3 px-4 py-2 bg-yellow-400/8 border border-yellow-400/20 rounded-xl hover:bg-yellow-400/15 transition-all group mt-1"
>
  <span className="text-base">✨</span>
  <div className="text-left flex-1">
    <p className="text-yellow-300 text-sm font-black">推薦好友賺點數</p>
    <p className="text-white/30 text-xs">推薦升級即得獎勵</p>
  </div>
  <span className="text-yellow-300/40 text-xs group-hover:translate-x-0.5 transition-transform">→</span>
</button>
  </div>
)}
{/* [DNA_PATCH_START] 影片設定 Modal */}
{showVideoModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-md bg-[#0d2318] border border-[#89f5a2]/20 rounded-3xl p-6 space-y-4 shadow-2xl">
      <h2 className="text-white font-black text-lg text-center">🎬 影片設定</h2>
      <p className="text-center text-sm font-black tracking-widest -mt-2" style={{color: '#fb923c'}}>
            {videoModel === "seedance" ? "✨ Powered by Seedance 1.5 Pro" : "⚡ Powered by Kling 3.0"}
          </p>

      {/* [DNA_PATCH_START] 模型選擇 */}
          <div>
            <p className="text-white/40 text-xs mb-2">影片模型</p>
            <div className="flex gap-2">
              <button
                onClick={() => setVideoModel("kling")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  videoModel === "kling"
                    ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                }`}
              >
                🎬 Kling 3.0
              </button>
              <button
                onClick={() => setVideoModel("seedance")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  videoModel === "seedance"
                    ? "bg-[#fb923c]/20 text-[#fb923c] border-[#fb923c]"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                }`}
              >
                ✨ Seedance 1.5
              </button>
            </div>
          </div>
          {/* [DNA_PATCH_END] */}
      {/* 影片動作指令 */}
<div>
  <p className="text-white/40 text-xs mb-2">影片動作指令（選填）</p>
  <textarea
    value={videoPrompt}
    onChange={(e) => setVideoPrompt(e.target.value)}
    placeholder="例如：在雪地打仗、在逛街、跳舞..."
    rows={2}
    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-[#89f5a2]/50"
  />
</div>
      {/* 比例選擇 */}
      <div>
        <p className="text-white/40 text-xs mb-2">影片比例</p>
        <div className="flex gap-2 flex-wrap">
          {["1:1", "16:9", "9:16", "4:3", "3:4"].map((r) => (
            <button
              key={r}
              onClick={() => setVideoRatio(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                videoRatio === r
                  ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 秒數選擇 */}
      <div>
        <p className="text-white/40 text-xs mb-2">影片秒數</p>
        <div className="flex gap-2">
          {[{ s: 5, label: "5秒", cost: "4-6點" }, { s: 10, label: "10秒", cost: "8-12點" }].map((item) => (
            <button
              key={item.s}
              onClick={() => setVideoDuration(item.s)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                videoDuration === item.s
                  ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
              }`}
            >
              {item.label} <span className="opacity-60">{item.cost}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowVideoModal(false)}
          className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
        >
          取消
        </button>
        <button
          onClick={() => {
            setShowVideoModal(false);
            handleGenerateVideo(prediction.output, "", videoRatio, videoDuration, videoModel);
          }}
          className="py-3 rounded-xl bg-gradient-to-r from-[#89f5a2] to-[#4ade80] text-[#0d2318] text-sm font-bold hover:opacity-90 transition-all"
        >
          🎬 開始生成
        </button>
      </div>
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}
{/* 上傳圖片轉影片 Modal */}
{showUploadModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-md bg-[#0d2318] border border-white/10 rounded-3xl p-6 space-y-4">
      
      {!agreedToTerms ? (
        <>
          <h2 className="text-white font-black text-lg text-center">⚠️ 使用聲明</h2>
          <div className="bg-white/5 rounded-2xl p-4 text-white/60 text-xs space-y-2 leading-relaxed">
            <p>使用本功能即表示您同意以下條款：</p>
            <p>1. 您上傳的圖片須為您本人或已獲得授權的影像，嚴禁上傳他人肖像。</p>
            <p>2. 嚴禁利用本服務製作任何未經當事人同意的換臉、深偽（Deepfake）影片。</p>
            <p>3. 嚴禁製作任何涉及色情、暴力、詐騙、誹謗或其他違法內容。</p>
            <p>4. 您須為上傳內容承擔全部法律責任，本平台不承擔任何連帶責任。</p>
            <p>5. 違反上述條款者，本平台有權終止您的帳號並保留法律追訴權。</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              className="w-4 h-4 accent-[#89f5a2]"
            />
            <span className="text-white/70 text-sm">我已閱讀並同意上述條款</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setShowUploadModal(false); setTermsChecked(false); }}
              className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
            >
              取消
            </button>
            <button
              onClick={() => { if (termsChecked) setAgreedToTerms(true); }}
              disabled={!termsChecked}
              className="py-3 rounded-xl bg-[#89f5a2] text-[#0d2318] text-sm font-bold disabled:opacity-30 hover:bg-[#72e88d] transition-all"
            >
              同意並繼續
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-white font-black text-lg text-center">📁 上傳圖片轉影片</h2>
          <p className="text-center text-sm font-black tracking-widest -mt-2" style={{color: '#fb923c'}}>
            {videoModel === "seedance" ? "✨ Powered by Seedance 1.5 Pro" : "⚡ Powered by Kling 3.0"}
          </p>
          
          {/* 上傳圖片 */}
          <label className="block w-full cursor-pointer">
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:border-[#89f5a2]/50 transition-all">
              {uploadedImage ? (
                <img src={uploadedImage} className="w-full max-h-36 object-contain rounded-xl" />
              ) : (
                <>
                  <p className="text-3xl mb-2">🖼️</p>
                  <p className="text-white/50 text-sm">點擊上傳圖片</p>
                  <p className="text-white/30 text-xs mt-1">支援 JPG、PNG、WEBP</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setUploadedImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>

          {/* 描述框 */}
          <textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="描述想要的動作或場景,用英文判讀會更準（選填）&#10;例如：walking in a park, waving hand, dancing"
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#89f5a2]/40"
            rows={3}
          />

          {/* [DNA_PATCH_START] 模型選擇 */}
          <div>
            <p className="text-white/40 text-xs mb-2">影片模型</p>
            <div className="flex gap-2">
              <button
                onClick={() => setVideoModel("kling")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  videoModel === "kling"
                    ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                }`}
              >
                🎬 Kling 3.0
              </button>
              <button
                onClick={() => setVideoModel("seedance")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  videoModel === "seedance"
                    ? "bg-[#fb923c]/20 text-[#fb923c] border-[#fb923c]"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                }`}
              >
                ✨ Seedance 1.5
              </button>
            </div>
          </div>
          {/* [DNA_PATCH_END] */}
          {/* 比例選擇 */}
          <div>
            <p className="text-white/40 text-xs mb-2">影片比例</p>
            <div className="flex gap-2 flex-wrap">
              {["1:1", "16:9", "9:16", "4:3", "3:4"].map((r) => (
                <button
                  key={r}
                  onClick={() => setVideoRatio(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    videoRatio === r
                      ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 秒數選擇 */}
          <div>
            <p className="text-white/40 text-xs mb-2">影片秒數</p>
            <div className="flex gap-2">
              {[{ s: 5, label: "5秒", cost: "4-6點" }, { s: 10, label: "10秒", cost: "8-12點" }].map((item) => (
                <button
                  key={item.s}
                  onClick={() => setVideoDuration(item.s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    videoDuration === item.s
                      ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                  }`}
                >
                  {item.label} <span className="opacity-60">{item.cost}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setShowUploadModal(false); setAgreedToTerms(false); setTermsChecked(false); setUploadedImage(null); setVideoPrompt(""); }}
              className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (uploadedImage) {
                  setShowUploadModal(false);
                  setAgreedToTerms(false);
                  setTermsChecked(false);
                  handleGenerateVideo(uploadedImage, videoPrompt, videoRatio, videoDuration, videoModel);
                  setUploadedImage(null);
                  setVideoPrompt("");
                }
              }}
              disabled={!uploadedImage}
              className="py-3 rounded-xl bg-gradient-to-r from-[#89f5a2] to-[#4ade80] text-[#0d2318] text-sm font-bold disabled:opacity-30 hover:opacity-90 transition-all"
            >
              🎬 生成影片
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}

      {/* 歷史作品區 */}
      {Array.isArray(history) && history.length > 0 && (
        <div className="w-full max-w-lg mb-24 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs font-bold uppercase tracking-[0.3em]">歷史作品</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
            {history.slice(0, 5).map((item, idx) => {
              const url = typeof item === 'string' ? item : item.image_url;
              const isVideo = url?.includes('.mp4');
              return (
                <div
                  key={idx}
                  className="group flex-shrink-0 w-32 h-32 rounded-2xl border border-white/10 overflow-hidden shadow-lg cursor-pointer relative transition-all duration-200 hover:scale-105 hover:border-[#89f5a2]/50 hover:shadow-[0_0_20px_rgba(137,245,162,0.15)]"
                  onClick={() => {
                    setPrediction({ output: url, status: 'succeeded' });
                    setGenType(isVideo ? "video" : "image");
                  }}
                >
                  {isVideo ? (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-1">
                      <span className="text-2xl">🎬</span>
                      <span className="text-[9px] text-[#89f5a2] font-black tracking-wider">VIDEO</span>
                    </div>
                  ) : (
                    <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {/* 懸停遮罩 */}
                  <div className="absolute inset-0 bg-[#89f5a2]/0 group-hover:bg-[#89f5a2]/10 transition-colors duration-200 flex items-center justify-center">
                    <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg">點擊查看</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        {/* [DNA_PATCH_START] 推薦賺點 Modal */}
{showReferralModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-md bg-[#0d2318] border border-yellow-400/20 rounded-3xl p-6 space-y-5 shadow-2xl">
      <div className="text-center">
        <p className="text-3xl mb-1">🎁</p>
        <h2 className="text-white font-black text-xl">推薦賺點</h2>
        <p className="text-white/50 text-xs mt-1">
          推薦朋友升級方案，朋友付款成功後<br />
          你最高可獲得 <span className="text-yellow-300 font-black">{referralCredits?.pro ?? "..."} 點</span> 獎勵！
        </p>
      </div>
      <div className="bg-white/5 rounded-2xl p-4 space-y-2">
        <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-3">方案獎勵對照</p>
        {[
          { label: "🌱 入門包", key: "starter" },
          { label: "⭐ 標準包", key: "standard" },
          { label: "🚀 專業包", key: "pro" },
        ].map(({ label, key }) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-white/70 text-sm">{label}</span>
            <span className="text-yellow-300 font-black text-sm">
              + {referralCredits?.[key as "starter" | "standard" | "pro"] ?? "..."} 點
            </span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">你的專屬介紹碼</p>
        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono font-black tracking-widest text-center">
            {referralCode ?? "載入中..."}
          </div>
          <button
            onClick={() => { if (referralCode) { navigator.clipboard.writeText(referralCode); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); } }}
            className="px-4 py-3 bg-yellow-400/20 border border-yellow-400/30 rounded-xl text-yellow-300 text-xs font-bold hover:bg-yellow-400/30 transition-all whitespace-nowrap"
          >
            {copiedCode ? "✅ 已複製" : "複製"}
          </button>
        </div>
      </div>
      <div>
        <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">你的專屬連結</p>
        <div className="flex gap-2">
          <div className="flex-1 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 text-xs font-mono truncate">
            {referralCode ? `${window.location.origin}/pricing?ref=${referralCode}` : "載入中..."}
          </div>
          <button
            onClick={() => { if (referralCode) { navigator.clipboard.writeText(`${window.location.origin}/pricing?ref=${referralCode}`); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); } }}
            className="px-4 py-3 bg-yellow-400/20 border border-yellow-400/30 rounded-xl text-yellow-300 text-xs font-bold hover:bg-yellow-400/30 transition-all whitespace-nowrap"
          >
            {copiedLink ? "✅ 已複製" : "複製"}
          </button>
        </div>
      </div>
      <button
        onClick={() => setShowReferralModal(false)}
        className="w-full py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
      >
        關閉
      </button>
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}
        </main>
  );
}