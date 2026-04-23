// [DNA_PATCH_START] 我的角色列表頁
"use client";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CharactersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/saved-characters?email=${session.user.email}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCharacters(data);
        setLoading(false);
      });
  }, [session]);

  if (!session) return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <p className="text-white/50 text-sm mb-4">請先登入才能查看角色</p>
      <button onClick={() => signIn("google")} className="px-6 py-3 bg-[#89f5a2] text-[#0d2318] rounded-full font-black text-sm">
        🔑 Google 登入
      </button>
    </main>
  );

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-24 sm:pt-16 pb-10 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-lg">

        {/* 頂部返回 */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 hover:text-white/70 transition-all"
          >
            ← 返回首頁
          </button>
          <h1 className="text-white font-black text-xl">🎭 我的角色</h1>
        </div>

        {/* 載入中 */}
        {loading && (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm">載入中...</p>
          </div>
        )}

        {/* 空狀態 */}
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

        {/* 角色列表 */}
        {!loading && characters.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => router.push(`/characters/${char.id}`)}
                className="group cursor-pointer bg-black/25 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-purple-400/40 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)] transition-all duration-200"
              >
                {/* 角色圖片 */}
                <div className="relative w-full aspect-square overflow-hidden">
                  <img
                    src={char.image_url}
                    alt={char.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* 角色資訊 */}
                <div className="p-3 space-y-1">
                  <p className="text-white font-black text-sm truncate">{char.name}</p>
                  <p className="text-white/30 text-[10px]">
                    {new Date(char.created_at).toLocaleDateString('zh-TW')} 建立
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
// [DNA_PATCH_END]