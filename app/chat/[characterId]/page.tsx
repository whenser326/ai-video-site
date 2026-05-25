// [DNA_PATCH_START] 單人聊天頁
"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  characterName?: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaUrl?: string;
  selfieLoading?: boolean;
  selfieType?: "photo" | "video";
  isUnlock?: boolean;
  unlockLevel?: string;
}

interface VideoModal {
  content: string;
  characterId: string;
  characterImage: string;
  characterVoiceId: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const characterId = params?.characterId as string;

  const [character, setCharacter] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState<number | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isOverQuota, setIsOverQuota] = useState(false);
  const [videoModal, setVideoModal] = useState<VideoModal | null>(null);
  const [avatarStatus, setAvatarStatus] = useState("");
  const [avatarVideoUrl, setAvatarVideoUrl] = useState("");
  const [avatarVoiceId, setAvatarVoiceId] = useState("female-2");
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
  // [DNA_PATCH_START] 搜尋功能 state
  const [showNotice, setShowNotice] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
const [chatStyle, setChatStyle] = useState("療癒");
const [writingStyle, setWritingStyle] = useState("直白");
const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [replyTo, setReplyTo] = useState<{ characterName: string; content: string } | null>(null);
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // [DNA_PATCH_END]

  const VOICE_OPTIONS = [
    { id: "female-1", label: "Jane（女）低沉" },
    { id: "female-2", label: "Stacy（女）甜美" },
    { id: "female-3", label: "Anna（女）清晰" },
    { id: "female-4", label: "Xiaoxi（女）活潑" },
    { id: "female-5", label: "Maya（女）溫柔" },
    { id: "male-1", label: "Aliby（男）專業" },
    { id: "male-2", label: "Evan（男）溫暖" },
    { id: "male-3", label: "Liu（男）成熟" },
    { id: "male-4", label: "Adrian（男）旁白" },
    { id: "male-5", label: "Wilson（男）深沉" },
  ];
