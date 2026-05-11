// [DNA_PATCH_START] 預設角色群組聊天頁
"use client";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  characterName?: string;
  characterId?: string;
}

const DEFAULT_CHARACTERS = [
  { id: "default-f1", name: "Yuki", gender: "female", personality: "活潑・大學生", description: "個性開朗活潑，喜歡聊八卦和追劇，說話帶點俏皮語氣，很愛笑。" },
  { id: "default-f2", name: "Luna", gender: "female", personality: "神秘・藝術家", description: "個性神秘冷靜，對藝術和哲學有獨到見解，說話簡短但深刻。" },
  { id: "default-f3", name: "Mia", gender: "female", personality: "溫柔・護士", description: "個性溫柔體貼，說話輕聲細語，很會傾聽，讓人感到安心。" },
  { id: "default-f4", name: "Zoe", gender: "female", personality: "毒舌・名媛", description: "個性傲嬌毒舌，表面嫌棄但其實在意，說話帶刺但令人著迷。" },
  { id: "default-f5", name: "Hana", gender: "female", personality: "元氣・健身教練", description: "充滿活力，熱愛運動，說話充滿正能量，很會鼓勵人。" },
  { id: "default-f6", name: "Iris", gender: "female", personality: "知性・律師", description: "邏輯清晰，說話有條理，偶爾展現強勢，有自己的原則。" },
  { id: "default-f7", name: "Rina", gender: "female", personality: "害羞・插畫師", description: "個性內斂害羞，說話結巴帶點可愛，但談到興趣就滔滔不絕。" },
  { id: "default-f8", name: "Nova", gender: "female", personality: "叛逆・樂手", description: "個性叛逆不羈，說話直接不修飾，但對朋友極度忠誠。" },
  { id: "default-f9", name: "Ella", gender: "female", personality: "賢慧・主婦", description: "溫暖體貼，喜歡照顧人，說話如鄰家姐姐般親切自然。" },
  { id: "default-f10", name: "Sera", gender: "female", personality: "冷酷・特工", description: "個性冷靜沉著，說話簡潔有力，偶爾流露出罕見的溫柔。" },
  { id: "default-m1", name: "Alex", gender: "male", personality: "成熟・醫生", description: "個性沉穩成熟，說話讓人信任，有時會展現出暖男的一面。" },
  { id: "default-m2", name: "Ken", gender: "male", personality: "陽光・運動員", description: "充滿陽光正能量，說話爽朗直接，喜歡給人加油打氣。" },
  { id: "default-m3", name: "Kai", gender: "male", personality: "壞壞・搖滾歌手", description: "個性帶點壞壞的魅力，說話隨性，讓人捉摸不定。" },
  { id: "default-m4", name: "Leo", gender: "male", personality: "霸道・CEO", description: "個性強勢自信，說話簡短有力，展現出難以抗拒的領袖氣場。" },
  { id: "default-m5", name: "Ren", gender: "male", personality: "溫柔・書店老闆", description: "個性溫文儒雅，說話輕柔，喜歡分享書中的故事和人生哲理。" },
  { id: "default-m6", name: "Finn", gender: "male", personality: "幽默・廚師", description: "個性幽默風趣，說話帶梗，很會炒熱氣氛，讓人開心。" },
  { id: "default-m7", name: "Cole", gender: "male", personality: "神秘・偵探", description: "個性深沉，觀察力敏銳，說話總帶著一絲謎樣的從容。" },
  { id: "default-m8", name: "Zack", gender: "male", personality: "陽光・衝浪教練", description: "自由奔放，說話輕鬆隨意，讓人感覺和他在一起沒有壓力。" },
  { id: "default-m9", name: "Jude", gender: "male", personality: "傲嬌・設計師", description: "個性傲嬌，對美感有強烈堅持，但被誇讚時會偷偷開心。" },
  { id: "default-m10", name: "Ash", gender: "male", personality: "溫暖・心理師", description: "說話充滿同理心，善於傾聽，讓人感覺被完全理解和接納。" },
];

const GROUP_LIMITS: Record<string, number> = { free: 3, starter: 3, standard: 3, pro: 5 };

