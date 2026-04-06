"use client";
import { useRouter } from "next/navigation";

export default function AdultPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0a0a] via-[#2d0f1a] to-[#1a0a2e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* 背景光暈 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        <div className="text-8xl mb-6">🔞</div>
        <h1 className="text-4xl font-black text-white mb-3">成人專區</h1>
        <p className="text-white/40 text-sm mb-8">Adult Content Studio</p>
        
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-sm">
          <div className="text-5xl mb-4">🚧</div>
          <h2 className="text-2xl font-black text-white mb-3">Coming Soon</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            成人內容生成功能即將推出。<br />
            將支援使用點數生成 18+ 圖片與影片。<br />
            敬請期待！
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-8">
          <p className="text-yellow-300/80 text-xs leading-relaxed">
            ⚠️ 本專區內容僅限 18 歲以上成人使用。<br />
            正式開放時將需要年齡驗證。
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white/60 text-sm font-bold hover:bg-white/20 transition-all"
        >
          ← 返回主頁
        </button>
      </div>
    </main>
  );
}