// [DNA_PATCH_START] 每日提示框
  useEffect(() => {
    if (!session?.user?.email) return;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
    const key = `chat_notice_seen_${today}`;
    if (!localStorage.getItem(key)) {
      setShowNotice(true);
    }
  }, [session]);
  // [DNA_PATCH_END]
  const handleSuggest = async () => {
    if (suggestLoading) return;
    setShowSuggest(true);
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/chat/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session?.user?.email,
          sessionId,
          characterId,
          characterName: character?.name,
          characterDescription: character?.description,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
    } catch {
      setSuggestions(["你今天過得怎麼樣？", "有沒有什麼有趣的事想分享？"]);
    }
    setSuggestLoading(false);
  };
  const randomDelay = () => Math.floor(Math.random() * 3000) + 2000;
  const selfieDelay = () => Math.floor(Math.random() * 7000) + 3000; // 單人：3~10秒

  useEffect(() => {
    if (!session?.user?.email || !characterId) return;
    fetch(`/api/saved-characters?email=${session.user.email}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find((c: any) => String(c.id) === String(characterId));
          setCharacter(found || null);
        }
      });
    fetch(`/api/user/credits?email=${session.user.email}`)
      .then(r => r.json())
      .then(d => {
        if (d.credits !== undefined) setCredits(d.credits);
        if (d.plan !== undefined) setPlan(d.plan);
      });
    // 從 localStorage 恢復上次 sessionId
    const savedSession = localStorage.getItem(`chat_session_${session.user.email}_${characterId}`);
    if (savedSession) setSessionId(savedSession);
  }, [session, characterId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
// 主動發話 timer
  useEffect(() => {
    if (!character || !session?.user?.email) return;
    const startTimer = () => {
      if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current);
      autoMessageTimerRef.current = setTimeout(async () => {
        if (loading) { startTimer(); return; }
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: session?.user?.email,
              characterId,
              sessionId,
              message: "（系統：請主動發話）",
              isAutoMessage: true,
            }),
          });
          const data = await res.json();
          if (data.responses && Array.isArray(data.responses)) {
            for (const r of data.responses) {
              await new Promise(resolve => setTimeout(resolve, randomDelay()));
              setMessages(prev => [...prev, {
                role: "assistant",
                content: r.content,
                characterName: r.characterName,
              }]);
            }
          }
        } catch { /* 靜默失敗 */ }
        startTimer();
      }, 60000);
    };
    startTimer();
    return () => { if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current); };
  }, [character, session, characterId, sessionId, loading]);
  const triggerSelfie = async (intent: "photo" | "video", selfiePrompt: string, msgId: string, charImageUrl?: string) => {
    const photoCost = 1;
    const videoCost = plan === 'pro' ? 4 : plan === 'standard' ? 5 : 6;

    // 自拍等待追問：每60秒發一則，最多3次
    const waitingMessages = [
      "（還在拍喔，等我一下～）",
      "（稍等一下，幫你調整一下角度...）",
      "（快好了，再等我一點點～）",
      "（哎呀快好了，你先等等！）",
    ];
    let waitCount = 0;
    const waitTimer = setInterval(() => {
      if (waitCount >= 3) { clearInterval(waitTimer); return; }
      const msg = waitingMessages[Math.floor(Math.random() * waitingMessages.length)];
      setMessages(prev => [...prev, {
        role: "assistant",
        content: msg,
        characterName: character?.name,
        characterImage: charImageUrl,
      }]);
      waitCount++;
    }, 60000);

    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, selfieLoading: true, selfieType: intent } : m
    ));

    try {
      // Step 1: 用 flux-kontext-pro 鎖定角色臉孔生成照片
      const charRes = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: selfiePrompt,
          selfieCharacterImage: charImageUrl || character?.image_url || null,
          userEmail: session?.user?.email,
          imageRatio: "1:1",
        }),
      });
      const charData = await charRes.json();
      if (!charData.id) throw new Error("照片生成啟動失敗");

      // Polling
      let imageUrl: string | null = null;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`/api/character?id=${charData.id}`);
        const pollData = await poll.json();
        if (pollData.status === "succeeded") {
          imageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
          break;
        }
        if (pollData.status === "failed") throw new Error("照片生成失敗");
      }
      if (!imageUrl) throw new Error("照片生成逾時");

      if (intent === "photo") {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, selfieLoading: false, imageUrl } : m
        ));
        fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => { if (d.credits !== undefined) setCredits(d.credits); });
        // 存入歷史
        if (session?.user?.email && imageUrl) {
          fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_email: session.user.email,
              image_url: imageUrl,
              video_url: null,
              prompt: "AI 自拍",
              character_id: character?.id || null,
            }),
          }).catch(() => {});
        }
        return;
      }

      // Step 2: 影片 — 先上傳照片到 Supabase，再丟給 Kling
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, selfieType: "video" } : m
      ));

      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, email: session?.user?.email }),
      });
      const uploadData = await uploadRes.json();
      const storedUrl = uploadData.url;
      if (!storedUrl) throw new Error("上傳失敗");

      // Step 3: Kling 生成影片
      const videoRes = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "video",
          image: storedUrl,
          videoPrompt: selfiePrompt,
          aspectRatio: "1:1",
          duration: 5,
          videoModel: "kling",
          userEmail: session?.user?.email,
        }),
      });
      const videoPred = await videoRes.json();
      if (!videoPred.id) throw new Error("影片啟動失敗");

      let videoUrl: string | null = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`/api/character?id=${videoPred.id}`);
        const pollData = await poll.json();
        if (pollData.status === "succeeded") {
          videoUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
          break;
        }
        if (pollData.status === "failed") throw new Error("影片生成失敗");
      }

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, selfieLoading: false, videoUrl: videoUrl || undefined } : m
      ));
      fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => { if (d.credits !== undefined) setCredits(d.credits); });
      // 存入歷史
      if (session?.user?.email && videoUrl) {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: session.user.email,
            image_url: null,
            video_url: videoUrl,
            prompt: "AI 自拍影片",
            character_id: character?.id || null,
          }),
        }).catch(() => {});
      }

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, selfieLoading: false } : m
      ));
    } finally {
      clearInterval(waitTimer);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !session?.user?.email) return;
    if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current);
    const userMsg = input.trim();
    setInput("");
    setReplyTo(null);
    setMessages(prev => [...prev, { role: "user", content: replyTo ? `↩ 回覆 ${replyTo.characterName}：${userMsg}` : userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  userEmail: session?.user?.email,
  characterId,
  sessionId,
  message: replyTo ? `（回覆 ${replyTo.characterName}：「${replyTo.content.slice(0, 30)}...」）\n${userMsg}` : userMsg,
  chatStyle,
  writingStyle,
}),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${data.error || "發生錯誤，請重試"}` }]);
        setLoading(false);
        return;
      }

      if (data.sessionId) {
            setSessionId(data.sessionId);
            if (session?.user?.email && characterId) {
              localStorage.setItem(`chat_session_${session.user.email}_${characterId}`, data.sessionId);
            }
          }
      if (data.remainingQuota !== undefined) setRemainingQuota(data.remainingQuota);
      if (data.isOverQuota) {
        setIsOverQuota(true);
        fetch(`/api/user/credits?email=${session.user.email}`)
          .then(r => r.json())
          .then(d => { if (d.credits !== undefined) setCredits(d.credits); });
      }

      setLoading(false);

      if (Array.isArray(data.responses)) {
        for (const r of data.responses) {
          await new Promise(resolve => setTimeout(resolve, randomDelay()));
          const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const newMsg: Message = {
            id: msgId,
            role: "assistant",
            content: r.content,
            characterName: r.characterName,
            isUnlock: r.isUnlock,
            unlockLevel: r.unlockLevel,
          };
          setMessages(prev => {
            const updated = [...prev, newMsg];
            if (r.selfieIntent && r.selfiePrompt) {
  setTimeout(() => triggerSelfie(r.selfieIntent, r.selfiePrompt, msgId, r.characterImageUrl), selfieDelay());
            }
            return updated;
          });
        }
        // E04：免費用戶升級提示
        if (plan === "free") {
          setMessages(prev => {
            const aCount = prev.filter(m => m.role === "assistant").length;
            if (aCount === 5 || aCount === 10 || aCount === 20) {
              setShowUpgradeModal(true);
            }
            return prev;
          });
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ 網路錯誤，請重試" }]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // [DNA_PATCH_START] 搜尋邏輯
  const searchResults = searchQuery.trim()
    ? messages.reduce<number[]>((acc, msg, idx) => {
        if (msg.content.toLowerCase().includes(searchQuery.toLowerCase())) acc.push(idx);
        return acc;
      }, [])
    : [];

  const handleSearchNav = (dir: 1 | -1) => {
    if (searchResults.length === 0) return;
    const next = (searchIndex + dir + searchResults.length) % searchResults.length;
    setSearchIndex(next);
    const targetIdx = searchResults[next];
    messageRefs.current[targetIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setSearchQuery("");
    setSearchIndex(0);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchIndex(0);
  };
  // [DNA_PATCH_END]

  const saveToCharacterAlbum = async (url: string) => {
    if (!character || !session?.user?.email) return;
    await fetch("/api/user/save-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, imageUrl: url, characterId: character.id }),
    });
    alert("✅ 已存入角色相簿！");
  };

  if (!session) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm">請先登入</p>
    </main>
  );

  return (
    <>
      <main className="flex flex-col h-screen bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] overflow-hidden">
        <div className="h-12 flex-shrink-0" />

        {/* 頂部角色資訊列 */}
        <div className="relative flex-shrink-0 overflow-hidden border-b border-white/10" style={{ minHeight: 80 }}>
          {character?.image_url && (
            <>
              <img
                src={character.image_url}
                alt=""
                aria-hidden
                className="absolute right-0 top-0 h-full w-32 object-cover object-top"
                style={{ opacity: 0.18, filter: "blur(1px)" }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.95) 45%, rgba(0,0,0,0.3) 100%)" }} />
            </>
          )}
          {!character?.image_url && <div className="absolute inset-0 bg-black/20" />}
          <div className="relative flex items-center gap-3 px-4 py-3">
            <button onClick={() => router.push('/characters')} className="text-white/40 text-xs hover:text-white/70 transition-all flex-shrink-0">← 我的角色</button>
            {character && (
              <>
                <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#89f5a2]/30">
                  <img src={character.image_url} alt={character.name} className="w-full h-full object-cover object-top" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm truncate">{character.name}</p>
                  {character.description && <p className="text-white/35 text-[10px] mt-0.5 truncate">{character.description.slice(0, 25)}{character.description.length > 25 ? "..." : ""}</p>}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {character.description?.split("・").slice(0, 3).map((t: string, i: number) => (
                      <span key={i} className="text-[9px] bg-[#89f5a2]/10 border border-[#89f5a2]/20 text-[#89f5a2]/55 rounded-full px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              {isOverQuota
                ? <p className="text-yellow-300 text-[10px] font-bold">💎 {credits} 點</p>
                : <p className="text-white/30 text-[10px]">剩餘 {remainingQuota ?? "..."} 次</p>
              }
            </div>
            {/* [DNA_PATCH_START] 搜尋按鈕 */}
            <button
              onClick={handleSearchOpen}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
            >
              <span className="text-sm">🔍</span>
            </button>
            {/* [DNA_PATCH_END] */}
          </div>
        </div>

        {/* [DNA_PATCH_START] 搜尋列 */}
        {searchOpen && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[#0a1d12]/95 border-b border-white/10">
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchIndex(0); }}
              placeholder="搜尋對話內容..."
              className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/25 focus:outline-none focus:border-[#89f5a2]/40"
            />
            {searchQuery.trim() && (
              <span className="text-white/30 text-[10px] flex-shrink-0 whitespace-nowrap">
                {searchResults.length > 0 ? `第 ${searchIndex + 1} / ${searchResults.length} 筆` : "無結果"}
              </span>
            )}
            <button
              onClick={() => handleSearchNav(-1)}
              disabled={searchResults.length === 0}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all"
            >↑</button>
            <button
              onClick={() => handleSearchNav(1)}
              disabled={searchResults.length === 0}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all"
            >↓</button>
            <button
              onClick={handleSearchClose}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs flex items-center justify-center hover:bg-white/10 transition-all"
            >✕</button>
          </div>
        )}
        {/* [DNA_PATCH_END] */}
        <div className="text-center py-1 border-b border-white/5 flex-shrink-0">
          <p className="text-white/20 text-[10px]">支援曖昧互動，明確露骨內容由 AI 自動過濾
<span
  title="由 Anthropic 開發的輕量級 AI 模型，反應快速"
  className="ml-2 cursor-help border-b border-dotted border-current opacity-60 hover:opacity-100 transition-opacity"
>
  · 🤖 Claude Haiku
</span></p>
        </div>
{showNotice && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 px-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#0d2318] border border-[#89f5a2]/25 rounded-3xl p-6 space-y-4 shadow-2xl">
              <p className="text-white font-black text-base">💬 聊天室說明</p>
              <p className="text-white/40 text-xs leading-relaxed">角色由 AI 扮演，可以自由聊天、曖昧互動、情感陪伴。</p>
              <p className="text-[#89f5a2]/50 text-xs">🔓 聊越多解鎖越多，50則起角色會說出隱藏內容</p>
              <div className="space-y-2">
                <p className="text-[#89f5a2]/70 text-xs font-bold">✅ 可以聊</p>
                <div className="space-y-1 pl-2">
                  <p className="text-white/40 text-xs">• 暖昧、挑逗語氣</p>
                  <p className="text-white/40 text-xs">• 情感親密對話</p>
                  <p className="text-white/40 text-xs">• 輕度性暗示</p>
                </div>
                <p className="text-red-400/70 text-xs font-bold mt-2">🚫 AI 會自動過濾</p>
                <div className="space-y-1 pl-2">
                  <p className="text-white/40 text-xs">• 明確的性行為描述</p>
                  <p className="text-white/40 text-xs">• 未成年相關任何內容</p>
                  <p className="text-white/40 text-xs">• 極端暴力細節</p>
                </div>
              </div>
              <p className="text-white/20 text-[10px]">此提示每日顯示一次</p>
              <button
                onClick={() => {
                  const today = new Date().toLocaleDateString("en-CA");
                  localStorage.setItem(`chat_notice_seen_${today}`, "1");
                  setShowNotice(false);
                }}
                className="w-full py-3 bg-[#89f5a2]/15 border border-[#89f5a2]/30 text-[#89f5a2] rounded-xl text-sm font-black hover:bg-[#89f5a2]/25 transition-all"
              >
                了解，開始聊天 →
              </button>
            </div>
          </div>
        )}
        {isOverQuota && (
          <div className="flex-shrink-0 px-4 py-2 bg-yellow-400/10 border-b border-yellow-400/20">
            <p className="text-yellow-300 text-xs text-center font-bold">⚠️ 免費次數已用完，每次對話扣 1 點</p>
          </div>
        )}

        {/* 訊息區 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-black">
          {messages.length === 0 && character && (
            <div className="text-center py-8 space-y-3">
              <img src={character.image_url} alt={character.name} className="w-20 h-20 rounded-full object-cover border-2 border-[#89f5a2]/30 mx-auto" />
              <p className="text-white/60 text-sm font-bold">{character.name}</p>
              <p className="text-white/30 text-xs">{character.description || "開始和我聊天吧！"}</p>
              <p className="text-white/20 text-xs mt-4">輸入訊息開始對話 ↓</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isSearchHit = searchResults.includes(idx);
            const isCurrentHit = searchResults[searchIndex] === idx;
            return (
            <div
              key={idx}
              ref={el => { messageRefs.current[idx] = el; }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} ${isCurrentHit ? "rounded-2xl ring-2 ring-[#89f5a2]/50" : isSearchHit ? "rounded-2xl ring-1 ring-[#89f5a2]/20" : ""}`}
            >
              {msg.role === "assistant" && character && (
                <img src={character.image_url} alt={character.name} className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0 self-end" />
              )}
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-[#89f5a2]/20 border border-[#89f5a2]/30 flex items-center justify-center flex-shrink-0 self-end">
                  <span className="text-xs">🧑</span>
                </div>
              )}
              <div className={`max-w-[75%] space-y-1 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.role === "assistant" && msg.isUnlock && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1, height: "0.5px", background: "rgba(255,255,255,0.15)" }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>🔓 親密度解鎖</span>
                    <div style={{ flex: 1, height: "0.5px", background: "rgba(255,255,255,0.15)" }} />
                  </div>
                )}
                {msg.role === "assistant" && msg.isUnlock && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                    {(msg.unlockLevel === "unlock_secret" || msg.unlockLevel === "unlock_confess") && (
                      <span style={{ fontSize: 11, color: "#B87333", background: "#FFF3DC", border: "0.5px solid #E8C570", borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>✨ 解鎖新的一面</span>
                    )}
                    {msg.unlockLevel === "unlock_mood" && (
                      <span style={{ fontSize: 11, color: "#534AB7", background: "#EEEDFE", border: "0.5px solid #AFA9EC", borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>🔓 親密度提升</span>
                    )}
                    {(msg.unlockLevel === "unlock_past" || msg.unlockLevel === "unlock_confess") && (
                      <span style={{ fontSize: 11, color: "#0C447C", background: "#E6F1FB", border: "0.5px solid #85B7EB", borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>💌 限你專屬</span>
                    )}
                  </div>
                )}
                {msg.role === "assistant" && msg.characterName && (
                  <p className="text-white/30 text-[10px] px-1">{msg.characterName}</p>
                )}
                <div className={`px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#89f5a2]/15 border border-[#89f5a2]/25 text-white rounded-2xl rounded-br-sm"
                    : msg.isUnlock && msg.unlockLevel === "unlock_secret"
                      ? "bg-[#FFFBF0]/10 border-[1.5px] border-[#E8C570]/60 text-white/85 rounded-2xl rounded-bl-sm"
                      : msg.isUnlock && msg.unlockLevel === "unlock_mood"
                        ? "bg-[#EEEDFE]/10 border-[1.5px] border-[#AFA9EC]/60 text-white/85 rounded-2xl rounded-bl-sm"
                        : msg.isUnlock && msg.unlockLevel === "unlock_past"
                          ? "bg-black/30 border-white/10 border border-l-[3px] border-l-[#378ADD]/70 text-white/85 rounded-r-2xl rounded-bl-sm"
                          : msg.isUnlock && msg.unlockLevel === "unlock_confess"
                            ? "bg-[#FFFBF0]/10 border-[#E8C570]/60 border border-l-[3px] border-l-[#378ADD]/70 text-white/85 rounded-r-2xl rounded-bl-sm"
                            : "bg-black/30 border border-white/10 text-white/85 rounded-2xl rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>

                {msg.selfieLoading && (
                  <div className="px-4 py-2 rounded-2xl bg-black/20 border border-[#89f5a2]/15 text-[#89f5a2]/60 text-xs">
                    {msg.selfieType === "photo" ? "📸 生成中，扣1點..." : "🎬 影片生成中，扣4-6點..\n請耐心等候，不要關閉視窗！"}
                  </div>
                )}

                {msg.imageUrl && (
                <div className="space-y-2">
                  <img src={msg.imageUrl} alt="AI自拍" className="rounded-2xl max-w-[220px] border border-white/15" />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => saveToCharacterAlbum(msg.imageUrl!)}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#89f5a2]/10 border border-[#89f5a2]/30 text-[#89f5a2] hover:bg-[#89f5a2]/20 transition-all"
                    >
                      ⭐ 存入角色相簿
                    </button>
                    <a href={msg.imageUrl} download className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/15 text-white/50 hover:bg-white/10 transition-all">
                      ⬇ 儲存
                    </a>
                  </div>
                </div>
              )}

              {msg.videoUrl && (
                <div className="space-y-2">
                  <video src={msg.videoUrl} controls autoPlay loop className="rounded-2xl max-w-[220px] border border-white/15" />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => saveToCharacterAlbum(msg.videoUrl!)}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#89f5a2]/10 border border-[#89f5a2]/30 text-[#89f5a2] hover:bg-[#89f5a2]/20 transition-all"
                    >
                      ⭐ 存入角色相簿
                    </button>
                    <a href={msg.videoUrl} download className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/15 text-white/50 hover:bg-white/10 transition-all">
                      ⬇ 儲存
                    </a>
                  </div>
                </div>
              )}

              {msg.mediaUrl && (
                <div className="space-y-2">
                  <img src={msg.mediaUrl} alt="用戶上傳" className="rounded-2xl max-w-[220px] border border-white/15" />
                </div>
              )}

                {msg.role === "assistant" && !msg.selfieLoading && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setReplyTo({ characterName: msg.characterName || character?.name || "角色", content: msg.content })}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/15 text-white/40 hover:bg-white/10 hover:text-white/70 transition-all"
                    >
                      ↩ 回覆
                    </button>
                    <button
                      onClick={() => {
                        setAvatarVoiceId(character?.voice_id || "female-2");
                        setAvatarVideoUrl("");
                        setAvatarStatus("");
                        setVideoModal({
                          content: msg.content,
                          characterId,
                          characterImage: character?.image_url || "",
                          characterVoiceId: character?.voice_id || "female-2",
                        });
                      }}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/25 text-purple-300/70 hover:bg-purple-500/20 hover:text-purple-300 transition-all"
                    >
                      🎬 轉成影片
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
          })}

          {loading && (
            <div className="flex gap-3">
              {character && <img src={character.image_url} alt={character.name} className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0 self-end" />}
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-black/30 border border-white/10">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 輸入列 */}
        <div className="flex-shrink-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#0d2318]/90 backdrop-blur-md border-t border-white/10">
          <div className="flex gap-2 items-end">
          <label className="flex-shrink-0 w-11 h-11 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
            <span className="text-base">📎</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !session?.user?.email) return;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('email', session.user.email);
                try {
                  const res = await fetch('/api/upload-chat-image', {
                    method: 'POST',
                    body: formData,
                  });
                  const data = await res.json();
                  if (data.url) {
                    setMessages(prev => [...prev, {
                      role: 'user',
                      content: '（傳送了一張圖片）',
                      mediaUrl: data.url,
                    }]);
                    // 帶圖片繼續對話
                    await fetch("/api/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userEmail: session.user.email,
                        characterId,
                        sessionId,
                        message: "（用戶傳了一張圖片）",
                        imageUrl: data.url,
                      }),
                    }).then(r => r.json()).then(async data => {
                      if (data.sessionId) {
            setSessionId(data.sessionId);
            if (session?.user?.email && characterId) {
              localStorage.setItem(`chat_session_${session.user.email}_${characterId}`, data.sessionId);
            }
          }
                      if (Array.isArray(data.responses)) {
                        for (const r of data.responses) {
                          await new Promise(resolve => setTimeout(resolve, randomDelay()));
                          setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: r.content,
                            characterName: r.characterName,
                          }]);
                        }
                      }
                    });
                  }
                } catch (err) { console.error('auto message failed:', err); }
                e.target.value = '';
              }}
            />
          </label>
          {/* 推薦台詞按鈕 */}
          <button
            onClick={handleSuggest}
            title="推薦話題"
            className="flex-shrink-0 w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-lg hover:bg-purple-500/25 transition-all flex items-center justify-center"
          >
            💬
          </button>
          {/* 風格切換按鈕 */}
