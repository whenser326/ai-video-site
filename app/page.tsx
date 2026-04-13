"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
// [DNA_PATCH_START] 防止視窗切換時自動刷新
import { useRouter } from 'next/navigation';

export default function Home() {
  const hasLoadedFromStorage = useRef(false);
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
// [DNA_PATCH_START] 影片提示詞翻譯狀態
const [videoTranslatedPrompt, setVideoTranslatedPrompt] = useState<string | null>(null);
const [isVideoTranslating, setIsVideoTranslating] = useState(false);
// [DNA_PATCH_END]
// [DNA_PATCH_START] 翻譯相關狀態
const [translatedPrompt, setTranslatedPrompt] = useState<string | null>(null);
const [isTranslating, setIsTranslating] = useState(false);
const [useTranslated, setUseTranslated] = useState(false);
// [DNA_PATCH_END]
// [DNA_PATCH_START] 推薦賺點狀態
const [showReferralModal, setShowReferralModal] = useState(false);
// [DNA_PATCH_START]
const [lockedCharacterUrl, setLockedCharacterUrl] = useState<string | null>(null);
const [lockedCharacterId, setLockedCharacterId] = useState<number | null>(null);
const [kontextRetryCount, setKontextRetryCount] = useState(0);
const [retryMessage, setRetryMessage] = useState("");
// [DNA_PATCH_END]
const [referralCode, setReferralCode] = useState<string | null>(null);
const [referralCredits, setReferralCredits] = useState<{ starter: string; standard: string; pro: string } | null>(null);
const [copiedCode, setCopiedCode] = useState(false);
const [copiedLink, setCopiedLink] = useState(false);
const [activeTab, setActiveTab] = useState<"gallery" | "history">("gallery");
// [DNA_PATCH_START] 靈感畫廊熱門圖片狀態
const [galleryItems, setGalleryItems] = useState<{ title: string; prompt: string; image: string }[]>([]);
// [DNA_PATCH_END]
// [DNA_PATCH_START] 角色收藏狀態
const [savedCharacters, setSavedCharacters] = useState<any[]>([]);
const [showSaveModal, setShowSaveModal] = useState(false);
const [saveCharacterName, setSaveCharacterName] = useState("");
const [isSaving, setIsSaving] = useState(false);
// [DNA_PATCH_END]
// [DNA_PATCH_START] TTS 狀態
const [showTtsModal, setShowTtsModal] = useState(false);
const [ttsText, setTtsText] = useState("");
const [ttsVoice, setTtsVoice] = useState("gentle-female");
const [ttsAudio, setTtsAudio] = useState<string | null>(null);
const [isTtsLoading, setIsTtsLoading] = useState(false);
const [ttsTrimmed, setTtsTrimmed] = useState(false);
// [DNA_PATCH_START] Wav2Lip 狀態
const [isWav2lipLoading, setIsWav2lipLoading] = useState(false);
const [wav2lipResult, setWav2lipResult] = useState<string | null>(null);
const [wav2lipSeconds, setWav2lipSeconds] = useState(0);
const [ttsSeconds, setTtsSeconds] = useState(0);
// [DNA_PATCH_END]
// [DNA_PATCH_START] 批次生成狀態
const [showBatchModal, setShowBatchModal] = useState(false);
const [batchCount, setBatchCount] = useState(2);
const [batchPrompts, setBatchPrompts] = useState<{ prompt: string; note: string; isTranslating?: boolean; translated?: boolean; isNoteTranslating?: boolean; noteTranslated?: boolean }[]>([
  { prompt: "", note: "" },
  { prompt: "", note: "" },
  { prompt: "", note: "" },
  { prompt: "", note: "" },
  { prompt: "", note: "" },
  { prompt: "", note: "" },
]);
const [batchResults, setBatchResults] = useState<{ url: string; status: "waiting" | "generating" | "done" | "failed" }[]>([]);
const [isBatchGenerating, setIsBatchGenerating] = useState(false);
const [batchCurrentIndex, setBatchCurrentIndex] = useState(-1);
// [DNA_PATCH_END]

  // 1. 初始化與點數同步
  useEffect(() => {
    if (!hasLoadedFromStorage.current && session?.user?.email) {
      hasLoadedFromStorage.current = true;
      const savedKey = `last_prediction_${session.user.email}`;
      const savedPrediction = localStorage.getItem(savedKey);
      if (savedPrediction) setPrediction(JSON.parse(savedPrediction));
    }
    
    // [DNA_PATCH_START]
    setLockedCharacterUrl(localStorage.getItem('locked_character'));
// [DNA_PATCH_END]
    if (session?.user?.email) {
      // 抓取歷史紀錄
      fetch(`/api/history?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          setHistory(data);
          // [DNA_PATCH_START] 靈感畫廊：從歷史抓最多4張有 prompt 的圖
          const FALLBACK_GALLERY = [
            { title: "迷人貓咪", prompt: "Breathtakingly beautiful cat", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719479381.png" },
            { title: "韓系男生", prompt: "A handsome Korean man looks at the camera with a smile ~ the background is a men's clothing store", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719447992.png" },
            { title: "城市女孩", prompt: "Beautiful woman walking on city street", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719327300.png" },
            { title: "走向鏡頭", prompt: "Slowly walk into the camera ~ getting closer and closer", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775716736592.png" },
            { title: "貓狗好友", prompt: "Beautiful cat playing with dog", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775658563619.png" },
            { title: "校園奔跑", prompt: "Running on campus", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775657672714.png" },
            { title: "健壯男士", prompt: "Handsome man showing off his strong muscles and wiping sweat", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719396914.png" },
            { title: "沙灘活力", prompt: "A fit woman playing beach volleyball on a tropical beach, action shot, dynamic movement, cinematic lighting", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719296354.png" },
          ];
          if (Array.isArray(data)) {
            const fromHistory = data
              .filter((item: any) => item.image_url && item.prompt && !item.video_url)
              .slice(0, 4)
              .map((item: any) => ({
                title: "我的作品",
                prompt: item.prompt,
                image: item.image_url,
              }));
            const combined = [...fromHistory, ...FALLBACK_GALLERY].slice(0, 8);
            setGalleryItems(combined);
          } else {
            setGalleryItems(FALLBACK_GALLERY);
          }
          // [DNA_PATCH_END]
        });

      // 抓取點數 (包含新用戶免費 3 張的邏輯應在後端 profiles 表格初始值設定為 3)
      fetch(`/api/user/credits?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
  setCredits(data.credits);
  setPlan(data.plan || 'free');
});
// [DNA_PATCH_START] 載入收藏角色
fetch(`/api/saved-characters?email=${session.user.email}`)
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data)) {
      setSavedCharacters(data);
      // [DNA_PATCH_START] 找到鎖定角色對應的 id
      const lockedUrl = localStorage.getItem('locked_character');
      if (lockedUrl) {
        const matched = data.find((c: any) => c.image_url === lockedUrl);
        if (matched) setLockedCharacterId(matched.id);
      }
      // [DNA_PATCH_END]
    }
  });
