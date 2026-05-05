// [DNA_PATCH_START] 單人聊天頁
"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  characterName?: string;
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

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const characterId = params?.characterId as string;

  const [character, setCharacter] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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

  const randomDelay = () => Math.floor(Math.random() * 3000) + 2000;

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
  const triggerSelfie = async (intent: "photo" | "video", selfiePrompt: string, targetIndex: number) => {
    const photoCost = 1;
    const videoCost = plan === 'pro' ? 4 : plan === 'standard' ? 5 : 6;

    setMessages(prev => prev.map((m, i) =>
      i === targetIndex ? { ...m, selfieLoading: true, selfieType: intent } : m
    ));

    try {
      // Step 1: 先生成照片
      const imgRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: selfiePrompt, gender: "", style: "", userEmail: session?.user?.email }),
      });
      const imgData = await imgRes.json();
      const imageUrl = Array.isArray(imgData.output) ? imgData.output[0] : imgData.output;

      if (!imageUrl) throw new Error("照片生成失敗");

      if (intent === "photo") {
        setMessages(prev => prev.map((m, i) =>
          i === targetIndex ? { ...m, selfieLoading: false, imageUrl } : m
        ));
        setCredits(prev => prev !== null ? prev - photoCost : prev);
        return;
      }

      // Step 2: 影片 — 先上傳照片到 Supabase，再丟給 Kling
      setMessages(prev => prev.map((m, i) =>
        i === targetIndex ? { ...m, selfieType: "video" } : m
      ));

      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, email: session?.user?.email }),
      });
      const uploadData = await uploadRes.json();
      const storedUrl = uploadData.url;
      if (!storedUrl) throw new Error("上傳失敗");

      // Step 3: Kling 生成影片（polling）
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

      // Step 4: Polling 等結果
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

      setMessages(prev => prev.map((m, i) =>
        i === targetIndex ? { ...m, selfieLoading: false, videoUrl: videoUrl || undefined } : m
      ));
      setCredits(prev => prev !== null ? prev - photoCost - videoCost : prev);

    } catch {
      setMessages(prev => prev.map((m, i) =>
        i === targetIndex ? { ...m, selfieLoading: false } : m
      ));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !session?.user?.email) return;
    if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current);
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session?.user?.email,
          characterId,
          sessionId,
          message: userMsg,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${data.error || "發生錯誤，請重試"}` }]);
        setLoading(false);
        return;
      }

      if (data.sessionId) setSessionId(data.sessionId);
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
          const newMsg: Message = {
            role: "assistant",
            content: r.content,
            characterName: r.characterName,
          };
          setMessages(prev => {
            const updated = [...prev, newMsg];
            if (r.selfieIntent && r.selfiePrompt) {
              const idx = updated.length - 1;
              setTimeout(() => triggerSelfie(r.selfieIntent, r.selfiePrompt, idx), randomDelay());
            }
            return updated;
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
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-[#0d2318]/90 backdrop-blur-md border-b border-white/10">
          <button onClick={() => router.push('/characters')} className="text-white/40 text-xs hover:text-white/70 transition-all flex-shrink-0">← 我的角色</button>
          {character && (
            <>
              <img src={character.image_url} alt={character.name} className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm truncate">{character.name}</p>
                {character.description && <p className="text-white/30 text-[10px] truncate">{character.description}</p>}
              </div>
            </>
          )}
          <div className="flex-shrink-0 text-right">
            {isOverQuota
              ? <p className="text-yellow-300 text-[10px] font-bold">💎 {credits} 點</p>
              : <p className="text-white/30 text-[10px]">剩餘 {remainingQuota ?? "..."} 次</p>
            }
          </div>
        </div>

        {isOverQuota && (
          <div className="flex-shrink-0 px-4 py-2 bg-yellow-400/10 border-b border-yellow-400/20">
            <p className="text-yellow-300 text-xs text-center font-bold">⚠️ 免費次數已用完，每次對話扣 1 點</p>
          </div>
        )}

        {/* 訊息區 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && character && (
            <div className="text-center py-8 space-y-3">
              <img src={character.image_url} alt={character.name} className="w-20 h-20 rounded-full object-cover border-2 border-[#89f5a2]/30 mx-auto" />
              <p className="text-white/60 text-sm font-bold">{character.name}</p>
              <p className="text-white/30 text-xs">{character.description || "開始和我聊天吧！"}</p>
              <p className="text-white/20 text-xs mt-4">輸入訊息開始對話 ↓</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "assistant" && character && (
                <img src={character.image_url} alt={character.name} className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0 self-end" />
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
                  <button
                    onClick={() => setVideoModal({
                      content: msg.content,
                      characterId,
                      characterImage: character?.image_url || "",
                      characterVoiceId: character?.voice_id || "female-2",
                    })}
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
        <div className="flex-shrink-0 px-4 py-3 bg-[#0d2318]/90 backdrop-blur-md border-t border-white/10">
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
                      if (data.sessionId) setSessionId(data.sessionId);
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
                } catch { /* 靜默失敗 */ }
                e.target.value = '';
              }}
            />
          </label>
          <textarea
            value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`跟 ${character?.name || "角色"} 說點什麼...`}
              rows={2}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-[#89f5a2]/40 leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] font-black text-lg hover:bg-[#89f5a2]/30 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              ↑
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-white/15 text-[10px]">Enter 送出・Shift+Enter 換行</p>
            <button onClick={() => router.push('/characters')} className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all">
              離開聊天室
            </button>
          </div>
        </div>
      </main>

      {/* 轉成影片 Modal */}
      {videoModal !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0f2318] border border-[#89f5a2]/25 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <p className="text-white font-black text-base">🎬 生成說話影片</p>
            <p className="text-white/40 text-xs leading-relaxed bg-black/20 rounded-xl p-3 line-clamp-3">{videoModal.content}</p>
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
                    setCredits(prev => prev !== null ? prev - avatarData.creditCost : prev);
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