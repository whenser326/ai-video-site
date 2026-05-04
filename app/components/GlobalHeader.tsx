// [DNA_PATCH_START] GlobalHeader 全面改版：LOGO + 點數 + 漢堡選單 RWD
"use client";
import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from 'react';
import FeedbackModal from './FeedbackModal';

export default function GlobalHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showFeedback, setShowFeedback] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

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

  // 點數同步
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user/credits?email=${session.user.email}`)
      .then(r => r.json())
      .then(d => { if (d.credits !== undefined) setCredits(d.credits); });
  }, [session]);

  // [DNA_PATCH_START] 點外部關閉 Drawer（排除漢堡按鈕本身）
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        drawerRef.current && !drawerRef.current.contains(e.target as Node) &&
        hamburgerRef.current && !hamburgerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);
  // [DNA_PATCH_END]

// [DNA_PATCH_START] 未登入補 LOGO
if (!session) return (
  <>
    <div className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-3 sm:px-5
                    bg-[#0d2318]/95 backdrop-blur-md border-b border-white/8">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <img src="/logo.png" alt="Consistent Flow" className="h-7 w-auto" />
        <span className="hidden xs:inline text-[#89f5a2] text-xs font-bold tracking-wide whitespace-nowrap">
          Consistent Flow
        </span>
      </button>
      {/* [DNA_PATCH_START] 未登入Header加定價方案按鈕 */}
      <div className="flex items-center gap-2">
        {pathname !== '/pricing' && (
          <button
            onClick={() => router.push('/pricing#plans')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
                       border border-white/20 text-white/60 bg-white/5 hover:bg-white/10 transition-all"
          >
            💳 定價方案
          </button>
        )}
        <button
          onClick={() => {
            const ua = navigator.userAgent;
            const isInAppBrowser = ua.includes('Line/') || ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('Instagram') || ua.includes('WhatsApp') || ua.includes('Twitter');
            if (isInAppBrowser) {
              window.location.href = window.location.href +
                (window.location.href.includes('?') ? '&' : '?') +
                'openExternalBrowser=1';
              return;
            }
            signIn("google", {}, { prompt: "select_account" });
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
                     border border-[#89f5a2]/30 text-[#89f5a2] bg-[#89f5a2]/10 hover:bg-[#89f5a2]/20 transition-all"
        >
          使用 Google 登入
        </button>
      </div>
      {/* [DNA_PATCH_END] */}
    </div>
    <div className="h-12" />
  </>
);
// [DNA_PATCH_END]
  if (pathname === '/pricing') return null;

  const handleTopUp = () => { router.push('/pricing#plans'); setMenuOpen(false); };
  const handleReferral = () => { window.dispatchEvent(new CustomEvent("open-referral-modal")); setMenuOpen(false); };

  const menuItems = [
    {
      label: '📖 使用指南',
      onClick: () => {
        const key = `onboarding_done_${session?.user?.email}`;
        localStorage.removeItem(key);
        window.dispatchEvent(new CustomEvent('open-onboarding'));
        setMenuOpen(false);
      },
      className: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20',
    },
    {      
      label: '🎭 我的角色',
      onClick: () => { router.push('/characters'); setMenuOpen(false); },
      className: 'text-purple-300 border-purple-400/30 bg-purple-400/10 hover:bg-purple-400/20',
    },
    {
      label: '📅 每日簽到',
      onClick: () => { router.push('/checkin'); setMenuOpen(false); },
      className: 'text-blue-300 border-blue-400/30 bg-blue-400/10 hover:bg-blue-400/20',
    },
    {
      label: '💳 儲值點數',
      onClick: handleTopUp,
      className: 'text-[#89f5a2] border-[#89f5a2]/30 bg-[#89f5a2]/10 hover:bg-[#89f5a2]/20',
    },
    {
      label: '🎁 推薦賺點',
      onClick: handleReferral,
      className: 'text-yellow-300 border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20',
    },
    {
      label: '💬 意見回饋',
      onClick: () => { setShowFeedback(true); setMenuOpen(false); },
      className: 'text-white/60 border-white/15 bg-white/5 hover:bg-white/10',
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  return (
    <>
      {/* Header 主列 */}
      <div className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-3 sm:px-5
                      bg-[#0d2318]/95 backdrop-blur-md border-b border-white/8">

        {/* 左：LOGO */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <img src="/logo.png" alt="Consistent Flow" className="h-7 w-auto" />
          <span className="hidden xs:inline text-[#89f5a2] text-xs font-bold tracking-wide whitespace-nowrap">
            Consistent Flow
          </span>
        </button>
<div className="flex-1 sm:hidden" />
        {/* [DNA_PATCH_START] 主導覽（桌面版，登入後才顯示） */}
        <div className="hidden sm:flex items-center gap-1 mx-3 flex-1 min-w-0" />
        {/* [DNA_PATCH_END] */}

        {/* 右：點數 + 電腦版按鈕 + 漢堡 */}
        <div className="flex items-center gap-2">

          {/* 點數徽章（永遠顯示） */}
          {credits !== null && (
            <button
              onClick={handleTopUp}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#89f5a2]/10 border border-[#89f5a2]/30
                         rounded-full text-[#89f5a2] text-xs font-bold hover:bg-[#89f5a2]/20 transition-all"
            >
              💎 {credits} 點
            </button>
          )}

          {/* 電腦版：直接顯示按鈕（sm 以上） */}
          <div className="hidden sm:flex items-center gap-1.5">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
                            border transition-all hover:scale-105 active:scale-95 ${item.className}`}
              >
                {item.label}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px]
                                   rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
            <button
  onClick={() => signOut({ callbackUrl: "/" })}
  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
             border border-white/10 text-white/30 bg-white/5 hover:bg-white/15 transition-all"
>
  🚪 登出
</button>
          </div>

          {/* 手機版：漢堡按鈕（sm 以下） */}
          <button
            ref={hamburgerRef}
            onClick={() => setMenuOpen(v => !v)}
            className="sm:hidden flex flex-col items-center justify-center gap-[4px]
                       w-9 h-9 rounded-xl border border-white/20 bg-white/8
                       hover:bg-white/15 transition-all active:scale-95"
            aria-label="選單"
          >
            <span className={`block w-4 h-[1.5px] bg-white/70 rounded transition-all duration-200
                              ${menuOpen ? 'translate-y-[5.5px] rotate-45' : ''}`} />
            <span className={`block w-4 h-[1.5px] bg-white/70 rounded transition-all duration-200
                              ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-4 h-[1.5px] bg-white/70 rounded transition-all duration-200
                              ${menuOpen ? '-translate-y-[5.5px] -rotate-45' : ''}`} />
          </button>

        </div>
      </div>

      {/* 手機版 Drawer（漢堡展開） */}
      {menuOpen && (
        <div
          ref={drawerRef}
          className="sm:hidden fixed top-12 left-0 right-0 z-40
                     bg-[#0d2318]/98 backdrop-blur-md border-b border-white/10
                     px-4 py-3 flex flex-col gap-2"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`relative flex items-center gap-2 w-full px-4 py-3 rounded-xl
                          text-sm font-bold border transition-all active:scale-98 ${item.className}`}
            >
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-[10px]
                                 rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          {/* 登出（只在 Drawer 裡顯示） */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold
                       border border-white/10 text-white/30 bg-white/3 hover:bg-white/8 transition-all"
          >
            🚪 登出
          </button>
        </div>
      )}

      {/* Header 佔位高度（防止內容被蓋住） */}
      <div className="h-12" />

      {/* FeedbackModal */}
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
    </>
  );
}
// [DNA_PATCH_END]