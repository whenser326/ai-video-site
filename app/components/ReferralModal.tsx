"use client";

// app/components/ReferralModal.tsx
// Code Splitting — 推薦賺點 Modal

interface ReferralCredits {
  starter: string;
  standard: string;
  pro: string;
}

interface Milestone {
  index: number;
  count: number;
  credits: number;
  claimed: boolean;
  reached: boolean;
}

interface ReferralModalProps {
  referralCode: string | null;
  referralCredits: ReferralCredits | null;
  copiedCode: boolean;
  setCopiedCode: (b: boolean) => void;
  copiedLink: boolean;
  setCopiedLink: (b: boolean) => void;
  onClose: () => void;
  milestones?: Milestone[];
  referralCount?: number;
}

export default function ReferralModal({
  referralCode,
  referralCredits,
  copiedCode,
  setCopiedCode,
  copiedLink,
  setCopiedLink,
  onClose,
  milestones = [],
  referralCount = 0,
}: ReferralModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#0d2318] border border-yellow-400/20 rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="text-center">
          <p className="text-3xl mb-1">🎁</p>
          <h2 className="text-white font-black text-xl">推薦賺點</h2>
          <p className="text-white/50 text-xs mt-1">
            推薦朋友升級方案，朋友付款成功後<br />
            你最高可獲得{" "}
            <span className="text-yellow-300 font-black">{referralCredits?.pro ?? "..."} 點</span> 獎勵！
          </p>
        </div>
{/* 推薦里程碑進度條 */}
        {milestones.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-white/40 text-xs font-bold tracking-wider uppercase">推薦里程碑</p>
              <p className="text-white/50 text-xs">已推薦 <span className="text-yellow-300 font-black">{referralCount}</span> 人</p>
            </div>

            {milestones.map((m) => {
              const maxCount = m.count;
              const progress = Math.min(referralCount / maxCount, 1);
              return (
                <div key={m.index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-xs">
                      {m.claimed ? "✅" : m.reached ? "🎉" : "🎯"} 推薦 {m.count} 人
                    </span>
                    <span className={`text-xs font-black ${m.claimed ? "text-white/30" : "text-yellow-300"}`}>
                      {m.claimed ? "已發放" : `+${m.credits} 點`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.claimed ? "bg-white/20" : "bg-gradient-to-r from-yellow-400 to-yellow-300"
                      }`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* 方案獎勵對照 */}
        <div className="bg-white/5 rounded-2xl p-4 space-y-2">
          <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-3">方案獎勵對照</p>
          {[
            { label: "🌱 入門包", key: "starter" },
            { label: "⭐ 標準包", key: "standard" },
            { label: "🚀 專業包", key: "pro" },
          ].map(({ label, key }) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-white/70 text-sm">{label}</span>
              <span className="text-yellow-300 font-black text-sm">
                + {referralCredits?.[key as "starter" | "standard" | "pro"] ?? "..."} 點
              </span>
            </div>
          ))}
        </div>

        {/* 介紹碼 */}
        <div>
          <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">你的專屬介紹碼</p>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono font-black tracking-widest text-center">
              {referralCode ?? "載入中..."}
            </div>
            <button
              onClick={() => {
                if (referralCode) {
                  navigator.clipboard.writeText(referralCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }
              }}
              className="px-4 py-3 bg-yellow-400/20 border border-yellow-400/30 rounded-xl text-yellow-300 text-xs font-bold hover:bg-yellow-400/30 transition-all whitespace-nowrap"
            >
              {copiedCode ? "✅ 已複製" : "複製"}
            </button>
          </div>
        </div>

        {/* 專屬連結 */}
        <div>
          <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">你的專屬連結</p>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 text-xs font-mono truncate">
              {referralCode
                ? `${window.location.origin}/pricing?ref=${referralCode}`
                : "載入中..."}
            </div>
            <button
              onClick={() => {
                if (referralCode) {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/pricing?ref=${referralCode}`
                  );
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }
              }}
              className="px-4 py-3 bg-yellow-400/20 border border-yellow-400/30 rounded-xl text-yellow-300 text-xs font-bold hover:bg-yellow-400/30 transition-all whitespace-nowrap"
            >
              {copiedLink ? "✅ 已複製" : "複製"}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
