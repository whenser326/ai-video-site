"use client";

// app/components/Text2VideoModal.tsx
// Code Splitting — 文字生成影片 Modal

const hasChinese = (text: string) => /[\u4e00-\u9fff]/.test(text);

interface Text2VideoModalProps {
  plan: string;
  text2videoModel: string;
  setText2videoModel: (m: "kling" | "seedance") => void;
  text2videoRatio: string;
  setText2videoRatio: (r: string) => void;
  text2videoDuration: number;
  setText2videoDuration: (d: number) => void;
  text2videoPrompt: string;
  setText2videoPrompt: (p: string) => void;
  text2videoTranslated: string | null;
  setText2videoTranslated: (p: string | null) => void;
  isText2videoTranslating: boolean;
  setIsText2videoTranslating: (b: boolean) => void;
  onClose: () => void;
  onGenerate: () => void;
}

export default function Text2VideoModal({
  plan,
  text2videoModel,
  setText2videoModel,
  text2videoRatio,
  setText2videoRatio,
  text2videoDuration,
  setText2videoDuration,
  text2videoPrompt,
  setText2videoPrompt,
  text2videoTranslated,
  setText2videoTranslated,
  isText2videoTranslating,
  setIsText2videoTranslating,
  onClose,
  onGenerate,
}: Text2VideoModalProps) {
  const getSeedanceCost = (d: number) => {
    if (d === 5) return plan === "pro" ? "13" : plan === "standard" ? "15" : "17";
    return plan === "pro" ? "21" : plan === "standard" ? "25" : "27";
  };
  const getKlingCost = (d: number) => {
    if (d === 5) return plan === "pro" ? "4" : plan === "standard" ? "5" : "6";
    return plan === "pro" ? "6" : plan === "standard" ? "7" : "8";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#0d2318] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">

        {/* 標題 */}
        <div className="text-center">
          <p className="text-3xl mb-1">✨</p>
          <h2 className="text-white font-black text-xl">文字生成影片</h2>
          <p className="text-white/40 text-xs mt-1">用文字描述你想要的影片內容</p>
        </div>

        {/* 付費限定提醒 */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
          <span className="text-yellow-300 text-sm">💎</span>
          <p className="text-yellow-300 text-xs font-bold">付費方案限定功能 — 免費用戶無法使用</p>
        </div>

        {/* 模型選擇 */}
        <div>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">選擇模型</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setText2videoModel("kling")}
              className={`flex flex-col items-start px-4 py-3 rounded-2xl border transition-all ${
                text2videoModel === "kling"
                  ? "border-[#89f5a2]/60 bg-[#89f5a2]/10"
                  : "border-white/10 bg-white/4 hover:border-[#89f5a2]/30"
              }`}
            >
              <span className={`text-sm font-bold ${text2videoModel === "kling" ? "text-[#89f5a2]" : "text-white/70"}`}>
                ⚡ Kling 3.0
              </span>
              <span className="text-[10px] text-white/30 mt-0.5">
                推薦・5秒 {plan === "pro" ? "4" : plan === "standard" ? "5" : "6"}點
              </span>
            </button>
            <button
              type="button"
              onClick={() => setText2videoModel("seedance")}
              className={`flex flex-col items-start px-4 py-3 rounded-2xl border transition-all ${
                text2videoModel === "seedance"
                  ? "border-orange-400/60 bg-orange-400/10"
                  : "border-white/10 bg-white/4 hover:border-orange-400/30"
              }`}
            >
              <span className={`text-sm font-bold ${text2videoModel === "seedance" ? "text-orange-300" : "text-white/70"}`}>
                ✨ Seedance 2.0
              </span>
              <span className="text-[10px] text-white/30 mt-0.5">
                高畫質・5秒 {plan === "pro" ? "13" : plan === "standard" ? "15" : "17"}點
              </span>
            </button>
          </div>
        </div>

        {/* 比例選擇 */}
        <div>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">影片比例</p>
          <div className="flex flex-wrap gap-2">
            {["16:9", "9:16", "1:1", "4:3", "3:4"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setText2videoRatio(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  text2videoRatio === r
                    ? "bg-[#89f5a2]/20 text-[#89f5a2] border-[#89f5a2]/50"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 秒數選擇 */}
        <div>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">影片長度</p>
          <div className="flex gap-2">
            {[5, 10].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setText2videoDuration(d)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  text2videoDuration === d
                    ? "bg-[#89f5a2]/20 text-[#89f5a2] border-[#89f5a2]/50"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                }`}
              >
                {d} 秒
                <span className="text-[10px] block opacity-60 mt-0.5">
                  {text2videoModel === "seedance" ? getSeedanceCost(d) : getKlingCost(d)}點
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 影片描述輸入 */}
        <div>
          <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">
            影片描述 <span className="text-red-400">*</span>
          </p>
          <div className="relative">
            <textarea
              rows={3}
              value={text2videoPrompt}
              onChange={(e) => {
                setText2videoPrompt(e.target.value);
                setText2videoTranslated(null);
              }}
              placeholder={"描述你想要的影片內容...可以輸入中文(即時翻譯)！\n例如：一個女生在海邊散步，陽光灑落，慢動作鏡頭"}
              className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#89f5a2]/40 resize-none leading-relaxed"
            />
            {hasChinese(text2videoPrompt) && !text2videoTranslated && (
              <button
                type="button"
                onClick={async () => {
                  setIsText2videoTranslating(true);
                  try {
                    const res = await fetch("/api/translate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: text2videoPrompt }),
                    });
                    const data = await res.json();
                    if (data.translated) setText2videoTranslated(data.translated);
                  } finally {
                    setIsText2videoTranslating(false);
                  }
                }}
                disabled={isText2videoTranslating}
                className="absolute bottom-2 right-2 px-2 py-1 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-xs rounded-lg font-bold disabled:opacity-40"
              >
                {isText2videoTranslating ? "翻譯中..." : "🌐 翻譯"}
              </button>
            )}
          </div>
          {text2videoTranslated && (
            <div className="flex gap-2 items-center mt-1.5 px-3 py-2 bg-[#89f5a2]/10 border border-[#89f5a2]/20 rounded-xl">
              <p className="text-[#89f5a2] text-xs flex-1">{text2videoTranslated}</p>
              <button
                type="button"
                onClick={() => {
                  setText2videoPrompt(text2videoTranslated);
                  setText2videoTranslated(null);
                }}
                className="text-xs px-2 py-0.5 bg-[#89f5a2]/30 text-[#89f5a2] rounded-lg font-bold flex-shrink-0"
              >
                採用
              </button>
              <button
                type="button"
                onClick={() => setText2videoTranslated(null)}
                className="text-xs text-white/30 flex-shrink-0"
              >
                略過
              </button>
            </div>
          )}
        </div>

        {/* 按鈕 */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={!text2videoPrompt.trim()}
            className="py-3 rounded-xl bg-gradient-to-r from-[#89f5a2] to-[#4ade80] text-[#0d2318] text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
          >
            🎬 開始生成
          </button>
        </div>
      </div>
    </div>
  );
}
