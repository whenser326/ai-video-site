// [DNA_PATCH_START] 群組聊天頁
"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  characterName?: string;
  characterImage?: string;
  characterId?: string;
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

const GROUP_LIMITS: Record<string, number> = {
  free: 0,
  starter: 3,
  standard: 3,
  pro: 5,
};

export default function GroupChatPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [planLoaded, setPlanLoaded] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isOverQuota, setIsOverQuota] = useState(false);
  const [started, setStarted] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [videoModal, setVideoModal] = useState<VideoModal | null>(null);
const [albumModal, setAlbumModal] = useState<{ url: string } | null>(null);
const [avatarStatus, setAvatarStatus] = useState("");
const [avatarVideoUrl, setAvatarVideoUrl] = useState("");
const [avatarVoiceId, setAvatarVoiceId] = useState("female-2");

const VOICE_OPTIONS = [
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
];
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserMessageTime = useRef<number>(Date.now());
  // [DNA_PATCH_START] 搜尋功能 state
  const [showStylePanel, setShowStylePanel] = useState(false);
const [chatStyle, setChatStyle] = useState("療癒");
const [writingStyle, setWritingStyle] = useState("直白");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [replyTo, setReplyTo] = useState<{ characterName: string; content: string } | null>(null);
  const [tagMenu, setTagMenu] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [birthdayChecked, setBirthdayChecked] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // [DNA_PATCH_END]

  const maxChars = GROUP_LIMITS[plan] || 0;
  const handleSuggest = async () => {
    if (suggestLoading) return;
    setShowSuggest(true);
    setSuggestLoading(true);
    setSuggestions([]);
    const firstChar = selectedChars[0];
    try {
      const res = await fetch("/api/chat/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session?.user?.email,
          sessionId,
          characterName: firstChar?.name || "角色",
          characterDescription: firstChar?.description || "",
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
    } catch {
      setSuggestions(["你今天過得怎麼樣？", "有沒有什麼有趣的事想分享？", "我一直在想你說的話…"]);
    }
    setSuggestLoading(false);
  };
  const randomDelay = () => Math.floor(Math.random() * 3000) + 2000;
  const selfieDelay = () => Math.floor(Math.random() * 7000) + 3000; // 3~10秒

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/saved-characters?email=${session.user.email}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCharacters(data); });
    fetch(`/api/user/credits?email=${session.user.email}`)
      .then(r => r.json())
      .then(d => {
        if (d.credits !== undefined) setCredits(d.credits);
        if (d.plan !== undefined) setPlan(d.plan);
        setPlanLoaded(true);
      });
    // 從 localStorage 恢復群組 sessionId
    const savedSession = localStorage.getItem(`chat_session_group_${session.user.email}`);
    if (savedSession) setSessionId(savedSession);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
    const noticeSeen = localStorage.getItem(`chat_notice_seen_${today}`);
    if (!noticeSeen) setShowNotice(true);
  
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // 主動發話 timer
  useEffect(() => {
    if (!started || selectedIds.length === 0) return;
    const startTimer = () => {
      if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current);
      autoMessageTimerRef.current = setTimeout(async () => {
        if (!session?.user?.email || loading) { startTimer(); return; }
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: session.user.email,
              characters: selectedIds,
              sessionId,
              message: "（系統：請主動發話）",
              isAutoMessage: true,
            }),
          });
          const data = await res.json();
          if (data.responses && Array.isArray(data.responses)) {
            const shuffled = [...data.responses].sort(() => Math.random() - 0.5);
            const count = Math.floor(Math.random() * shuffled.length) + 1;
            const picked = shuffled.slice(0, count);
            for (const r of picked) {
              await new Promise(resolve => setTimeout(resolve, randomDelay()));
              const char = characters.find(c => c.id === r.characterId);
              setMessages(prev => [...prev, {
                role: "assistant",
                content: r.content,
                characterName: r.characterName,
                characterImage: char?.image_url,
                characterId: r.characterId,
              }]);
            }
          }
        } catch (err) { console.error('auto message failed:', err); }
        startTimer();
      }, 60000);
    };
    startTimer();
    return () => { if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current); };
  }, [started, selectedIds, session, sessionId, characters]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= maxChars) return prev;
      return [...prev, id];
    });
  };

  const selectedChars = characters.filter(c => selectedIds.includes(c.id));

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
    const charForMsg = selectedChars.find(c => c.image_url === charImageUrl) || selectedChars[0];
    const waitTimer = setInterval(() => {
      if (waitCount >= 3) { clearInterval(waitTimer); return; }
      const msg = waitingMessages[Math.floor(Math.random() * waitingMessages.length)];
      setMessages(prev => [...prev, {
        role: "assistant",
        content: msg,
        characterName: charForMsg?.name,
        characterImage: charForMsg?.image_url,
      }]);
      waitCount++;
    }, 60000);

    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, selfieLoading: true, selfieType: intent } : m
    ));

    try {
      // 用 flux-kontext-pro 鎖定角色臉孔
      const charRes = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: selfiePrompt,
          selfieCharacterImage: charImageUrl || null,
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
      // 上傳 Supabase 換永久 URL
      let permanentImageUrl = imageUrl;
      try {
        const upRes = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, email: session?.user?.email }),
        });
        const upData = await upRes.json();
        if (upData.url) permanentImageUrl = upData.url;
      } catch { /* fallback 用原始 URL */ }

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, selfieLoading: false, imageUrl: permanentImageUrl } : m
      ));
      fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => { if (d.credits !== undefined) setCredits(d.credits); });
      if (session?.user?.email && permanentImageUrl) {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: session.user.email,
            image_url: permanentImageUrl,
            video_url: null,
            prompt: "AI 自拍",
            character_id: null,
          }),
        }).catch(() => {});
      }
      return;
    }

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

      // 影片上傳 Supabase 換永久 URL
      let permanentVideoUrl = videoUrl;
      if (videoUrl) {
        try {
          const upRes = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: videoUrl, email: session?.user?.email }),
          });
          const upData = await upRes.json();
          if (upData.url) permanentVideoUrl = upData.url;
        } catch { /* fallback 用原始 URL */ }
      }

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, selfieLoading: false, videoUrl: permanentVideoUrl || undefined } : m
      ));
      fetch(`/api/user/credits?email=${session?.user?.email}`).then(r => r.json()).then(d => { if (d.credits !== undefined) setCredits(d.credits); });
      if (session?.user?.email && permanentVideoUrl) {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: session.user.email,
            image_url: null,
            video_url: permanentVideoUrl,
            prompt: "AI 自拍影片",
            character_id: null,
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

  const saveToCharacterAlbum = async (url: string, charId?: string) => {
    if (!session?.user?.email) return;
    await fetch("/api/user/save-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, imageUrl: url, characterId: charId || null }),
    });
    alert("✅ 已存入角色相簿！");
  };

  const handleSend = async (overrideMessage?: string, imageUrl?: string) => {
    const userMsg = overrideMessage || input.trim();
    if (!userMsg || loading || !session?.user?.email) return;
    // 用戶發話，重置 timer
    lastUserMessageTime.current = Date.now();
    if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current);
    if (!overrideMessage) setInput("");
    setReplyTo(null);
    setTagMenu(false);
    setLoading(true);

    if (!imageUrl) {
      setMessages(prev => [...prev, { role: "user", content: replyTo ? `↩ 回覆 ${replyTo.characterName}：${userMsg}` : userMsg }]);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  userEmail: session.user.email,
  characters: selectedIds,
  sessionId,
  message: replyTo ? `（回覆 ${replyTo.characterName}：「${replyTo.content.slice(0, 30)}...」）\n${userMsg}` : userMsg,
  imageUrl: imageUrl || undefined,
  chatStyle,
  writingStyle,
  taggedCharacter: (() => {
    for (const c of selectedChars) {
      if (userMsg.includes(`@${c.name}`)) return c.name;
    }
    return undefined;
  })(),
}),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${data.error || "發生錯誤"}` }]);
        setLoading(false);
        return;
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
        if (session?.user?.email) {
          localStorage.setItem(`chat_session_group_${session.user.email}`, data.sessionId);
        }
      }
      if (data.remainingQuota !== undefined) setRemainingQuota(data.remainingQuota);
      if (data.isOverQuota) {
        setIsOverQuota(true);
        fetch(`/api/user/credits?email=${session?.user?.email}`)
          .then(r => r.json())
          .then(d => { if (d.credits !== undefined) setCredits(d.credits); });
      }

      // ✅ 問題1修正：API 回來後立刻解鎖輸入，不等角色顯示完
      setLoading(false);

      if (Array.isArray(data.responses)) {
        // ✅ 問題2修正：隨機抽取部分角色發言（至少1人，最多3人或全部）
        const shuffled = [...data.responses].sort(() => Math.random() - 0.5);
        const maxResponders = Math.min(shuffled.length, 3);
        const count = Math.floor(Math.random() * maxResponders) + 1;
        const picked = shuffled.slice(0, count);

        // 不擋主流程，獨立跑顯示邏輯
        (async () => {
          const selfieQueue: { intent: "photo" | "video"; prompt: string; msgId: string; charImgUrl?: string }[] = [];
          for (const r of picked) {
            setIsTyping(true);
            await new Promise(resolve => setTimeout(resolve, randomDelay()));
            setIsTyping(false);
            const char = characters.find(c => c.id === r.characterId);
            const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            if ((r.selfieIntent === "photo" || r.selfieIntent === "video") && r.selfiePrompt) {
              selfieQueue.push({
                intent: r.selfieIntent as "photo" | "video",
                prompt: r.selfiePrompt as string,
                msgId,
                charImgUrl: r.characterImageUrl as string | undefined,
              });
            }
            setMessages(prev => {
              const newMsg: Message = {
                id: msgId,
                role: "assistant",
                content: r.content,
                characterName: r.characterName,
                characterImage: char?.image_url,
                characterId: r.characterId,
                isUnlock: r.isUnlock,
                unlockLevel: r.unlockLevel,
              };
              return [...prev, newMsg];
            });
          }
          // 群組自拍：先觸發第一個，3-10秒後隨機讓部分剩餘角色跟拍
          if (selfieQueue.length > 0) {
            // 隨機打亂順序
            const shuffled = [...selfieQueue].sort(() => Math.random() - 0.5);
            const first = shuffled[0];
            const rest = shuffled.slice(1);

            // 第一個立刻觸發
            setMessages(prev => {
              const alreadyGenerating = prev.some(m => m.selfieLoading === true);
              if (!alreadyGenerating) {
                triggerSelfie(first.intent, first.prompt, first.msgId, first.charImgUrl);
              }
              return prev;
            });

            // 剩餘角色：隨機決定幾個跟拍（1 到 rest.length，不強制全部）
            if (rest.length > 0) {
              const followCount = Math.floor(Math.random() * rest.length) + 1;
              const followers = rest.slice(0, followCount);
              followers.forEach((f, idx) => {
                const delay = Math.floor(Math.random() * 7000) + 3000 + idx * 1000;
                setTimeout(() => {
                  setMessages(prev => {
                    const alreadyGenerating = prev.some(m => m.selfieLoading === true);
                    if (!alreadyGenerating) {
                      triggerSelfie(f.intent, f.prompt, f.msgId, f.charImgUrl);
                    }
                    return prev;
                  });
                }, delay);
              });
            }
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
        })();
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

  if (!session) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm">請先登入</p>
    </main>
  );

  if (!planLoaded) return null;

  if (plan === "free") return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] px-4">
      <div className="text-center space-y-4">
        <p className="text-4xl">🔒</p>
        <p className="text-white font-black text-lg">群組聊天需要付費方案</p>
        <p className="text-white/40 text-sm">入門/標準：最多3個角色・專業：最多5個角色</p>
        <button onClick={() => router.push('/pricing#plans')} className="px-6 py-3 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] rounded-full font-black text-sm">💳 查看方案</button>
        <button onClick={() => router.push('/characters')} className="block mx-auto text-white/30 text-xs mt-2">← 返回</button>
      </div>
    </main>
  );

  if (!started) return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-6 pb-10 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-lg space-y-5">
        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => router.push('/characters')} className="text-white/40 text-xs hover:text-white/70 transition-all">← 返回</button>
          <p className="text-white font-black text-xl">🎭 群組聊天</p>
        </div>
        <p className="text-white/40 text-sm">選擇 2 至 {maxChars} 個角色開始群組對話</p>
        {selectedChars.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {selectedChars.map(c => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-full">
                <img src={c.image_url} className="w-5 h-5 rounded-full object-cover" />
                <span className="text-[#89f5a2] text-xs font-bold">{c.name}</span>
                <button onClick={() => toggleSelect(c.id)} className="text-white/30 text-xs hover:text-white/60">✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {characters.map(char => {
            const isSelected = selectedIds.includes(char.id);
            const isDisabled = !isSelected && selectedIds.length >= maxChars;
            return (
              <div key={char.id} onClick={() => !isDisabled && toggleSelect(char.id)}
                className={`relative bg-black/25 rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                  isSelected ? 'border-[#89f5a2]/50 shadow-[0_0_15px_rgba(137,245,162,0.15)]' :
                  isDisabled ? 'border-white/5 opacity-40 cursor-not-allowed' :
                  'border-white/10 hover:border-white/25'
                }`}
              >
                <div className="relative w-full aspect-square overflow-hidden">
                  <img src={char.image_url} alt={char.name} className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#89f5a2]/20 flex items-center justify-center">
                      <span className="text-3xl">✓</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-white font-black text-xs truncate">{char.name}</p>
                </div>
              </div>
            );
          })}
        </div>
        <button disabled={selectedIds.length < 2} onClick={async () => {
          setStarted(true);
          // E05：生日觸發（有角色後才能執行）
          if (!session?.user?.email || selectedIds.length === 0) return;
          const email = session.user.email;
          const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
          const birthdayKey = `birthday_msg_${email}_${today}`;
          if (localStorage.getItem(birthdayKey)) return;
          fetch(`/api/user/birthday?email=${email}`)
            .then(r => r.json())
            .then(async d => {
              const todayMMDD = today.slice(5);
              if (!d.birthday || d.birthday !== todayMMDD) return;
              await new Promise(r => setTimeout(r, 2000));

              // 查聊天最多的角色，fallback 隨機
              let mostChatCharId = selectedIds[Math.floor(Math.random() * selectedIds.length)];
              const savedSession = localStorage.getItem(`chat_session_group_${email}`);
              if (savedSession) {
                const countRes = await fetch(`/api/chat/most-active?sessionId=${savedSession}`);
                const countData = await countRes.json();
                if (countData.characterId && selectedIds.includes(countData.characterId)) {
                  mostChatCharId = countData.characterId;
                }
              }

              // 所有角色逐一送生日祝福，聊最多的角色附圖
              for (let i = 0; i < selectedIds.length; i++) {
                const res = await fetch("/api/chat/birthday", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userEmail: email,
                    characterId: selectedIds[i],
                    prompt: `今天是用戶的生日！用角色個性說出一段真摯的生日祝福，要有角色的個性特色，讓人感受到角色真的記得，1-2句話。`,
                    generateImage: selectedIds[i] === mostChatCharId,
                  }),
                });
                const data = await res.json();
                if (data.text) {
                  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  setMessages(prev => [...prev, {
                    id: msgId,
                    role: "assistant",
                    content: data.text,
                    characterName: data.characterName,
                    imageUrl: undefined,
                  }]);

                  // 前端輪詢生日圖片
                  if (data.predictionId) {
                    const predId = data.predictionId;
                    const charIdForPoll = selectedIds[i];
                    const poll = async () => {
                      const pollRes = await fetch(`/api/chat/birthday/poll?id=${predId}&characterId=${charIdForPoll}`);
                      const pollData = await pollRes.json();
                      if (pollData.status === "succeeded" && pollData.imageUrl) {
                        setMessages(prev => prev.map(m =>
                          m.id === msgId ? { ...m, imageUrl: pollData.imageUrl } : m
                        ));
                      } else if (pollData.status !== "failed") {
                        setTimeout(poll, 3000);
                      }
                    };
                    setTimeout(poll, 3000);
                  }
                }
                if (i < selectedIds.length - 1) {
                  await new Promise(r => setTimeout(r, 1500));
                }
              }
              localStorage.setItem(birthdayKey, "1");
            })
            .catch(() => {});
        }}
          className="w-full py-3 rounded-2xl bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] font-black text-sm hover:bg-[#89f5a2]/30 disabled:opacity-30 transition-all"
        >
          {selectedIds.length < 2 ? `還需選 ${2 - selectedIds.length} 個角色` : `🎭 開始群組聊天（${selectedIds.length} 個角色）`}
        </button>
      </div>
    </main>
  );

  return (
    <>
      <main className="flex flex-col h-screen bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] overflow-hidden">
        <div className="h-12 flex-shrink-0" />

        {/* 頂部 */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-[#0d2318]/90 backdrop-blur-md border-b border-white/10">
          <button onClick={() => setStarted(false)} className="text-white/40 text-xs hover:text-white/70 transition-all flex-shrink-0">← 換角色</button>
          <div className="flex-1 flex gap-1 overflow-hidden">
            {selectedChars.map(c => (
              <img key={c.id} src={c.image_url} alt={c.name} className="w-7 h-7 rounded-full object-cover border border-white/20 flex-shrink-0" />
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div>
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

        {isOverQuota && (
          <div className="flex-shrink-0 px-4 py-2 bg-yellow-400/10 border-b border-yellow-400/20">
            <p className="text-yellow-300 text-xs text-center font-bold">⚠️ 免費次數已用完，每個角色回覆扣 1 點</p>
          </div>
        )}

        {/* 訊息區 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-black">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-3">
              <div className="flex justify-center gap-2">
                {selectedChars.map(c => (
                  <img key={c.id} src={c.image_url} alt={c.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#89f5a2]/30" />
                ))}
              </div>
              <p className="text-white/40 text-sm">{selectedChars.map(c => c.name).join("、")} 已就位</p>
              <p className="text-white/20 text-xs">輸入訊息開始群組對話 ↓</p>
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
              {msg.role === "assistant" && msg.characterImage && (
                <img src={msg.characterImage} alt={msg.characterName} className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0 self-end" />
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
                  <div className="px-4 py-2 rounded-2xl bg-black/20 border border-[#89f5a2]/15 text-[#89f5a2]/60 text-xs whitespace-pre-line">
                    {msg.selfieType === "photo"
                      ? "📸 圖片生成上傳中，扣1點\n⚠️ 請勿關閉視窗！"
                      : "🎬 影片生成中，扣4-6點\n⚠️ 請耐心等候，請勿關閉視窗！"}
                  </div>
                )}

                {msg.imageUrl && (
                  <div className="space-y-2">
                    <img src={msg.imageUrl} alt="AI自拍" className="rounded-2xl max-w-[220px] border border-white/15" />
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setAlbumModal({ url: msg.imageUrl! })}
  className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#89f5a2]/10 border border-[#89f5a2]/30 text-[#89f5a2] hover:bg-[#89f5a2]/20 transition-all">
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
                      <button onClick={() => setAlbumModal({ url: msg.videoUrl! })}
  className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#89f5a2]/10 border border-[#89f5a2]/30 text-[#89f5a2] hover:bg-[#89f5a2]/20 transition-all">
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
                      onClick={() => setReplyTo({ characterName: msg.characterName || "角色", content: msg.content })}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/15 text-white/40 hover:bg-white/10 hover:text-white/70 transition-all"
                    >
                      ↩ 回覆
                    </button>
                    <button
                      onClick={() => {
  const char = selectedChars.find(c => c.id === (msg.characterId || selectedIds[0]));
  setAvatarVoiceId(char?.voice_id || "female-2");
  setAvatarVideoUrl("");
  setAvatarStatus("");
  setVideoModal({
    content: msg.content,
    characterId: msg.characterId || selectedIds[0],
    characterImage: char?.image_url || "",
    characterVoiceId: char?.voice_id || "female-2",
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

          {(loading || isTyping) && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 self-end">
                <span className="text-xs">💬</span>
              </div>
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
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-[#89f5a2]/60 text-[10px] font-bold mb-0.5">↩ 回覆 {replyTo.characterName}</p>
                <p className="text-white/30 text-[10px] truncate">{replyTo.content.slice(0, 40)}{replyTo.content.length > 40 ? "..." : ""}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/20 hover:text-white/50 text-xs flex-shrink-0">✕</button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <label className="flex-shrink-0 w-11 h-11 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
              <span className="text-base">📎</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !session?.user?.email) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('email', session.user.email);
                  try {
                    const res = await fetch('/api/upload-chat-image', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.url) {
                      setMessages(prev => [...prev, { role: 'user', content: '（傳送了一張圖片）', mediaUrl: data.url }]);
                      await handleSend("（用戶傳了一張圖片）", data.url);
                    }
                  } catch (err) { console.error('group action failed:', err); }
                  e.target.value = '';
                }}
              />
            </label>
            <button onClick={handleSuggest} title="推薦話題"
  className="flex-shrink-0 w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-lg hover:bg-purple-500/25 transition-all flex items-center justify-center">
  💬
</button>
<button
  onClick={() => setShowStylePanel(p => !p)}
  title="切換說話風格"
  className={`flex-shrink-0 w-11 h-11 rounded-2xl text-lg transition-all flex items-center justify-center ${showStylePanel || chatStyle !== "療癒" || writingStyle !== "直白" ? "bg-[#89f5a2]/15 border border-[#89f5a2]/60 text-[#89f5a2]" : "bg-white/5 border border-white/10 text-white/40 hover:border-white/25"}`}
>
  🎨
</button>

            {tagMenu && (
              <div className="mb-2 bg-[#0a1e12] border border-[#89f5a2]/20 rounded-xl p-2 flex gap-2 flex-wrap">
                <p className="w-full text-[#89f5a2]/50 text-[10px] mb-1">Tag 誰來回覆？</p>
                {selectedChars.map(c => (
                  <button key={c.id} onClick={() => {
                    setInput(prev => prev + `@${c.name} `);
                    setTagMenu(false);
                  }} className="px-3 py-1 bg-white/5 border border-white/15 rounded-full text-white/60 text-xs hover:border-[#89f5a2]/40 hover:text-[#89f5a2] transition-all">
                    {c.image_url && <img src={c.image_url} className="inline-block w-4 h-4 rounded-full mr-1 object-cover" />}
                    @{c.name}
                  </button>
                ))}
                <button onClick={() => setTagMenu(false)} className="ml-auto text-white/20 text-xs hover:text-white/50">✕</button>
              </div>
            )}
            <textarea
              value={input}
              onChange={e => {
                setInput(e.target.value);
                if (e.target.value.endsWith("@")) setTagMenu(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="跟大家說點什麼..."
              rows={2}
              className="flex-1 px-4 py-3 bg-black border border-white/10 rounded-2xl text-white placeholder-white/20 text-base resize-none focus:outline-none focus:border-[#89f5a2]/40 leading-relaxed"
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] font-black text-lg hover:bg-[#89f5a2]/30 disabled:opacity-30 transition-all flex items-center justify-center">
              ↑
            </button>
          </div>
          {showSuggest && (
            <div className="mt-2 bg-[#0d2318]/90 border border-purple-500/25 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-purple-300/60 text-[10px] font-bold">💬 推薦話題</p>
                <button onClick={() => setShowSuggest(false)} className="text-white/20 text-xs hover:text-white/50">✕</button>
              </div>
              {suggestLoading && <p className="text-white/30 text-xs text-center py-2">生成中...</p>}
              {!suggestLoading && suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); setShowSuggest(false); }}
                  className="w-full text-left px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-white/70 text-xs hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-white/90 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
          {showStylePanel && (
            <div className="mt-2 bg-[#0a1e12] border border-[#89f5a2]/15 rounded-2xl p-3">
              <div className="bg-[#0d2318] border border-[#89f5a2]/10 rounded-xl p-3 mb-3">
                <p className="text-[#89f5a2]/50 text-[10px] tracking-widest mb-2">參與角色</p>
                <div className="space-y-1.5">
                  {selectedChars.map(c => (
                    <div key={c.id} className="flex gap-2 items-center">
                      <img src={c.image_url} className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0" />
                      <span className="text-white/80 text-[11px] font-bold">{c.name}</span>
                      {c.description && <span className="text-white/35 text-[11px]">· {c.description}</span>}
                    </div>
                  ))}
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
            {isOverQuota && <p className="text-yellow-400/50 text-[10px]">次數用完，每則回覆扣 1 點</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!confirm("清除記憶後對話將從頭開始，確定嗎？")) return;
                  if (session?.user?.email) {
                    localStorage.removeItem(`chat_session_group_${session.user.email}`);
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
      {/* 聊天須知 每日提示框 */}
      {showNotice && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 px-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0d2318] border border-[#89f5a2]/25 rounded-3xl p-6 space-y-4 shadow-2xl">
            <p className="text-white font-black text-base">💬 聊天室說明</p>
            <p className="text-white/40 text-xs leading-relaxed">角色由 AI 扮演，可以自由聊天、曖昧互動、情感陪伴。</p>
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
{/* 存入相簿選角色 Modal */}
      {albumModal !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0f2318] border border-[#89f5a2]/25 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="text-white font-black text-base">⭐ 存入角色相簿</p>
            <p className="text-white/40 text-xs">選擇要存入哪個角色的相簿</p>
            <div className="space-y-2">
              {selectedChars.map(c => (
                <button
                  key={c.id}
                  onClick={async () => {
                    await saveToCharacterAlbum(albumModal.url, c.id);
                    setAlbumModal(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-[#89f5a2]/40 hover:bg-[#89f5a2]/10 transition-all"
                >
                  <img src={c.image_url} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                  <span className="text-white text-sm font-bold">{c.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAlbumModal(null)} className="w-full py-2 text-white/25 text-xs hover:text-white/50 transition-all">
              取消
            </button>
          </div>
        </div>
      )}
{/* E04 升級提示 Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center pb-8 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0d2318] border border-[#89f5a2]/25 rounded-3xl p-6 space-y-4 shadow-2xl">
            {selectedChars[0]?.image_url && (
              <img src={selectedChars[0].image_url} alt={selectedChars[0].name} className="w-16 h-16 rounded-full object-cover border-2 border-[#89f5a2]/40 mx-auto" />
            )}
            <div className="text-center space-y-1">
              <p className="text-white font-black text-base">她們好像更喜歡你了...</p>
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

            {/* 聲音選擇 */}
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

            {/* 進度狀態 */}
            {avatarStatus && (
              <p className="text-[#89f5a2]/60 text-xs text-center">{avatarStatus}</p>
            )}

            {/* 生成完成：播放影片 */}
            {avatarVideoUrl && (
              <div className="space-y-2">
                <video src={avatarVideoUrl} controls autoPlay loop className="w-full rounded-xl border border-white/10" />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveToCharacterAlbum(avatarVideoUrl, videoModal.characterId)}
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

            {/* 按鈕區 */}
            {!avatarVideoUrl && (
              <button
                disabled={!!avatarStatus}
                onClick={async () => {
                  if (!videoModal || !session?.user?.email) return;
                  setAvatarStatus("🎙️ 生成語音中...");
                  try {
                    // Step 1: TTS
                    const ttsRes = await fetch("/api/tts", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: videoModal.content, voiceId: avatarVoiceId, videoDuration: 10 }),
                    });
                    const ttsData = await ttsRes.json();
                    if (!ttsData.audio) throw new Error(ttsData.error || "TTS 失敗");

                    setAvatarStatus("🎬 合成說話影片中...");

                    // Step 2: Kling Avatar
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

                    // Step 3: Polling
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
              onClick={() => {
                setVideoModal(null);
                setAvatarStatus("");
                setAvatarVideoUrl("");
              }}
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