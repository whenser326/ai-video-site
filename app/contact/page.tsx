"use client";
import { useState, useEffect, useRef } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      setError("請填寫所有欄位");
      return;
    }
    if (!turnstileToken) {
      setError("請等待驗證完成");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "送出失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-16 pb-12 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-black text-white mb-2">聯絡我們</h1>
        <p className="text-white/40 text-xs mb-8">Consistent Flow 客服中心</p>

        <div className="space-y-6">

          {/* 聯絡表單 */}
          <div className="bg-black/25 border border-white/10 rounded-2xl p-6 space-y-4">
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">傳送訊息給我們</p>

            {success ? (
              <div className="text-center py-8">
                <p className="text-[#89f5a2] text-2xl font-black mb-2">✅ 已送出！</p>
                <p className="text-white/50 text-sm">我們將於 1–3 個工作天內回覆您</p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="您的姓名"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#89f5a2]/50"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="您的 Email"
                  type="email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#89f5a2]/50"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="請描述您的問題或意見..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#89f5a2]/50 resize-none"
                />

                {/* Turnstile */}
                <div ref={turnstileRef} />

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#89f5a2] to-[#4ade80] text-[#0d2318] font-black text-sm hover:opacity-90 transition-all disabled:opacity-40"
                >
                  {submitting ? "送出中..." : "📨 送出訊息"}
                </button>
              </div>
            )}
          </div>

          {/* Email 聯絡 */}
          <div className="bg-black/25 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">客服 Email</p>
              <a href="mailto:whenserjp@gmail.com" className="text-[#89f5a2] text-lg font-bold hover:underline">
                whenserjp@gmail.com
              </a>
              <p className="text-white/30 text-xs mt-1">回覆時間：1–3 個工作天</p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">常見問題</p>
              <div className="space-y-3 text-sm text-white/60">
                <div>
                  <p className="text-white/80 font-bold">點數購買後未到帳？</p>
                  <p>請來信並附上付款截圖，我們將於 1 個工作天內處理。</p>
                </div>
                <div>
                  <p className="text-white/80 font-bold">生成失敗但點數被扣？</p>
                  <p>系統會自動退點。若 10 分鐘後仍未退回，請聯絡客服。</p>
                </div>
                <div>
                  <p className="text-white/80 font-bold">如何取消帳號？</p>
                  <p>請來信告知您的帳號 Email，我們將協助處理。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/25 border border-white/10 rounded-2xl p-6">
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">相關政策</p>
            <div className="flex flex-col gap-2">
              <a href="/terms" className="text-[#89f5a2] text-sm hover:underline">服務條款 →</a>
              <a href="/privacy" className="text-[#89f5a2] text-sm hover:underline">隱私權政策 →</a>
              <a href="/refund" className="text-[#89f5a2] text-sm hover:underline">退款政策 →</a>
            </div>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <a href="/" className="text-[#89f5a2] text-sm hover:underline">← 返回首頁</a>
        </div>
      </div>
    </main>
  );
}