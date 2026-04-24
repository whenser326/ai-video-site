"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
// [DNA_PATCH_START] 防止視窗切換時自動刷新
import { useRouter } from 'next/navigation';

// [DNA_PATCH_START] Code Splitting — dynamic import 懶載入 Modal
import dynamic from "next/dynamic";

const BatchModal = dynamic(() => import("./components/BatchModal"), { ssr: false });
const TtsModal = dynamic(() => import("./components/TtsModal"), { ssr: false });
const ReferralModal = dynamic(() => import("./components/ReferralModal"), { ssr: false });
const SaveCharacterModal = dynamic(() => import("./components/SaveCharacterModal"), { ssr: false });
const VideoSettingsModal = dynamic(() => import("./components/VideoSettingsModal"), { ssr: false });
const Text2VideoModal = dynamic(() => import("./components/Text2VideoModal"), { ssr: false });
export default function Home() {
  const hasLoadedFromStorage = useRef(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // [DNA_PATCH_START] 入場動畫
const [pageReady, setPageReady] = useState(false);
const [splashDone, setSplashDone] = useState(false);
// [DNA_PATCH_END]
  const [error, setError] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [seconds, setSeconds] = useState(0);
  const VIDEO_COUNTDOWN = 120; // 影片預估 120 秒
const IMAGE_COUNTDOWN = 60; // 圖片預估 60 秒
  const [genType, setGenType] = useState<"image" | "video">("image");
  // [DNA_PATCH_START] Step 1 模式選擇狀態
const [generationMode, setGenerationMode] = useState<"image" | "video" | "upload" | "text2video">("image");
// [DNA_PATCH_START] Steps 2-6 手風琴狀態
const [activeStep, setActiveStep] = useState<number>(2);
const [imageRatio, setImageRatio] = useState("1:1");
// [DNA_PATCH_START] STEP 2 外貌特徵 state
const [selectedHair, setSelectedHair] = useState("");
const [selectedEye, setSelectedEye] = useState("");
const [selectedBody, setSelectedBody] = useState("");
// [DNA_PATCH_START] 外貌特徵自訂輸入
const [customAppearance, setCustomAppearance] = useState("");
const [customAppearanceTranslated, setCustomAppearanceTranslated] = useState<string | null>(null);
const [isCustomAppearanceTranslating, setIsCustomAppearanceTranslating] = useState(false);
const [selectedPersona, setSelectedPersona] = useState("");
const [selectedPersonality, setSelectedPersonality] = useState("");
const [selectedJob, setSelectedJob] = useState("");
const [selectedScene, setSelectedScene] = useState("");
const [selectedShot, setSelectedShot] = useState("");
// [DNA_PATCH_START] 自訂欄位 + 翻譯狀態
const [customPersona, setCustomPersona] = useState("");
const [customPersonaTranslated, setCustomPersonaTranslated] = useState<string | null>(null);
const [isCustomPersonaTranslating, setIsCustomPersonaTranslating] = useState(false);
const [customScene, setCustomScene] = useState("");
const [customSceneTranslated, setCustomSceneTranslated] = useState<string | null>(null);
const [isCustomSceneTranslating, setIsCustomSceneTranslating] = useState(false);
const [customPersonality, setCustomPersonality] = useState("");
const [customPersonalityTranslated, setCustomPersonalityTranslated] = useState<string | null>(null);
const [isCustomPersonalityTranslating, setIsCustomPersonalityTranslating] = useState(false);
// [DNA_PATCH_END]
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
const [showText2VideoModal, setShowText2VideoModal] = useState(false);
const [text2videoPrompt, setText2videoPrompt] = useState("");
const [text2videoTranslated, setText2videoTranslated] = useState<string | null>(null);
const [isText2videoTranslating, setIsText2videoTranslating] = useState(false);
const [text2videoRatio, setText2videoRatio] = useState("16:9");
const [text2videoDuration, setText2videoDuration] = useState(5);
const [text2videoModel, setText2videoModel] = useState<"kling" | "seedance">("kling");
const [videoModel, setVideoModel] = useState<"kling" | "seedance">("kling");
// [DNA_PATCH_START] Omni-Reference 狀態
const [omniRef1, setOmniRef1] = useState<string | null>(null); // 第二角色
const [omniRef2, setOmniRef2] = useState<string | null>(null); // 場景風格
const [omniRef3, setOmniRef3] = useState<string | null>(null); // 動作參考
// [DNA_PATCH_END]
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
const [galleryItems, setGalleryItems] = useState<{ title: string; prompt: string; image: string }[]>([
  { title: "迷人貓咪", prompt: "Breathtakingly beautiful cat", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719479381.png" },
  { title: "韓系男生", prompt: "A handsome Korean man looks at the camera with a smile ~ the background is a men's clothing store", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719447992.png" },
  { title: "城市女孩", prompt: "Beautiful woman walking on city street", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719327300.png" },
  { title: "走向鏡頭", prompt: "Slowly walk into the camera ~ getting closer and closer", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775716736592.png" },
  { title: "貓狗好友", prompt: "Beautiful cat playing with dog", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775658563619.png" },
  { title: "校園奔跑", prompt: "Running on campus", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775657672714.png" },
  { title: "健壯男士", prompt: "Handsome man showing off his strong muscles and wiping sweat", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719396914.png" },
  { title: "沙灘活力", prompt: "A fit woman playing beach volleyball on a tropical beach, action shot, dynamic movement, cinematic lighting", image: "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/whenser@gmail.com-1775719296354.png" },
]);
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
// [DNA_PATCH_START] TTS 試聽限制
const [ttsTrimmed, setTtsTrimmed] = useState(false);
const [ttsCache, setTtsCache] = useState<Record<string, string>>({});
// [DNA_PATCH_START]
const [ttsPreviewCount, setTtsPreviewCount] = useState(0);
const [ttsPreviewVideoUrl, setTtsPreviewVideoUrl] = useState<string | null>(null);
// [DNA_PATCH_END]
const TTS_MAX_PREVIEW = 3;
// [DNA_PATCH_END]
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
    
    // 新
if (session?.user?.email) {
  setLockedCharacterUrl(localStorage.getItem('locked_character'));
}
    // [DNA_PATCH_START] history 延遲載入，不阻塞首屏
    if (session?.user?.email) {
      setTimeout(() => {
        fetch(`/api/history?email=${session?.user?.email}`)
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
      }, 1500); // 延遲 1.5 秒，讓首屏點數/登入狀態先跑完

      // [DNA_PATCH_START] 點數優先載入，收藏角色延遲 400ms
      fetch(`/api/user/credits?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          setCredits(data.credits);
          setPlan(data.plan || 'free');
        });
      setTimeout(() => {
        fetch(`/api/saved-characters?email=${session?.user?.email}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setSavedCharacters(data);
              const lockedUrl = localStorage.getItem('locked_character');
              if (lockedUrl) {
                const matched = data.find((c: any) => c.image_url === lockedUrl);
                if (matched) setLockedCharacterId(matched.id);
              }
            }
          });
      }, 400);
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

// [DNA_PATCH_START] 偵測主頁載入完成 → 結束入場動畫
useEffect(() => {
  const maxWait = setTimeout(() => setPageReady(true), 2500);
  if (credits !== null) {
    setPageReady(true);
    clearTimeout(maxWait);
  }
  return () => clearTimeout(maxWait);
}, [credits]);
// [DNA_PATCH_END]

// ✨ 修正後的下載功能
  const downloadFile = async (url: string) => {
    try {
      setLoading(true); // 下載大檔案時顯示一下載入狀態
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 自動判斷副檔名
      let extension = genType === "video" ? "mp4" : "png";
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
        setGenType(resolvedGenType as "image" | "video");
        // [DNA_PATCH_START]
// 新影片生成完成：歸零試聽計數，保留 ttsCache（用戶可重聽舊聲音）
const resolvedIsVideo = resolvedGenType === "video";
if (resolvedIsVideo && finalUrl) {
  setTtsPreviewCount(0);
  setTtsPreviewVideoUrl(finalUrl);
}
// [DNA_PATCH_END]
        
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
    setTimeout(() => progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);

    try {
      // [DNA_PATCH_START] 直接用 state 而非重新從 API 抓
const lockedCharacter = lockedCharacterUrl || null;
// [DNA_PATCH_END]
      const res = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // [DNA_PATCH_START] prompt 組合含自訂欄位
body: JSON.stringify({ 
  prompt: [selectedStyle, selectedPersona || customPersona, selectedScene || customScene, selectedShot, prompt].filter(Boolean).join(", "),
  userEmail: session?.user?.email,
  lockedCharacter: lockedCharacter || null,
  imageRatio: imageRatio,
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
// [DNA_PATCH_START] handleText2Video
const handleText2Video = async () => {
  const finalPrompt = text2videoTranslated || text2videoPrompt;
  if (!finalPrompt.trim()) { alert("⚠️ 請輸入影片描述"); return; }
  if (plan === "free") { alert("⚠️ 文字生成影片為付費功能，請先升級方案！"); return; }

  setShowText2VideoModal(false);
  setLoading(true);
  setError("");
  setSeconds(0);
  setGenType("video");
  setTimeout(() => progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);

  try {
    const res = await fetch("/api/character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "text2video",
        userEmail: session?.user?.email,
        videoPrompt: finalPrompt,
        videoModel: text2videoModel,
        aspectRatio: text2videoRatio,
        duration: text2videoDuration,
      }),
    });
    const data = await res.json();
    if (data.id) checkStatus(data.id, "video");
    else {
      const msg = data.error || "文字生成影片啟動失敗";
      setError(msg);
      alert("⚠️ " + msg);
      setLoading(false);
    }
  } catch (err) { setError("連線失敗"); setLoading(false); }
};
// [DNA_PATCH_END]
  // 5. ✨ 接通影片生成
// [DNA_PATCH_START] handleGenerateVideo 加入 omniRefs
const handleGenerateVideo = async (imageUrl: string, prompt?: string, ratio?: string, duration?: number, model?: string, omniRefs?: (string | null)[]) => {
// [DNA_PATCH_END]
    setLoading(true);
    setError("");
    setSeconds(0);
    setGenType("video");
    setTimeout(() => progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);

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
  // [DNA_PATCH_START] Omni-Reference
  omniRefs: omniRefs ? omniRefs.filter(Boolean) : [],
  // [DNA_PATCH_END]
}),
      });
      const data = await res.json();
      if (data.id) checkStatus(data.id, "video");
      else { 
  const msg = data.error || "影片啟動失敗";
  setError(msg);
  alert("⚠️ " + msg);
  setLoading(false); 
}
    } catch (err) { setError("影片連線失敗"); setLoading(false); }
  };

return (
  <>
{/* [DNA_PATCH_START] Splash 入場動畫蓋板 */}
{!splashDone && (
  <div
    style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0f2e18",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: pageReady ? 0 : 1,
      transition: "opacity 0.7s ease",
      pointerEvents: pageReady ? "none" : "auto",
      overflow: "hidden",
    }}
    onTransitionEnd={() => { if (pageReady) setSplashDone(true); }}
  >
    <style>{`
      @keyframes orbitSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      @keyframes sweep { 0%{left:-80%} 65%,100%{left:160%} }
      @keyframes logoPulse {
        0%,100%{filter:drop-shadow(0 0 16px rgba(137,245,162,0.7)) drop-shadow(0 0 40px rgba(137,245,162,0.4));transform:scale(1)}
        50%{filter:drop-shadow(0 0 30px rgba(137,245,162,1)) drop-shadow(0 0 70px rgba(137,245,162,0.7));transform:scale(1.03)}
      }
      @keyframes scan { 0%{left:-40px} 100%{left:150px} }
      @keyframes textGlow {
        0%,100%{text-shadow:0 0 8px rgba(137,245,162,0.3)}
        50%{text-shadow:0 0 22px rgba(137,245,162,0.85),0 0 40px rgba(137,245,162,0.3)}
      }
      @keyframes dotB {
        0%,100%{transform:translateY(0);opacity:0.3}
        50%{transform:translateY(-7px);opacity:1}
      }
      @keyframes lineFlash {
        0%,100%{opacity:0.35;width:70px}
        50%{opacity:1;width:120px}
      }
      @keyframes glowDrift {
        0%,100%{opacity:0.5;transform:scale(1)}
        50%{opacity:1;transform:scale(1.1)}
      }
      .splash-orbit {
        position:absolute; width:210px; height:210px; border-radius:50%;
        border:1px solid rgba(137,245,162,0.18);
        animation:orbitSpin 7s linear infinite;
      }
      .splash-orbit::after {
        content:''; position:absolute;
        width:7px; height:7px; border-radius:50%;
        background:#89f5a2;
        top:-3.5px; left:50%; transform:translateX(-50%);
        box-shadow:0 0 10px #89f5a2, 0 0 20px rgba(137,245,162,0.5);
      }
      .splash-sweep-bar {
        position:absolute; top:0; left:-80%;
        width:45%; height:100%;
        background:linear-gradient(90deg,transparent,rgba(137,245,162,0.45),transparent);
        animation:sweep 2.6s ease-in-out infinite;
      }
      .splash-logo-img {
        width:100%; height:100%; object-fit:cover;
      }
      .splash-scandot {
        width:36px; height:100%;
        background:linear-gradient(90deg,transparent,#89f5a2,transparent);
        position:absolute; left:-40px;
        animation:scan 2.6s linear infinite;
      }
      .splash-scandot-delay { animation-delay:0.5s; }
      .splash-brand {
        color:#89f5a2; font-weight:900; font-size:20px; letter-spacing:0.2em;
        animation:textGlow 2.6s ease-in-out infinite;
      }
      .splash-dot { animation:dotB 1.3s ease-in-out infinite; }
      .splash-dot:nth-child(2) { animation-delay:0.22s; }
      .splash-dot:nth-child(3) { animation-delay:0.44s; }
      .splash-bottom-line {
        position:absolute; bottom:36px; height:1px;
        background:linear-gradient(90deg,transparent,rgba(137,245,162,0.45),transparent);
        animation:lineFlash 2.6s ease-in-out infinite;
      }
      .splash-bg1 {
        position:absolute; width:320px; height:320px;
        top:-80px; right:-80px; border-radius:50%;
        background:radial-gradient(circle,rgba(137,245,162,0.18) 0%,transparent 70%);
        animation:glowDrift 5s ease-in-out infinite;
      }
      .splash-bg2 {
        position:absolute; width:260px; height:260px;
        bottom:-60px; left:-60px; border-radius:50%;
        background:radial-gradient(circle,rgba(137,245,162,0.15) 0%,transparent 70%);
        animation:glowDrift 5s ease-in-out infinite 2.5s;
      }
    `}</style>
    <div className="splash-bg1" />
    <div className="splash-bg2" />
    <div style={{ position:"relative", width:220, height:220, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="splash-orbit" />
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", overflow:"hidden", zIndex:2, pointerEvents:"none" }}>
        <div className="splash-sweep-bar" />
      </div>
      <div style={{ width:200, height:200, borderRadius:"50%", overflow:"hidden", position:"relative", zIndex:1 }}>
        <img className="splash-logo-img" src="/logo-splash.png" alt="Consistent Flow" style={{ width:"100%", height:"100%", objectFit:"cover", animation:"logoPulse 2.6s ease-in-out infinite" }} />
      </div>
    </div>
    <div style={{ marginTop:8, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
      <div style={{ width:130, height:1.5, background:"rgba(137,245,162,0.1)", borderRadius:2, overflow:"hidden", position:"relative" }}>
        <div className="splash-scandot" />
      </div>
      <div style={{ width:85, height:1.5, background:"rgba(137,245,162,0.1)", borderRadius:2, overflow:"hidden", position:"relative" }}>
        <div className="splash-scandot splash-scandot-delay" />
      </div>
    </div>
    <div style={{ marginTop:20, textAlign:"center" }}>
      <p className="splash-brand">CONSISTENT FLOW</p>
      <p style={{ color:"rgba(137,245,162,0.42)", fontSize:11, letterSpacing:"0.28em", marginTop:6 }}>AI CHARACTER STUDIO</p>
    </div>
    <div style={{ display:"flex", gap:9, marginTop:32 }}>
      {[0,1,2].map(i => (
        <div key={i} className="splash-dot" style={{ width:7, height:7, borderRadius:"50%", background:"#89f5a2" }} />
      ))}
    </div>
    <div className="splash-bottom-line" />
  </div>
)}
{/* [DNA_PATCH_END] */}
    <main className="flex min-h-screen flex-col items-center px-3 sm:px-4 pt-2 pb-4 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] relative overflow-y-auto">
      
      {/* 背景裝飾光暈 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#89f5a2]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4ade80]/8 rounded-full blur-[100px]" />
      </div>

            {/* 主卡片 */}
      <div className="w-full max-w-lg mt-14 sm:mt-16 mb-8 relative z-10">
        
{/* [DNA_PATCH_START] 標題區（LOGO 已移至 GlobalHeader，這裡只保留文字） */}
<div className="text-center mb-6">
  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-lg">
    AI Character Studio
  </h1>
  <p className="text-white/40 text-xs mt-1.5 font-medium tracking-widest uppercase">
    高精度角色生成平台
  </p>
</div>
{/* [DNA_PATCH_END] */}
{/* [DNA_PATCH_START] Hero 佔位符 */}
<div className="w-full mb-6 rounded-2xl overflow-hidden border border-white/10 relative"
     style={{ aspectRatio: '16/9' }}>
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#091c10] gap-3">
    <div className="w-12 h-12 rounded-full border border-[#89f5a2]/30 flex items-center justify-center">
      <div style={{
        borderLeft: '14px solid #89f5a2',
        borderTop: '9px solid transparent',
        borderBottom: '9px solid transparent',
        marginLeft: '3px',
        opacity: 0.7,
      }} />
    <video src="https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/hero.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </div>
{/* [DNA_PATCH_END] */}

{/* [DNA_PATCH_START] Step 1 模式選擇 */}
{(() => {
  const modes = [
    { key: "image",        label: "🎨 生成角色圖片",   desc: "1點" },
    { key: "video",        label: "🎬 圖片轉影片",     desc: "4-6點" },
    { key: "upload",       label: "📁 上傳照片轉影片", desc: "4-6點" },
{ key: "text2video",   label: "✨ 文字生成影片",   desc: "Kling 4-6點 / Seedance 13-27點" },
  ] as const;
  return (
    <div className="mb-4">
      <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase mb-2 px-1">
        選擇模式
      </p>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((m) => {
          const isPaidOnly = m.key === "text2video" && plan === "free";
          const isActive   = generationMode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                if (isPaidOnly) {
                  alert("⚠️ 文字生成影片為付費功能，請先升級方案！\n\n前往儲值頁面升級 👉 /pricing");
                  return;
                }
                setGenerationMode(m.key);
                if (m.key === "video")  { setShowVideoModal(true);  }
                if (m.key === "upload") { setShowUploadModal(true); }
                if (m.key === "text2video") { setShowText2VideoModal(true); }
              }}
              className={`relative flex flex-col items-start px-4 py-3 rounded-2xl border text-left
                transition-all active:scale-95
                ${isPaidOnly
                  ? "border-yellow-400/20 bg-yellow-400/5 cursor-pointer"
                  : isActive
                    ? "border-[#89f5a2]/60 bg-[#89f5a2]/10 shadow-sm shadow-[#89f5a2]/10"
                    : "border-white/10 bg-white/4 hover:border-[#89f5a2]/30 hover:bg-white/8"
                }`}
            >
              <span className={`text-sm font-bold leading-tight
                ${isPaidOnly ? "text-yellow-300/70" : isActive ? "text-[#89f5a2]" : "text-white/70"}`}>
                {m.label}
              </span>
              <span className={`text-[10px] mt-0.5
                ${isPaidOnly ? "text-yellow-400/50" : isActive ? "text-[#89f5a2]/60" : "text-white/30"}`}>
                {isPaidOnly ? "💎 付費方案限定" : m.desc}
              </span>
              {isPaidOnly && (
                <span className="absolute top-2 right-2 text-[9px] text-yellow-400/70 font-black">升級</span>
              )}
              {isActive && !isPaidOnly && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#89f5a2]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
})()}
{/* [DNA_PATCH_END] */}

{/* [DNA_PATCH_START] 輸入卡片 Steps 2-6 手風琴 */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-4 space-y-2">

            {/* 鎖定角色狀態列 */}
            {lockedCharacterUrl && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-2xl mb-2">
                <img src={lockedCharacterUrl} className="w-10 h-10 rounded-xl object-cover border border-[#89f5a2]/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#89f5a2] text-xs font-black">🔒 角色鎖定中</p>
                  <p className="text-white/40 text-xs mt-0.5">生成將套用此角色（-1點）</p>
                </div>
              </div>
            )}

            {/* Step 2：角色人設 */}
            {(() => {
              const isOpen = activeStep === 2;
              const summary = [selectedStyle, selectedPersona].filter(Boolean);
              return (
                <div className="border border-white/8 rounded-2xl overflow-hidden">
                  <button type="button" onClick={() => setActiveStep(isOpen ? 0 : 2)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/4 hover:bg-white/7 transition-all">
                    <span className="text-[10px] font-black text-white/30 w-12 flex-shrink-0">STEP 1</span>
<span className="text-sm font-bold text-white/80 flex-1 text-left">角色風格</span>
                    {summary.length > 0 && !isOpen && (
                      <span className="text-[10px] text-[#89f5a2]/70 truncate max-w-[120px]">
                        {summary.map(v => {
                          const styleMap: Record<string,string> = {
                            "anime style, cel shading, vibrant colors": "動漫",
                            "photorealistic, hyperdetailed, cinematic lighting": "寫實",
                            "oil painting, classical art style, textured brushstrokes": "油畫",
                            "game character, 3D render, Unreal Engine style": "遊戲",
                            "pencil sketch, black and white illustration, detailed lineart": "素描",
                          };
                          const personaMap: Record<string,string> = {
                            "Taiwanese girl, natural look, friendly smile, casual outfit": "台灣女孩",
                            "high fashion model, cold expression, sharp features, editorial look": "冷豔名模",
                            "cute student girl, innocent expression, school uniform, soft lighting": "清純學生",
                            "office lady, professional attire, confident look, city background": "都市OL",
                            "mysterious witch, dark fantasy, glowing eyes, dramatic lighting": "神秘女巫",
                            "handsome Korean man, clean look, casual fashion, soft smile": "韓系男生",
                            "rugged masculine man, strong jawline, serious expression, cinematic": "硬漢型男",
                            "armored knight, heroic pose, fantasy style, epic lighting": "帥氣騎士",
                            "cyberpunk character, neon lights, futuristic outfit, urban night": "賽博龐克",
                            "fantasy elf, pointed ears, ethereal beauty, forest background": "奇幻精靈",
                          };
                          return styleMap[v] || personaMap[v] || v;
                        }).join(" · ")}
                      </span>
                    )}
                    <span className="text-white/30 text-xs ml-1">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 space-y-3 bg-black/20">
                      {/* 風格 */}
                      <div>
                        <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">角色風格</p>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { label: "🎨 動漫", value: "anime style, cel shading, vibrant colors" },
                            { label: "📸 寫實", value: "photorealistic, hyperdetailed, cinematic lighting" },
                            { label: "🖼️ 油畫", value: "oil painting, classical art style, textured brushstrokes" },
                            { label: "🎮 遊戲", value: "game character, 3D render, Unreal Engine style" },
                            { label: "✏️ 素描", value: "pencil sketch, black and white illustration, detailed lineart" },
                          ].map((s) => (
                            <button key={s.value} type="button"
                              onClick={() => setSelectedStyle(selectedStyle === s.value ? "" : s.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                selectedStyle === s.value
                                  ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                                  : "bg-white/5 text-white/50 border-white/10 hover:border-[#89f5a2]/40"
                              }`}>{s.label}</button>
                          ))}
                        </div>
                      </div>
                      {/* 人設 */}
                      <div>
                        <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">✨ 人設快速標籤</p>
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
                            <button key={tag.value} type="button"
                              onClick={() => {
                                setSelectedPersona(selectedPersona === tag.value ? "" : tag.value);
                                setPrompt(selectedPersona === tag.value ? "" : tag.value);
                                setCustomPersona("");
                                setTranslatedPrompt(null); setUseTranslated(false);
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                selectedPersona === tag.value
                                  ? "bg-yellow-400/30 text-yellow-300 border-yellow-400/60"
                                  : "bg-white/5 text-white/50 border-white/10 hover:border-yellow-400/40"
                              }`}>{tag.label}</button>
                          ))}
                        </div>
                        {!selectedPersona && (
                        <div className="mt-2 space-y-1">
                          <div className="relative">
                            <textarea
  rows={2}
  value={customPersona}
  onChange={(e) => { setCustomPersona(e.target.value); setCustomPersonaTranslated(null); }}
  placeholder="或自行輸入角色描述...可中文輸入！輸入後點「翻譯」按鈕幫你翻譯 🌐"
  className="w-full px-3 py-2 pr-16 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/25 focus:outline-none focus:border-yellow-400/40 resize-none leading-relaxed"
/>
                            {hasChinese(customPersona) && !customPersonaTranslated && (
                              <button type="button"
                                onClick={async () => {
                                  setIsCustomPersonaTranslating(true);
                                  try {
                                    const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: customPersona }) });
                                    const data = await res.json();
                                    if (data.translated) setCustomPersonaTranslated(data.translated);
                                  } finally { setIsCustomPersonaTranslating(false); }
                                }}
                                disabled={isCustomPersonaTranslating}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[10px] rounded-lg font-bold disabled:opacity-40">
                                {isCustomPersonaTranslating ? "翻譯中..." : "🌐 翻譯"}
                              </button>
                            )}
                          </div>
                          {customPersonaTranslated && (
                            <div className="flex gap-2 items-center px-2 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                              <p className="text-yellow-300 text-[10px] flex-1">{customPersonaTranslated}</p>
                              <button type="button" onClick={() => { setCustomPersona(customPersonaTranslated); setCustomPersonaTranslated(null); }}
                                className="text-[10px] px-2 py-0.5 bg-yellow-400/30 text-yellow-300 rounded-lg font-bold flex-shrink-0">採用</button>
                              <button type="button" onClick={() => setCustomPersonaTranslated(null)}
                                className="text-[10px] text-white/30 flex-shrink-0">略過</button>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                      {/* 圖片比例 */}
<div>
  <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">圖片比例</p>
  <div className="flex gap-2 flex-wrap">
    {[
      { label: "1:1", value: "1:1" },
      { label: "16:9", value: "16:9" },
      { label: "9:16", value: "9:16" },
      { label: "4:3", value: "4:3" },
      { label: "3:4", value: "3:4" },
    ].map((r) => (
      <button key={r.value} type="button"
        onClick={() => setImageRatio(r.value)}
        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
          imageRatio === r.value
            ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
            : "bg-white/5 text-white/50 border-white/10 hover:border-[#89f5a2]/40"
        }`}>{r.label}</button>
    ))}
  </div>
  <p className="text-white/20 text-[10px] mt-1.5">選好比例後生成，之後轉影片就不會變形</p>
</div>
                      <button type="button" onClick={() => setActiveStep(25)}
  className="w-full py-2 text-xs text-white/40 hover:text-white/60 transition-all">
  下一步 →
</button>
                    </div>
                  )}
                </div>
              );
            })()}
{/* STEP 2：外貌特徵（選填，存入 description，不進 prompt） */}
{(() => {
  const isOpen = activeStep === 25;
  const summary = [selectedHair, selectedEye, selectedBody].filter(Boolean);
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setActiveStep(isOpen ? 0 : 25)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/4 hover:bg-white/7 transition-all">
        <span className="text-[10px] font-black text-white/30 w-12 flex-shrink-0">STEP 2</span>
        <span className="text-sm font-bold text-white/80 flex-1 text-left">外貌特徵</span>
        {summary.length > 0 && !isOpen && (
          <span className="text-[10px] text-pink-300/70 truncate max-w-[120px]">{summary.join(" · ")}</span>
        )}
        <span className="text-white/20 text-[10px] mr-1">選填</span>
        <span className="text-white/30 text-xs ml-1">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 space-y-3 bg-black/20">
          {/* 髮色 */}
          <div>
            <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">髮色</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "🖤 黑髮", value: "黑髮" },
                { label: "🤎 棕髮", value: "棕髮" },
                { label: "💛 金髮", value: "金髮" },
                { label: "🤍 銀白髮", value: "銀白髮" },
                { label: "❤️ 紅髮", value: "紅髮" },
              ].map((item) => (
                <button key={item.value} type="button"
                  onClick={() => setSelectedHair(selectedHair === item.value ? "" : item.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selectedHair === item.value
                      ? "bg-pink-400/30 text-pink-300 border-pink-400/60"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-pink-400/40"
                  }`}>{item.label}</button>
              ))}
            </div>
          </div>
          {/* 眼睛 */}
          <div>
            <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">眼睛</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "⚫ 黑眸", value: "黑眸" },
                { label: "🔵 藍眸", value: "藍眸" },
                { label: "🟢 綠眸", value: "綠眸" },
                { label: "✨ 異色瞳", value: "異色瞳" },
              ].map((item) => (
                <button key={item.value} type="button"
                  onClick={() => setSelectedEye(selectedEye === item.value ? "" : item.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selectedEye === item.value
                      ? "bg-pink-400/30 text-pink-300 border-pink-400/60"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-pink-400/40"
                  }`}>{item.label}</button>
              ))}
            </div>
          </div>
          {/* 身材 */}
          <div>
            <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">身材</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "🌸 嬌小", value: "嬌小" },
                { label: "🦋 高挑", value: "高挑" },
                { label: "💪 健壯", value: "健壯" },
                { label: "🍃 纖細", value: "纖細" },
              ].map((item) => (
                <button key={item.value} type="button"
                  onClick={() => setSelectedBody(selectedBody === item.value ? "" : item.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selectedBody === item.value
                      ? "bg-pink-400/30 text-pink-300 border-pink-400/60"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-pink-400/40"
                  }`}>{item.label}</button>
              ))}
            </div>
          </div>
          {!selectedHair && !selectedEye && !selectedBody && (
            <div className="space-y-1">
              <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">自訂外貌</p>
              <div className="relative">
                <textarea
                  rows={2}
                  value={customAppearance}
                  onChange={(e) => { setCustomAppearance(e.target.value); setCustomAppearanceTranslated(null); }}
                  placeholder="或自行描述外貌特徵...可中文輸入！輸入後點「翻譯」按鈕幫你翻譯 🌐"
                  className="w-full px-3 py-2 pr-16 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/25 focus:outline-none focus:border-pink-400/40 resize-none leading-relaxed"
                />
                {hasChinese(customAppearance) && !customAppearanceTranslated && (
                  <button type="button"
                    onClick={async () => {
                      setIsCustomAppearanceTranslating(true);
                      try {
                        const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: customAppearance }) });
                        const data = await res.json();
                        if (data.translated) setCustomAppearanceTranslated(data.translated);
                      } finally { setIsCustomAppearanceTranslating(false); }
                    }}
                    disabled={isCustomAppearanceTranslating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-pink-400/20 border border-pink-400/40 text-pink-300 text-[10px] rounded-lg font-bold disabled:opacity-40">
                    {isCustomAppearanceTranslating ? "翻譯中..." : "🌐 翻譯"}
                  </button>
                )}
              </div>
              {customAppearanceTranslated && (
                <div className="flex gap-2 items-center px-2 py-1.5 bg-pink-400/10 border border-pink-400/20 rounded-xl">
                  <p className="text-pink-300 text-[10px] flex-1">{customAppearanceTranslated}</p>
                  <button type="button" onClick={() => { setCustomAppearance(customAppearanceTranslated); setCustomAppearanceTranslated(null); }}
                    className="text-[10px] px-2 py-0.5 bg-pink-400/30 text-pink-300 rounded-lg font-bold flex-shrink-0">採用</button>
                  <button type="button" onClick={() => setCustomAppearanceTranslated(null)}
                    className="text-[10px] text-white/30 flex-shrink-0">略過</button>
                </div>
              )}
            </div>
          )}
          <p className="text-white/20 text-[10px]">此設定存入角色資料，不影響生成 prompt</p>
          <button type="button" onClick={() => setActiveStep(3)}
            className="w-full py-2 text-xs text-white/40 hover:text-white/60 transition-all">
            下一步 →
          </button>
        </div>
      )}
    </div>
  );
})()}
            {/* Step 3：個性職業 */}
            {(() => {
              const isOpen = activeStep === 3;
              const summary = [selectedPersonality, selectedJob].filter(Boolean);
              return (
                <div className="border border-white/8 rounded-2xl overflow-hidden">
                  <button type="button" onClick={() => setActiveStep(isOpen ? 0 : 3)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/4 hover:bg-white/7 transition-all">
                    <span className="text-[10px] font-black text-white/30 w-12 flex-shrink-0">STEP 3</span>
<span className="text-sm font-bold text-white/80 flex-1 text-left">個性職業</span>
                    {summary.length > 0 && !isOpen && (
                      <span className="text-[10px] text-purple-300/70 truncate max-w-[120px]">{summary.join(" · ")}</span>
                    )}
                    <span className="text-white/30 text-xs ml-1">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 space-y-3 bg-black/20">
                      <div>
                        <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">個性</p>
                        <div className="flex gap-2 flex-wrap">
                          {["開朗活潑","冷靜理智","神秘感","溫柔體貼","霸道強勢","天真爛漫","毒舌傲嬌"].map((p) => (
                            <button key={p} type="button"
                              onClick={() => { setSelectedPersonality(selectedPersonality === p ? "" : p); setCustomPersonality(""); }}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                selectedPersonality === p
                                  ? "bg-purple-400/30 text-purple-300 border-purple-400/60"
                                  : "bg-white/5 text-white/50 border-white/10 hover:border-purple-400/40"
                              }`}>{p}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-white/30 text-[10px] font-bold tracking-wider uppercase mb-2">職業</p>
                        <div className="flex gap-2 flex-wrap">
                          {["醫生","教師","偵探","魔法師","運動員","護士","學生","商人","武士","歌手"].map((j) => (
                            <button key={j} type="button"
                              onClick={() => { setSelectedJob(selectedJob === j ? "" : j); setCustomPersonality(""); }}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                selectedJob === j
                                  ? "bg-purple-400/30 text-purple-300 border-purple-400/60"
                                  : "bg-white/5 text-white/50 border-white/10 hover:border-purple-400/40"
                              }`}>{j}</button>
                          ))}
                        </div>
                      </div>
                      {!selectedPersonality && !selectedJob && (
                        <div className="space-y-1">
                          <div className="relative">
                            <textarea
  rows={2}
  value={customPersonality}
  onChange={(e) => { setCustomPersonality(e.target.value); setCustomPersonalityTranslated(null); }}
  placeholder="或自行輸入個性描述...可中文輸入！輸入後點「翻譯」按鈕幫你翻譯 🌐"
  className="w-full px-3 py-2 pr-16 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/25 focus:outline-none focus:border-purple-400/40 resize-none leading-relaxed"
/>
                            {hasChinese(customPersonality) && !customPersonalityTranslated && (
                              <button type="button"
                                onClick={async () => {
                                  setIsCustomPersonalityTranslating(true);
                                  try {
                                    const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: customPersonality }) });
                                    const data = await res.json();
                                    if (data.translated) setCustomPersonalityTranslated(data.translated);
                                  } finally { setIsCustomPersonalityTranslating(false); }
                                }}
                                disabled={isCustomPersonalityTranslating}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-purple-400/20 border border-purple-400/40 text-purple-300 text-[10px] rounded-lg font-bold disabled:opacity-40">
                                {isCustomPersonalityTranslating ? "翻譯中..." : "🌐 翻譯"}
                              </button>
                            )}
                          </div>
                          {customPersonalityTranslated && (
                            <div className="flex gap-2 items-center px-2 py-1.5 bg-purple-400/10 border border-purple-400/20 rounded-xl">
                              <p className="text-purple-300 text-[10px] flex-1">{customPersonalityTranslated}</p>
                              <button type="button" onClick={() => { setCustomPersonality(customPersonalityTranslated); setCustomPersonalityTranslated(null); }}
                                className="text-[10px] px-2 py-0.5 bg-purple-400/30 text-purple-300 rounded-lg font-bold flex-shrink-0">採用</button>
                              <button type="button" onClick={() => setCustomPersonalityTranslated(null)}
                                className="text-[10px] text-white/30 flex-shrink-0">略過</button>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-white/20 text-[10px]">此設定存入角色資料，不影響生成 prompt</p>
                      <button type="button" onClick={() => setActiveStep(4)}
                        className="w-full py-2 text-xs text-white/40 hover:text-white/60 transition-all">
                        下一步 →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Step 4：場景選擇 */}
            {(() => {
              const isOpen = activeStep === 4;
              const sceneLabels: Record<string,string> = {
                "urban night cityscape, neon lights, busy street": "城市夜景",
                "dense jungle, tropical forest, sunlight through leaves": "叢林",
                "abandoned ruins, overgrown, dramatic lighting": "廢墟",
                "snowy landscape, winter, soft light": "雪地",
                "cozy cafe interior, warm lighting, bokeh": "咖啡廳",
                "ancient temple, mystical atmosphere, fog": "神殿",
                "beach, ocean, golden hour sunlight": "海邊",
                "cyberpunk city, rain, holographic signs": "賽博城市",
              };
              return (
                <div className="border border-white/8 rounded-2xl overflow-hidden">
                  <button type="button" onClick={() => setActiveStep(isOpen ? 0 : 4)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/4 hover:bg-white/7 transition-all">
                    <span className="text-[10px] font-black text-white/30 w-12 flex-shrink-0">STEP 4</span>
                    <span className="text-sm font-bold text-white/80 flex-1 text-left">場景選擇</span>
                    {selectedScene && !isOpen && (
                      <span className="text-[10px] text-blue-300/70">{sceneLabels[selectedScene] || selectedScene}</span>
                    )}
                    <span className="text-white/30 text-xs ml-1">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 bg-black/20">
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(sceneLabels).map(([value, label]) => (
                          <button key={value} type="button"
                            onClick={() => { setSelectedScene(selectedScene === value ? "" : value); setCustomScene(""); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                              selectedScene === value
                                ? "bg-blue-400/30 text-blue-300 border-blue-400/60"
                                : "bg-white/5 text-white/50 border-white/10 hover:border-blue-400/40"
                            }`}>{label}</button>
                        ))}
                      </div>
                      {!selectedScene && (
                        <div className="mt-2 space-y-1">
                          <div className="relative">
                            <textarea
  rows={2}
  value={customScene}
  onChange={(e) => { setCustomScene(e.target.value); setCustomSceneTranslated(null); }}
  placeholder="或自行輸入場景描述...可中文輸入！輸入後點「翻譯」按鈕幫你翻譯 🌐"
  className="w-full px-3 py-2 pr-16 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-white/25 focus:outline-none focus:border-blue-400/40 resize-none leading-relaxed"
/>
                            {hasChinese(customScene) && !customSceneTranslated && (
                              <button type="button"
                                onClick={async () => {
                                  setIsCustomSceneTranslating(true);
                                  try {
                                    const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: customScene }) });
                                    const data = await res.json();
                                    if (data.translated) setCustomSceneTranslated(data.translated);
                                  } finally { setIsCustomSceneTranslating(false); }
                                }}
                                disabled={isCustomSceneTranslating}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-400/20 border border-blue-400/40 text-blue-300 text-[10px] rounded-lg font-bold disabled:opacity-40">
                                {isCustomSceneTranslating ? "翻譯中..." : "🌐 翻譯"}
                              </button>
                            )}
                          </div>
                          {customSceneTranslated && (
                            <div className="flex gap-2 items-center px-2 py-1.5 bg-blue-400/10 border border-blue-400/20 rounded-xl">
                              <p className="text-blue-300 text-[10px] flex-1">{customSceneTranslated}</p>
                              <button type="button" onClick={() => { setCustomScene(customSceneTranslated); setCustomSceneTranslated(null); }}
                                className="text-[10px] px-2 py-0.5 bg-blue-400/30 text-blue-300 rounded-lg font-bold flex-shrink-0">採用</button>
                              <button type="button" onClick={() => setCustomSceneTranslated(null)}
                                className="text-[10px] text-white/30 flex-shrink-0">略過</button>
                            </div>
                          )}
                        </div>
                      )}
                      <button type="button" onClick={() => setActiveStep(generationMode === "image" ? 6 : 5)}
                        className="w-full py-2 mt-3 text-xs text-white/40 hover:text-white/60 transition-all">
                        下一步 →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* STEP 5：鏡頭角度（永遠顯示，圖片模式灰暗不可點） */}
            {(() => {
              const isLocked = generationMode === "image";
              const isOpen = activeStep === 5 && !isLocked;
              const shotLabels: Record<string,string> = {
                "close-up shot, detailed face": "特寫",
                "full body shot": "全身鏡",
                "low angle shot, looking up": "從下往上",
                "orbiting camera, 360 around subject": "環繞鏡頭",
                "slow push in, camera moving forward": "慢速推近",
              };
              return (
                <div className={`border rounded-2xl overflow-hidden transition-all ${
                  isLocked ? "border-white/4 opacity-40" : "border-white/8"
                }`}>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => !isLocked && setActiveStep(isOpen ? 0 : 5)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                      isLocked ? "bg-white/2 cursor-not-allowed" : "bg-white/4 hover:bg-white/7"
                    }`}>
                    <span className="text-[10px] font-black text-white/30 w-12 flex-shrink-0">STEP 5</span>
                    <span className={`text-sm font-bold flex-1 text-left ${isLocked ? "text-white/30" : "text-white/80"}`}>鏡頭角度</span>
                    {!isLocked && selectedShot && !isOpen && (
                      <span className="text-[10px] text-amber-300/70">{shotLabels[selectedShot] || selectedShot}</span>
                    )}
                    <span className="text-white/25 text-[10px] mr-1">
                      {isLocked ? "🔒 選影片模式才開放" : "影片限定"}
                    </span>
                    {!isLocked && <span className="text-white/30 text-xs">{isOpen ? "▲" : "▼"}</span>}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 bg-black/20">
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(shotLabels).map(([value, label]) => (
                          <button key={value} type="button"
                            onClick={() => setSelectedShot(selectedShot === value ? "" : value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                              selectedShot === value
                                ? "bg-amber-400/30 text-amber-300 border-amber-400/60"
                                : "bg-white/5 text-white/50 border-white/10 hover:border-amber-400/40"
                            }`}>{label}</button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setActiveStep(6)}
                        className="w-full py-2 mt-3 text-xs text-white/40 hover:text-white/60 transition-all">
                        下一步 →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Step 6：自由輸入 */}
            {(() => {
              const isOpen = activeStep === 6;
              return (
                <div className="border border-white/8 rounded-2xl overflow-hidden">
                  <button type="button" onClick={() => setActiveStep(isOpen ? 0 : 6)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/4 hover:bg-white/7 transition-all">
                    <span className="text-[10px] font-black text-white/30 w-12 flex-shrink-0">STEP 6</span>
                    <span className="text-sm font-bold text-white/80 flex-1 text-left">補充細節</span>
                    <span className="text-white/20 text-[10px] mr-1">選填</span>
                    <span className="text-white/30 text-xs">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 space-y-2 bg-black/20">
                      {/* 已選標籤摘要 */}
                      {[selectedStyle, selectedPersona, selectedScene, selectedShot].filter(Boolean).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-white/4 rounded-xl">
                          {[
                            { v: selectedStyle, color: "text-[#89f5a2]/70" },
                            { v: selectedPersona, color: "text-yellow-300/70" },
                            { v: selectedScene, color: "text-blue-300/70" },
                            { v: selectedShot, color: "text-amber-300/70" },
                          ].filter(x => x.v).map((x, i) => (
                            <span key={i} className={`text-[10px] ${x.color}`}>#{x.v.split(",")[0]}</span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <textarea
                          value={prompt}
                          onChange={(e) => { setPrompt(e.target.value); setTranslatedPrompt(null); setUseTranslated(false); }}
                          placeholder="補充細節（選填，中文也可以！輸入後點「翻譯成英文」按鈕，我們幫你自動翻譯 🌐）：服裝顏色、表情、動作...&#10;標籤已幫你建立骨架，這裡補充細節"
                          className="w-full p-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#89f5a2]/40 text-sm resize-none transition-all"
                          rows={3}
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                          {hasChinese(prompt) && !translatedPrompt && (
                            <button type="button" onClick={handleTranslate} disabled={isTranslating}
                              className="px-2 py-1 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-xs rounded-lg font-bold hover:bg-[#89f5a2]/30 disabled:opacity-40">
                              {isTranslating ? "翻譯中..." : "🌐 翻譯"}
                            </button>
                          )}
                          <span className="text-white/20 text-xs">{prompt.length}/500</span>
                        </div>
                      </div>
                      {translatedPrompt && (
                        <div className="bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-xl p-3 space-y-2">
                          <p className="text-white/40 text-xs font-bold uppercase">🌐 翻譯結果</p>
                          <p className="text-[#89f5a2] text-sm font-medium">{translatedPrompt}</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setPrompt(translatedPrompt); setTranslatedPrompt(null); setUseTranslated(true); }}
                              className="flex-1 py-1.5 bg-[#89f5a2] text-[#0d2318] rounded-lg text-xs font-black hover:opacity-90">✅ 採用翻譯</button>
                            <button type="button" onClick={() => { setTranslatedPrompt(null); setUseTranslated(false); }}
                              className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-xs font-bold">略過</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 生成按鈕 */}
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
                <span className="flex items-center justify-center gap-2">
                  ✨ 開始生成角色
                  <span className="text-[#0d2318]/60 text-sm font-bold">1 點</span>
                </span>
              )}
            </button>

          </form>
        </div>
        {/* [DNA_PATCH_END] */}

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
          <div ref={progressRef} className="mt-4 p-5 bg-black/25 backdrop-blur-xl rounded-2xl border border-white/10">
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
          <p className="text-white/25 text-[10px] text-center mt-1">
  📱 長按上方圖片可直接儲存到相簿｜影片請點「儲存成果」下載
</p>
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
                  disabled={loading || (credits !== null && credits <= 0)}
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
{/* [DNA_PATCH_START] 結果區操作按鈕整合 */}
{prediction?.output && !genType.includes('video') && (
  <div className="mt-4 px-4 space-y-2.5">

    {/* 主要操作：一排三顆 */}
    <div className="grid grid-cols-3 gap-2">
      {/* 鎖定此角色 */}
      <button
        onClick={async () => {
          try {
            const btn = document.activeElement as HTMLButtonElement;
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
              alert('✅ 角色已鎖定！');
            } else {
              alert('鎖定失敗，請重試');
            }
          } catch { alert('鎖定失敗，請重試'); }
        }}
        className="flex flex-col items-center gap-1.5 py-3.5 bg-gradient-to-b from-[#89f5a2]/15 to-[#89f5a2]/5 border border-[#89f5a2]/40 text-[#89f5a2] rounded-2xl text-xs font-black hover:from-[#89f5a2]/25 hover:to-[#89f5a2]/10 hover:border-[#89f5a2]/60 transition-all active:scale-95 shadow-sm shadow-[#89f5a2]/10"
      >
        <span className="text-lg">🎯</span>
        <span>鎖定角色</span>
      </button>

      {/* 收藏此角色 */}
      <button
        onClick={() => { setSaveCharacterName(""); setShowSaveModal(true); }}
        className="flex flex-col items-center gap-1.5 py-3.5 bg-gradient-to-b from-yellow-400/15 to-yellow-400/5 border border-yellow-400/40 text-yellow-300 rounded-2xl text-xs font-black hover:from-yellow-400/25 hover:to-yellow-400/10 hover:border-yellow-400/60 transition-all active:scale-95 shadow-sm shadow-yellow-400/10"
      >
        <span className="text-lg">⭐</span>
        <span>收藏角色</span>
      </button>

      {/* 批次生成（付費+已鎖定才亮） */}
      <button
        onClick={() => {
          if (plan === 'free') { alert('⚠️ 批次生成為付費功能，請先升級方案'); return; }
          if (!lockedCharacterUrl) { alert('⚠️ 批次生成必須先鎖定角色'); return; }
          setShowBatchModal(true);
        }}
        className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl text-xs font-black border transition-all active:scale-95 ${
          plan !== 'free' && lockedCharacterUrl
            ? 'bg-gradient-to-b from-blue-500/15 to-blue-500/5 border-blue-400/40 text-blue-300 hover:from-blue-500/25 hover:border-blue-400/60 shadow-sm shadow-blue-400/10'
            : 'bg-white/3 border-white/8 text-white/20 cursor-not-allowed'
        }`}
      >
        <span className="text-lg">🎭</span>
        <span>批次生成</span>
        {(plan === 'free' || !lockedCharacterUrl) && (
          <span className="text-[9px] text-white/20 font-normal -mt-0.5">
            {plan === 'free' ? '付費限定' : '需鎖定角色'}
          </span>
        )}
      </button>
    </div>

    {/* 次要操作：解除鎖定 + 上傳轉影片 */}
    <div className={`grid gap-2 ${lockedCharacterUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {lockedCharacterUrl && (
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
            setLockedCharacterId(null);
          }}
          className="py-2.5 bg-white/3 border border-white/10 text-white/35 rounded-xl text-xs font-bold hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400/60 transition-all active:scale-95"
        >
          🔓 解除鎖定
        </button>
      )}
      <button
        onClick={() => setShowUploadModal(true)}
        className="py-2.5 bg-[#89f5a2]/6 border border-[#89f5a2]/20 text-[#89f5a2]/55 rounded-xl text-xs font-bold hover:bg-[#89f5a2]/12 hover:border-[#89f5a2]/35 hover:text-[#89f5a2]/80 transition-all active:scale-95"
      >
        📁 上傳照片轉影片
      </button>
    </div>

    {/* 推薦賺點橫幅 */}
    <button
      onClick={() => setShowReferralModal(true)}
      className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-yellow-400/10 to-amber-500/5 border border-yellow-400/25 rounded-2xl hover:from-yellow-400/18 hover:border-yellow-400/40 transition-all group"
    >
      <div className="w-8 h-8 rounded-xl bg-yellow-400/15 flex items-center justify-center flex-shrink-0">
        <span className="text-base">🎁</span>
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-yellow-300 text-sm font-black leading-tight">推薦好友賺點數</p>
        <p className="text-white/30 text-[11px] mt-0.5">推薦升級最高可得獎勵點數</p>
      </div>
      <span className="text-yellow-400/50 text-sm group-hover:translate-x-0.5 transition-transform flex-shrink-0">›</span>
    </button>

    {/* 成人專區入口（暫時隱藏） */}
    {false && (
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-500/8 to-rose-500/5 border border-pink-500/20 rounded-2xl hover:from-pink-500/15 hover:border-pink-500/35 transition-all group opacity-60"
      >
        <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center flex-shrink-0">
          <span className="text-base">🔞</span>
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-pink-300 text-sm font-black leading-tight">成人專區</p>
          <p className="text-white/25 text-[11px] mt-0.5">即將開放 · 需年齡驗證</p>
        </div>
        <span className="text-xs px-2 py-0.5 bg-pink-500/15 text-pink-300/60 rounded-full border border-pink-500/15 flex-shrink-0">Coming Soon</span>
      </button>
    )}

  </div>
)}
{/* [DNA_PATCH_END] */}
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
{/* [DNA_PATCH_START] 影片設定 Modal — Code Split */}
{showVideoModal && (
  <VideoSettingsModal
    plan={plan}
    videoModel={videoModel}
    setVideoModel={setVideoModel}
    videoPrompt={videoPrompt}
    setVideoPrompt={setVideoPrompt}
    videoTranslatedPrompt={videoTranslatedPrompt}
    setVideoTranslatedPrompt={setVideoTranslatedPrompt}
    isVideoTranslating={isVideoTranslating}
    handleVideoTranslate={handleVideoTranslate}
    videoRatio={videoRatio}
    setVideoRatio={setVideoRatio}
    videoDuration={videoDuration}
    setVideoDuration={setVideoDuration}
    omniRef1={omniRef1}
    setOmniRef1={setOmniRef1}
    omniRef2={omniRef2}
    setOmniRef2={setOmniRef2}
    omniRef3={omniRef3}
    setOmniRef3={setOmniRef3}
    predictionOutput={prediction?.output ?? null}
    onClose={() => setShowVideoModal(false)}
    onGenerate={(refs) => {
      setShowVideoModal(false);
      handleGenerateVideo(prediction.output, videoTranslatedPrompt || videoPrompt, videoRatio, videoDuration, videoModel, refs);
    }}
  />
)}
{/* [DNA_PATCH_START] 文字生成影片 Modal — Code Split */}
{showText2VideoModal && (
  <Text2VideoModal
    plan={plan}
    text2videoModel={text2videoModel}
    setText2videoModel={setText2videoModel}
    text2videoRatio={text2videoRatio}
    setText2videoRatio={setText2videoRatio}
    text2videoDuration={text2videoDuration}
    setText2videoDuration={setText2videoDuration}
    text2videoPrompt={text2videoPrompt}
    setText2videoPrompt={setText2videoPrompt}
    text2videoTranslated={text2videoTranslated}
    setText2videoTranslated={setText2videoTranslated}
    isText2videoTranslating={isText2videoTranslating}
    setIsText2videoTranslating={setIsText2videoTranslating}
    onClose={() => { setShowText2VideoModal(false); setGenerationMode("image"); }}
    onGenerate={handleText2Video}
  />
)}
{/* [DNA_PATCH_END] */}
{/* 上傳圖片轉影片 Modal */}
{showUploadModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-md bg-[#0d2318] border border-white/10 rounded-3xl p-6 space-y-4 overflow-y-auto max-h-[90vh]">
      
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
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setVideoModel("kling")}
                className={`w-full px-4 py-3 rounded-xl text-left border transition-all ${
                  videoModel === "kling"
                    ? "bg-[#89f5a2]/15 border-[#89f5a2]"
                    : "bg-white/5 border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-black text-sm">⚡ Kling 3.0</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#89f5a2] text-[#0d2318]">推薦</span>
                </div>
                <p className="text-white/50 text-xs mt-1">4K畫質・角色一致性強・生成速度快</p>
                <p className="text-[#89f5a2] text-xs font-bold mt-0.5">5秒 4–6點 ／ 10秒 8–12點</p>
              </button>
              <button
                onClick={() => setVideoModel("seedance")}
                className={`w-full px-4 py-3 rounded-xl text-left border transition-all ${
                  videoModel === "seedance"
                    ? "bg-[#fb923c]/15 border-[#fb923c]"
                    : "bg-white/5 border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center justify-between">
  <span className="text-white font-black text-sm">✨ Seedance 2.0</span>
  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#fb923c] text-white">高畫質溢價</span>
</div>
<p className="text-white/50 text-xs mt-1">物理動態超真實・原生音訊・場景特效強</p>
<p className="text-white/30 text-xs mt-0.5">🔒 Replicate 官方版・非第三方不穩定版</p>
                <p className="text-[#fb923c] text-xs font-bold mt-0.5">
                  5秒 {plan === 'starter' ? '17點' : plan === 'standard' ? '15點' : plan === 'pro' ? '13點' : '—'} ／
10秒 {plan === 'starter' ? '27點' : plan === 'standard' ? '25點' : plan === 'pro' ? '21點' : '—'}
                  　⚠️ 點數較高
                </p>
              </button>
            </div>
          </div>
{/* [DNA_PATCH_END] */}
{/* [DNA_PATCH_START] Omni-Reference 區塊（Seedance 專屬） */}
{videoModel === "seedance" && (
  <div className="border border-[#fb923c]/20 rounded-2xl overflow-hidden">
    <div className="px-4 py-3 bg-[#fb923c]/5 flex items-center justify-between">
      <div>
        <p className="text-[#fb923c] text-xs font-black">✨ Omni-Reference 多參考圖（選填）</p>
        <p className="text-white/30 text-[10px] mt-0.5">
          上傳後額外加費：入門+6點・標準+5點・專業+4點
        </p>
      </div>
    </div>
    <div className="px-4 pb-4 pt-2 space-y-3 bg-black/10">
      {[
        { label: "🎭 第二角色", hint: "加入第二個人物", state: omniRef1, setter: setOmniRef1 },
        { label: "🌄 場景風格", hint: "指定場景或背景風格", state: omniRef2, setter: setOmniRef2 },
        { label: "🎬 動作參考", hint: "指定動作或姿勢", state: omniRef3, setter: setOmniRef3 },
      ].map((item, idx) => (
        <div key={idx}>
          <p className="text-white/40 text-[10px] font-bold mb-1">{item.label}
            <span className="text-white/20 font-normal ml-1">（{item.hint}）</span>
          </p>
          <label className="block cursor-pointer">
            <div className={`border border-dashed rounded-xl p-3 text-center transition-all ${
              item.state
                ? "border-[#fb923c]/50 bg-[#fb923c]/5"
                : "border-white/10 hover:border-[#fb923c]/30"
            }`}>
              {item.state ? (
                <div className="relative">
                  <img src={item.state} className="w-full max-h-24 object-contain rounded-lg" />
                  <button
                    type="button"
                    onClick={(e) => { 
  e.preventDefault(); 
  item.setter(null);
  const input = e.currentTarget.closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;
  if (input) input.value = '';
}}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full text-white text-xs flex items-center justify-center font-black hover:bg-red-500"
                  >×</button>
                </div>
              ) : (
                <p className="text-white/25 text-xs">點擊上傳圖片</p>
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
                  reader.onload = () => item.setter(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
      ))}
    </div>
  </div>
)}
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
  // [DNA_PATCH_START] 傳入 omniRefs
  const refs = videoModel === "seedance" ? [omniRef1, omniRef2, omniRef3] : [];
  handleGenerateVideo(uploadedImage, videoTranslatedPrompt || videoPrompt, videoRatio, videoDuration, videoModel, refs);
  setOmniRef1(null); setOmniRef2(null); setOmniRef3(null);
  // [DNA_PATCH_END]
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
                // [DNA_PATCH_START] 靈感畫廊點擊：填入prompt並捲動到輸入框
onClick={() => {
  setPrompt(item.prompt);
  setTranslatedPrompt(null);
  setUseTranslated(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}}
// [DNA_PATCH_END]
              >
                <div className="w-32 h-32 rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all duration-200 hover:scale-105 hover:border-[#89f5a2]/50 hover:shadow-[0_0_20px_rgba(137,245,162,0.15)] relative">
                  <img src={item.image} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
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
        {/* [DNA_PATCH_START] TTS Modal — Code Split */}
{showTtsModal && (
  <TtsModal
    plan={plan}
    videoDuration={videoDuration}
    ttsText={ttsText}
    setTtsText={setTtsText}
    ttsVoice={ttsVoice}
    setTtsVoice={setTtsVoice}
    ttsAudio={ttsAudio}
    setTtsAudio={setTtsAudio}
    isTtsLoading={isTtsLoading}
    setIsTtsLoading={setIsTtsLoading}
    ttsTrimmed={ttsTrimmed}
    setTtsTrimmed={setTtsTrimmed}
    ttsCache={ttsCache}
    setTtsCache={setTtsCache}
    ttsPreviewCount={ttsPreviewCount}
    setTtsPreviewCount={setTtsPreviewCount}
    TTS_MAX_PREVIEW={TTS_MAX_PREVIEW}
    ttsSeconds={ttsSeconds}
    isWav2lipLoading={isWav2lipLoading}
    setIsWav2lipLoading={setIsWav2lipLoading}
    wav2lipResult={wav2lipResult}
    setWav2lipResult={setWav2lipResult}
    wav2lipSeconds={wav2lipSeconds}
    prediction={prediction}
    userEmail={session?.user?.email}
    setCredits={(fn) => setCredits(fn as any)}
    onClose={() => setShowTtsModal(false)}
    downloadFile={downloadFile}
  />
)}
{/* [DNA_PATCH_END] */}
{/* [DNA_PATCH_START] 批次生成 Modal — Code Split */}
{showBatchModal && (
  <BatchModal
    plan={plan}
    batchCount={batchCount}
    setBatchCount={setBatchCount}
    batchPrompts={batchPrompts}
    setBatchPrompts={setBatchPrompts}
    batchResults={batchResults}
    isBatchGenerating={isBatchGenerating}
    batchCurrentIndex={batchCurrentIndex}
    onClose={() => { setShowBatchModal(false); setBatchResults([]); setBatchCurrentIndex(-1); }}
    onGenerate={handleBatchGenerate}
  />
)}
{/* [DNA_PATCH_END] */}
{/* [DNA_PATCH_START] 收藏命名 Modal — Code Split */}
{showSaveModal && (
  <SaveCharacterModal
    saveCharacterName={saveCharacterName}
    setSaveCharacterName={setSaveCharacterName}
    isSaving={isSaving}
    selectedPersonality={selectedPersonality}
    selectedJob={selectedJob}
    customPersonality={customPersonality}
    selectedHair={selectedHair}
selectedEye={selectedEye}
selectedBody={selectedBody}
customAppearance={customAppearance}
    predictionOutput={prediction?.output ?? null}
    userEmail={session?.user?.email}
    plan={plan}
    onSaveSuccess={(data) => {
      setSavedCharacters(prev => [data, ...prev]);
      setShowSaveModal(false);
    }}
    onClose={() => setShowSaveModal(false)}
  />
)}
{/* [DNA_PATCH_END] */}
        {/* [DNA_PATCH_START] 推薦賺點 Modal — Code Split */}
{showReferralModal && (
  <ReferralModal
    referralCode={referralCode}
    referralCredits={referralCredits}
    copiedCode={copiedCode}
    setCopiedCode={setCopiedCode}
    copiedLink={copiedLink}
    setCopiedLink={setCopiedLink}
    onClose={() => setShowReferralModal(false)}
  />
)}
{/* [DNA_PATCH_END] */}
        </main>
  </>
  );
}