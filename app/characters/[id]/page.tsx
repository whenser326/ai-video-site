// [DNA_PATCH_START] 角色詳情頁
"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CharacterDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const characterId = params?.id;

  const [character, setCharacter] = useState<any>(null);
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  useEffect(() => {
    if (!session?.user?.email || !characterId) return;

    // 抓角色資料
    fetch(`/api/saved-characters?email=${session.user.email}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const found = data.find((c: any) => String(c.id) === String(characterId));
          setCharacter(found || null);
        }
      });

    // 抓這個角色的生成歷史
    fetch(`/api/history?email=${session.user.email}&character_id=${characterId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGenerations(data);
        setLoading(false);
      });
  }, [session, characterId]);

  const handleLockCharacter = async () => {
    if (!character) return;
    await fetch("/api/user/save-locked-character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session?.user?.email, url: character.image_url }),
    });
    localStorage.setItem('locked_character', character.image_url);
    alert(`✅ 已切換到「${character.name}」，返回主頁即可使用`);
    router.push('/');
  };

  if (!session) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm">請先登入</p>
    </main>
  );

  if (!loading && !character) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm mb-4">找不到此角色</p>
      <button onClick={() => router.push('/characters')} className="px-4 py-2 bg-white/10 rounded-full text-white/50 text-sm">返回</button>
    </main>
  );

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-24 sm:pt-16 pb-10 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-lg space-y-5">

        {/* 頂部返回 */}
        <div className="relative flex items-center justify-center mt-2">
          <h1 className="text-white font-black text-2xl sm:text-lg text-center">
            {character?.name || "載入中..."}
          </h1>
          <button
            onClick={() => router.push('/characters')}
            className="absolute right-0 sm:hidden px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 transition-all"
          >
            ← 返回
          </button>
          <button
            onClick={() => router.push('/characters')}
            className="hidden sm:block absolute left-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 transition-all"
          >
            ← 返回
          </button>
        </div>

        {/* 角色身份卡 */}
        {character && (
          <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
            <div className="flex gap-4 p-4">
              <img
                src={character.image_url}
                alt={character.name}
                className="w-24 h-24 rounded-2xl object-cover border border-white/10 flex-shrink-0"
              />
              <div className="flex-1 space-y-1 min-w-0">
                <p className="text-white font-black text-lg">{character.name}</p>
                <p className="text-white/30 text-xs">
                  {new Date(character.created_at).toLocaleDateString('zh-TW')} 建立
                </p>
                <p className="text-white/30 text-xs">
                  共 {generations.length} 筆作品
                </p>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              <button
                onClick={handleLockCharacter}
                className="py-2.5 bg-gradient-to-r from-[#89f5a2]/20 to-[#4ade80]/20 border border-[#89f5a2]/40 text-[#89f5a2] rounded-xl text-xs font-black hover:from-[#89f5a2]/30 transition-all"
              >
                🎯 使用此角色
              </button>
              <button
                onClick={() => { handleLockCharacter(); }}
                className="py-2.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-black hover:from-purple-500/30 transition-all"
              >
                🎙️ 讓她說話
              </button>
            </div>
          </div>
        )}

        {/* 作品相簿 */}
        <div>
          <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-3">📁 作品相簿</p>

          {loading && (
            <p className="text-white/30 text-sm text-center py-8">載入中...</p>
          )}

          {!loading && generations.length === 0 && (
            <div className="text-center py-10 bg-black/15 rounded-2xl border border-white/5">
              <p className="text-white/30 text-sm">還沒有作品</p>
              <p className="text-white/20 text-xs mt-1">使用此角色生成後會自動出現在這裡</p>
            </div>
          )}

          {!loading && generations.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {generations.map((gen, idx) => {
                const isVideo = !!gen.video_url;
                const url = gen.video_url || gen.image_url;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedMedia(gen)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-[#89f5a2]/40 hover:scale-105 transition-all duration-200"
                  >
                    {isVideo ? (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center gap-1">
                        <span className="text-xl">🎬</span>
                        <span className="text-[8px] text-[#89f5a2] font-black">VIDEO</span>
                      </div>
                    ) : (
                      <img src={url} className="w-full h-full object-cover" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 媒體預覽 Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>
            {selectedMedia.video_url ? (
              <video src={selectedMedia.video_url} controls autoPlay className="w-full rounded-2xl" />
            ) : (
              <img src={selectedMedia.image_url} className="w-full rounded-2xl" />
            )}
            {selectedMedia.prompt && (
              <p className="text-white/40 text-xs text-center px-2">{selectedMedia.prompt}</p>
            )}
            <button
              onClick={() => setSelectedMedia(null)}
              className="w-full py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
// [DNA_PATCH_END]