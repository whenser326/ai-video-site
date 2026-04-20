"use client";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

// [DNA_PATCH_START] 更新方案功能列表
const plans = [
  {
    name: "入門包",
    emoji: "🌱",
    price: "$5",
    credits: 30,
    bg: "#1a2e1a",
    border: "#3B6D11",
    badgeBg: "",
    badgeText: "",
    badge: "",
    titleColor: "#C0DD97",
    subColor: "#639922",
    features: ["30 點數", "圖片生成 1點/張", "Kling 3.0 影片 6點/支", "Seedance 2.0 17點/支（5秒）", "Seedance Omni-Reference 23點/支（5秒）", "角色一致性功能", "批次生成 2張", "角色配音 18點/次", "歷史紀錄保存 30 天 / 5 筆"],
    plan: "starter",
  },
  {
    name: "標準包",
    emoji: "⭐",
    price: "$12",
    credits: 80,
    bg: "#1a2435",
    border: "#378ADD",
    badgeBg: "#185FA5",
    badgeText: "#B5D4F4",
    badge: "最多人選",
    titleColor: "#B5D4F4",
    subColor: "#378ADD",
    features: ["80 點數", "圖片生成 1點/張", "Kling 3.0 影片 5點/支", "Seedance 2.0 15點/支（5秒）", "Seedance Omni-Reference 20點/支（5秒）", "角色一致性功能", "批次生成 4張", "角色配音 16點/次", "歷史紀錄保存 30 天 / 10 筆"],
    plan: "standard",
  },
  {
    name: "專業包",
    emoji: "🚀",
    price: "$25",
    credits: 200,
    bg: "#2a1f0a",
    border: "#BA7517",
    badgeBg: "#854F0B",
    badgeText: "#FAC775",
    badge: "最划算",
    titleColor: "#FAC775",
    subColor: "#EF9F27",
    features: ["200 點數", "圖片生成 1點/張", "Kling 3.0 影片 4點/支", "Seedance 2.0 13點/支（5秒）", "Seedance Omni-Reference 17點/支（5秒）", "角色一致性功能", "批次生成 6張", "角色配音 14點/次", "歷史紀錄保存 90 天 / 30 筆"],
    plan: "pro",
  },
];
// [DNA_PATCH_END]

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  // [DNA_PATCH_START]
  const [referralCode, setReferralCode] = React.useState("");
  // [DNA_PATCH_END]

  // [DNA_PATCH_START] 自動讀取 URL ref 參數 + localStorage 記住介紹碼
  React.useEffect(() => {
    // 優先讀 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      const code = refCode.toUpperCase();
      setReferralCode(code);
      localStorage.setItem("referral_code", code);
    } else {
      // URL 沒有就讀 localStorage（之前點過連結但沒馬上買）
      const saved = localStorage.getItem("referral_code");
      if (saved) setReferralCode(saved);
    }
  }, []);
  // [DNA_PATCH_END]
  // [DNA_PATCH_START] 動態價格
  const [prices, setPrices] = React.useState<Record<string, string>>({
    starter: "5",
    standard: "12",
    pro: "25",
  });

  React.useEffect(() => {
    fetch("/api/referral/settings-public")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setPrices({
            starter: data.settings.plan_price_starter || "5",
            standard: data.settings.plan_price_standard || "12",
            pro: data.settings.plan_price_pro || "25",
          });
        }
      });
  }, []);
  // [DNA_PATCH_END]

// [DNA_PATCH_START] 串接 Stripe 付款
const handleBuy = async (plan: string) => {
  if (!session) { signIn("google"); return; }
  
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, email: session.user?.email, referralCode: referralCode.trim().toUpperCase() }),
    });
    const data = await res.json();
    if (data.url) {
      localStorage.removeItem("referral_code");
      window.location.href = data.url;
    }
    else alert("付款連結建立失敗，請重試");
  } catch (err) {
    alert("連線失敗，請重試");
  }
};
// [DNA_PATCH_END]

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d] p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#89f5a2]/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#4ade80]/6 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <button onClick={() => router.push('/')} className="mb-8 flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
          ← 返回主頁
        </button>

{/* [DNA_PATCH_START] LOGO 全寬顯示邊緣漸隱 */}
<div
  className="relative w-full max-w-lg mx-auto mb-2"
  style={{
    height: '380px',
    WebkitMaskImage: 'radial-gradient(ellipse 75% 80% at 50% 50%, black 30%, transparent 80%)',
    maskImage: 'radial-gradient(ellipse 60% 100% at 50% 50%, black 30%, transparent 80%)',
  }}
>
  <img
    src="/logo.png"
    alt="Consistent Flow"
    className="w-full h-full object-contain"
  />
</div>
{/* [DNA_PATCH_END] */}

        {/* 免費版 */}
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🆓</span>
            <div>
              <p className="text-white font-bold text-sm">免費版</p>
              <p className="text-white/40 text-xs">5 點體驗、僅圖片生成、無角色一致性</p>
            </div>
          </div>
          <span className="text-white/30 text-sm font-bold">$0</span>
        </div>

        {/* 付費方案 */}
        {/* [DNA_PATCH_START] 介紹碼輸入欄位 */}
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
              <button
                onClick={() => setReferralCode("")}
                className="px-3 py-2 text-white/40 hover:text-white/70 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {/* [DNA_PATCH_END] */}

        {/* 付費方案 */}
        <div id="plans" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {plans.map((p) => (
            <div
              key={p.plan}
              className="relative rounded-3xl p-6 backdrop-blur-sm"
              style={{ background: p.bg, border: `${p.plan === 'standard' ? 2 : 1}px solid ${p.border}` }}
            >
              {p.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-black rounded-full"
                  style={{ background: p.badgeBg, color: p.badgeText }}
                >
                  {p.badge}
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