// [DNA_PATCH_END]
    }
  }, [session]);
  // [DNA_PATCH_START] Wav2Lip 倒數計時
useEffect(() => {
  if (!isWav2lipLoading) { setWav2lipSeconds(0); return; }
  const timer = setInterval(() => setWav2lipSeconds(prev => prev + 2), 2000);
  return () => clearInterval(timer);
}, [isWav2lipLoading]);
// [DNA_PATCH_END]
// [DNA_PATCH_START] TTS 倒數計時
useEffect(() => {
  if (!isTtsLoading) { setTtsSeconds(0); return; }
  const timer = setInterval(() => setTtsSeconds(prev => prev + 2), 2000);
  return () => clearInterval(timer);
}, [isTtsLoading]);
// [DNA_PATCH_END]
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
  // [DNA_PATCH_START]
const checkStatus = async (id: string, currentGenType?: string) => {
// [DNA_PATCH_END]
    try {
      const res = await fetch(`/api/character?id=${id}&email=${session?.user?.email}`);
      const data = await res.json();
      setSeconds(prev => prev + 2);
      console.log("Polling status:", data.status, "Error:", data.error, data);

      if (data.status === "succeeded") {
        // [DNA_PATCH_START]
const finalUrl = Array.isArray(data.output) ? data.output[0] : data.output;
const resolvedGenType = currentGenType || genType;
console.log("finalUrl:", finalUrl, "resolvedGenType:", resolvedGenType, "output:", data.output);
// [DNA_PATCH_END]
        const formattedData = { ...data, output: finalUrl };
        
        setPrediction(formattedData);
        
        // 更新點數與歷史
        if (session?.user?.email) {
                    fetch(`/api/user/credits?email=${session.user.email}`).then(res => res.json()).then(data => setCredits(data.credits));
        }
// [DNA_PATCH_START] 寫入歷史紀錄
// [DNA_PATCH_START] 圖片+影片永久保存至 Supabase Storage
if (session?.user?.email && finalUrl) {
  let permanentUrl = finalUrl;
  try {
    const uploadRes = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: finalUrl, email: session.user.email }),
    });
    const uploadData = await uploadRes.json();
    if (uploadData.url) permanentUrl = uploadData.url;
  } catch {
    // 上傳失敗用原始 URL
  }

  await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_email: session.user.email,
      image_url: resolvedGenType === "image" ? permanentUrl : null,
      video_url: resolvedGenType === "video" ? permanentUrl : null,
      prompt: prompt || videoPrompt,
      character_id: lockedCharacterId || null,
    }),
  });
}
// [DNA_PATCH_END]
if (session?.user?.email) fetch(`/api/history?email=${session.user.email}`).then(res => res.json()).then(data => setHistory(data));
        localStorage.setItem(`last_prediction_${session?.user?.email}`, JSON.stringify(formattedData));
        setLoading(false);
        setSeconds(0);
      // [DNA_PATCH_START]
      } else if (data.status === "failed") {
        const isKontext = data.model?.includes('flux-kontext-pro');
        if (isKontext && kontextRetryCount < 2) {
          const nextCount = kontextRetryCount + 1;
          setKontextRetryCount(nextCount);
          setRetryMessage(`角色一致性生成遇到問題，正在第 ${nextCount} 次重試...`);
          // 重新呼叫生成
          try {
            const res = await fetch("/api/character", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: prompt,
                userEmail: session?.user?.email,
              }),
            });
            const retryData = await res.json();
            if (retryData.id) {
              setTimeout(() => checkStatus(retryData.id), 2000);
            } else {
              // retry 也啟動失敗，退點
              await fetch("/api/character", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refundCredits: 1, userEmail: session?.user?.email }),
              });
              fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => setCredits(d.credits));
              setRetryMessage("");
              setKontextRetryCount(0);
              setError("角色一致性生成失敗，點數已退還");
              setLoading(false);
            }
          } catch {
            setRetryMessage("");
            setKontextRetryCount(0);
            setError("角色一致性生成失敗，請重試");
            setLoading(false);
          }
        } else if (isKontext && kontextRetryCount >= 2) {
          // 2次都失敗，退點
          await fetch("/api/character", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refundCredits: 1, userEmail: session?.user?.email }),
          });
          fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => setCredits(d.credits));
          setRetryMessage("");
          setKontextRetryCount(0);
          setError("角色一致性生成失敗，點數已退還");
          setLoading(false);
        } else {
          setError("生成失敗，請檢查點數或重試");
          setLoading(false);
        }
      // [DNA_PATCH_END]
      } else {
        setTimeout(() => checkStatus(id, currentGenType), 2000);
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
      if (data.id) checkStatus(data.id, "image");
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
// [DNA_PATCH_START] 影片提示詞翻譯函式
const handleVideoTranslate = async () => {
  if (!videoPrompt.trim() || !hasChinese(videoPrompt)) return;
  setIsVideoTranslating(true);
  setVideoTranslatedPrompt(null);
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: videoPrompt }),
    });
    const data = await res.json();
    if (data.translated) setVideoTranslatedPrompt(data.translated);
  } catch {
    // 翻譯失敗靜默處理
  } finally {
    setIsVideoTranslating(false);
  }
};
// [DNA_PATCH_START] 批次生成函式
const getMaxBatch = () => {
  if (plan === 'pro') return 6;
  if (plan === 'standard') return 4;
  if (plan === 'starter') return 2;
  return 0;
};

