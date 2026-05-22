"use client";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  characterName?: string;
  mediaUrl?: string;
}

interface GalleryCharacter {
  id: string;
  name: string;
  age: number;
  personality_tags: string[];
  story: string;
  image_url: string | null;
  actual_chat_count: number;
}

export default function GalleryChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const galleryId = params?.id as string;

  const [character, setCharacter] = useState<GalleryCharacter | null>(null);
  const [charLoading, setCharLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [isOverQuota, setIsOverQuota] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [replyTo, setReplyTo] = useState<{ characterName: string; content: string } | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [chatStyle, setChatStyle] = useState("");
  const [writingStyle, setWritingStyle] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const autoMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const randomDelay = () => Math.floor(Math.random() * 3000) + 2000;

  // 讀取角色資料 + actual_chat_count +1
  useEffect(() => {
    if (!galleryId) return;
    setCharLoading(true);
    fetch(`/api/gallery?id=${galleryId}`)
      .then(r => r.json())
      .then(data => {
        if (data.item) {
          setCharacter(data.item);
          // actual_chat_count +1
          fetch(`/api/gallery/chat-count`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: galleryId }),
          }).catch(() => {});
        }
      })
      .finally(() => setCharLoading(false));
  }, [galleryId]);

  // 每日提示
  useEffect(() => {
    if (!session?.user?.email) return;
    const today = new Date().toLocaleDateString("en-CA");
    if (!localStorage.getItem(`chat_notice_seen_${today}`)) setShowNotice(true);
  }, [session]);

  // 讀 credits + sessionId
  useEffect(() => {
    if (!session?.user?.email || !galleryId) return;
    fetch(`/api/user/credits?email=${session.user.email}`)
      .then(r => r.json())
      .then(d => { if (d.remainingQuota !== undefined) setRemainingQuota(d.remainingQuota); });
    const saved = localStorage.getItem(`chat_session_gallery_${session.user.email}_${galleryId}`);
    if (saved) setSessionId(saved);
  }, [session, galleryId]);

  // 自動捲動
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 60秒自動發話
  useEffect(() => {
    if (!character || !session?.user?.email) return;
    const startTimer = () => {
      if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current);
      autoMessageTimerRef.current = setTimeout(async () => {
        if (loadingRef.current) { startTimer(); return; }
        try {
          const fakeChar = { id: galleryId, name: character.name, description: character.story, image_url: character.image_url };
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: session?.user?.email,
              characterId: galleryId,
              sessionId,
              message: "（系統：請主動發話）",
              isAutoMessage: true,
              defaultCharacter: fakeChar,
            }),
          });
          const data = await res.json();
          if (data.responses && Array.isArray(data.responses)) {
            for (const r of data.responses) {
              await new Promise(resolve => setTimeout(resolve, randomDelay()));
              setMessages(prev => [...prev, { role: "assistant", content: r.content, characterName: r.characterName }]);
            }
            if (data.sessionId) {
              setSessionId(data.sessionId);
              localStorage.setItem(`chat_session_gallery_${session?.user?.email}_${galleryId}`, data.sessionId);
            }
          }
        } catch { }
        startTimer();
      }, 60000);
    };
    startTimer();
    return () => { if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current); };
  }, [character, session, galleryId, sessionId]);

  const searchResults = searchQuery.trim()
    ? messages.reduce<number[]>((acc, msg, i) => {
        if (msg.content.includes(searchQuery.trim())) acc.push(i);
        return acc;
      }, [])
    : [];

  const handleSearchNav = (dir: 1 | -1) => {
    if (!searchResults.length) return;
    const next = (searchIndex + dir + searchResults.length) % searchResults.length;
    setSearchIndex(next);
    messageRefs.current[searchResults[next]]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSuggest = async () => {
    if (suggestLoading || !character) return;
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
          characterName: character.name,
          characterDescription: character.story,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
    } catch {
      setSuggestions(["你今天過得怎麼樣？", "有沒有什麼有趣的事想分享？", "我一直在想你說的話…"]);
    }
    setSuggestLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !session?.user?.email || !character) return;
    const userMsg = input.trim();
    setInput("");
    setReplyTo(null);
    setMessages(prev => [...prev, { role: "user", content: replyTo ? `↩ 回覆 ${replyTo.characterName}：${userMsg}` : userMsg }]);
    setLoading(true);
    loadingRef.current = true;
    setIsTyping(true);

    // 自拍關鍵字 → 提示付費
    const photoKeywords = ["拍照", "自拍", "拍張", "傳照片", "照片給我", "看看你", "看看妳", "拍一張", "傳圖"];
    const videoKeywords = ["錄影", "錄一段", "拍影片", "拍個影片", "拍段影片"];
    if (videoKeywords.some(k => userMsg.includes(k))) {
      await new Promise(r => setTimeout(r, randomDelay()));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `（${character.name} 想錄影片給你，但這個功能需要收藏角色後才能使用 🎬 收藏我之後就可以囉！）`,
        characterName: character.name,
      }]);
      setLoading(false);
      return;
    }
    if (photoKeywords.some(k => userMsg.includes(k))) {
      await new Promise(r => setTimeout(r, randomDelay()));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `（${character.name} 想傳照片給你，但這個功能需要收藏角色後才能使用 📸 收藏我之後就可以囉！）`,
        characterName: character.name,
      }]);
      setLoading(false);
      return;
    }

    try {
      const fakeChar = { id: galleryId, name: character.name, description: character.story, image_url: character.image_url };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          characterId: galleryId,
          sessionId,
          message: replyTo ? `（回覆 ${replyTo.characterName}：「${replyTo.content.slice(0, 30)}...」）\n${userMsg}` : userMsg,
          defaultCharacter: fakeChar,
          chatStyle,
          writingStyle,
        }),
      });
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(`chat_session_gallery_${session.user.email}_${galleryId}`, data.sessionId);
      }
      if (data.remainingQuota !== undefined) setRemainingQuota(data.remainingQuota);
      if (data.isOverQuota) setIsOverQuota(true);

      setLoading(false);
      loadingRef.current = false;

      if (data.responses && Array.isArray(data.responses)) {
        for (const r of data.responses) {
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, randomDelay()));
          setIsTyping(false);
          setMessages(prev => [...prev, { role: "assistant", content: r.content, characterName: r.characterName }]);
        }
      }
      setIsTyping(false);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "（連線失敗，請重試）", characterName: character.name }]);
      setLoading(false);
      loadingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!session) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm mb-4">請先登入才能開始聊天</p>
      <button onClick={() => signIn("google", {}, { prompt: "select_account" })} className="px-6 py-3 bg-[#89f5a2] text-[#0d2318] rounded-full font-black text-sm">🔑 Google 登入</button>
    </main>
  );

  if (charLoading) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm">載入角色中...</p>
    </main>
  );

  if (!character) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm">找不到角色</p>
    </main>
  );

  return (
    <main className="flex h-screen flex-col bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] overflow-hidden">
      {/* 頂部 */}
      <div className="relative flex-shrink-0 overflow-hidden border-b border-white/8" style={{ minHeight: 80 }}>
        {/* 角色圖：右側半透明背景 */}
        {character.image_url && (
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
        {/* 無圖時純黑底 */}
        {!character.image_url && <div className="absolute inset-0 bg-black/20" />}

        {/* 內容 */}
        <div className="relative flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.push('/')} className="text-white/40 hover:text-white/70 transition-all text-sm flex-shrink-0">←</button>
          <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden border-2 border-[#89f5a2]/30">
            {character.image_url
              ? <img src={character.image_url} alt={character.name} className="w-full h-full object-cover object-top" />
              : <div className="w-full h-full flex items-center justify-center text-2xl bg-white/8">🧑</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm truncate">{character.name}</p>
            <p className="text-white/35 text-[10px] mt-0.5">{character.age}歲・{character.personality_tags.slice(0, 2).join("・")}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {character.personality_tags.slice(0, 3).map((t: string) => (
                <span key={t} className="text-[9px] bg-[#89f5a2]/10 border border-[#89f5a2]/20 text-[#89f5a2]/55 rounded-full px-1.5 py-0.5">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => router.push(`/gallery/${galleryId}`)} className="text-white/30 hover:text-white/60 transition-all text-xs">詳情</button>
            <button onClick={() => { setSearchOpen(p => !p); setSearchQuery(""); setSearchIndex(0); }} className="text-white/30 hover:text-white/60 transition-all text-base">🔍</button>
            {remainingQuota !== null && (
              <span className="text-[10px] text-white/20">{remainingQuota} 次剩餘</span>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="px-4 py-2 bg-black/30 border-b border-white/8 flex items-center gap-2 flex-shrink-0">
          <input ref={searchInputRef} autoFocus value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchIndex(0); }}
            placeholder="搜尋對話..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white/80 text-xs placeholder-white/20 focus:outline-none focus:border-[#89f5a2]/40" />
          {searchResults.length > 0 && <span className="text-white/30 text-[10px] whitespace-nowrap">第 {searchIndex + 1} / {searchResults.length} 筆</span>}
          <button onClick={() => handleSearchNav(-1)} className="text-white/30 hover:text-white/60 text-sm">↑</button>
          <button onClick={() => handleSearchNav(1)} className="text-white/30 hover:text-white/60 text-sm">↓</button>
          <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="text-white/30 hover:text-white/60 text-sm">✕</button>
        </div>
      )}

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

      {/* 內容揭露小字 */}
      <div className="px-4 py-1.5 bg-black/15 border-b border-white/5 flex-shrink-0">
        <p className="text-[10px] text-white/20 text-center">💬 支援曖昧互動，明確露骨內容由 AI 自動過濾
          <span title="由 Anthropic 開發的輕量級 AI 模型，反應快速" className="ml-2 cursor-help border-b border-dotted border-current opacity-60 hover:opacity-100 transition-opacity">· 🤖 Claude Haiku</span>
        </p>
      </div>

      {/* 訊息區 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#0a0a0a]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-3 py-16">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
              {character.image_url
                ? <img src={character.image_url} alt={character.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-5xl">🧑</div>
              }
            </div>
            <p className="text-white/60 font-black text-base">{character.name}</p>
            <p className="text-white/30 text-xs">{character.age}歲・{character.personality_tags.join("・")}</p>
            <p className="text-white/20 text-xs mt-2">跟 {character.name} 打個招呼吧！</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} ref={el => { messageRefs.current[idx] = el; }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2 items-start`}
            style={searchResults.includes(idx) ? { outline: idx === searchResults[searchIndex] ? "2px solid #89f5a2" : "1px solid rgba(137,245,162,0.3)", borderRadius: 16 } : {}}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-white/8 border border-white/10 mt-1">
                {character.image_url
                  ? <img src={character.image_url} alt={character.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">🧑</div>
                }
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#89f5a2]/20 border border-[#89f5a2]/30 text-white"
                : "bg-black/30 border border-white/10 text-white/85"
            }`}>
              {msg.mediaUrl && (
                <img src={msg.mediaUrl} alt="uploaded" className="w-48 rounded-xl mb-2 object-cover" />
              )}
              {msg.content}
            </div>
            {msg.role === "assistant" && (
              <button
                onClick={() => setReplyTo({ characterName: msg.characterName || character.name, content: msg.content })}
                className="mt-1 px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-white/30 hover:bg-white/10 hover:text-white/60 transition-all self-start"
              >
                ↩ 回覆
              </button>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-white/8 border border-white/10 mt-1">
              {character.image_url
                ? <img src={character.image_url} alt={character.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl">🧑</div>
              }
            </div>
            <div className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 輸入列 */}
      <div className="px-4 py-3 border-t border-white/8 bg-black/20 flex-shrink-0">
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
                    const fakeChar = { id: galleryId, name: character.name, description: character.story, image_url: character.image_url };
                    await fetch("/api/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userEmail: session.user.email,
                        characterId: galleryId,
                        sessionId,
                        message: "（用戶傳了一張圖片）",
                        imageUrl: data.url,
                        defaultCharacter: fakeChar,
                      }),
                    }).then(r => r.json()).then(async data => {
                      if (data.sessionId) {
                        setSessionId(data.sessionId);
                        localStorage.setItem(`chat_session_gallery_${session?.user?.email}_${galleryId}`, data.sessionId);
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
                } catch (err) { console.error('upload failed:', err); }
                e.target.value = '';
              }}
            />
          </label>
          <button onClick={handleSuggest} title="推薦話題"
            className="flex-shrink-0 w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-lg hover:bg-purple-500/25 transition-all flex items-center justify-center">
            💬
          </button>
          <button onClick={() => setShowStylePanel(p => !p)} title="風格設定"
            className={`flex-shrink-0 w-11 h-11 rounded-2xl border text-lg transition-all flex items-center justify-center ${showStylePanel ? "bg-[#89f5a2]/20 border-[#89f5a2]/50 text-[#89f5a2]" : "bg-white/5 border-white/15 text-white/50 hover:border-white/30"}`}>
            🎨
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`跟 ${character.name} 說點什麼...`}
            rows={2}
            className="flex-1 px-4 py-3 bg-black border border-white/10 rounded-2xl text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-[#89f5a2]/40 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] font-black text-lg hover:bg-[#89f5a2]/30 disabled:opacity-30 transition-all flex items-center justify-center"
          >↑</button>
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
          <div className="mt-2 bg-[#0d2318]/90 border border-[#89f5a2]/20 rounded-2xl p-3">
            <div className="mb-2">
              <p className="text-white/30 text-[10px] font-bold mb-1">🎭 {character.name} · {character.story.slice(0, 30)}...</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {["療癒", "毒舌", "刺激"].map(s => (
                <button key={s} onClick={() => setChatStyle(p => p === s ? "" : s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chatStyle === s ? "bg-[#89f5a2] text-[#0d2318]" : "bg-white/5 border border-white/15 text-white/50 hover:border-white/30"}`}>
                  {s}
                </button>
              ))}
              <div className="w-px h-5 bg-white/15 mx-1" />
              {["直白", "文藝", "輕小說"].map(s => (
                <button key={s} onClick={() => setWritingStyle(p => p === s ? "" : s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${writingStyle === s ? "bg-[#89f5a2] text-[#0d2318]" : "bg-white/5 border border-white/15 text-white/50 hover:border-white/30"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-white/15 text-[10px]">Enter 送出・Shift+Enter 換行</p>
          {isOverQuota
            ? <p className="text-yellow-300 text-[10px] font-bold">💎 {remainingQuota ?? 0} 次・次數用完每次 -1 點</p>
            : remainingQuota !== null && <p className="text-white/20 text-[10px]">剩餘 {remainingQuota} 次</p>
          }
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!confirm("清除記憶後對話將從頭開始，確定嗎？")) return;
                if (session?.user?.email && galleryId) {
                  localStorage.removeItem(`chat_session_gallery_${session.user.email}_${galleryId}`);
                }
                setSessionId(null);
                setMessages([]);
              }}
              className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all"
            >🗑️ 清除記憶</button>
            <button onClick={() => router.push('/')} className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all">
              離開聊天室
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
