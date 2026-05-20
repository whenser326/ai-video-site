"use client";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import { WHY_DIFFERENT } from "../data/whyDifferent";

// [DNA_PATCH_START] 優惠倒數計時元件（後台控制截止時間）
function CountdownBanner({ endTime, bonus, countdownText }: { endTime: string; bonus: { starter: string; standard: string; pro: string }; countdownText: string }) {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  React.useEffect(() => {
    if (!endTime) return;
    const calc = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;
      if (diff <= 0) { setTimeLeft(t => ({ ...t, expired: true })); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime || timeLeft.expired) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
      <p className="text-red-300 font-black text-sm mb-1">{countdownText || "🔥 限時優惠！購買任一方案加贈點數"}</p>
      <p className="text-white/50 text-xs mb-3">
        入門+{bonus.starter}點 ／ 標準+{bonus.standard}點 ／ 專業+{bonus.pro}點
      </p>
      <div className="flex items-center justify-center gap-2">
        {timeLeft.days > 0 && (
          <>
            <div className="bg-black/30 rounded-xl px-3 py-2 min-w-[52px]">
              <p className="text-white font-black text-xl tabular-nums">{pad(timeLeft.days)}</p>
              <p className="text-white/30 text-[10px]">天</p>
            </div>
            <span className="text-white/40 font-black text-xl">:</span>
          </>
        )}
        <div className="bg-black/30 rounded-xl px-3 py-2 min-w-[52px]">
          <p className="text-white font-black text-xl tabular-nums">{pad(timeLeft.hours)}</p>
          <p className="text-white/30 text-[10px]">時</p>
        </div>
        <span className="text-white/40 font-black text-xl">:</span>
        <div className="bg-black/30 rounded-xl px-3 py-2 min-w-[52px]">
          <p className="text-white font-black text-xl tabular-nums">{pad(timeLeft.minutes)}</p>
          <p className="text-white/30 text-[10px]">分</p>
        </div>
        <span className="text-white/40 font-black text-xl">:</span>
        <div className="bg-black/30 rounded-xl px-3 py-2 min-w-[52px]">
          <p className="text-white font-black text-xl tabular-nums">{pad(timeLeft.seconds)}</p>
          <p className="text-white/30 text-[10px]">秒</p>
        </div>
      </div>
    </div>
  );
}
// [DNA_PATCH_END]
export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [referralCode, setReferralCode] = React.useState("");
  const [promo, setPromo] = React.useState({
    countdown_end: "",
    quota_starter: "", quota_standard: "", quota_pro: "",
    firstbuy_text: "",
    banner_text: "",
    badge_starter: "", badge_standard: "", badge_pro: "",
    bonus_starter: "5", bonus_standard: "7", bonus_pro: "10",
    countdown_text: "",
  });
  const [isPaidUser, setIsPaidUser] = React.useState(false);
  const [prices, setPrices] = React.useState<Record<string, string>>({
    starter: "250", standard: "450", pro: "799",
  });
  // [DNA_PATCH_START] 動態影片點數
  const [videoCredits, setVideoCredits] = React.useState({
    kling_5s_starter: "6", kling_5s_standard: "5", kling_5s_pro: "4",
    seedance_5s_starter: "17", seedance_5s_standard: "15", seedance_5s_pro: "13",
    omni_extra_starter: "6", omni_extra_standard: "5", omni_extra_pro: "4",
    tts_credits_starter: "8", tts_credits_standard: "7", tts_credits_pro: "6",
    wav2lip_credits_starter: "10", wav2lip_credits_standard: "9", wav2lip_credits_pro: "8",
  });

  const plans = React.useMemo(() => {
    const ttsStarter = parseInt(videoCredits.tts_credits_starter) + parseInt(videoCredits.wav2lip_credits_starter);
    const ttsStandard = parseInt(videoCredits.tts_credits_standard) + parseInt(videoCredits.wav2lip_credits_standard);
    const ttsPro = parseInt(videoCredits.tts_credits_pro) + parseInt(videoCredits.wav2lip_credits_pro);
    const omniStarter = parseInt(videoCredits.seedance_5s_starter) + parseInt(videoCredits.omni_extra_starter);
    const omniStandard = parseInt(videoCredits.seedance_5s_standard) + parseInt(videoCredits.omni_extra_standard);
    const omniPro = parseInt(videoCredits.seedance_5s_pro) + parseInt(videoCredits.omni_extra_pro);
    return [
      {
        name: "入門包", emoji: "🌱", credits: 30,
        bg: "#1a2e1a", border: "#3B6D11", badgeBg: "", badgeText: "", badge: "",
        titleColor: "#C0DD97", subColor: "#639922",
        features: [
          "30 點數", "圖片生成 1點/張",
          `Kling 3.0 影片 ${videoCredits.kling_5s_starter}點/支`,
          `Seedance 2.0 ${videoCredits.seedance_5s_starter}點/支（5秒）`,
          `Seedance Omni-Reference ${omniStarter}點/支（5秒）`,
          "角色一致性功能", "批次生成 2張",
          `角色配音 ${ttsStarter}點/次`,
          "歷史紀錄保存 30 天 / 5 筆",
        ],
        plan: "starter",
      },
      {
        name: "標準包", emoji: "⭐", credits: 80,
        bg: "#1a2435", border: "#378ADD", badgeBg: "#185FA5", badgeText: "#B5D4F4", badge: "最多人選",
        titleColor: "#B5D4F4", subColor: "#378ADD",
        features: [
          "80 點數", "圖片生成 1點/張",
          `Kling 3.0 影片 ${videoCredits.kling_5s_standard}點/支`,
          `Seedance 2.0 ${videoCredits.seedance_5s_standard}點/支（5秒）`,
          `Seedance Omni-Reference ${omniStandard}點/支（5秒）`,
          "角色一致性功能", "批次生成 4張",
          `角色配音 ${ttsStandard}點/次`,
          "歷史紀錄保存 30 天 / 10 筆",
        ],
        plan: "standard",
      },
      {
        name: "專業包", emoji: "🚀", credits: 200,
        bg: "#2a1f0a", border: "#BA7517", badgeBg: "#854F0B", badgeText: "#FAC775", badge: "最划算",
        titleColor: "#FAC775", subColor: "#EF9F27",
        features: [
          "200 點數", "圖片生成 1點/張",
          `Kling 3.0 影片 ${videoCredits.kling_5s_pro}點/支`,
          `Seedance 2.0 ${videoCredits.seedance_5s_pro}點/支（5秒）`,
          `Seedance Omni-Reference ${omniPro}點/支（5秒）`,
          "角色一致性功能", "批次生成 6張",
          `角色配音 ${ttsPro}點/次`,
          "歷史紀錄保存 90 天 / 30 筆",
        ],
        plan: "pro",
      },
    ];
  }, [videoCredits]);
  // [DNA_PATCH_END]

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      const code = refCode.toUpperCase();
      setReferralCode(code);
      localStorage.setItem("referral_code", code);
    } else {
      const saved = localStorage.getItem("referral_code");
      if (saved) setReferralCode(saved);
    }
  }, []);

  React.useEffect(() => {
    fetch("/api/referral/settings-public")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setPrices({
            starter: data.settings.plan_price_starter || "250",
            standard: data.settings.plan_price_standard || "450",
            pro: data.settings.plan_price_pro || "799",
          });
          setVideoCredits(prev => ({ ...prev, ...data.settings }));
          setPromo({
            countdown_end: data.settings.promo_countdown_end || "",
            quota_starter: data.settings.promo_quota_starter || "",
            quota_standard: data.settings.promo_quota_standard || "",
            quota_pro: data.settings.promo_quota_pro || "",
            firstbuy_text: data.settings.promo_firstbuy_text || "",
            banner_text: data.settings.promo_banner_text || "",
            badge_starter: data.settings.promo_badge_starter || "",
            badge_standard: data.settings.promo_badge_standard || "",
            badge_pro: data.settings.promo_badge_pro || "",
            bonus_starter: data.settings.plan_bonus_credits_starter || "5",
            bonus_standard: data.settings.plan_bonus_credits_standard || "7",
            bonus_pro: data.settings.plan_bonus_credits_pro || "10",
            countdown_text: data.settings.promo_countdown_text || "",
          });
        }
      });
    // 檢查是否首購用戶
    if (session?.user?.email) {
      fetch(`/api/user/credits?email=${session.user.email}`)
        .then(r => r.json())
        .then(d => { if (d.plan && d.plan !== "free") setIsPaidUser(true); });
    }
  }, [session]);

  const handleBuy = async (plan: string) => {
    if (!session) { signIn("google"); return; }
    try {
      const res = await fetch("/api/newebpay/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ plan, email: session.user?.email, referralCode: referralCode.trim().toUpperCase() }),
});
const data = await res.json();
if (data.TradeInfo) {
  localStorage.removeItem("referral_code");
  // 建立隱藏表單 POST 到藍新
  const form = document.createElement("form");
  form.method = "POST";
  form.action = data.url;
  const fields = {
    MerchantID: data.MerchantID,
    TradeInfo: data.TradeInfo,
    TradeSha: data.TradeSha,
    Version: data.Version,
  };
  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value as string;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
} else alert("付款連結建立失敗，請重試");
    } catch (err) {
      alert("連線失敗，請重試");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#89f5a2]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#4ade80]/6 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <button onClick={() => router.push('/')} className="mb-8 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 hover:text-white/70 transition-all">
          ← 返回首頁
        </button>

        <div
          className="relative w-full max-w-lg mx-auto mb-2"
          style={{
            height: '380px',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 80% at 50% 50%, black 30%, transparent 80%)',
            maskImage: 'radial-gradient(ellipse 60% 100% at 50% 50%, black 30%, transparent 80%)',
          }}
        >
          <img src="/logo.png" alt="Consistent Flow" className="w-full h-full object-contain" />
        </div>
{/* [DNA_PATCH_START] N04 優惠控制系統 */}
        {/* 公告條 */}
        {promo.banner_text && (
          <div className="mb-6 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl text-center">
            <p className="text-yellow-300 font-black text-sm">{promo.banner_text}</p>
          </div>
        )}
        {/* 首購優惠（未付費用戶才顯示） */}
        {promo.firstbuy_text && !isPaidUser && (
          <div className="mb-6 p-3 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-2xl text-center">
            <p className="text-[#89f5a2] font-black text-sm">🎁 {promo.firstbuy_text}</p>
          </div>
        )}
        {/* 倒數計時 */}
        <CountdownBanner
          endTime={promo.countdown_end}
          bonus={{ starter: promo.bonus_starter, standard: promo.bonus_standard, pro: promo.bonus_pro }}
          countdownText={promo.countdown_text}
        />
        {/* [DNA_PATCH_END] */}
        {/* [DNA_PATCH_START] 免費試用入口 */}
        {!session && (
          <div className="mb-6 p-5 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-2xl text-center">
            <p className="text-white font-black text-base mb-1">🎁 還沒有帳號？先免費試用</p>
            <p className="text-white/50 text-xs mb-4">不需信用卡，立即獲得 5 點開始體驗</p>
            <button
              onClick={() => signIn("google")}
              className="px-8 py-3 bg-[#89f5a2] text-[#0d2318] font-black rounded-xl text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              用 Google 免費註冊 →
            </button>
          </div>
        )}
        {/* [DNA_PATCH_END] */}

        {/* 免費版 */}
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🆓</span>
            <div>
              <p className="text-white font-bold text-sm">免費版</p>
              <p className="text-white/60 text-xs">免費試用 5 點，立即體驗 AI 角色生成與鎖定功能</p>
            </div>
          </div>
          <span className="text-white/30 text-sm font-bold">$0</span>
        </div>

        {/* 介紹碼 */}
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-white/60 text-xs mb-2">有朋友推薦你嗎？輸入介紹碼後購買，朋友可獲得獎勵點數 🎁</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="輸入介紹碼（選填）"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-[#89f5a2]/50"
            />
            {referralCode && (
              <button onClick={() => setReferralCode("")} className="px-3 py-2 text-white/40 hover:text-white/70 text-sm">✕</button>
            )}
          </div>
        </div>

        {/* 付費方案 */}
        <div id="plans" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {plans.map((p) => (
            <div
              key={p.plan}
              className="relative rounded-3xl p-6 backdrop-blur-sm"
              style={{ background: p.bg, border: `${p.plan === 'standard' ? 2 : 1}px solid ${p.border}` }}
            >
              {/* badge：後台有設定就用後台的，沒有才用原有的 */}
              {(promo[`badge_${p.plan}` as keyof typeof promo] || p.badge) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-black rounded-full"
                  style={{
                    background: promo[`badge_${p.plan}` as keyof typeof promo] ? 'rgba(239,68,68,0.8)' : p.badgeBg,
                    color: promo[`badge_${p.plan}` as keyof typeof promo] ? 'white' : p.badgeText,
                  }}>
                  {promo[`badge_${p.plan}` as keyof typeof promo] || p.badge}
                </div>
              )}
              <div className="text-3xl mb-3">{p.emoji}</div>
              <h2 className="font-black text-xl mb-1" style={{ color: p.titleColor }}>{p.name}</h2>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-4xl font-black" style={{ color: p.titleColor }}>${prices[p.plan]}</span>
                <span className="text-sm mb-1" style={{ color: p.subColor }}>NTD</span>
              </div>
              <div className="mb-6 space-y-2">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: p.subColor }}>
                    <span style={{ color: p.titleColor }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              {/* 限量名額顯示 */}
              {promo[`quota_${p.plan}` as keyof typeof promo] && parseInt(promo[`quota_${p.plan}` as keyof typeof promo]) > 0 && (
                <p className="text-center text-xs text-red-300 font-bold mb-2">
                  ⚡ 僅剩 {promo[`quota_${p.plan}` as keyof typeof promo]} 名優惠名額
                </p>
              )}
              <button
                onClick={() => handleBuy(p.plan)}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
                style={{ background: `${p.border}33`, border: `1px solid ${p.border}`, color: p.titleColor }}
              >
                立即購買
              </button>
            </div>
          ))}
        </div>
{/* 為什麼我們不一樣 */}
        <div className="mb-6 rounded-3xl p-8" style={{ background: 'rgba(29,158,200,0.12)', border: '1px solid rgba(29,158,200,0.35)' }}>
          <h3 className="font-black text-xl mb-6 text-center" style={{ color: '#5bd4f0' }}>🧠 為什麼我們不一樣？</h3>
          <div className="space-y-4">
            {WHY_DIFFERENT.map((text, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 mt-0.5" style={{ color: '#5bd4f0' }}>✓</span>
                <span className="text-sm leading-relaxed" style={{ color: 'rgba(180,240,255,0.7)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* 角色一致性說明 */}
        <div className="bg-black/20 border border-white/10 rounded-3xl p-8">
          <h3 className="text-white font-black text-xl mb-6 text-center">🎯 什麼是角色一致性？</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1️⃣", title: "生成你的角色", desc: "用文字描述，AI 生成一張滿意的角色圖" },
              { step: "2️⃣", title: "鎖定角色外觀", desc: "按下「鎖定此角色」，AI 記住這個角色" },
              { step: "3️⃣", title: "跨場景保持一致", desc: "不同場景、服裝、動作，都是同一張臉" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{item.step}</div>
                <p className="text-white font-bold text-sm mb-1">{item.title}</p>
                <p className="text-white/40 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}