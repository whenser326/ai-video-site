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
  const [result, setResult] = useState<{ creditsEarned: number; spinCredits: number; bonusCredits: number; bonusVideo: boolean } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const canvasRef = typeof window !== 'undefined' ? null : null;
  const [error, setError] = useState("");
  const [birthday, setBirthday] = useState("");
  const [birthdaySaved, setBirthdaySaved] = useState(false);
  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [birthdayDay, setBirthdayDay] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (session?.user?.email) {
      fetch(`/api/checkin?email=${session.user.email}`)
        .then(r => r.json())
        .then(d => {
          setStreak(d.checkin_streak || 0);
          setAlready(d.already);
        });
      fetch(`/api/user/birthday?email=${session.user.email}`)
        .then(r => r.json())
        .then(d => {
          if (d.birthday) {
            const [mm, dd] = d.birthday.split("-");
            setBirthdayMonth(mm || "");
            setBirthdayDay(dd || "");
            setBirthday(d.birthday);
          }
        });
    }
  }, [session, status]);


  // 計算30天格子
  const currentStreak = streak;
  const cells = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const isChecked = day <= currentStreak;
    const isBonus7 = day === 7;
    const isBonus14 = day === 14;
    const isBonus21 = day === 21;
    const isBonus30 = day === 30;
    return { day, isChecked, isBonus7, isBonus14, isBonus21, isBonus30 };
  });

  return (
    <main className="flex min-h-screen flex-col items-center px-3 sm:px-4 pt-2 pb-8 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="h-12" />
      <div className="w-full max-w-lg mt-4 space-y-4">
{/* 返回按鈕 */}
        <div className="flex items-center mb-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 hover:text-white/70 transition-all"
          >
            ← 返回首頁
          </button>
        </div>
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

        {/* 轉盤簽到區塊 */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 p-5 flex flex-col items-center">
          {/* 轉盤 Canvas */}
          <div className="relative mb-4">
            <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 w-0 h-0"
              style={{ borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderTop:'20px solid #89f5a2', zIndex:10 }} />
            <canvas
              id="checkinWheel"
              width={220}
              height={220}
              className="rounded-full border-4 border-[#89f5a2]"
            />
          </div>

          {/* 簽到按鈕 */}
          <button
            onClick={async () => {
              if (already || loading || spinning) return;
              // 先畫好轉盤
              const canvas = document.getElementById('checkinWheel') as HTMLCanvasElement;
              const ctx = canvas?.getContext('2d');
              if (!ctx) return;

              const segs = [
                { label:'+1 點', color:'#1a3a25', textColor:'#89f5a2' },
                { label:'+2 點', color:'#2d5a3d', textColor:'#89f5a2' },
                { label:'+3 點', color:'#1a4a2a', textColor:'#5DF5A5' },
                { label:'+4 點', color:'#0d3320', textColor:'#5DF5A5' },
                { label:'+5 點', color:'#0a2818', textColor:'#FFE566' },
              ];
              const n = segs.length;
              const cx = 110, cy = 110, r = 105;

              const drawWheel = (angle: number) => {
                ctx.clearRect(0,0,220,220);
                for(let i=0;i<n;i++) {
                  const start = angle + (i/n)*2*Math.PI;
                  const end = angle + ((i+1)/n)*2*Math.PI;
                  ctx.beginPath(); ctx.moveTo(cx,cy);
                  ctx.arc(cx,cy,r,start,end); ctx.closePath();
                  ctx.fillStyle = segs[i].color; ctx.fill();
                  ctx.strokeStyle='#89f5a2'; ctx.lineWidth=1.5; ctx.stroke();
                  ctx.save(); ctx.translate(cx,cy);
                  ctx.rotate(start+(end-start)/2);
                  ctx.textAlign='right'; ctx.fillStyle=segs[i].textColor;
                  ctx.font='bold 13px sans-serif';
                  ctx.fillText(segs[i].label, r-10, 5);
                  ctx.restore();
                }
                ctx.beginPath(); ctx.arc(cx,cy,16,0,2*Math.PI);
                ctx.fillStyle='#0d2318'; ctx.fill();
                ctx.strokeStyle='#89f5a2'; ctx.lineWidth=2; ctx.stroke();
              };

              drawWheel(spinAngle);
              setSpinning(true);
              setLoading(true);

              // 呼叫 API 取得結果
              const res = await fetch("/api/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: session?.user?.email }),
              });
              const data = await res.json();
              setLoading(false);

              if (data.error) { setError(data.error); setSpinning(false); return; }

              // 根據 spinCredits 決定停在哪個格子
              const spinCredits = data.spinCredits || 1;
              const segIdx = [1,2,3,4,5].indexOf(spinCredits);
              const targetIdx = segIdx >= 0 ? segIdx : 0;
              const segAngle = (2*Math.PI)/n;
              const targetAngle = 2*Math.PI*8 + (Math.PI*1.5) - (targetIdx*segAngle) - segAngle/2;
              const duration = 3500;
              const start = performance.now();
              const startAngle = spinAngle;

              const animate = (now: number) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed/duration, 1);
                const ease = 1 - Math.pow(1-progress, 4);
                const angle = startAngle + targetAngle * ease;
                drawWheel(angle);
                if(progress < 1) {
                  requestAnimationFrame(animate);
                } else {
                  setSpinAngle(angle % (2*Math.PI));
                  setSpinning(false);
                  setAlready(true);
                  setStreak(data.streak);
                  setResult({ creditsEarned: data.creditsEarned, spinCredits: data.spinCredits, bonusCredits: data.bonusCredits, bonusVideo: !!data.bonusVideo });
                }
              };
              requestAnimationFrame(animate);
            }}
            disabled={already || loading || spinning}
            className={`px-10 py-3 rounded-2xl font-black text-base transition-all
              ${already
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : spinning
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-[#89f5a2] text-[#0d2318] hover:opacity-90 active:scale-[0.98]"
              }`}
          >
            {spinning ? "轉動中..." : already ? "✅ 今日已簽到" : "🎰 轉動幸運輪盤"}
          </button>

          {/* 簽到成功提示 */}
          {result && (
            <div className="mt-4 w-full bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-2xl p-4 text-center">
              <p className="text-[#89f5a2] font-black text-lg">✅ 簽到成功！</p>
              <p className="text-white/60 text-sm mt-1">
                轉到 <span className="text-[#89f5a2] font-black">+{result.spinCredits} 點</span>
                {result.bonusCredits > 0 && (
                  <span className="text-yellow-300 font-black">（含連續獎勵 +{result.bonusCredits}點 🎉）</span>
                )}
              </p>
              {result.bonusVideo && (
                <p className="text-purple-300 font-black text-sm mt-2">🎬 今日影片額度已重置，可再生成 1 支！</p>
              )}
            </div>
          )}
        </div>

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
            {cells.map(({ day, isChecked, isBonus7, isBonus14, isBonus21, isBonus30 }) => (
              <div key={day}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-black border transition-all
                  ${isChecked
                    ? "bg-[#89f5a2]/20 border-[#89f5a2]/50 text-[#89f5a2]"
                    : "bg-white/4 border-white/8 text-white/25"
                  }
                  ${isBonus7 || isBonus14 || isBonus21 || isBonus30 ? "ring-1 ring-yellow-400/50" : ""}
                `}>
                {isChecked ? "✓" : day}
                {(isBonus7 || isBonus14 || isBonus21 || isBonus30) && (
                  <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-yellow-400 text-[#0d2318] rounded-full px-1 font-black leading-tight">
                    {isBonus7 ? "+3" : isBonus14 ? "+5" : isBonus21 ? "+5" : "+10"}
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

        {/* 🎂 生日設定 */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl border border-white/10 p-5 space-y-3">
          <div>
            <p className="text-white font-black text-sm">🎂 設定你的生日</p>
            <p className="text-white/30 text-xs mt-1">填寫後，生日當天角色會送你驚喜！（選填）</p>
            {!birthday && (
              <p className="text-yellow-400/80 text-xs mt-2 font-bold">⚠️ 注意！請勿隨意填寫！生日只能設定一次，設定後無法修改。</p>
            )}
          </div>
          {birthday ? (
            <div className="space-y-2">
              <p className="text-white/50 text-sm">🎂 已設定：{birthday.replace("-", " 月 ")} 日</p>
              <p className="text-white/25 text-xs">生日設定後無法修改，如有問題請聯絡客服。</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="number"
                  min={1}
                  max={12}
                  placeholder="月 MM"
                  value={birthdayMonth}
                  onChange={e => setBirthdayMonth(e.target.value.padStart(2, "0").slice(-2))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-white text-sm text-center focus:outline-none focus:border-[#89f5a2]/40 placeholder-white/20"
                />
                <span className="text-white/30 text-sm">月</span>
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <input
                  type="number"
                  min={1}
                  max={31}
                  placeholder="日 DD"
                  value={birthdayDay}
                  onChange={e => setBirthdayDay(e.target.value.padStart(2, "0").slice(-2))}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-white text-sm text-center focus:outline-none focus:border-[#89f5a2]/40 placeholder-white/20"
                />
                <span className="text-white/30 text-sm">日</span>
              </div>
              <button
                onClick={async () => {
                  if (!session?.user?.email) return;
                  if (birthday) return; // 已設定則拒絕
                  const mm = birthdayMonth.padStart(2, "0");
                  const dd = birthdayDay.padStart(2, "0");
                  if (!mm || !dd) return;
                  const val = `${mm}-${dd}`;
                  await fetch("/api/user/birthday", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: session.user.email, birthday: val }),
                  });
                  setBirthday(val);
                  setBirthdaySaved(true);
                  setTimeout(() => setBirthdaySaved(false), 2000);
                }}
                className="px-4 py-2 bg-[#89f5a2]/15 border border-[#89f5a2]/30 text-[#89f5a2] rounded-xl text-xs font-black hover:bg-[#89f5a2]/25 transition-all whitespace-nowrap"
              >
                {birthdaySaved ? "✅ 已儲存" : "儲存"}
              </button>
            </div>
          )}
        </div>

        {/* 規則說明 */}
        <div className="bg-black/15 rounded-2xl border border-white/5 p-4 space-y-2">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">獎勵規則</p>
          <p className="text-white/50 text-xs">📅 每日簽到 → +1~5點隨機</p>
          <p className="text-white/50 text-xs">🎯 連續簽到第7天 → 額外 +3點</p>
          <p className="text-white/50 text-xs">⭐ 連續簽到第14天 → 額外 +5點</p>
          <p className="text-white/50 text-xs">⭐ 連續簽到第21天 → 額外 +5點</p>
          <p className="text-white/50 text-xs">🏆 連續簽到第30天 → 額外 +10點</p>
          <p className="text-white/50 text-xs">⚠️ 中斷一天後連續天數重新計算</p>
          <p className="text-white/50 text-xs">📱 每個網路每日限一個帳號簽到</p>
          <p className="text-white/50 text-xs">🎬 免費用戶簽到後可額外生成 1 支影片（當日有效）</p>
        </div>

      </div>
    </main>
  );
}