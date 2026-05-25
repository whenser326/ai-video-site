// [DNA_PATCH_START] 我的角色列表頁
"use client";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import VoiceSelector, { VOICE_OPTIONS } from "@/app/components/VoiceSelector";
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
export default function CharactersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
const [selectedDefaultIds, setSelectedDefaultIds] = useState<string[]>([]);
const [defaultExpanded, setDefaultExpanded] = useState(false);
  // 編輯聲音 Modal 狀態
  const [editVoiceChar, setEditVoiceChar] = useState<any | null>(null);
  const [editVoiceId, setEditVoiceId] = useState("female-2");
  const [isSavingVoice, setIsSavingVoice] = useState(false);

  const handleDelete = async (charId: string) => {
    if (!confirm('確定要刪除這個角色嗎？此操作無法復原。')) return;
    setDeletingId(charId);
    try {
      const res = await fetch(`/api/saved-characters?id=${charId}&email=${session?.user?.email}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCharacters(prev => prev.filter(c => c.id !== charId));
        setOpenMenuId(null);
      } else {
        alert('刪除失敗，請重試');
      }
    } catch {
      alert('刪除失敗，請重試');
    }
    setDeletingId(null);
  };

  const handleSaveVoice = async () => {
    if (!editVoiceChar || !session?.user?.email) return;
    setIsSavingVoice(true);
    try {
      const res = await fetch("/api/saved-characters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editVoiceChar.id,
          email: session.user.email,
          voice_id: editVoiceId,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setCharacters(prev => prev.map(c =>
          c.id === editVoiceChar.id ? { ...c, voice_id: editVoiceId } : c
        ));
        setEditVoiceChar(null);
        alert("✅ 聲音已更新！");
      }
    } catch {
      alert("更新失敗，請重試");
    }
    setIsSavingVoice(false);
  };

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/saved-characters?email=${session.user.email}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCharacters(data);
        setLoading(false);
      });
  }, [session]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  if (!session) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm mb-4">請先登入才能查看角色</p>
      <button onClick={() => signIn("google", {}, { prompt: "select_account" })} className="px-6 py-3 bg-[#89f5a2] text-[#0d2318] rounded-full font-black text-sm">
        🔑 Google 登入
      </button>
    </main>
  );

  return (
    <>
    <main className="flex min-h-screen flex-col items-center px-4 pt-6 pb-10 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-lg">

        <div className="flex items-center gap-3 mb-6 mt-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 hover:text-white/70 transition-all"
          >
            ← 返回首頁
          </button>
          <p className="text-white font-black text-xl">🎭 我的角色</p>
        </div>

        {loading && (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm">載入中...</p>
          </div>
        )}

        {!loading && characters.length === 0 && (
          <div className="flex flex-col items-center py-8 space-y-2 border border-dashed border-white/10 rounded-2xl mb-6">
            <p className="text-3xl">🎭</p>
            <p className="text-white/40 text-sm">尚未建立角色</p>
            <p className="text-white/25 text-xs">生成圖片後點「⭐ 收藏此角色」即可建立</p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 px-5 py-2 bg-[#89f5a2]/10 border border-[#89f5a2]/30 text-[#89f5a2] rounded-full text-xs font-bold hover:opacity-90 transition-all"
            >
              ✨ 去生成角色
            </button>
          </div>
        )}

        {!loading && characters.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {characters.map((char) => (
              <div
                key={char.id}
                className="relative group bg-black backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-purple-400/40 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)] transition-all duration-200"
              >
                <div
                  className="relative w-full aspect-square overflow-hidden cursor-pointer"
                  onClick={() => setOpenMenuId(openMenuId === char.id ? null : char.id)}
                >
                  <img
                    src={char.image_url}
                    alt={char.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                <div className="p-3 space-y-1">
                  <p className="text-white font-black text-sm truncate">{char.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-white/20 text-[10px]">🎙️</span>
                      <span className="text-white/25 text-[10px] truncate">
                        {VOICE_OPTIONS.find(v => v.id === char.voice_id)?.label || "未設定"}
                      </span>
                    </div>
                    </div>
                  <p className="text-[#89f5a2]/30 text-[9px]">🔓 聊越多解鎖越多</p>
                </div>

                {openMenuId === char.id && (
                  <div
                    ref={menuRef}
                    className="absolute inset-0 bg-black/65 flex items-end p-2 z-10"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <div
                      className="w-full bg-black border border-[#89f5a2]/30 rounded-xl overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => router.push(`/characters/${char.id}`)}
                        className="w-full flex items-center gap-2 px-3 py-3 text-xs font-bold text-[rgba(184,255,200,0.8)] border-b border-[rgba(137,245,162,0.08)] hover:bg-[rgba(137,245,162,0.08)] transition-all"
                      >
                        📁 查看作品
                      </button>
                      <button
                        onClick={() => router.push(`/chat/${char.id}`)}
                        className="w-full flex items-center gap-2 px-3 py-3 text-xs font-bold text-[rgba(184,255,200,0.8)] border-b border-[rgba(137,245,162,0.08)] hover:bg-[rgba(137,245,162,0.08)] transition-all"
                      >
                        💬 互動聊天
                      </button>
                      <button
                        onClick={() => {
                          setEditVoiceChar(char);
                          setEditVoiceId(char.voice_id || "female-2");
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-3 text-xs font-bold text-[rgba(184,255,200,0.8)] border-b border-[rgba(137,245,162,0.08)] hover:bg-[rgba(137,245,162,0.08)] transition-all"
                      >
                        🎙️ 編輯聲音
                      </button>
                      <button
                        onClick={() => handleDelete(char.id)}
                        disabled={deletingId === char.id}
                        className="w-full flex items-center gap-2 px-3 py-3 text-xs font-bold text-red-400/70 hover:bg-red-500/10 transition-all disabled:opacity-40"
                      >
                        🗑️ {deletingId === char.id ? '刪除中...' : '刪除角色'}
                      </button>
                      <div className="px-3 py-2 bg-[#89f5a2]/5">
                        <p className="text-white/60 text-[9px] leading-relaxed">🔓 聊越多解鎖越多！每聊 <span className="text-[#89f5a2]/70 font-bold">50 / 100 / 200 / 500</span> 則，角色會說出只有你能看的隱藏內容</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
{!loading && characters.length >= 2 && (
          <div className="mt-6 bg-black border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white/70 text-sm font-bold">🎭 群組聊天</p>
              <span className="text-[10px] bg-[#89f5a2]/10 border border-[#89f5a2]/20 rounded-full px-2 py-0.5 text-[#89f5a2]">
                入門/標準 最多3人・專業 最多5人
              </span>
            </div>
            <p className="text-white/30 text-xs">選擇 2 個以上角色，一起開聊</p>
            <div className="flex gap-2 items-center">
              {characters.slice(0, 3).map((c) => (
                <img
                  key={c.id}
                  src={c.image_url}
                  alt={c.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#89f5a2]/30"
                />
              ))}
              {characters.length > 3 && (
                <div className="w-11 h-11 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 text-xs font-bold">
                  +{characters.length - 3}
                </div>
              )}
              <button
                onClick={() => router.push('/chat/group')}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#2d8a42] to-[#3db558] text-white text-xs font-black hover:opacity-90 transition-all"
              >
                開始群組聊天 →
              </button>
            </div>
          </div>
        )}

{/* 預設角色區塊 */}
        <div className="mt-6 border border-[#5bd4f0]/20 rounded-2xl p-4 bg-[#5bd4f0]/5">
          <button
            onClick={() => setDefaultExpanded(prev => !prev)}
            className="w-full flex items-center gap-2 mb-2 hover:opacity-80 transition-all"
          >
            <p className="text-white/60 text-sm font-bold">✨ 預設角色</p>
            <span className="text-[10px] bg-[#5bd4f0]/10 border border-[#5bd4f0]/25 rounded-full px-2 py-0.5 text-[#5bd4f0]">免費可用</span>
            <span className="ml-auto text-white/30 text-xs">{defaultExpanded ? "▲ 收起" : "▼ 展開"}</span>
          </button>
          {!defaultExpanded && (
            <p className="text-white/25 text-[11px] mb-3">👆 點擊展開，選角色直接開聊</p>
          )}
          {defaultExpanded && (
            <p className="text-white/30 text-[11px] mb-3">點選角色即可開始，選 2 位以上可開群組聊天</p>
          )}
          {defaultExpanded && (
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_CHARACTERS.map((char) => (
              <div
                key={char.id}
                onClick={() => {
                  setSelectedDefaultIds(prev =>
                    prev.includes(char.id) ? prev.filter(i => i !== char.id) : [...prev, char.id]
                  );
                }}
                className={`flex items-center gap-3 rounded-2xl p-3 cursor-pointer transition-all border ${
                  selectedDefaultIds.includes(char.id)
                    ? 'bg-[#5bd4f0]/12 border-[#5bd4f0]/50'
                    : 'bg-black/20 border-white/8 hover:border-[#5bd4f0]/30 hover:bg-[#5bd4f0]/5'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${char.gender === 'female' ? 'bg-pink-500/15' : 'bg-blue-500/15'}`}>
                  {char.gender === 'female' ? '👩' : '👨'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/80 text-sm font-bold truncate">{char.name}</p>
                  <p className="text-white/30 text-[10px] truncate">{char.personality}</p>
                </div>
                {selectedDefaultIds.includes(char.id) && (
                  <div className="w-5 h-5 rounded-full bg-[#5bd4f0] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#0d2318] text-[10px] font-black">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {selectedDefaultIds.length === 1 && (
            <div className="mt-3 flex items-center gap-3 bg-black/20 border border-white/10 rounded-2xl p-3">
              <p className="text-white/50 text-xs flex-1">已選 1 位・可再選更多開群組</p>
              <button
                onClick={() => router.push(`/chat/default/${selectedDefaultIds[0]}`)}
                className="px-4 py-2 bg-[#89f5a2]/15 border border-[#89f5a2]/30 text-[#89f5a2] rounded-xl text-xs font-black hover:bg-[#89f5a2]/25 transition-all"
              >單人聊天 →</button>
              <button onClick={() => setSelectedDefaultIds([])} className="text-white/25 text-xs hover:text-white/50 transition-all">取消</button>
            </div>
          )}
          {selectedDefaultIds.length >= 2 && (
            <div className="mt-3 flex items-center gap-3 bg-[#5bd4f0]/10 border border-[#5bd4f0]/30 rounded-2xl p-3">
              <p className="text-[#5bd4f0] text-xs font-bold flex-1">已選 {selectedDefaultIds.length} 位・開始群組聊天</p>
              <button
                onClick={() => router.push(`/chat/default-group?ids=${selectedDefaultIds.join(",")}`)}
                className="px-4 py-2 bg-[#5bd4f0]/20 border border-[#5bd4f0]/40 text-[#5bd4f0] rounded-xl text-xs font-black hover:bg-[#5bd4f0]/30 transition-all"
              >開始 →</button>
              <button onClick={() => setSelectedDefaultIds([])} className="text-white/25 text-xs hover:text-white/50 transition-all">取消</button>
            </div>
          )}
        </div>

      </div>
    </main>

    {/* 編輯聲音 Modal */}
    {editVoiceChar && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm bg-[#0d2318] border border-[#89f5a2]/20 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <img src={editVoiceChar.image_url} className="w-12 h-12 rounded-full object-cover border border-white/20" />
            <div>
              <p className="text-white font-black text-base">{editVoiceChar.name}</p>
              <p className="text-white/30 text-xs">設定聊天室預設聲音</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-white/40 text-xs">🎙️ 選擇聲音</p>
            <VoiceSelector
              selectedVoiceId={editVoiceId}
              onChange={setEditVoiceId}
              userEmail={session?.user?.email ?? ""}
              plan="starter"
              characterId={editVoiceChar?.id}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setEditVoiceChar(null)}
              className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
            >
              取消
            </button>
            <button
              disabled={isSavingVoice}
              onClick={handleSaveVoice}
              className="py-3 rounded-xl bg-gradient-to-r from-[#89f5a2] to-[#4ade80] text-[#0d2318] text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
            >
              {isSavingVoice ? "儲存中..." : "✅ 確認更新"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
// [DNA_PATCH_END]