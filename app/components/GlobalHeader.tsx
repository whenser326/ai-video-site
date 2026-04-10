"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function GlobalHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  if (!session) return null;
  if (pathname === '/pricing') return null;

  const handleTopUp = () => router.push('/pricing#plans');
  const mailSubject = encodeURIComponent("Consistent Flow 用戶回饋");
  const mailBody = encodeURIComponent("您好，我想反映以下問題或建議：\n\n");

  // [DNA_PATCH_START]
  const handleReferral = () => {
    window.dispatchEvent(new CustomEvent("open-referral-modal"));
  };
  // [DNA_PATCH_END]

  return (
    <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 flex flex-col sm:flex-row gap-1.5 sm:gap-2">
      <button
        onClick={() => router.push('/characters')}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-400/15 backdrop-blur-md border border-purple-400/40 rounded-full text-purple-300 text-xs font-bold hover:bg-purple-400/25 transition-all hover:scale-105 active:scale-95"
      >
        🎭 我的角色
      </button>
      <button
        onClick={handleTopUp}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#89f5a2]/15 backdrop-blur-md border border-[#89f5a2]/40 rounded-full text-[#89f5a2] text-xs font-bold hover:bg-[#89f5a2]/25 transition-all hover:scale-105 active:scale-95"
      >
        💳 儲值點數
      </button>

      {/* [DNA_PATCH_START] */}
      <button
        onClick={handleReferral}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 backdrop-blur-md border border-yellow-400/30 rounded-full text-yellow-300 text-xs font-bold hover:bg-yellow-400/20 transition-all hover:scale-105 active:scale-95"
      >
        🎁 推薦賺點
      </button>
      {/* [DNA_PATCH_END] */}

      <a href={`mailto:whenser@gmail.com?subject=${mailSubject}&body=${mailBody}`}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/60 text-xs font-bold hover:bg-white/20 hover:text-white transition-all hover:scale-105 active:scale-95"
      >
        💬 意見回饋
      </a>
    </div>
  );
}