const handleBatchGenerate = async () => {
  if (!lockedCharacterUrl) { alert("⚠️ 批次生成必須先鎖定角色！"); return; }
  const maxBatch = getMaxBatch();
  if (maxBatch === 0) { alert("⚠️ 批次生成為付費功能，請先升級方案"); return; }
  const validPrompts = batchPrompts.slice(0, batchCount).filter(p => p.prompt.trim());
  if (validPrompts.length === 0) { alert("⚠️ 請至少填寫一個 Pose 描述"); return; }

  setIsBatchGenerating(true);
  setBatchCurrentIndex(-1);
  setBatchResults(validPrompts.map(() => ({ url: "", status: "waiting" })));

  const res = await fetch("/api/character", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchPrompts: validPrompts, userEmail: session?.user?.email }),
  });
  const data = await res.json();

  if (!data.batch || !data.predictions) {
    alert(data.error || "批次生成啟動失敗");
    setIsBatchGenerating(false);
    return;
  }

  const results: { url: string; status: "waiting" | "generating" | "done" | "failed" }[] = validPrompts.map(() => ({ url: "", status: "waiting" }));

  for (let i = 0; i < data.predictions.length; i++) {
    setBatchCurrentIndex(i);
    results[i] = { url: "", status: "generating" };
    setBatchResults([...results]);

    const predId = data.predictions[i].id;
    let done = false;
    let retryCount = 0;
    let currentPredId = predId;

    while (!done) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const pollRes = await fetch(`/api/character?id=${currentPredId}&email=${session?.user?.email}`);
        const pollData = await pollRes.json();

        if (pollData.status === "succeeded") {
          const finalUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
          let permanentUrl = finalUrl;
          try {
            const uploadRes = await fetch("/api/upload-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: finalUrl, email: session?.user?.email }),
            });
            const uploadData = await uploadRes.json();
            if (uploadData.url) permanentUrl = uploadData.url;
          } catch {}
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_email: session?.user?.email,
              image_url: permanentUrl,
              video_url: null,
              prompt: validPrompts[i].prompt,
              character_id: lockedCharacterId || null,
            }),
          });
          results[i] = { url: permanentUrl, status: "done" };
          setBatchResults([...results]);
          done = true;

        } else if (pollData.status === "failed") {
          if (retryCount < 2) {
            // 自動 retry
            retryCount++;
            results[i] = { url: "", status: "generating" };
            setBatchResults([...results]);
            const finalPrompt = `${validPrompts[i].prompt}${validPrompts[i].note ? ', ' + validPrompts[i].note : ''}, same person from reference image`;
            try {
              const retryRes = await fetch("/api/character", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  batchPrompts: [{ prompt: validPrompts[i].prompt, note: validPrompts[i].note }],
                  userEmail: session?.user?.email,
                  isSingleRetry: true,
                }),
              });
              const retryData = await retryRes.json();
              if (retryData.batch && retryData.predictions?.[0]?.id) {
                currentPredId = retryData.predictions[0].id;
              } else {
                // retry 啟動失敗，直接退點標記失敗
                await fetch("/api/character", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ refundCredits: 1, userEmail: session?.user?.email }),
                });
                fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => setCredits(d.credits));
                results[i] = { url: "", status: "failed" };
                setBatchResults([...results]);
                done = true;
              }
            } catch {
              results[i] = { url: "", status: "failed" };
              setBatchResults([...results]);
              done = true;
            }
          } else {
            // retry 2次都失敗，退點
            await fetch("/api/character", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refundCredits: 1, userEmail: session?.user?.email }),
            });
            fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => setCredits(d.credits));
            results[i] = { url: "", status: "failed" };
            setBatchResults([...results]);
            done = true;
          }
        }
      } catch { done = true; }
    }
  }

  if (session?.user?.email) {
    fetch(`/api/user/credits?email=${session.user.email}`).then(r => r.json()).then(d => setCredits(d.credits));
    fetch(`/api/history?email=${session.user.email}`).then(r => r.json()).then(d => setHistory(d));
  }
  setBatchCurrentIndex(-1);
  setIsBatchGenerating(false);
};
// [DNA_PATCH_END]
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
      if (data.id) checkStatus(data.id, "video");
      else { setError(data.error || "影片啟動失敗"); setLoading(false); }
    } catch (err) { setError("影片連線失敗"); setLoading(false); }
  };