export default function DefaultGroupChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);
  const selectedChars = DEFAULT_CHARACTERS.filter(c => ids.includes(c.id));

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [chatStyle, setChatStyle] = useState("");
  const [writingStyle, setWritingStyle] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [replyTo, setReplyTo] = useState<{ characterName: string; content: string } | null>(null);
  const [tagMenu, setTagMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoMessageTimerRef = useRef<NodeJS.Timeout | null>(null);
// [DNA_PATCH_START] 每日提示框
  useEffect(() => {
    if (!session?.user?.email) return;
    const today = new Date().toLocaleDateString("en-CA");
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
  const getEmoji = (gender: string) => gender === "female" ? "👩" : "👨";
  const sessionKey = `chat_session_default_group_${session?.user?.email}_${ids.join("-")}`;

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user/credits?email=${session.user.email}`)
      .then(r => r.json())
      .then(d => {
        if (d.plan) setPlan(d.plan);
        if (d.remainingQuota !== undefined) setRemainingQuota(d.remainingQuota);
      });
    const saved = localStorage.getItem(sessionKey);
    if (saved) setSessionId(saved);
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedChars.length === 0 || !session?.user?.email) return;
    const startTimer = () => {
      if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current);
      autoMessageTimerRef.current = setTimeout(async () => {
        if (loading) { startTimer(); return; }
        const randomChar = selectedChars[Math.floor(Math.random() * selectedChars.length)];
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: session?.user?.email,
              sessionId,
              message: "（系統：請主動發話）",
              isAutoMessage: true,
              defaultCharacters: selectedChars.map(c => ({ id: c.id, name: c.name, description: c.description, image_url: null })),
            }),
          });
          const data = await res.json();
          if (data.responses && Array.isArray(data.responses)) {
            for (const r of data.responses) {
              await new Promise(resolve => setTimeout(resolve, randomDelay()));
              setMessages(prev => [...prev, { role: "assistant", content: r.content, characterName: r.characterName, characterId: r.characterId }]);
            }
            if (data.sessionId) {
              setSessionId(data.sessionId);
              localStorage.setItem(sessionKey, data.sessionId);
            }
          }
        } catch { }
        startTimer();
      }, 60000);
    };
    startTimer();
    return () => { if (autoMessageTimerRef.current) clearTimeout(autoMessageTimerRef.current); };
  }, [selectedChars.length, session, sessionId, loading]);
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
  const handleSend = async () => {
    if (!input.trim() || loading || !session?.user?.email) return;
    const userMsg = input.trim();
    setInput("");
    setReplyTo(null);
    setTagMenu(false);
    setMessages(prev => [...prev, { role: "user", content: replyTo ? `↩ 回覆 ${replyTo.characterName}：${userMsg}` : userMsg }]);
    setLoading(true);

    const photoKeywords = ["拍照", "自拍", "拍張", "傳照片", "照片給我", "看看你", "看看妳", "拍一張", "傳圖"];
    const videoKeywords = ["錄影", "錄一段", "拍影片", "拍個影片", "拍段影片"];
    if (videoKeywords.some(k => userMsg.includes(k))) {
      await new Promise(r => setTimeout(r, randomDelay()));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `（想錄影片給你，但這個功能需要收藏角色後才能使用 🎬 快去收藏你喜歡的角色吧！）`,
        characterName: selectedChars[0]?.name,
      }]);
      setLoading(false);
      return;
    }
    if (photoKeywords.some(k => userMsg.includes(k))) {
      await new Promise(r => setTimeout(r, randomDelay()));
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `（想傳照片給你，但這個功能需要收藏角色後才能使用 📸 快去收藏你喜歡的角色吧！）`,
        characterName: selectedChars[0]?.name,
      }]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session.user.email,
          sessionId,
          message: replyTo ? `（回覆 ${replyTo.characterName}：「${replyTo.content.slice(0, 30)}...」）\n${userMsg}` : userMsg,
          defaultCharacters: selectedChars.map(c => ({ id: c.id, name: c.name, description: c.description, image_url: null })),
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
      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(sessionKey, data.sessionId);
      }
      if (data.remainingQuota !== undefined) setRemainingQuota(data.remainingQuota);

      // ✅ 問題1修正：API 回來後立刻解鎖輸入
      setLoading(false);

      if (data.responses && Array.isArray(data.responses)) {
        // ✅ 問題2修正：隨機抽取部分角色發言（至少1人，最多3人或全部）
        const shuffled = [...data.responses].sort(() => Math.random() - 0.5);
        const maxResponders = Math.min(shuffled.length, 3);
        const count = Math.floor(Math.random() * maxResponders) + 1;
        const picked = shuffled.slice(0, count);

        // 不擋主流程，獨立跑顯示邏輯
        (async () => {
          for (const r of picked) {
            await new Promise(resolve => setTimeout(resolve, randomDelay()));
            setMessages(prev => [...prev, { role: "assistant", content: r.content, characterName: r.characterName, characterId: r.characterId }]);
          }
        })();
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "（連線失敗，請重試）" }]);
      setLoading(false);
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

  if (selectedChars.length < 2) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm mb-4">請至少選擇 2 個角色</p>
      <button onClick={() => router.push('/characters')} className="px-6 py-3 bg-[#89f5a2] text-[#0d2318] rounded-full font-black text-sm">← 返回選擇</button>
    </main>
  );

  return (
    <main className="flex h-screen flex-col bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] overflow-hidden">
      {/* 頂部 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-black/20 flex-shrink-0">
        <button onClick={() => router.push('/characters')} className="text-white/40 hover:text-white/70 transition-all text-sm mr-1">←</button>
        <div className="flex -space-x-2">
          {selectedChars.map(c => (
            <div key={c.id} className="w-9 h-9 rounded-full flex items-center justify-center text-xl bg-white/8 border-2 border-[#0d2318]">
              {getEmoji(c.gender)}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 ml-1">
          <p className="text-white font-black text-sm truncate">{selectedChars.map(c => c.name).join("・")}</p>
          <p className="text-white/30 text-[10px]">群組聊天</p>
        </div>
        <span className="text-[10px] bg-[#5bd4f0]/10 border border-[#5bd4f0]/20 rounded-full px-2 py-0.5 text-[#5bd4f0]">預設角色</span>
        <button onClick={() => { setSearchOpen(p => !p); setSearchQuery(""); setSearchIndex(0); }} className="text-white/30 hover:text-white/60 transition-all text-base">🔍</button>
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
{/* [DNA_PATCH_START] 每日提示框 */}
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
      {/* [DNA_PATCH_END] */}
      {/* 內容揭露小字 */}
      <div className="px-4 py-1.5 bg-black/15 border-b border-white/5 flex-shrink-0">
        <p className="text-[10px] text-white/20 text-center">💬 支援曖昧互動，明確露骨內容由 AI 自動過濾
<span
  title="由 Anthropic 開發的輕量級 AI 模型，反應快速"
  className="ml-2 cursor-help border-b border-dotted border-current opacity-60 hover:opacity-100 transition-opacity"
>
  · 🤖 Claude Haiku
</span></p>
      </div>

      {/* 訊息區 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-3 py-16">
            <div className="flex -space-x-3">
              {selectedChars.map(c => (
                <div key={c.id} className="w-16 h-16 rounded-full flex items-center justify-center text-4xl bg-white/5 border-2 border-[#0d2318]">
                  {getEmoji(c.gender)}
                </div>
              ))}
            </div>
            <p className="text-white/40 text-sm mt-2">{selectedChars.map(c => c.name).join("、")} 都在線上</p>
            <p className="text-white/20 text-xs">說點什麼開始聊天吧！</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const char = selectedChars.find(c => c.id === msg.characterId) || selectedChars.find(c => c.name === msg.characterName);
          return (
            <div key={idx} ref={el => { messageRefs.current[idx] = el; }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`} style={searchResults.includes(idx) ? { outline: idx === searchResults[searchIndex] ? "2px solid #89f5a2" : "1px solid rgba(137,245,162,0.3)", borderRadius: 16 } : {}}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl bg-white/8 border border-white/10 flex-shrink-0 mt-1">
                  {char ? getEmoji(char.gender) : "🤖"}
                </div>
              )}
              <div className="max-w-[75%]">
                {msg.role === "assistant" && msg.characterName && (
                  <p className="text-white/30 text-[10px] mb-1 ml-1">{msg.characterName}</p>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#89f5a2]/20 border border-[#89f5a2]/30 text-white"
                    : "bg-black/30 border border-white/10 text-white/85"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "assistant" && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <button
                      onClick={() => setReplyTo({ characterName: msg.characterName || "角色", content: msg.content })}
                      className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-white/30 hover:bg-white/10 hover:text-white/60 transition-all"
                    >
                      ↩ 回覆
                    </button>
                    <button
                      onClick={() => {
                        const name = msg.characterName;
                        if (name) setInput(prev => prev + `@${name} `);
                      }}
                      className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-white/30 hover:bg-white/10 hover:text-[#89f5a2] transition-all"
                    >
                      @ Tag
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl bg-white/8 border border-white/10 flex-shrink-0 mt-1">💬</div>
            <div className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
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
                    setMessages(prev => [...prev, { role: 'user', content: '（傳送了一張圖片）' }]);
                  }
                } catch { }
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
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-[#89f5a2]/60 text-[10px] font-bold mb-0.5">↩ 回覆 {replyTo.characterName}</p>
                <p className="text-white/30 text-[10px] truncate">{replyTo.content.slice(0, 40)}{replyTo.content.length > 40 ? "..." : ""}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/20 hover:text-white/50 text-xs flex-shrink-0">✕</button>
            </div>
          )}
          {tagMenu && (
            <div className="mb-2 bg-[#0a1e12] border border-[#89f5a2]/20 rounded-xl p-2 flex gap-2 flex-wrap">
              <p className="w-full text-[#89f5a2]/50 text-[10px] mb-1">Tag 誰來回覆？</p>
              {selectedChars.map(c => (
                <button key={c.id} onClick={() => {
                  setInput(prev => prev + `@${c.name} `);
                  setTagMenu(false);
                }} className="px-3 py-1 bg-white/5 border border-white/15 rounded-full text-white/60 text-xs hover:border-[#89f5a2]/40 hover:text-[#89f5a2] transition-all">
                  {getEmoji(c.gender)} @{c.name}
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
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-[#89f5a2]/40 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
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
              <p className="text-white/30 text-[10px] font-bold mb-1">🎭 {selectedChars.map(c => c.name).join("・")}</p>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!confirm("清除記憶後對話將從頭開始，確定嗎？")) return;
                localStorage.removeItem(sessionKey);
                setSessionId(null);
                setMessages([]);
              }}
              className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all"
            >🗑️ 清除記憶</button>
            <button onClick={() => router.push('/characters')} className="px-3 py-1 rounded-full text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all">
              離開聊天室
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
// [DNA_PATCH_END]