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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [planLoaded, setPlanLoaded] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isOverQuota, setIsOverQuota] = useState(false);
  const [started, setStarted] = useState(false);
  const [videoModal, setVideoModal] = useState<VideoModal | null>(null);
const [albumModal, setAlbumModal] = useState<{ url: string } | null>(null);
const [avatarStatus, setAvatarStatus] = useState("");
const [avatarVideoUrl, setAvatarVideoUrl] = useState("");
const [avatarVoiceId, setAvatarVoiceId] = useState("female-2");

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserMessageTime = useRef<number>(Date.now());

  const maxChars = GROUP_LIMITS[plan] || 0;
  const randomDelay = () => Math.floor(Math.random() * 3000) + 2000;
  const selfieDelay = () => Math.floor(Math.random() * 150000) + 30000; // 群組：30秒~3分鐘

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
        if (!session?.user?.email || loading) return;
        // 隨機選一個角色主動發話
        const randomCharId = selectedIds[Math.floor(Math.random() * selectedIds.length)];
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: session.user.email,
              characters: [randomCharId],
              sessionId,
              message: "（系統：請主動發話）",
              isAutoMessage: true,
            }),
          });
          const data = await res.json();
          if (data.responses && Array.isArray(data.responses)) {
            for (const r of data.responses) {
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
        } catch { /* 靜默失敗 */ }
        // 發完再重設 timer
        startTimer();
      }, 60000);
    };
    startTimer();
    return () => { if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current); };
  }, [started, selectedIds, session, sessionId, loading]);

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
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, selfieLoading: false, imageUrl } : m
      ));
      setCredits(prev => prev !== null ? prev - photoCost : prev);
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

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, selfieLoading: false, videoUrl: videoUrl || undefined } : m
      ));
      setCredits(prev => prev !== null ? prev - photoCost - videoCost : prev);

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, selfieLoading: false } : m
      ));
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
    const selfieQueue: { intent: "photo" | "video"; prompt: string; msgId: string; charImgUrl?: string }[] = [];
    // 用戶發話，重置 timer
    lastUserMessageTime.current = Date.now();
    if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current);
    if (!overrideMessage) setInput("");
    setLoading(true);

    if (!imageUrl) {
      setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          characters: selectedIds,
          sessionId,
          message: userMsg,
          imageUrl: imageUrl || undefined,
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

      setLoading(false);

      if (Array.isArray(data.responses)) {
        for (const r of data.responses) {
          await new Promise(resolve => setTimeout(resolve, randomDelay()));
          const char = characters.find(c => c.id === r.characterId);
          setMessages(prev => {
            const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const newMsg: Message = {
            id: msgId,
            role: "assistant",
            content: r.content,
            characterName: r.characterName,
            characterImage: char?.image_url,
            characterId: r.characterId,
          };
          const updated = [...prev, newMsg];
          if ((r.selfieIntent === "photo" || r.selfieIntent === "video") && r.selfiePrompt) {
            selfieQueue.push({
              intent: r.selfieIntent as "photo" | "video",
              prompt: r.selfiePrompt as string,
              msgId,
              charImgUrl: r.characterImageUrl as string | undefined,
            });
          }
          return updated;
        });
      }

      // 群組自拍：從有意圖的角色中隨機選一個，延遲30秒到3分鐘
      if (selfieQueue.length > 0) {
        const chosen = selfieQueue[Math.floor(Math.random() * selfieQueue.length)];
        const delay = Math.floor(Math.random() * (180000 - 30000)) + 30000;
        setTimeout(() => {
          triggerSelfie(chosen.intent, chosen.prompt, chosen.msgId, chosen.charImgUrl);
        }, delay);
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
        <button disabled={selectedIds.length < 2} onClick={() => setStarted(true)}
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
          <div className="flex-shrink-0">
            {isOverQuota
              ? <p className="text-yellow-300 text-[10px] font-bold">💎 {credits} 點</p>
              : <p className="text-white/30 text-[10px]">剩餘 {remainingQuota ?? "..."} 次</p>
            }
          </div>
        </div>

        {isOverQuota && (
          <div className="flex-shrink-0 px-4 py-2 bg-yellow-400/10 border-b border-yellow-400/20">
            <p className="text-yellow-300 text-xs text-center font-bold">⚠️ 免費次數已用完，每個角色回覆扣 1 點</p>
          </div>
        )}

        {/* 訊息區 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "assistant" && msg.characterImage && (
                <img src={msg.characterImage} alt={msg.characterName} className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0 self-end" />
              )}
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-[#89f5a2]/20 border border-[#89f5a2]/30 flex items-center justify-center flex-shrink-0 self-end">
                  <span className="text-xs">🧑</span>
                </div>
              )}
              <div className={`max-w-[75%] space-y-1 flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.role === "assistant" && msg.characterName && (
                  <p className="text-white/30 text-[10px] px-1">{msg.characterName}</p>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#89f5a2]/15 border border-[#89f5a2]/25 text-white rounded-br-sm"
                    : "bg-black/30 border border-white/10 text-white/85 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>

                {msg.selfieLoading && (
                  <div className="px-4 py-2 rounded-2xl bg-black/20 border border-[#89f5a2]/15 text-[#89f5a2]/60 text-xs">
                    {msg.selfieType === "photo" ? "📸 生成中，扣1點..." : "🎬 生成中，扣點..."}
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
                  <button
                    onClick={() => {
  const char = selectedChars.find(c => c.id === (msg.characterId || selectedIds[0]));
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
                )}
              </div>
            </div>
          ))}

          {loading && (
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
                  } catch { /* 靜默失敗 */ }
                  e.target.value = '';
                }}
              />
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="跟大家說點什麼..."
              rows={2}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-[#89f5a2]/40 leading-relaxed"
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] font-black text-lg hover:bg-[#89f5a2]/30 disabled:opacity-30 transition-all flex items-center justify-center">
              ↑
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-white/15 text-[10px]">Enter 送出・Shift+Enter 換行</p>
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

      {/* 轉成影片 Modal */}
      {videoModal !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0f2318] border border-[#89f5a2]/25 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="text-white font-black text-base">🎬 生成說話影片</p>
            <p className="text-white/40 text-xs leading-relaxed bg-black/20 rounded-xl p-3 line-clamp-3">{videoModal.content}</p>

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
                    setCredits(prev => prev !== null ? prev - avatarData.creditCost : prev);

                    // Step 3: Polling
                    for (let i = 0; i < 60; i++) {
                      await new Promise(r => setTimeout(r, 5000));
                      const poll = await fetch(`/api/kling-avatar?id=${avatarData.id}`);
                      const pollData = await poll.json();
                      if (pollData.status === "succeeded") {
                        const url = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
                        setAvatarVideoUrl(url);
                        setAvatarStatus("");
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