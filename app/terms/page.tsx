export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-16 pb-12 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-black text-white mb-2">服務條款</h1>
        <p className="text-white/40 text-xs mb-8">最後更新：2026年4月</p>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-2">1. 服務說明</h2>
            <p>Consistent Flow（以下簡稱「本平台」）提供 AI 角色圖片與影片生成服務。使用本平台即表示您同意以下條款。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">2. 帳號與登入</h2>
            <p>本平台使用 Google 帳號登入。您需對自己帳號的所有使用行為負責。請勿將帳號分享給他人使用。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">3. 點數制度</h2>
            <p>本平台採用點數制。新用戶註冊後自動獲得免費點數。付費點數方案詳見定價頁面。點數一經購買，除法律另有規定外，不提供退款。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">4. 使用規範</h2>
            <p>使用本平台時，您同意不得：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>生成涉及未成年人的不當內容</li>
              <li>生成侵害他人著作權、肖像權或隱私權的內容</li>
              <li>將生成內容用於非法用途</li>
              <li>使用自動化程式大量存取本平台服務</li>
              <li>上傳未經授權的他人照片</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">5. 內容所有權</h2>
            <p>您使用本平台生成的內容，著作權歸您所有。本平台保留使用生成內容改善 AI 模型的權利（不含個人識別資訊）。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">6. 服務中斷與限制</h2>
            <p>本平台保留在不另行通知的情況下暫停、修改或終止服務的權利。點數因系統維護或服務中斷未能使用時，本平台將視情況補償。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">7. 免責聲明</h2>
            <p>本平台所有 AI 生成內容均為虛構，不代表真實人物或事件。本平台不對生成內容的準確性或適用性負責。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">8. 條款修改</h2>
            <p>本平台保留隨時修改本條款的權利。修改後繼續使用本平台，視為同意修改後的條款。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">9. 聯絡我們</h2>
            <p>如有任何問題，請透過以下方式聯絡：</p>
            <p className="mt-1">Email：<a href="mailto:whenserjp@gmail.com" className="text-[#89f5a2] hover:underline">whenserjp@gmail.com</a></p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <a href="/" className="text-[#89f5a2] text-sm hover:underline">← 返回首頁</a>
        </div>
      </div>
    </main>
  );
}