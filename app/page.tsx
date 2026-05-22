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
import GallerySection from "./components/GallerySection";
// [DNA_PATCH_START] promo-timer-component
function PromoTimer() {
  const [time, setTime] = useState({ h: '00', m: '00', s: '00' })
  useEffect(() => {
    function tick() {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000)
      setTime({
        h: String(Math.floor(diff / 3600)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600) / 60)).padStart(2, '0'),
        s: String(diff % 60).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 11, color: 'rgba(184,255,200,0.5)', whiteSpace: 'nowrap' }}>剩餘時間</span>
      <div className="flex items-center gap-1">
        {(['h','m','s'] as const).map((unit, i) => (
          <div key={unit} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-0.5">
              <div style={{ background: 'rgba(184,255,200,0.12)', border: '1px solid rgba(184,255,200,0.28)', borderRadius: 6, padding: '2px 6px', fontSize: 15, fontWeight: 700, color: '#c8ffd6', fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'center' }}>
                {time[unit]}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(184,255,200,0.35)' }}>{['時','分','秒'][i]}</div>
            </div>
            {i < 2 && <div style={{ fontSize: 14, color: 'rgba(184,255,200,0.3)', marginBottom: 8 }}>:</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
// [DNA_PATCH_END]
export default function Home() {
  const hasLoadedFromStorage = useRef(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
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
// [DNA_PATCH_START] 動作參考影片 state
const [motionVideoFile, setMotionVideoFile] = useState<File | null>(null);
const [motionVideoUrl, setMotionVideoUrl] = useState<string | null>(null);
const [motionVideoUploading, setMotionVideoUploading] = useState(false);
const [motionVideoError, setMotionVideoError] = useState<string>('');
const [motionLimits, setMotionLimits] = useState({ minSec: 5, maxSec: 10, maxMb: 30 });
const [motionExpanded, setMotionExpanded] = useState(false);
// [DNA_PATCH_START] Upload Modal 功能下拉 state
const [selectedFunction, setSelectedFunction] = useState<"free_motion" | "motion_video" | "multi_reference" | "avatar">("free_motion");
const [functionDropdownOpen, setFunctionDropdownOpen] = useState(false);
const [uploadTab, setUploadTab] = useState(0);
const [uploadTextMode, setUploadTextMode] = useState(false);
const [faceLockImageUrl, setFaceLockImageUrl] = useState<string | null>(null);
const [avatarText, setAvatarText] = useState("");
const [avatarVoiceId, setAvatarVoiceId] = useState("female-2");
const [avatarLoading, setAvatarLoading] = useState(false);
const [avatarPredictionId, setAvatarPredictionId] = useState<string | null>(null);
const [avatarTtsAudio, setAvatarTtsAudio] = useState<string | null>(null);
const [avatarTtsCache, setAvatarTtsCache] = useState<Record<string, string>>({});
const [avatarTtsPreviewCount, setAvatarTtsPreviewCount] = useState(0);
const AVATAR_TTS_MAX_PREVIEW = 3;
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
// [DNA_PATCH_START] Toast 通知狀態
const [toastMessage, setToastMessage] = useState("");
const [showToast, setShowToast] = useState(false);
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
// [DNA_PATCH_START] promo-card-state
const [showPromoCard, setShowPromoCard] = useState(false)
const [promoCollapsed, setPromoCollapsed] = useState(false)
const [adultEnabled, setAdultEnabled] = useState(false)
// [DNA_PATCH_START] Onboarding 引導狀態
const [showOnboarding, setShowOnboarding] = useState(false);
const [onboardingDismissed, setOnboardingDismissed] = useState(false);
// [DNA_PATCH_END]
// [DNA_PATCH_END]
  // 1. 初始化與點數同步
  useEffect(() => {
    if (!hasLoadedFromStorage.current && session?.user?.email) {
      hasLoadedFromStorage.current = true;
      const savedKey = `last_prediction_${session.user.email}`;
      const savedPrediction = localStorage.getItem(savedKey);
      if (savedPrediction) setPrediction(JSON.parse(savedPrediction));
    }
    
    // [DNA_PATCH_START] 鎖定角色從資料庫讀，避免跨帳號污染
    // 不再讀 localStorage，改由 credits API 回傳後設定（見下方 fetch credits 的 .then）
    // [DNA_PATCH_END]
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
          // [DNA_PATCH_START] 從資料庫讀鎖定角色，避免跨帳號污染
          setLockedCharacterUrl(data.locked_character || null);
          // [DNA_PATCH_END]
        });
      setTimeout(() => {
        fetch(`/api/saved-characters?email=${session?.user?.email}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setSavedCharacters(data);
              // [DNA_PATCH_START] 從資料庫讀鎖定角色（不讀 localStorage）
              fetch(`/api/user/credits?email=${session?.user?.email}`)
                .then(r => r.json())
                .then(creditsData => {
                  const lockedUrl = creditsData.locked_character;
                  if (lockedUrl) {
                    const matched = data.find((c: any) => c.image_url === lockedUrl);
                    if (matched) setLockedCharacterId(matched.id);
                  }
                });
              // [DNA_PATCH_END]
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
// [DNA_PATCH_START] 讀取成人專區開關
useEffect(() => {
  fetch("/api/admin/settings-public?key=adult_section_enabled")
    .then(r => r.json())
    .then(d => { if (d.value === "true") setAdultEnabled(true); })
    .catch(() => {});
}, []);
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
// [DNA_PATCH_START] selectedFunction 自動同步 videoModel
useEffect(() => {
  if (selectedFunction === "multi_reference") {
    setVideoModel("seedance");
  } else {
    setVideoModel("kling");
  }
}, [selectedFunction]);
// [DNA_PATCH_END]
// [DNA_PATCH_START] promo-card-trigger：等 Onboarding 關掉後才顯示
useEffect(() => {
  if (session === undefined) return
  if (session !== null && credits === null) return
  const isPaid = session !== null && plan !== 'free'
  if (isPaid) return
  if (showOnboarding) return  // Onboarding 還開著就不觸發
  const timer = setTimeout(() => setShowPromoCard(true), 2500)
  return () => clearTimeout(timer)
}, [session === null ? 'loggedout' : plan, credits, showOnboarding])
// [DNA_PATCH_END]
// [DNA_PATCH_START] 首次登入引導：只對免費新用戶顯示，付費帳號跳過
useEffect(() => {
  if (!session?.user?.email) return;
  if (credits === null) return;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
  const key = `onboarding_done_${session.user.email}_${today}`;
  // Onboarding 只由「使用指南」按鈕手動觸發，不自動跳
  // 付費用戶直接寫入 localStorage 標記，避免重複顯示
  if (plan !== 'free') {
    localStorage.setItem(key, '1');
  }
}, [session?.user?.email, plan, credits]);

useEffect(() => {
  const handler = () => {
    setShowOnboarding(true);
    setOnboardingDismissed(false);
  };
  window.addEventListener('open-onboarding', handler);
  return () => window.removeEventListener('open-onboarding', handler);
}, []);
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
      prompt: resolvedGenType === "video" ? (videoPrompt || prompt) : (prompt || videoPrompt),
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
          const errMsg = data.error || "";
          const isE005 = errMsg.includes("E005") || errMsg.includes("flagged as sensitive");
          setError(isE005
            ? "影片生成失敗：偵測到真實人臉，違反 Seedance 使用政策。請改用 AI 生成圖作為主角，或改用其他模式。"
            : "生成失敗，請檢查點數或重試");
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
  prompt: [
  selectedStyle,
  selectedHair, selectedEye, selectedBody,
  customAppearance ? (customAppearanceTranslated || customAppearance) : null,
  selectedPersona || (customPersona ? (customPersonaTranslated || customPersona) : null),
  selectedScene || (customScene ? (customSceneTranslated || customScene) : null),
  selectedShot,
  prompt
].filter(Boolean).join(", "),
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
    // [DNA_PATCH_START] 429 錯誤中文化
    const errMsg = data.error || "批次生成啟動失敗";
    const friendlyMsg = errMsg.includes("429") || errMsg.includes("throttled") || errMsg.includes("Too Many")
      ? "⚠️ 生成請求太頻繁，請等待 5 秒後重試"
      : "⚠️ 批次生成啟動失敗，請重試";
    alert(friendlyMsg);
    // [DNA_PATCH_END]
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

  // [DNA_PATCH_START] 動作參考影片上傳 + Motion Control 生成
  const handleMotionVideoUpload = async (file: File): Promise<string | null> => {
    setMotionVideoUploading(true);
    setMotionVideoError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', session?.user?.email || '');
      const res = await fetch('/api/upload-video', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setMotionVideoError(data.error || '上傳失敗');
        return null;
      }
      if (data.minDurationSec) setMotionLimits({ minSec: data.minDurationSec, maxSec: data.maxDurationSec, maxMb: data.maxSizeMb });
      setMotionVideoUrl(data.url);
      return data.url;
    } catch {
      setMotionVideoError('上傳失敗，請重試');
      return null;
    } finally {
      setMotionVideoUploading(false);
    }
  };

  const handleMotionControl = async (imageUrl: string, videoUrl: string, prompt?: string, ratio?: string, duration?: number) => {
    setLoading(true);
    setError('');
    setSeconds(0);
    setGenType('video');
    setTimeout(() => progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    try {
      const res = await fetch('/api/motion-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: session?.user?.email,
          image: imageUrl,
          motionVideoUrl: videoUrl,
          prompt: prompt || 'animate this character following the motion reference, cinematic quality',
          aspectRatio: ratio || '1:1',
          duration: duration || 5,
        }),
      });
      const data = await res.json();
      if (data.id) checkStatus(data.id, 'video');
      else {
        const msg = data.error || 'Motion Control 啟動失敗';
        setError(msg);
        alert('⚠️ ' + msg);
        setLoading(false);
      }
    } catch { setError('連線失敗'); setLoading(false); }
  };
  // [DNA_PATCH_END]
  // [DNA_PATCH_START] handleUploadAvatar：說話影片線路（TTS → Kling Avatar）
const handleUploadAvatar = async (imageUrl: string) => {
  if (!avatarText.trim()) { alert("⚠️ 請輸入說話文字"); return; }
  setAvatarLoading(true);
  setLoading(true);
  setError("");
  setSeconds(0);
  setGenType("video");
  setRetryMessage("步驟 1／2：語音合成中（ElevenLabs）...");
  setTimeout(() => progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);

  let avatarTimer: ReturnType<typeof setInterval> | undefined = undefined;
  try {
    // Step 1: TTS
    const ttsRes = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: avatarText, voiceId: avatarVoiceId, videoDuration: 5 }),
    });
    const ttsData = await ttsRes.json();
    if (!ttsData.audio) {
      setError(ttsData.error || "語音合成失敗，請重試");
      setRetryMessage(""); setLoading(false); setAvatarLoading(false); return;
    }

    // Step 2: Kling Avatar
    setRetryMessage("步驟 2／2：說話影片生成中（Kling Avatar）...");
    const avatarRes = await fetch("/api/kling-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        audioBase64: ttsData.audio,
        userEmail: session?.user?.email,
        plan,
        prompt: "natural talking",
        mode: "std",
      }),
    });
    const avatarData = await avatarRes.json();
    if (!avatarData.id) {
      setError(avatarData.error || "說話影片啟動失敗，請重試");
      setRetryMessage(""); setLoading(false); setAvatarLoading(false); return;
    }

    setAvatarPredictionId(avatarData.id);
    if (session?.user?.email) {
      fetch(`/api/user/credits?email=${session.user.email}`).then(r => r.json()).then(d => setCredits(d.credits));
    }

    // Polling
    let done = false;
    let attempts = 0;
    avatarTimer = setInterval(() => setSeconds(prev => prev + 3), 3000);
    while (!done && attempts < 60) {
      await new Promise(r => setTimeout(r, 3000));
      attempts++;
      const pollRes = await fetch(`/api/kling-avatar?id=${avatarData.id}`);
      const pollData = await pollRes.json();
      if (pollData.status === "succeeded") {
        done = true;
        const output = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
        setPrediction({ output, status: "succeeded" });
        setRetryMessage("");
        if (session?.user?.email) {
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_email: session.user.email,
              image_url: null,
              video_url: output,
              prompt: avatarText,
              character_id: lockedCharacterId || null,
            }),
          });
        }
      } else if (pollData.status === "failed") {
        done = true;
        setError("說話影片生成失敗，請重試");
        setRetryMessage("");
      }
    }
    if (!done) { setError("說話影片逾時，請重試"); setRetryMessage(""); }
  } catch {
    setError("連線失敗，請重試");
    setRetryMessage("");
  } finally {
    if (avatarTimer) clearInterval(avatarTimer);
    setLoading(false);
    setAvatarLoading(false);
  }
};
// [DNA_PATCH_END]
// [DNA_PATCH_START] handleUploadDirect：直接用原圖生成影片（不鎖臉）
const handleUploadDirect = async (
  imageUrl: string,
  mode: "free_motion" | "motion_video" | "multi_reference",
  motionUrl?: string | null,
  omniRefs?: (string | null)[]
) => {
  setLoading(true);
  setError("");
  setSeconds(0);
  setGenType("video");
  setRetryMessage(`生成影片中（${mode === "multi_reference" ? "Seedance" : "Kling 3.0"}）...`);
  setTimeout(() => progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);

  if (mode === "motion_video" && motionUrl) {
    await handleMotionControl(imageUrl, motionUrl, videoTranslatedPrompt || videoPrompt, videoRatio, videoDuration);
  } else {
    await handleGenerateVideo(
      imageUrl,
      videoTranslatedPrompt || videoPrompt,
      videoRatio,
      videoDuration,
      mode === "multi_reference" ? "seedance" : "kling",
      omniRefs ? omniRefs.filter(Boolean) : []
    );
  }
  setRetryMessage("");
};
// [DNA_PATCH_END]
  // [DNA_PATCH_START] 未登入直接 return Landing Page，不渲染主工作室
// [DNA_PATCH_START] 未登入 Landing Page — 美化版
if (status === 'loading') return null;
if (!session) return (
  <>
    <div style={{
      minHeight: '100vh',
      background: '#0a1f10',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Noto Sans TC', sans-serif",
    }}>
      {/* Hero */}
      <div style={{
        padding: '72px 24px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0d2318 0%, #1a3a25 50%, #0d2318 100%)',
      }}>
        {/* 背景光暈 */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(137,245,162,0.10) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(137,245,162,0.06) 0%, transparent 65%)',
        }} />

        {/* Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'rgba(137,245,162,0.08)',
          border: '1px solid rgba(137,245,162,0.22)',
          borderRadius: 20, padding: '5px 14px',
          fontSize: 10, fontWeight: 600, color: '#89f5a2',
          letterSpacing: '0.15em',
          position: 'relative',
          whiteSpace: 'nowrap',
          width: 'fit-content',
          margin: '0 auto 24px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#89f5a2', display: 'inline-block', boxShadow: '0 0 8px #89f5a2' }} />
          ✨ AI CHARACTER STUDIO
        </div>

        {/* 標題 */}
        <h1 style={{
          fontSize: 'clamp(24px, 8vw, 38px)',
          fontWeight: 500,
          color: '#fff',
          lineHeight: 1.2,
          marginBottom: 14,
          position: 'relative',
          letterSpacing: '0.01em',
        }}>
          打造專屬 AI 角色
          <br />
          <span style={{
            color: '#89f5a2',
            fontWeight: 400,
            letterSpacing: '0.06em',
            textShadow: '0 0 20px rgba(137,245,162,0.6), 0 0 40px rgba(137,245,162,0.25)',
            display: 'inline-block',
            marginTop: 6,
            fontSize: '0.85em',
            opacity: 0.92,
          }}>創作・對話・影片</span>
        </h1>

        {/* 副標 */}
        <p style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 32,
          position: 'relative',
          lineHeight: 1.9,
          maxWidth: 300,
          margin: '0 auto 32px',
          letterSpacing: '0.03em',
        }}>
          生成角色、和他們聊天、製作說話影片<br />一個平台，三種體驗
        </p>

        {/* CTA 按鈕 */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', position: 'relative', flexWrap: 'wrap' }}>
          {/Threads|FBAN|FBAV|Instagram|Line\/|MicroMessenger/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '') && (
            <div style={{
              width: '100%', textAlign: 'center',
              fontSize: 11, color: 'rgba(255,200,100,0.85)',
              background: 'rgba(255,180,0,0.08)',
              border: '1px solid rgba(255,180,0,0.2)',
              borderRadius: 8, padding: '7px 12px',
              marginBottom: 4, lineHeight: 1.7,
            }}>
              ⚠️ 若登入失敗，請用 <strong>Safari</strong> 或 <strong>Chrome</strong> 開啟本頁
            </div>
          )}
          <button
            onClick={() => signIn("google", {}, { prompt: "select_account" })}
            style={{
              background: 'linear-gradient(135deg, #2d8a42, #3db558)',
              border: 'none',
              borderRadius: 12,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 800,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(61,181,88,0.35)',
              letterSpacing: '0.02em',
            }}
          >🚀 免費開始試用</button>
          <button
            onClick={() => { window.location.href = '/pricing'; }}
            style={{
              background: 'rgba(137,245,162,0.06)',
              border: '1px solid rgba(137,245,162,0.22)',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#89f5a2',
              cursor: 'pointer',
            }}
          >查看定價</button>
        </div>
      </div>

      {/* 功能卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        padding: '24px 16px',
        maxWidth: 560,
        margin: '0 auto',
        width: '100%',
      }}>
        {[
          { icon: '🎨', title: '生成 AI 角色', desc: '高精度圖片與影片，角色外貌高度一致' },
          { icon: '💬', title: '即時對話', desc: '和角色聊天、群組聊天、AI 自拍' },
          { icon: '🎬', title: '說話影片', desc: '語音合成 + 嘴型同步，栩栩如生' },
        ].map((f) => (
          <div key={f.title} style={{
            background: 'rgba(137,245,162,0.04)',
            border: '1px solid rgba(137,245,162,0.10)',
            borderRadius: 12,
            padding: '14px 8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#b8ffc8', marginBottom: 4, lineHeight: 1.4 }}>{f.title}</div>
            <div style={{ fontSize: 9.5, color: 'rgba(184,255,200,0.4)', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div style={{ textAlign: 'center', paddingBottom: 32, marginTop: 4 }}>
        <div style={{
          display: 'inline-block',
          fontSize: 11, color: 'rgba(184,255,200,0.28)',
          borderTop: '1px solid rgba(137,245,162,0.08)',
          paddingTop: 16,
        }}>
          ↓ 免費獲得 5 點，登入即可使用
        </div>
      </div>
    </div>
  </>
);
// [DNA_PATCH_END]
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
{/* [DNA_PATCH_START] 已登入 Onboarding 引導（第一次登入，半透明遮罩） */}
{session && showOnboarding && !onboardingDismissed && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 500,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  }}>
    <div style={{
  background: '#0f2318',
  border: '1px solid rgba(137,245,162,0.28)',
  borderRadius: 18,
  padding: '28px 22px',
  width: '100%',
  maxWidth: 360,
  boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(137,245,162,0.05)',
}}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 12, color: 'rgba(184,255,200,0.4)' }}>
          歡迎！你有{' '}
          <span style={{ color: '#89f5a2', fontWeight: 700 }}>5 點</span>
          {' '}免費點數
        </p>
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#d4ffe0', textAlign: 'center', marginBottom: 4, marginTop: 8, letterSpacing: '-0.01em' }}>
  👋 你想先做什麼？
</div>
      <div style={{ fontSize: 11, color: 'rgba(184,255,200,0.4)', textAlign: 'center', marginBottom: 22, lineHeight: 1.6 }}>
        選擇你的第一個任務，我帶你一步步完成
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: '🌐', title: '探索角色', sub: '瀏覽社群角色 → 查看詳細頁面 → 直接開始聊天', href: '/explore' },
          { icon: '🌟', title: '生成 AI 角色', sub: '選風格 → 設定外觀 → 生成圖片或影片', href: '/create' },
          { icon: '💬', title: '和 AI 角色聊天', sub: '選角色 → 設定個性 → 開始對話・AI 自拍・說話影片', href: '/characters' },
          { icon: '📁', title: '上傳照片轉影片', sub: '說話影片・自由動作・套用動作・高精度影片', href: '/create?upload=1' },
        ].map((opt) => (
          <div
            key={opt.title}
              onClick={() => {
                const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
const key = `onboarding_done_${session?.user?.email}_${today}`;
localStorage.setItem(key, '1');
                setShowOnboarding(false);
                setOnboardingDismissed(true);
                if (opt.href) {
                router.push(opt.href);
              }
              }}
              style={{
                background: 'rgba(137,245,162,0.06)',
              border: '1px solid rgba(137,245,162,0.2)',
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(137,245,162,0.12)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(137,245,162,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(137,245,162,0.06)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(137,245,162,0.2)';
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#d4ffe0' }}>{opt.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(184,255,200,0.45)', marginTop: 2 }}>{opt.sub}</div>
            </div>
            <span style={{ color: 'rgba(137,245,162,0.4)', fontSize: 14 }}>→</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* [DNA_PATCH_START] 查看完整指南按鈕 */}
          <div
            onClick={() => {
              const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
const key = `onboarding_done_${session?.user?.email}_${today}`;
localStorage.setItem(key, '1');
              setShowOnboarding(false);
              setOnboardingDismissed(true);
              window.location.href = '/guide';
            }}
            style={{
              background: 'rgba(137,245,162,0.06)',
              border: '1px solid rgba(137,245,162,0.2)',
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(137,245,162,0.12)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(137,245,162,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(137,245,162,0.06)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(137,245,162,0.2)';
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>📖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#d4ffe0', textAlign: 'left' }}>查看完整指南</div>
            <div style={{ fontSize: 10, color: 'rgba(184,255,200,0.45)', marginTop: 2, textAlign: 'left' }}>功能詳解・點數說明・方案對照</div>
            </div>
            <span style={{ color: 'rgba(137,245,162,0.4)', fontSize: 14 }}>→</span>
          </div>
          {/* [DNA_PATCH_END] */}
          <span
            onClick={() => {
              const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
const key = `onboarding_done_${session?.user?.email}_${today}`;
localStorage.setItem(key, '1');
              setShowOnboarding(false);
              setOnboardingDismissed(true);
            }}
            style={{ fontSize: 10, color: 'rgba(184,255,200,0.25)', cursor: 'pointer' }}
          >
            跳過，直接進入 →
          </span>
        </div>
    </div>
  </div>
)}
{/* [DNA_PATCH_END] */}
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] relative overflow-y-auto">
      <div className="h-12" />
      {/* [DNA_PATCH_START] N01 已登入首頁：Hero + 瀑布流 */}
      <GallerySection userEmail={session?.user?.email || ""} plan={plan} />
      {/* [DNA_PATCH_END] */}
        </main>
{/* [DNA_PATCH_START] Toast 通知元件 */}
{showToast && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-2xl bg-[#1a3a25] border border-[#89f5a2]/40 text-[#89f5a2] text-sm font-black shadow-xl shadow-black/40 transition-all flex items-center gap-3">
    <span>{toastMessage}</span>
    <button onClick={() => setShowToast(false)} className="text-[#89f5a2]/60 hover:text-[#89f5a2] text-base leading-none">✕</button>
  </div>
)}
{/* [DNA_PATCH_END] */}
  </>
  );
}
