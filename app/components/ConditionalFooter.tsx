"use client";
import { usePathname } from "next/navigation";

const HIDE_FOOTER_PATHS = [
  "/chat/",
  "/admin",
];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const hide = HIDE_FOOTER_PATHS.some(p => pathname.startsWith(p));
  if (hide) return null;

  return (
    <footer className="w-full border-t border-white/8 bg-[#0d2318]/80 py-4 px-4 mt-auto">
      <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/30">
        <a href="/terms" className="hover:text-white/60 transition-colors">服務條款</a>
        <a href="/privacy" className="hover:text-white/60 transition-colors">隱私權政策</a>
        <a href="/refund" className="hover:text-white/60 transition-colors">退款政策</a>
        <a href="/contact" className="hover:text-white/60 transition-colors">聯絡我們</a>
        <span className="text-white/15">© 2026 Consistent Flow</span>
      </div>
    </footer>
  );
}