return (
    <main className="flex min-h-screen flex-col items-center px-3 sm:px-4 pt-4 pb-4 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] relative overflow-y-auto">
      
      {/* 背景裝飾光暈 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#89f5a2]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4ade80]/8 rounded-full blur-[100px]" />
      </div>

      {/* 登入與點數顯示區 */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-50 flex flex-col items-end gap-1.5">
        {session ? (
          <>
            {/* 手機版：直排 / 電腦版：橫排 */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2">
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
      <div className="w-full max-w-lg mt-14 sm:mt-16 mb-8 relative z-10">
        
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
  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">AI Character Studio</h1>
  <p className="text-white/40 text-sm mt-2 font-medium tracking-widest uppercase">高精度角色生成平台</p>
</div>
{/* [DNA_PATCH_END] */}

        {/* 輸入卡片 */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
           {/* [DNA_PATCH_START] 鎖定角色狀態列 */}
{(() => {
  const lockedUrl = lockedCharacterUrl;
  return lockedUrl ? (
    <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-2xl">
      <img src={lockedUrl} className="w-12 h-12 rounded-xl object-cover border border-[#89f5a2]/40 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[#89f5a2] text-xs font-black">🔒 角色鎖定中</p>
        <p className="text-white/40 text-xs mt-0.5">生成將套用此角色（-1點）</p>
      </div>
    </div>
  ) : null;
})()}
{/* [DNA_PATCH_END] */}
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
{/* [DNA_PATCH_START] 人設快速標籤 */}
<div className="mb-3">
  <p className="text-white/40 text-xs mb-2 font-bold tracking-wider uppercase">✨ 人設快速標籤</p>
  <div className="flex gap-2 flex-wrap">
    {[
      { label: "🇹🇼 台灣女孩", value: "Taiwanese girl, natural look, friendly smile, casual outfit" },
      { label: "👠 冷豔名模", value: "high fashion model, cold expression, sharp features, editorial look" },
      { label: "🎀 清純學生", value: "cute student girl, innocent expression, school uniform, soft lighting" },
      { label: "💼 都市OL", value: "office lady, professional attire, confident look, city background" },
      { label: "🔮 神秘女巫", value: "mysterious witch, dark fantasy, glowing eyes, dramatic lighting" },
      { label: "🇰🇷 韓系男生", value: "handsome Korean man, clean look, casual fashion, soft smile" },
      { label: "💪 硬漢型男", value: "rugged masculine man, strong jawline, serious expression, cinematic" },
      { label: "⚔️ 帥氣騎士", value: "armored knight, heroic pose, fantasy style, epic lighting" },
      { label: "🌆 賽博龐克", value: "cyberpunk character, neon lights, futuristic outfit, urban night" },
      { label: "🧝 奇幻精靈", value: "fantasy elf, pointed ears, ethereal beauty, forest background" },
    ].map((tag) => (
      <button
        key={tag.value}
        type="button"
        onClick={() => {
          setPrompt(tag.value);
          setTranslatedPrompt(null);
          setUseTranslated(false);
        }}
        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
          prompt === tag.value
            ? "bg-yellow-400/30 text-yellow-300 border-yellow-400/60"
            : "bg-white/5 text-white/50 border-white/10 hover:border-yellow-400/40 hover:text-white/70"
        }`}
      >
        {tag.label}
      </button>
    ))}
  </div>
  <p className="text-white/20 text-[10px] mt-1.5">點選後自動填入輸入框，可再自行微調</p>
</div>
{/* [DNA_PATCH_END] */}

{/* [DNA_PATCH_START] textarea + 翻譯按鈕 + 翻譯確認 + 提示文字 */}
<div className="relative">
  <textarea
    value={prompt}
    onChange={(e) => {
      setPrompt(e.target.value);
      setTranslatedPrompt(null);
      setUseTranslated(false);
    }}
    placeholder="描述你想生成的角色（中文也可以！輸入後點「翻譯成英文」按鈕，我們幫你自動翻譯 🌐）&#10;格式：場景 + 角色關鍵字&#10;例：a fierce warrior elf girl with silver hair, standing in a forest"
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

{/* [DNA_PATCH_START] retry 提示訊息 */}
{retryMessage && (
  <div className="w-full max-w-lg relative z-10">
    <div className="px-4 py-3 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl text-yellow-300 text-sm text-center font-bold">
      ⚡ {retryMessage}
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}
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
    ? "🔄 影片生成中，等待時間較長，請保持頁面開啟 😊" 
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
                    <span className="flex flex-col items-center leading-tight"><span>🎬 轉成影片</span><span className="text-white/40 text-xs">Kling 3.0 · 4-6點</span></span>
                  )}
                </button>
                {/* [DNA_PATCH_START] 分享按鈕 */}
                <button
                  onClick={async () => {
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    if (isMobile && navigator.share) {
                      // 手機：跳系統選單
                      try {
                        await navigator.share({
                          title: 'AI Character Studio',
                          text: '我用 AI Character Studio 生成了這張角色圖！來試試看 👉',
                          url: 'https://ai-video-site-psi.vercel.app',
                        });
                      } catch {}
                    } else {
                      // 電腦：下載圖片 + 開FB
                      await downloadFile(prediction.output);
                      setTimeout(() => {
                        window.open('https://www.facebook.com', '_blank');
                        alert('圖片已下載！\n\n請到 FB 建立新貼文 → 選擇剛下載的圖片 📘');
                      }, 1000);
                    }
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/15 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  分享作品
                </button>
                {/* [DNA_PATCH_END] */}
                {/* [DNA_PATCH_START] 影片不保存提示 */}
{genType === "video" && (
  // [DNA_PATCH_START]
<div className="col-span-2 w-full mt-1 px-4 py-3 bg-yellow-400/20 border-2 border-yellow-400/50 rounded-2xl text-center">
  <p className="text-yellow-300 text-sm font-black tracking-wide">⚠️ 影片保存僅3天(付費7天)，請立即下載保存</p>
</div>
// [DNA_PATCH_END]
)}
{/* [DNA_PATCH_START] TTS 語音合成按鈕（付費專屬，僅影片生成後顯示） */}
{plan !== 'free' && genType === 'video' && (
  <button
    onClick={() => { setTtsText(""); setTtsAudio(null); setWav2lipResult(null); setShowTtsModal(true); }}
    className="col-span-2 w-full py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-purple-500/30 transition-all"
  >
    🎙️ 語音合成 <span className="text-purple-300/50 text-xs">6點/次</span>
  </button>
)}
{/* [DNA_PATCH_END] */}
{/* [DNA_PATCH_END] */}
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
    const lockBtn = document.activeElement as HTMLButtonElement;
    if (lockBtn) lockBtn.textContent = '🔄 鎖定中...';
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
                localStorage.setItem('locked_character', data.url);
                setLockedCharacterUrl(data.url);
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
    const lockBtn = document.activeElement as HTMLButtonElement;
    if (lockBtn) lockBtn.textContent = '🔄 鎖定中...';
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
  localStorage.setItem('locked_character', data.url);
  setLockedCharacterUrl(data.url);
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
        {/* [DNA_PATCH_START] 批次生成按鈕（付費專屬） */}
        {plan !== 'free' && lockedCharacterUrl && (
          <button
            onClick={() => setShowBatchModal(true)}
            className="w-full py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-blue-500/30 transition-all"
          >
            🎭 批次生成不同 Pose <span className="text-blue-300/50 text-xs">每張1點</span>
          </button>
        )}
        {/* [DNA_PATCH_END] */}
        {/* [DNA_PATCH_START] 收藏此角色按鈕 */}
        <button
          onClick={() => { setSaveCharacterName(""); setShowSaveModal(true); }}
          className="w-full py-3 bg-gradient-to-r from-yellow-400/20 to-yellow-300/10 border border-yellow-400/30 text-yellow-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-yellow-400/30 transition-all"
        >
          ⭐ 收藏此角色
        </button>
        {/* [DNA_PATCH_END] */}
        {/* [DNA_PATCH_START] TTS 語音合成按鈕（付費專屬，僅影片生成後顯示） */}
        {plan !== 'free' && (prediction?.output?.includes('.mp4') || genType === 'video') && (
          <button
            onClick={() => { setTtsText(""); setTtsAudio(null); setShowTtsModal(true); }}
            className="w-full py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-purple-500/30 transition-all"
          >
            🎙️ 語音合成 <span className="text-purple-300/50 text-xs">6點/次</span>
          </button>
        )}
        {/* [DNA_PATCH_END] */}
        {/* [DNA_PATCH_START] 解除鎖定按鈕 */}
<button
  onClick={async () => {
    if (!confirm('確定要解除鎖定角色嗎？')) return;
    await fetch("/api/user/clear-locked-character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session?.user?.email }),
    });
    localStorage.removeItem('locked_character');
    setLockedCharacterUrl(null);
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
{/* 成人專區暫時隱藏，等綠界審核通過後再開放 */}
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
{/* [DNA_PATCH_START] 收藏角色列表 */}
{savedCharacters.length > 0 && (
  <div className="mt-3 px-4">
    <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">⭐ 收藏的角色</p>
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {savedCharacters.map((char) => (
        <div key={char.id} className="flex-shrink-0 w-20 group relative cursor-pointer"
          onClick={() => {
            localStorage.setItem('locked_character', char.image_url);
            setLockedCharacterUrl(char.image_url);
            setLockedCharacterId(char.id);
            fetch("/api/user/save-locked-character", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: session?.user?.email, url: char.image_url }),
            });
            alert(`✅ 已切換到「${char.name}」`);
          }}
        >
          <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 group-hover:border-yellow-400/50 transition-all">
            <img src={char.image_url} className="w-full h-full object-cover" />
          </div>
          <p className="text-white/50 text-[9px] text-center mt-1 truncate font-bold">{char.name}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!confirm(`確定刪除「${char.name}」？`)) return;
              fetch("/api/saved-characters", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: char.id, email: session?.user?.email }),
              }).then(() => setSavedCharacters(prev => prev.filter(c => c.id !== char.id)));
            }}
            className="absolute top-0 right-0 w-5 h-5 bg-red-500/80 rounded-full text-white text-[10px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >×</button>
        </div>
      ))}
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}
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
{/* 影片動作指令 */}
{/* [DNA_PATCH_START] 影片動作指令 + 翻譯 */}
<div>
  <p className="text-white/40 text-xs mb-2">影片動作指令（選填）</p>
  <div className="relative">
    <textarea
      value={videoPrompt}
      onChange={(e) => { setVideoPrompt(e.target.value); setVideoTranslatedPrompt(null); }}
      placeholder="例如：在雪地打仗、在逛街、跳舞...（中文也可以！輸入後點「翻譯成英文」按鈕，我們幫你自動翻譯 🌐）"
      rows={2}
      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-[#89f5a2]/50"
    />
    <div className="absolute bottom-2 right-2">
      {hasChinese(videoPrompt) && !videoTranslatedPrompt && (
        <button
          type="button"
          onClick={handleVideoTranslate}
          disabled={isVideoTranslating}
          className="px-2 py-1 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-xs rounded-lg font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-40"
        >
          {isVideoTranslating ? "翻譯中..." : "🌐 翻譯"}
        </button>
      )}
    </div>
  </div>
  {videoTranslatedPrompt && (
    <div className="mt-2 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-xl p-3 space-y-2">
      <p className="text-white/40 text-xs font-bold uppercase">🌐 翻譯結果</p>
      <p className="text-[#89f5a2] text-sm">{videoTranslatedPrompt}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setVideoPrompt(videoTranslatedPrompt); setVideoTranslatedPrompt(null); }}
          className="flex-1 py-1.5 bg-[#89f5a2] text-[#0d2318] rounded-lg text-xs font-black hover:opacity-90 transition-all"
        >
          ✅ 採用
        </button>
        <button
          type="button"
          onClick={() => setVideoTranslatedPrompt(null)}
          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
        >
          略過
        </button>
      </div>
    </div>
  )}
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
          {/* [DNA_PATCH_START] 上傳圖片描述框 + 翻譯 */}
          <div className="relative">
            <textarea
              value={videoPrompt}
              onChange={(e) => { setVideoPrompt(e.target.value); setVideoTranslatedPrompt(null); }}
              placeholder="描述想要的動作或場景，用英文判讀會更準！（選填，中文也可以！輸入後點「翻譯成英文」按鈕，我們幫你自動翻譯 🌐）&#10;例如：walking in a park, waving hand, dancing"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#89f5a2]/40"
              rows={3}
            />
            <div className="absolute bottom-2 right-2">
              {hasChinese(videoPrompt) && !videoTranslatedPrompt && (
                <button
                  type="button"
                  onClick={handleVideoTranslate}
                  disabled={isVideoTranslating}
                  className="px-2 py-1 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-xs rounded-lg font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-40"
                >
                  {isVideoTranslating ? "翻譯中..." : "🌐 翻譯"}
                </button>
              )}
            </div>
          </div>
          {videoTranslatedPrompt && (
            <div className="mt-2 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-xl p-3 space-y-2">
              <p className="text-white/40 text-xs font-bold uppercase">🌐 翻譯結果</p>
              <p className="text-[#89f5a2] text-sm">{videoTranslatedPrompt}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setVideoPrompt(videoTranslatedPrompt); setVideoTranslatedPrompt(null); }}
                  className="flex-1 py-1.5 bg-[#89f5a2] text-[#0d2318] rounded-lg text-xs font-black hover:opacity-90 transition-all"
                >
                  ✅ 採用
                </button>
                <button
                  type="button"
                  onClick={() => setVideoTranslatedPrompt(null)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
                >
                  略過
                </button>
              </div>
            </div>
          )}
          {/* [DNA_PATCH_END] */}

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

{/* [DNA_PATCH_START] 歷史+靈感 Tab 區 */}
      <div className="w-full max-w-lg mb-24 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Tab 切換 */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="flex-1 h-px bg-white/10" />
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "gallery" ? "bg-[#89f5a2] text-[#0d2318]" : "text-white/40 hover:text-white/70"}`}
            >
              ✨ 靈感畫廊
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "history" ? "bg-[#89f5a2] text-[#0d2318]" : "text-white/40 hover:text-white/70"}`}
            >
              🕘 我的歷史
            </button>
          </div>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* 靈感畫廊 */}
        {activeTab === "gallery" && (
          <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
            {galleryItems.map((item, idx) => (
              <div
                key={idx}
                className="group flex-shrink-0 w-32 cursor-pointer"
                onClick={() => { setPrompt(item.prompt); setTranslatedPrompt(null); setUseTranslated(false); }}
              >
                <div className="w-32 h-32 rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all duration-200 hover:scale-105 hover:border-[#89f5a2]/50 hover:shadow-[0_0_20px_rgba(137,245,162,0.15)] relative">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-end justify-center pb-2">
                    <span className="text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg bg-black/50 px-2 py-0.5 rounded-full">套用靈感</span>
                  </div>
                </div>
                <p className="text-white/40 text-[10px] text-center mt-1.5 font-bold">{item.title}</p>
              </div>
            ))}
          </div>
        )}

        {/* 我的歷史 */}
        {activeTab === "history" && (
          <>
            {Array.isArray(history) && history.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
                {history.slice(0, 50).map((item, idx) => {
                  const url = typeof item === 'string' ? item : (item.video_url || item.image_url);
                  const isVideo = !!(typeof item === 'object' && (item.video_url || (typeof item.image_url === 'string' && item.image_url?.includes('.mp4'))));
                  return (
                    <div
                      key={idx}
                      className="group flex-shrink-0 w-32 h-32 rounded-2xl border border-white/10 overflow-hidden shadow-lg cursor-pointer relative transition-all duration-200 hover:scale-105 hover:border-[#89f5a2]/50 hover:shadow-[0_0_20px_rgba(137,245,162,0.15)]"
                      onClick={() => { setPrediction({ output: url, status: 'succeeded' }); setGenType(isVideo ? "video" : "image"); }}
                    >
                      {isVideo ? (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-1">
                          <span className="text-2xl">🎬</span>
                          <span className="text-[9px] text-[#89f5a2] font-black tracking-wider">VIDEO</span>
                        </div>
                      ) : (
                        <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      )}
                      <div className="absolute inset-0 bg-[#89f5a2]/0 group-hover:bg-[#89f5a2]/10 transition-colors duration-200 flex items-center justify-center">
                        <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg">點擊查看</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                {session ? (
                  <p className="text-white/30 text-sm">還沒有歷史紀錄，快去生成第一張吧！</p>
                ) : (
                  <p className="text-white/30 text-sm">登入後可查看歷史紀錄</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {/* [DNA_PATCH_END] */}
        {/* [DNA_PATCH_START] TTS Modal */}
{showTtsModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-sm bg-[#0d2318] border border-purple-500/20 rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
      <div className="text-center">
        <p className="text-3xl mb-1">🎙️</p>
        <h2 className="text-white font-black text-lg">語音合成</h2>
        <p className="text-white/40 text-xs mt-1">輸入台詞，讓角色開口說話</p>
      </div>

      {/* 聲音選擇 */}
      <div>
        <p className="text-white/40 text-xs font-bold mb-2">選擇聲音</p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: "female-1", label: "👩 低沉女聲" },
            { id: "female-2", label: "👩 甜美女聲" },
            { id: "female-3", label: "👩 清晰女聲" },
            { id: "female-4", label: "👩 活潑女聲" },
            { id: "female-5", label: "👩 溫柔女聲" },
            { id: "male-1", label: "👨 專業男聲" },
            { id: "male-2", label: "👨 溫暖男聲" },
            { id: "male-3", label: "👨 成熟男聲" },
            { id: "male-4", label: "👨 旁白男聲" },
            { id: "male-5", label: "👨 深沉男聲" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => { setTtsVoice(v.id); setTtsAudio(null); setTtsTrimmed(false); }}
              className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                ttsVoice === v.id
                  ? "bg-purple-500/30 text-purple-200 border-purple-500"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* 台詞輸入 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-white/40 text-xs font-bold">輸入台詞</p>
          <p className="text-white/30 text-xs">{ttsText.length}/150字</p>
        </div>
        <textarea
          value={ttsText}
          onChange={(e) => { setTtsText(e.target.value); setTtsAudio(null); }}
          placeholder="中英文皆可，例如：大家好，我是AI生成的角色！"
          rows={3}
          maxLength={300}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-purple-500/50"
        />
        {ttsTrimmed && (
          <p className="text-yellow-300 text-xs mt-1">⚠️ 文字已超過上限，自動截斷</p>
        )}
      </div>

      {/* 試聽區 */}
      {ttsAudio && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 space-y-3">
            <p className="text-purple-300 text-xs font-bold">🎵 試聽結果</p>
            <audio controls className="w-full" src={`data:audio/mp3;base64,${ttsAudio}`} />
            <button
              onClick={async () => {
                const link = document.createElement("a");
                link.href = `data:audio/mp3;base64,${ttsAudio}`;
                link.download = `ai-voice-${Date.now()}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                const planCredits = plan === 'starter' ? 8 : plan === 'standard' ? 7 : 6;
                await fetch("/api/character", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ refundCredits: -planCredits, userEmail: session?.user?.email }),
                });
                fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => setCredits(d.credits));
                alert("✅ 語音已下載，點數已扣除！");
              }}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-black hover:opacity-90 transition-all"
            >
              ⬇️ 下載語音（扣 {plan === 'starter' ? 8 : plan === 'standard' ? 7 : 6} 點）
            </button>

            {/* [DNA_PATCH_START] Wav2Lip 合成到影片 */}
            <div className="border border-orange-400/30 bg-orange-400/5 rounded-xl p-3 space-y-2">
              <p className="text-orange-300 font-black text-sm">🎬 合成到影片（讓角色開口說話）</p>
              {/* [DNA_PATCH_START] Wav2Lip 進度條 */}
              {isWav2lipLoading && (
                <div className="p-4 bg-black/25 rounded-2xl border border-orange-400/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-300 text-xs font-black tracking-widest uppercase">🎬 合成中</span>
                    <span className="text-white/60 text-xs font-mono">
                      {wav2lipSeconds >= 120
                        ? "請保持頁面開啟"
                        : `剩餘約 ${Math.max(120 - wav2lipSeconds, 0)} 秒`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((wav2lipSeconds / 120) * 100, 95)}%` }}
                    />
                  </div>
                  <p className="text-white/25 text-[10px] text-center">
                    {wav2lipSeconds >= 60
                      ? "⚠️ 合成時間較長，請保持頁面開啟，若超過 3 分鐘仍未完成，可能是影片臉部不夠清晰導致，建議換一支影片重試"
                      : "嘴型合成約需 60～120 秒，請耐心等候"}
                  </p>
                </div>
              )}
              {/* [DNA_PATCH_END] */}
              <p className="text-orange-200 text-xs font-bold leading-relaxed">
                ⚠️ 注意：影片必須包含<span className="text-orange-300 font-black">清晰正面人臉</span>，側臉或無臉的影片將會合成失敗！
              </p>
              <p className="text-white/40 text-xs">扣 {plan === 'starter' ? 10 : plan === 'standard' ? 9 : 8} 點，失敗自動退點</p>
              {wav2lipResult ? (
                <div className="space-y-2">
                  <video controls className="w-full rounded-lg" src={wav2lipResult} />
                  <button
                    onClick={() => downloadFile(wav2lipResult)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-black hover:opacity-90 transition-all"
                  >
                    ⬇️ 下載說話影片
                  </button>
                  <button
                    onClick={() => { setWav2lipResult(null); setShowTtsModal(false); setTtsAudio(null); }}
                    className="w-full py-2 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
                  >
                    ✅ 完成，關閉視窗
                  </button>
                </div>
                
              ) : (
                <button
                  disabled={isWav2lipLoading}
                  onClick={async () => {
                    if (!prediction?.output) {
                      alert("找不到影片，請重新生成影片後再試");
                      return;
                    }
                    setIsWav2lipLoading(true);
                    setWav2lipResult(null);
                    try {
                      // 啟動合成
                      const startRes = await fetch("/api/wav2lip", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          videoUrl: prediction.output,
                          audioBase64: ttsAudio,
                          userEmail: session?.user?.email,
                          plan,
                        }),
                      });
                      const startData = await startRes.json();
                      if (!startData.id) {
                        alert(startData.error || "合成啟動失敗");
                        setIsWav2lipLoading(false);
                        return;
                      }
                      fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => setCredits(d.credits));
                      // Polling
                      const pollWav2lip = async (id: string) => {
                        const pollRes = await fetch(`/api/wav2lip?id=${id}&email=${session?.user?.email}`);
                        const pollData = await pollRes.json();
                        if (pollData.status === "succeeded" && pollData.output) {
                          setWav2lipResult(pollData.output);
                          setIsWav2lipLoading(false);
                        } else if (pollData.status === "failed") {
                          alert("合成失敗，點數已退還");
                          fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => setCredits(d.credits));
                          setIsWav2lipLoading(false);
                        } else {
                          setTimeout(() => pollWav2lip(id), 3000);
                        }
                      };
                      pollWav2lip(startData.id);
                    } catch (err) {
                      alert("合成失敗，請重試");
                      setIsWav2lipLoading(false);
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-black hover:opacity-90 transition-all disabled:opacity-40"
                >
                  {isWav2lipLoading ? "⏳ 合成中，請稍候..." : `🎬 合成到影片（扣 ${plan === 'starter' ? 10 : plan === 'standard' ? 9 : 8} 點）`}
                </button>
              )}
            </div>
            {/* [DNA_PATCH_END] */}
          </div>
        )}
{/* [DNA_PATCH_START] TTS 載入提示 */}
{isTtsLoading && (
  <div className="p-4 bg-black/25 rounded-2xl border border-purple-500/20 space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-purple-300 text-xs font-black tracking-widest uppercase">🎙️ 語音生成中</span>
      <span className="text-white/60 text-xs font-mono">
        {ttsSeconds >= 60
          ? "請耐心等候"
          : `剩餘約 ${Math.max(60 - ttsSeconds, 0)} 秒`}
      </span>
    </div>
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000"
        style={{ width: `${Math.min((ttsSeconds / 60) * 100, 95)}%` }}
      />
    </div>
    <p className="text-white/25 text-[10px] text-center">
      {ttsSeconds >= 60
        ? "語音生成時間較長，請保持頁面開啟"
        : "語音生成約需 30 至 60 秒，請耐心等候"}
    </p>
  </div>
)}
{/* [DNA_PATCH_END] */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setShowTtsModal(false); setTtsAudio(null); }}
          className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
        >取消</button>
        <button
          disabled={isTtsLoading || !ttsText.trim()}
          onClick={async () => {
            setIsTtsLoading(true);
            setTtsAudio(null);
            setTtsTrimmed(false);
            const res = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: ttsText, voiceId: ttsVoice }),
            });
            const data = await res.json();
            if (data.audio) {
              setTtsAudio(data.audio);
              setTtsTrimmed(data.trimmed);
            } else {
              alert(data.error || "語音生成失敗");
            }
            setIsTtsLoading(false);
          }}
          className="py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
        >{isTtsLoading ? "生成中..." : "🎙️ 免費試聽"}</button>
      </div>
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}
{/* [DNA_PATCH_START] 批次生成 Modal */}
{showBatchModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-md bg-[#0d2318] border border-blue-500/20 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="text-center">
        <p className="text-3xl mb-1">🎭</p>
        <h2 className="text-white font-black text-lg">批次生成不同 Pose</h2>
        <p className="text-white/40 text-xs mt-1">同一套衣服，不同姿勢／角度，每張 1 點</p>
      </div>

      {/* 張數選擇 */}
      <div>
        <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">生成張數</p>
        <div className="flex gap-2">
          {Array.from({ length: getMaxBatch() }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setBatchCount(n)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                batchCount === n
                  ? "bg-blue-500/30 text-blue-300 border-blue-500"
                  : "bg-white/5 text-white/40 border-white/10 hover:border-white/30"
              }`}
            >{n} 張</button>
          ))}
        </div>
        <p className="text-blue-300/50 text-xs mt-1.5 text-center">
          {plan === 'starter' ? '入門包：最多2張' : plan === 'standard' ? '標準包：最多4張' : '專業包：最多6張'}
        </p>
      </div>

      {/* 方案上限提示 */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
        <p className="text-blue-300 text-xs font-bold">⚠️ 建議：同一套衣服 + 不同姿勢效果最穩定</p>
        <p className="text-white/30 text-xs mt-0.5">換衣服或換風格臉部可能不一致，請注意</p>
      </div>

      {/* 每張的 Prompt 輸入 */}
      <div className="space-y-3">
        <p className="text-white/40 text-xs font-bold tracking-wider uppercase">每張 Pose 描述</p>
        {Array.from({ length: batchCount }, (_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <p className="text-white/50 text-xs font-bold">第 {i + 1} 張</p>
            <div className="relative">
  <input
    type="text"
    value={batchPrompts[i]?.prompt || ""}
    onChange={(e) => {
      const updated = [...batchPrompts];
      updated[i] = { ...updated[i], prompt: e.target.value, translated: false };
      setBatchPrompts(updated);
    }}
    placeholder="姿勢描述（英文）例：standing sideways, arms crossed"
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-white/20 focus:outline-none focus:border-blue-400/50 pr-20"
  />
  {hasChinese(batchPrompts[i]?.prompt || "") && !batchPrompts[i]?.translated && (
    <button
      type="button"
      disabled={batchPrompts[i]?.isTranslating}
      onClick={async () => {
        const updated = [...batchPrompts];
        updated[i] = { ...updated[i], isTranslating: true };
        setBatchPrompts(updated);
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: batchPrompts[i].prompt }),
          });
          const data = await res.json();
          if (data.translated) {
            updated[i] = { ...updated[i], prompt: data.translated, isTranslating: false, translated: true };
          } else {
            updated[i] = { ...updated[i], isTranslating: false };
          }
        } catch {
          updated[i] = { ...updated[i], isTranslating: false };
        }
        setBatchPrompts([...updated]);
      }}
      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-[10px] rounded font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-40 whitespace-nowrap"
    >
      {batchPrompts[i]?.isTranslating ? "翻譯中..." : "🌐 翻譯"}
    </button>
  )}