<button
  onClick={() => setShowStylePanel(p => !p)}
  title="切換說話風格"
  className={`flex-shrink-0 w-11 h-11 rounded-2xl text-lg transition-all flex items-center justify-center ${showStylePanel || chatStyle !== "療癒" || writingStyle !== "直白" ? "bg-[#89f5a2]/15 border border-[#89f5a2]/60 text-[#89f5a2]" : "bg-white/5 border border-white/10 text-white/40 hover:border-white/25"}`}
>
  🎨
</button>

          {replyTo && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-[#89f5a2]/60 text-[10px] font-bold mb-0.5">↩ 回覆 {replyTo.characterName}</p>
                <p className="text-white/30 text-[10px] truncate">{replyTo.content.slice(0, 40)}{replyTo.content.length > 40 ? "..." : ""}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/20 hover:text-white/50 text-xs flex-shrink-0">✕</button>
            </div>
          )}
          <textarea
            value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`跟 ${character?.name || "角色"} 說點什麼...`}
              rows={2}
              className="flex-1 px-4 py-3 bg-black border border-white/10 rounded-2xl text-white placeholder-white/20 text-base resize-none focus:outline-none focus:border-[#89f5a2]/40 leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] font-black text-lg hover:bg-[#89f5a2]/30 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              ↑
            </button>
          </div>
          {showSuggest && (
            <div className="mt-2 bg-[#0d2318]/90 border border-purple-500/25 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-purple-300/60 text-[10px] font-bold">💬 推薦話題</p>
                <button onClick={() => setShowSuggest(false)} className="text-white/20 text-xs hover:text-white/50">✕</button>
              </div>
              {suggestLoading && (
                <p className="text-white/30 text-xs text-center py-2">生成中...</p>
              )}
              {!suggestLoading && suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); setShowSuggest(false); }}
                  className="w-full text-left px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-white/70 text-xs hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-white/90 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {showStylePanel && (
            <div className="mt-2 bg-[#0a1e12] border border-[#89f5a2]/15 rounded-2xl p-3">
              <div className="bg-[#0d2318] border border-[#89f5a2]/10 rounded-xl p-3 mb-3">
                <p className="text-[#89f5a2]/50 text-[10px] tracking-widest mb-2">角色設定</p>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <span className="text-white/30 text-[11px] w-8 shrink-0">名稱</span>
                    <span className="text-white/80 text-[11px]">{character?.name || "—"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-white/30 text-[11px] w-8 shrink-0">個性</span>
                    <span className="text-white/80 text-[11px]">{character?.description || "—"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-white/30 text-[11px] w-8 shrink-0">聲線</span>
                    <span className="text-white/80 text-[11px]">{VOICE_OPTIONS.find(v => v.id === (character?.voice_id || "female-2"))?.label || "—"}</span>
                  </div>
                </div>
              </div>
              <p className="text-white/30 text-[10px] mb-2">選擇口吻與文風</p>
              <div className="flex gap-2 flex-wrap items-center">
                {["療癒", "毒舌", "刺激"].map(s => (
                  <button key={s} onClick={() => setChatStyle(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chatStyle === s ? "bg-[#89f5a2] text-[#0d2318]" : "bg-white/5 border border-white/15 text-white/50 hover:border-white/30"}`}>
                    {s}
                  </button>
                ))}
                <div className="w-px h-5 bg-white/15 mx-1" />
                {["直白", "文藝", "輕小說"].map(s => (
                  <button key={s} onClick={() => setWritingStyle(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${writingStyle === s ? "bg-[#89f5a2] text-[#0d2318]" : "bg-white/5 border border-white/15 text-white/50 hover:border-white/30"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-white/15 text-[10px]">Enter 送出・Shift+Enter 換行</p>
          {isOverQuota && <p className="text-yellow-400/50 text-[10px]">次數用完，每次 -1 點</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!confirm("清除記憶後對話將從頭開始，確定嗎？")) return;
                  if (session?.user?.email && characterId) {
                    localStorage.removeItem(`chat_session_${session.user.email}_${characterId}`);
                  }
                  setSessionId(null);
                  setMessages([]);
                }}
                className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all"
              >
                🗑️ 清除記憶
              </button>
              <button onClick={() => router.push('/characters')} className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all">
                離開聊天室
              </button>
            </div>
          </div>
        </div>
      </main>
{/* E04 升級提示 Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center pb-8 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0d2318] border border-[#89f5a2]/25 rounded-3xl p-6 space-y-4 shadow-2xl">
            {character?.image_url && (
              <img src={character.image_url} alt={character.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#89f5a2]/40 mx-auto" />
            )}
            <div className="text-center space-y-1">
              <p className="text-white font-black text-base">{character?.name} 好像更喜歡你了...</p>
              <p className="text-white/40 text-xs">你們已聊了 {messages.filter(m => m.role === "assistant").length} 則，解鎖更多功能繼續深入互動</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                <span className="text-sm">📸</span>
                <p className="text-white/60 text-xs">AI 自拍・角色傳圖給你</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                <span className="text-sm">🎬</span>
                <p className="text-white/60 text-xs">說話影片・讓角色開口說話</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                <span className="text-sm">💬</span>
                <p className="text-white/60 text-xs">無限對話・不受次數限制</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full py-3 bg-[#89f5a2] text-[#0d2318] rounded-2xl text-sm font-black hover:opacity-90 transition-all"
            >
              🚀 立即升級，繼續聊
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full py-2 text-white/25 text-xs hover:text-white/50 transition-all"
            >
              先不了，繼續聊
            </button>
          </div>
        </div>
      )}
      {/* 轉成影片 Modal */}
      {videoModal !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0f2318] border border-[#89f5a2]/25 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="text-white font-black text-base">🎬 生成說話影片</p>
            {(() => {
              const textLen = videoModal.content.replace(/[^\u4e00-\u9fff]/g, "").length;
              const isTooLong = textLen > 55;
              return (
                <>
                  <p className="text-white/40 text-xs leading-relaxed bg-black/20 rounded-xl p-3 line-clamp-3">{videoModal.content}</p>
                  {isTooLong && (
                    <p className="text-yellow-400 text-[10px] font-bold">⚠️ 文字過長（{textLen} 字），TTS 將自動截斷至約 55 字</p>
                  )}
                </>
              );
            })()}
            <div className="space-y-1.5">
              <p className="text-white/40 text-xs">🎙️ 聲音</p>
              <select
                value={avatarVoiceId}
                onChange={e => setAvatarVoiceId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#89f5a2]/40 appearance-none"
              >
                {VOICE_OPTIONS.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#0f2318]">{v.label}</option>
                ))}
              </select>
            </div>
            {avatarStatus && (
              <p className="text-[#89f5a2]/60 text-xs text-center">{avatarStatus}</p>
            )}
            {avatarVideoUrl && (
              <div className="space-y-2">
                <video src={avatarVideoUrl} controls autoPlay loop className="w-full rounded-xl border border-white/10" />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveToCharacterAlbum(avatarVideoUrl)}
                    className="flex-1 py-2 bg-[#89f5a2]/10 border border-[#89f5a2]/25 text-[#89f5a2] rounded-xl text-xs font-bold hover:bg-[#89f5a2]/20 transition-all"
                  >
                    ⭐ 存入相簿
                  </button>
                  <a href={avatarVideoUrl} download className="flex-1 py-2 bg-white/5 border border-white/10 text-white/50 rounded-xl text-xs font-bold hover:bg-white/10 transition-all text-center">
                    ⬇ 下載
                  </a>
                </div>
              </div>
            )}
            {!avatarVideoUrl && (
              <button
                disabled={!!avatarStatus}
                onClick={async () => {
                  if (!videoModal || !session?.user?.email) return;
                  setAvatarStatus("🎙️ 生成語音中...");
                  try {
                    const ttsRes = await fetch("/api/tts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: videoModal.content, voiceId: avatarVoiceId, videoDuration: 10 }),
                    });
                    const ttsData = await ttsRes.json();
                    if (!ttsData.audio) throw new Error(ttsData.error || "TTS 失敗");
                    setAvatarStatus("🎬 合成說話影片中...");
                    const avatarRes = await fetch("/api/kling-avatar", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        imageUrl: videoModal.characterImage,
                        audioBase64: ttsData.audio,
                        prompt: "natural talking",
                        mode: "std",
                        userEmail: session.user.email,
                        plan,
                      }),
                    });
                    const avatarData = await avatarRes.json();
                    if (!avatarData.id) throw new Error(avatarData.error || "生成失敗");
                    setAvatarStatus("⏳ 生成中，請稍候...");
                    for (let i = 0; i < 60; i++) {
                      await new Promise(r => setTimeout(r, 5000));
                      const poll = await fetch(`/api/kling-avatar?id=${avatarData.id}`);
                      const pollData = await poll.json();
                      if (pollData.status === "succeeded") {
                        const url = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
                        setAvatarVideoUrl(url);
                        setAvatarStatus("");
                        fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => { if (d.credits !== undefined) setCredits(d.credits); });
                        return;
                      }
                      if (pollData.status === "failed") throw new Error("影片生成失敗");
                    }
                    throw new Error("生成逾時");
                  } catch (err: any) {
                    setAvatarStatus(`❌ ${err.message}`);
                  }
                }}
                className="w-full py-3 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-xl text-sm font-black hover:bg-purple-500/30 disabled:opacity-40 transition-all"
              >
                {avatarStatus ? "生成中..." : "🎬 開始生成說話影片"}
              </button>
            )}
            <button
              onClick={() => { setVideoModal(null); setAvatarStatus(""); setAvatarVideoUrl(""); }}
              className="w-full py-2 text-white/25 text-xs hover:text-white/50 transition-all"
            >
              {avatarVideoUrl ? "關閉" : "取消"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
// [DNA_PATCH_END]