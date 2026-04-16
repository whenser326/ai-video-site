export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-16 pb-12 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-black text-white mb-2">隱私權政策</h1>
        <p className="text-white/40 text-xs mb-8">最後更新：2026年4月</p>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-2">1. 收集的資料</h2>
            <p>本平台收集以下資料：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Google 帳號基本資料（Email、顯示名稱）</li>
              <li>您在本平台生成的圖片與影片</li>
              <li>使用紀錄（生成次數、點數消耗）</li>
              <li>您上傳的圖片（用於上傳轉影片功能）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">2. 資料使用目的</h2>
            <p>收集的資料用於：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>提供本平台服務（帳號管理、點數計算）</li>
              <li>改善服務品質</li>
              <li>防止濫用行為</li>
              <li>處理付款與客服需求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">3. 資料儲存</h2>
            <p>您的資料儲存於 Supabase 雲端資料庫（伺服器位於美國）。生成的圖片與影片保存於 Supabase Storage，付費用戶保存 7 天，免費用戶保存 3 天後自動刪除。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">4. 第三方服務</h2>
            <p>本平台使用以下第三方服務：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Google OAuth（登入驗證）</li>
              <li>Replicate（AI 圖片與影片生成）</li>
              <li>ElevenLabs（語音合成）</li>
              <li>藍新金流（付款處理）</li>
            </ul>
            <p className="mt-2">各服務均有其獨立隱私權政策。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">5. 資料分享</h2>
            <p>本平台不會將您的個人資料出售給第三方。僅在以下情況分享資料：法律要求、防止詐欺或保護用戶安全。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">6. 您的權利</h2>
            <p>您有權要求：查閱、更正或刪除您的個人資料。如需行使上述權利，請聯絡我們。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">7. Cookie</h2>
            <p>本平台使用 Cookie 維持登入狀態。您可透過瀏覽器設定拒絕 Cookie，但可能影響部分功能。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">8. 聯絡我們</h2>
            <p>如有隱私相關問題，請聯絡：</p>
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