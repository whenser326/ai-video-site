// [DNA_PATCH_START] 完整替換 layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ConditionalHeader from "./components/ConditionalHeader";
import ConditionalFooter from "./components/ConditionalFooter";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d2318" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Consistent Flow" />
        <link rel="apple-touch-icon" href="/logo-splash.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <ConditionalHeader />
          {children}
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
// [DNA_PATCH_END]