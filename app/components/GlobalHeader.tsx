"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from 'react';
import FeedbackModal from './FeedbackModal';

export default function GlobalHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // [DNA_PATCH_START]
  const [showFeedback, setShowFeedback] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user?.email) return;
    const checkUnread = async () => {
      const res = await fetch('/api/feedback');
      const data = await res.json();
      if (data.messages) {
        const count = data.messages.filter(
          (m: { admin_reply: string | null; is_read_by_user: boolean }) =>
            m.admin_reply && !m.is_read_by_user
        ).length;
        setUnreadCount(count);
      }
    };
    checkUnread();
    const interval = setInterval(checkUnread, 60000);
    return () => clearInterval(interval);
  }, [session]);
  // [DNA_PATCH_END]

  if (!session) return null;
  if (pathname === '/pricing') return null;

  const handleTopUp = () => router.push('/pricing#plans');

  // [DNA_PATCH_START]
  const handleReferral = () => {
    window.dispatchEvent(new CustomEvent("open-referral-modal"));
  };
  // [DNA_PATCH_END]

  return (
    <>
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

        {/* [DNA_PATCH_START] */}
        <button
          onClick={() => setShowFeedback(true)}
          className="relative flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/60 text-xs font-bold hover:bg-white/20 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          💬 意見回饋
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        {/* [DNA_PATCH_END] */}
      </div>

      {/* [DNA_PATCH_START] */}
      {showFeedback && session?.user?.email && (
        <FeedbackModal
          userEmail={session.user.email}
          onClose={() => {
            setShowFeedback(false);
            fetch('/api/feedback').then(r => r.json()).then(data => {
              if (data.messages) {
                const count = data.messages.filter(
                  (m: { admin_reply: string | null; is_read_by_user: boolean }) =>
                    m.admin_reply && !m.is_read_by_user
                ).length;
                setUnreadCount(count);
              }
            });
          }}
        />
      )}
      {/* [DNA_PATCH_END] */}
    </>
  );
}