export default function RefundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-16 pb-12 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-black text-white mb-2">退款政策</h1>
        <p className="text-white/40 text-xs mb-8">最後更新：2026年4月</p>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-2">1. 點數購買</h2>
            <p>本平台販售的點數屬於數位內容商品。依據消費者保護法及電子商務相關規定，數位內容一經購買並開始使用，不適用七天猶豫期退款。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">2. 不提供退款的情況</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>點數已部分或全部使用</li>
              <li>因違反使用條款導致帳號停用</li>
              <li>用戶個人操作失誤（如誤觸生成按鈕）</li>
              <li>對 AI 生成結果不滿意（生成結果具有不確定性，此為 AI 技術特性）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">3. 例外退款情況</h2>
            <p>以下情況本平台將主動退款或補點：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>付款成功但點數未到帳（系統錯誤）</li>
              <li>因本平台系統故障導致生成失敗且點數已扣除（系統會自動退點，如未退請聯絡客服）</li>
              <li>重複付款（相同訂單付款兩次）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">4. 申請退款流程</h2>
            <p>如符合例外退款條件，請於付款後 7 天內聯絡客服，並提供：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>訂單編號或付款截圖</li>
              <li>帳號 Email</li>
              <li>問題說明</li>
            </ul>
            <p className="mt-2">我們將於 3 個工作天內回覆處理結果。</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">5. 聯絡客服</h2>
            <p>Email：<a href="mailto:whenserjp@gmail.com" className="text-[#89f5a2] hover:underline">whenserjp@gmail.com</a></p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <a href="/" className="text-[#89f5a2] text-sm hover:underline">← 返回首頁</a>
        </div>
      </div>
    </main>
  );
}