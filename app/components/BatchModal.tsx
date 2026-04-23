"use client";

// app/components/BatchModal.tsx
// Code Splitting — 批次生成 Modal

interface BatchPrompt {
  prompt: string;
  note: string;
  isTranslating?: boolean;
  translated?: boolean;
  isNoteTranslating?: boolean;
  noteTranslated?: boolean;
}

interface BatchResult {
  url: string;
  status: "waiting" | "generating" | "done" | "failed";
}

interface BatchModalProps {
  plan: string;
  batchCount: number;
  setBatchCount: (n: number) => void;
  batchPrompts: BatchPrompt[];
  setBatchPrompts: (p: BatchPrompt[]) => void;
  batchResults: BatchResult[];
  isBatchGenerating: boolean;
  batchCurrentIndex: number;
  onClose: () => void;
  onGenerate: () => void;
}

const hasChinese = (text: string) => /[\u4e00-\u9fff]/.test(text);

const getMaxBatch = (plan: string) => {
  if (plan === "pro") return 6;
  if (plan === "standard") return 4;
  if (plan === "starter") return 2;
  return 0;
};

export default function BatchModal({
  plan,
  batchCount,
  setBatchCount,
  batchPrompts,
  setBatchPrompts,
  batchResults,
  isBatchGenerating,
  batchCurrentIndex,
  onClose,
  onGenerate,
}: BatchModalProps) {
  const maxBatch = getMaxBatch(plan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#0d2318] border border-blue-500/20 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <p className="text-3xl mb-1">🎭</p>
          <h2 className="text-white font-black text-lg">批次生成不同 Pose</h2>
          <p className="text-white/40 text-xs mt-1">同一套衣服，不同姿勢／角度，每張 1 點</p>
        </div>

        {/* 張數選擇 */}
        <div>
          <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">生成張數</p>
          <div className="flex gap-2">
            {Array.from({ length: maxBatch }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setBatchCount(n)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  batchCount === n
                    ? "bg-blue-500/30 text-blue-300 border-blue-500"
                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/30"
                }`}
              >
                {n} 張
              </button>
            ))}
          </div>
          <p className="text-blue-300/50 text-xs mt-1.5 text-center">
            {plan === "starter"
              ? "入門包：最多2張"
              : plan === "standard"
              ? "標準包：最多4張"
              : "專業包：最多6張"}
          </p>
        </div>

        {/* 建議提示 */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
          <p className="text-blue-300 text-xs font-bold">⚠️ 建議：同一套衣服 + 不同姿勢效果最穩定</p>
          <p className="text-white/30 text-xs mt-0.5">換衣服或換風格臉部可能不一致，請注意</p>
        </div>

        {/* 每張 Prompt 輸入 */}
        <div className="space-y-3">
          <p className="text-white/40 text-xs font-bold tracking-wider uppercase">每張 Pose 描述</p>
          {Array.from({ length: batchCount }, (_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <p className="text-white/50 text-xs font-bold">第 {i + 1} 張</p>
              <div className="relative">
                <input
                  type="text"
                  value={batchPrompts[i]?.prompt || ""}
                  onChange={(e) => {
                    const updated = [...batchPrompts];
                    updated[i] = { ...updated[i], prompt: e.target.value, translated: false };
                    setBatchPrompts(updated);
                  }}
                  placeholder="姿勢描述（英文）例：standing sideways, arms crossed"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs placeholder-white/20 focus:outline-none focus:border-blue-400/50 pr-20"
                />
                {hasChinese(batchPrompts[i]?.prompt || "") && !batchPrompts[i]?.translated && (
                  <button
                    type="button"
                    disabled={batchPrompts[i]?.isTranslating}
                    onClick={async () => {
                      const updated = [...batchPrompts];
                      updated[i] = { ...updated[i], isTranslating: true };
                      setBatchPrompts(updated);
                      try {
                        const res = await fetch("/api/translate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ text: batchPrompts[i].prompt }),
                        });
                        const data = await res.json();
                        if (data.translated) {
                          updated[i] = { ...updated[i], prompt: data.translated, isTranslating: false, translated: true };
                        } else {
                          updated[i] = { ...updated[i], isTranslating: false };
                        }
                      } catch {
                        updated[i] = { ...updated[i], isTranslating: false };
                      }
                      setBatchPrompts([...updated]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-[10px] rounded font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-40 whitespace-nowrap"
                  >
                    {batchPrompts[i]?.isTranslating ? "翻譯中..." : "🌐 翻譯"}
                  </button>
                )}
              </div>
              <p className="text-white/25 text-[10px]">
                📌 備註（選填）：補充角度、距離、表情等細節，例如：微笑、特寫、從後方拍（中文也可以！輸入後點「翻譯成英文」按鈕，我們幫你自動翻譯 🌐）
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={batchPrompts[i]?.note || ""}
                  onChange={(e) => {
                    const updated = [...batchPrompts];
                    updated[i] = { ...updated[i], note: e.target.value, noteTranslated: false };
                    setBatchPrompts(updated);
                  }}
                  placeholder="例：微笑表情、從側面拍、特寫臉部..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 text-xs placeholder-white/20 focus:outline-none focus:border-blue-400/30 pr-20"
                />
                {hasChinese(batchPrompts[i]?.note || "") && !batchPrompts[i]?.noteTranslated && (
                  <button
                    type="button"
                    disabled={batchPrompts[i]?.isNoteTranslating}
                    onClick={async () => {
                      const updated = [...batchPrompts];
                      updated[i] = { ...updated[i], isNoteTranslating: true };
                      setBatchPrompts(updated);
                      try {
                        const res = await fetch("/api/translate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ text: batchPrompts[i].note }),
                        });
                        const data = await res.json();
                        if (data.translated) {
                          updated[i] = { ...updated[i], note: data.translated, isNoteTranslating: false, noteTranslated: true };
                        } else {
                          updated[i] = { ...updated[i], isNoteTranslating: false };
                        }
                      } catch {
                        updated[i] = { ...updated[i], isNoteTranslating: false };
                      }
                      setBatchPrompts([...updated]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-[10px] rounded font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-40 whitespace-nowrap"
                  >
                    {batchPrompts[i]?.isNoteTranslating ? "翻譯中..." : "🌐 翻譯"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 生成結果區 */}
        {batchResults.length > 0 && (
          <div>
            <p className="text-white/40 text-xs font-bold tracking-wider uppercase mb-2">生成進度</p>
            <div className="grid grid-cols-3 gap-2">
              {batchResults.map((r, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-white/5 relative"
                >
                  {r.status === "done" && r.url ? (
                    <img src={r.url} className="w-full h-full object-cover" />
                  ) : r.status === "generating" ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-5 h-5 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
                      <span className="text-blue-300 text-[9px]">生成中</span>
                    </div>
                  ) : r.status === "failed" ? (
                    <span className="text-red-400 text-[9px] text-center px-1">失敗已退點</span>
                  ) : (
                    <span className="text-white/20 text-[10px]">等待中</span>
                  )}
                  <span className="absolute bottom-1 left-1 text-white/40 text-[8px] font-bold">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>
            {isBatchGenerating && batchCurrentIndex >= 0 && (
              <p className="text-blue-300 text-xs text-center mt-2 font-bold">
                ⚡ 正在生成第 {batchCurrentIndex + 1} 張，完成後自動儲存到角色相簿
              </p>
            )}
            {!isBatchGenerating &&
              batchResults.every((r) => r.status === "done" || r.status === "failed") && (
                <p className="text-[#89f5a2] text-xs text-center mt-2 font-bold">
                  ✅ 批次生成完成！已自動儲存到角色相簿
                </p>
              )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={isBatchGenerating}
            className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all disabled:opacity-30"
          >
            關閉
          </button>
          <button
            onClick={onGenerate}
            disabled={isBatchGenerating}
            className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
          >
            {isBatchGenerating
              ? `生成中 ${batchCurrentIndex + 1}/${batchResults.length}...`
              : `🎭 開始生成（${batchCount} 點）`}
          </button>
        </div>
      </div>
    </div>
  );
}