</div>
            <p className="text-white/25 text-[10px]">📌 備註（選填）：補充角度、距離、表情等細節，例如：微笑、特寫、從後方拍</p>
<div className="relative">
  <input
    type="text"
    value={batchPrompts[i]?.note || ""}
    onChange={(e) => {
      const updated = [...batchPrompts];
      updated[i] = { ...updated[i], note: e.target.value, noteTranslated: false };
      setBatchPrompts(updated);
    }}
    placeholder="例：微笑表情、從側面拍、特寫臉部..."
    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-xs placeholder-white/20 focus:outline-none focus:border-blue-400/30 pr-20"
  />
  {hasChinese(batchPrompts[i]?.note || "") && !batchPrompts[i]?.noteTranslated && (
    <button
      type="button"
      disabled={batchPrompts[i]?.isNoteTranslating}
      onClick={async () => {
        const updated = [...batchPrompts];
        updated[i] = { ...updated[i], isNoteTranslating: true };
        setBatchPrompts(updated);
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: batchPrompts[i].note }),
          });
          const data = await res.json();
          if (data.translated) {
            updated[i] = { ...updated[i], note: data.translated, isNoteTranslating: false, noteTranslated: true };
          } else {
            updated[i] = { ...updated[i], isNoteTranslating: false };
          }
        } catch {
          updated[i] = { ...updated[i], isNoteTranslating: false };
        }
        setBatchPrompts([...updated]);
      }}
      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-[10px] rounded font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-40 whitespace-nowrap"
    >
      {batchPrompts[i]?.isNoteTranslating ? "翻譯中..." : "🌐 翻譯"}
    </button>
  )}
