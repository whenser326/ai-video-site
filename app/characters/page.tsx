// [DNA_PATCH_START] 我的角色列表頁
"use client";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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

export default function CharactersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🎭</p>
            <p className="text-white/50 text-sm">還沒有收藏的角色</p>
            <p className="text-white/30 text-xs">生成圖片後點「⭐ 收藏此角色」即可建立</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-3 bg-[#89f5a2] text-[#0d2318] rounded-full font-black text-sm hover:opacity-90 transition-all"
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
                className="relative group bg-black/25 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-purple-400/40 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)] transition-all duration-200"
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
                  <div className="flex items-center gap-1">
                    <span className="text-white/20 text-[10px]">🎙️</span>
                    <span className="text-white/25 text-[10px] truncate">
                      {VOICE_OPTIONS.find(v => v.id === char.voice_id)?.label || "未設定"}
                    </span>
                  </div>
                </div>

                {openMenuId === char.id && (
                  <div
                    ref={menuRef}
                    className="absolute inset-0 bg-black/65 flex items-end p-2 z-10"
                    onClick={() => setOpenMenuId(null)}
                  >
                    <div
                      className="w-full bg-[#0f2318] border border-[#89f5a2]/30 rounded-xl overflow-hidden"
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && characters.length >= 2 && (
          <div className="mt-8 bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
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
            <select
              value={editVoiceId}
              onChange={e => setEditVoiceId(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#89f5a2]/50 appearance-none"
            >
              {VOICE_OPTIONS.map(v => (
                <option key={v.id} value={v.id} className="bg-[#0d2318]">{v.label}</option>
              ))}
            </select>
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