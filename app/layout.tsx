// [DNA_PATCH_START] 完整替換 layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ConditionalHeader from "./components/ConditionalHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Character Studio｜AI 角色生成平台",
  description: "用 AI 生成高精度角色圖片與影片，支援角色一致性、不同姿勢批次生成、語音合成、嘴型同步。免費試用，台灣首選 AI 角色創作工具。",
  keywords: "AI角色生成, AI圖片生成, AI影片生成, 角色一致性, AI繪圖, 台灣AI工具, character AI, AI avatar",
  openGraph: {
    title: "AI Character Studio｜AI 角色生成平台",
    description: "用 AI 生成高精度角色圖片與影片，支援角色一致性、批次生成不同姿勢、語音合成、嘴型同步。",
    url: "https://ai-video-site-psi.vercel.app",
    siteName: "AI Character Studio",
    images: [
      {
        url: "https://ai-video-site-psi.vercel.app/logo.png",
        width: 512,
        height: 512,
        alt: "AI Character Studio",
      },
    ],
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Character Studio｜AI 角色生成平台",
    description: "用 AI 生成高精度角色圖片與影片，支援角色一致性、批次生成、語音合成。",
    images: ["https://ai-video-site-psi.vercel.app/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <ConditionalHeader />
          {children}
          {/* Footer */}
          <footer className="w-full border-t border-white/8 bg-[#0d2318]/80 py-4 px-4 mt-auto">
            <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/30">
              <a href="/terms" className="hover:text-white/60 transition-colors">服務條款</a>
              <a href="/privacy" className="hover:text-white/60 transition-colors">隱私權政策</a>
              <a href="/refund" className="hover:text-white/60 transition-colors">退款政策</a>
              <a href="/contact" className="hover:text-white/60 transition-colors">聯絡我們</a>
              <span className="text-white/15">© 2026 Consistent Flow</span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
// [DNA_PATCH_END]