</div>
          </div>
        ))}
      </div>

      {/* 生成結果區 */}
      {batchResults.length > 0 && (
        <div>
          <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">生成進度</p>
          <div className="grid grid-cols-3 gap-2">
            {batchResults.map((r, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5 relative">
                {r.status === "done" && r.url ? (
                  <img src={r.url} className="w-full h-full object-cover" />
                ) : r.status === "generating" ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-5 h-5 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-blue-300 text-[9px]">生成中</span>
                  </div>
                ) : r.status === "failed" ? (
                  <span className="text-red-400 text-[9px] text-center px-1">失敗已退點</span>
                ) : (
                  <span className="text-white/20 text-[10px]">等待中</span>
                )}
                <span className="absolute bottom-1 left-1 text-white/40 text-[8px] font-bold">#{i + 1}</span>
              </div>
            ))}
          </div>
          {isBatchGenerating && batchCurrentIndex >= 0 && (
            <p className="text-blue-300 text-xs text-center mt-2 font-bold">
              ⚡ 正在生成第 {batchCurrentIndex + 1} 張，完成後自動儲存到角色相簿
            </p>
          )}
          {!isBatchGenerating && batchResults.every(r => r.status === "done" || r.status === "failed") && (
            <p className="text-[#89f5a2] text-xs text-center mt-2 font-bold">✅ 批次生成完成！已自動儲存到角色相簿</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setShowBatchModal(false); setBatchResults([]); setBatchCurrentIndex(-1); }}
          disabled={isBatchGenerating}
          className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all disabled:opacity-30"
        >關閉</button>
        <button
          onClick={handleBatchGenerate}
          disabled={isBatchGenerating}
          className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
        >
          {isBatchGenerating ? `生成中 ${batchCurrentIndex + 1}/${batchResults.length}...` : `🎭 開始生成（${batchCount} 點）`}
        </button>
      </div>
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}
{/* [DNA_PATCH_START] 收藏命名 Modal */}
{showSaveModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-sm bg-[#0d2318] border border-yellow-400/20 rounded-3xl p-6 space-y-4 shadow-2xl">
      <div className="text-center">
        <p className="text-3xl mb-1">⭐</p>
        <h2 className="text-white font-black text-lg">收藏此角色</h2>
        <p className="text-white/40 text-xs mt-1">幫這個角色取個名字吧！</p>
      </div>
      <input
        type="text"
        value={saveCharacterName}
        onChange={(e) => setSaveCharacterName(e.target.value)}
        placeholder="例如：我的主角、帥氣男生..."
        maxLength={20}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:border-yellow-400/50"
      />
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowSaveModal(false)}
          className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
        >取消</button>
        <button
          disabled={isSaving}
          onClick={async () => {
            if (!prediction?.output) return;
            setIsSaving(true);
            const res = await fetch("/api/saved-characters", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: session?.user?.email,
                name: saveCharacterName || "未命名角色",
                image_url: prediction.output,
                plan,
              }),
            });
            const data = await res.json();
            if (data.error) {
              alert(data.error);
            } else {
              setSavedCharacters(prev => [data.data, ...prev]);
              setShowSaveModal(false);
              alert("✅ 角色已收藏！");
            }
            setIsSaving(false);
          }}
          className="py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-300 text-[#0d2318] text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
        >{isSaving ? "收藏中..." : "⭐ 確認收藏"}</button>
      </div>
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}
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