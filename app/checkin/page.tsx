"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalHeader from "../components/GlobalHeader";

export default function CheckinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [already, setAlready] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ creditsEarned: number; bonusCredits: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (session?.user?.email) {
      fetch(`/api/checkin?email=${session.user.email}`)
        .then(r => r.json())
        .then(d => {
          setStreak(d.checkin_streak || 0);
          setAlready(d.already);
        });
    }
  }, [session, status]);

  const handleCheckin = async () => {
    if (!session?.user?.email || already || loading) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      setError(data.error);
    } else {
      setAlready(true);
      setStreak(data.streak);
      setResult({ creditsEarned: data.creditsEarned, bonusCredits: data.bonusCredits });
    }
  };

  // 計算30天格子
  const currentStreak = streak;
  const cells = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const isChecked = day <= currentStreak;
    const isBonus7 = day === 7;
    const isBonus30 = day === 30;
    return { day, isChecked, isBonus7, isBonus30 };
  });

  return (
    <main className="flex min-h-screen flex-col items-center px-3 sm:px-4 pt-2 pb-8 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="h-12" />
      <div className="w-full max-w-lg mt-4 space-y-4">

        {/* 標題 */}
        <div className="text-center mb-2">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-white font-black text-xl">每日簽到</p>
          <p className="text-white/40 text-xs mt-1">每天簽到得1點，連續7天+3點，連續30天+10點</p>
        </div>

        {/* 連續天數 */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 p-5 text-center">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">目前連續簽到</p>
          <p className="text-[#89f5a2] text-5xl font-black">{currentStreak}</p>
          <p className="text-white/40 text-sm mt-1">天</p>
        </div>

        {/* 簽到按鈕 */}
        <button
          onClick={handleCheckin}
          disabled={already || loading}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all
            ${already
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-gradient-to-r from-[#89f5a2] to-[#4ade80] text-[#0d2318] hover:opacity-90 active:scale-[0.99] shadow-lg shadow-[#89f5a2]/25"
            }`}
        >
          {loading ? "簽到中..." : already ? "✅ 今日已簽到" : "📅 立即簽到 +1點"}
        </button>

        {/* 簽到成功提示 */}
        {result && (
          <div className="bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-2xl p-4 text-center animate-in fade-in duration-300">
            <p className="text-[#89f5a2] font-black text-lg">✅ 簽到成功！</p>
            <p className="text-white/60 text-sm mt-1">
              獲得 <span className="text-[#89f5a2] font-black">{result.creditsEarned} 點</span>
              {result.bonusCredits > 0 && (
                <span className="text-yellow-300 font-black">（含連續獎勵 +{result.bonusCredits}點 🎉）</span>
              )}
            </p>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
            <p className="text-red-300 text-sm font-bold">⚠️ {error}</p>
          </div>
        )}

        {/* 30天進度格子 */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 p-5">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">簽到進度</p>
          <div className="grid grid-cols-7 gap-2">
            {cells.map(({ day, isChecked, isBonus7, isBonus30 }) => (
              <div key={day}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-black border transition-all
                  ${isChecked
                    ? "bg-[#89f5a2]/20 border-[#89f5a2]/50 text-[#89f5a2]"
                    : "bg-white/4 border-white/8 text-white/25"
                  }
                  ${isBonus7 || isBonus30 ? "ring-1 ring-yellow-400/50" : ""}
                `}>
                {isChecked ? "✓" : day}
                {(isBonus7 || isBonus30) && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-yellow-400 text-[#0d2318] rounded-full px-1 font-black leading-tight">
                    {isBonus7 ? "+3" : "+10"}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#89f5a2]/20 border border-[#89f5a2]/50" />
              <span className="text-white/30 text-[10px]">已簽到</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/4 border border-white/8" />
              <span className="text-white/30 text-[10px]">未簽到</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/4 border border-yellow-400/50 ring-1 ring-yellow-400/50" />
              <span className="text-white/30 text-[10px]">獎勵日</span>
            </div>
          </div>
        </div>

        {/* 規則說明 */}
        <div className="bg-black/15 rounded-2xl border border-white/5 p-4 space-y-2">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">獎勵規則</p>
          <p className="text-white/50 text-xs">📅 每日簽到 → +1點</p>
          <p className="text-white/50 text-xs">🎯 連續簽到第7天 → 額外 +3點</p>
          <p className="text-white/50 text-xs">🏆 連續簽到第30天 → 額外 +10點</p>
          <p className="text-white/50 text-xs">⚠️ 中斷一天後連續天數重新計算</p>
          <p className="text-white/50 text-xs">📱 每個網路每日限一個帳號簽到</p>
        </div>

      </div>
    </main>
  );
}