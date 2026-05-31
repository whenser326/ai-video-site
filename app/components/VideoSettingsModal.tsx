"use client";

// app/components/VideoSettingsModal.tsx
// Code Splitting — 影片設定 Modal（圖片轉影片用）

const hasChinese = (text: string) => /[\u4e00-\u9fff]/.test(text);

interface VideoSettingsModalProps {
  plan: string;
  videoModel: "kling" | "seedance";
  setVideoModel: (m: "kling" | "seedance") => void;
  videoPrompt: string;
  setVideoPrompt: (p: string) => void;
  videoTranslatedPrompt: string | null;
  setVideoTranslatedPrompt: (p: string | null) => void;
  isVideoTranslating: boolean;
  handleVideoTranslate: () => void;
  videoRatio: string;
  setVideoRatio: (r: string) => void;
  videoDuration: number;
  setVideoDuration: (d: number) => void;
  omniRef1: string | null;
  setOmniRef1: (v: string | null) => void;
  omniRef2: string | null;
  setOmniRef2: (v: string | null) => void;
  omniRef3: string | null;
  setOmniRef3: (v: string | null) => void;
  predictionOutput: string | null;
  onClose: () => void;
  onGenerate: (refs: (string | null)[], ratio: string, duration: number) => void;
}

export default function VideoSettingsModal({
  plan,
  videoModel,
  setVideoModel,
  videoPrompt,
  setVideoPrompt,
  videoTranslatedPrompt,
  setVideoTranslatedPrompt,
  isVideoTranslating,
  handleVideoTranslate,
  videoRatio,
  setVideoRatio,
  videoDuration,
  setVideoDuration,
  omniRef1,
  setOmniRef1,
  omniRef2,
  setOmniRef2,
  omniRef3,
  setOmniRef3,
  predictionOutput,
  onClose,
  onGenerate,
}: VideoSettingsModalProps) {
  const omniItems = [
    { label: "🎭 第二角色", hint: "加入第二個人物", state: omniRef1, setter: setOmniRef1 },
    { label: "🌄 場景風格", hint: "指定場景或背景風格", state: omniRef2, setter: setOmniRef2 },
    { label: "🎬 動作參考", hint: "指定動作或姿勢", state: omniRef3, setter: setOmniRef3 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#0d2318] border border-[#89f5a2]/20 rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-white font-black text-lg text-center">🎬 影片設定</h2>
        <p className="text-center text-sm font-black tracking-widest -mt-2" style={{ color: "#fb923c" }}>
          {videoModel === "seedance" ? "✨ Powered by Seedance 1.5 Pro" : "⚡ Powered by Kling 3.0"}
        </p>

        {/* 模型選擇 */}
        <div>
          <p className="text-white/40 text-xs mb-2">影片模型</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setVideoModel("kling")}
              className={`w-full px-4 py-3 rounded-xl text-left border transition-all ${
                videoModel === "kling"
                  ? "bg-[#89f5a2]/15 border-[#89f5a2] text-white"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm">⚡ Kling 3.0</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    videoModel === "kling"
                      ? "bg-[#89f5a2] text-[#0d2318]"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  推薦
                </span>
              </div>
              <p className="text-xs mt-1 opacity-60">4K高解析・角色一致性強・生成快速・CP值最高</p>
              <p className="text-xs mt-0.5 font-bold" style={{ color: "#89f5a2" }}>
                5秒 4-6點 ／ 10秒 8-12點
              </p>
            </button>

            <button
              onClick={() => setVideoModel("seedance")}
              className={`w-full px-4 py-3 rounded-xl text-left border transition-all ${
                videoModel === "seedance"
                  ? "bg-[#fb923c]/15 border-[#fb923c] text-white"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-black text-sm">✨ Seedance 2.0</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#fb923c] text-white">
                  高畫質溢價
                </span>
              </div>
              <p className="text-white/50 text-xs mt-1">物理動態超真實・原生音訊・場景特效強</p>
              <p className="text-white/30 text-xs mt-0.5">🔒 Replicate 官方版・非第三方不穩定版</p>
              <p className="text-xs mt-0.5 font-bold" style={{ color: "#fb923c" }}>
                5秒{" "}
                {plan === "starter" ? "17點" : plan === "standard" ? "15點" : plan === "pro" ? "13點" : "—"} ／ 10秒{" "}
                {plan === "starter" ? "27點" : plan === "standard" ? "25點" : plan === "pro" ? "21點" : "—"}
                　⚠️ 點數較高
              </p>
            </button>
          </div>
        </div>

        {/* 影片動作指令 + 翻譯 */}
        <div>
          <p className="text-white/40 text-xs mb-2">影片動作指令（選填）</p>
          <div className="relative">
            <textarea
              value={videoPrompt}
              onChange={(e) => {
                setVideoPrompt(e.target.value);
                setVideoTranslatedPrompt(null);
              }}
              placeholder="例如：在雪地打仗、在逛街、跳舞...（中文也可以！輸入後點「翻譯成英文」按鈕，我們幫你自動翻譯 🌐）"
              rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-[#89f5a2]/50"
            />
            <div className="absolute bottom-2 right-2">
              {hasChinese(videoPrompt) && !videoTranslatedPrompt && (
                <button
                  type="button"
                  onClick={handleVideoTranslate}
                  disabled={isVideoTranslating}
                  className="px-2 py-1 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-xs rounded-lg font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-40"
                >
                  {isVideoTranslating ? "翻譯中..." : "🌐 翻譯"}
                </button>
              )}
            </div>
          </div>
          {videoTranslatedPrompt && (
            <div className="mt-2 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-xl p-3 space-y-2">
              <p className="text-white/40 text-xs font-bold uppercase">🌐 翻譯結果</p>
              <p className="text-[#89f5a2] text-sm">{videoTranslatedPrompt}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVideoPrompt(videoTranslatedPrompt);
                    setVideoTranslatedPrompt(null);
                  }}
                  className="flex-1 py-1.5 bg-[#89f5a2] text-[#0d2318] rounded-lg text-xs font-black hover:opacity-90 transition-all"
                >
                  ✅ 採用
                </button>
                <button
                  type="button"
                  onClick={() => setVideoTranslatedPrompt(null)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
                >
                  略過
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Omni-Reference（Seedance 專屬） */}
        {videoModel === "seedance" && (
          <div className="border border-[#fb923c]/20 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-[#fb923c]/5 flex items-center justify-between">
              <div>
                <p className="text-[#fb923c] text-xs font-black">✨ Omni-Reference 多參考圖（選填）</p>
                <p className="text-white/30 text-[10px] mt-0.5">
                  上傳後額外加費：入門+6點・標準+5點・專業+4點
                </p>
              </div>
            </div>
            <div className="px-4 pb-4 pt-2 space-y-3 bg-black/10">
              {omniItems.map((item, idx) => (
                <div key={idx}>
                  <p className="text-white/40 text-[10px] font-bold mb-1">
                    {item.label}
                    <span className="text-white/20 font-normal ml-1">（{item.hint}）</span>
                  </p>
                  <label className="block cursor-pointer">
                    <div
                      className={`border border-dashed rounded-xl p-3 text-center transition-all ${
                        item.state
                          ? "border-[#fb923c]/50 bg-[#fb923c]/5"
                          : "border-white/10 hover:border-[#fb923c]/30"
                      }`}
                    >
                      {item.state ? (
                        <div className="relative">
                          <img
                            src={item.state}
                            className="w-full max-h-24 object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              item.setter(null);
                              const input = e.currentTarget
                                .closest("label")
                                ?.querySelector('input[type="file"]') as HTMLInputElement;
                              if (input) input.value = "";
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full text-white text-xs flex items-center justify-center font-black hover:bg-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <p className="text-white/25 text-xs">點擊上傳圖片</p>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => item.setter(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 比例選擇 */}
        <div>
          <p className="text-white/40 text-xs mb-2">影片比例</p>
          <div className="flex gap-2 flex-wrap">
            {["1:1", "16:9", "9:16", "4:3", "3:4"].map((r) => (
              <button
                key={r}
                onClick={() => setVideoRatio(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  videoRatio === r
                    ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
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
          <p className="text-white/40 text-xs mb-2">影片秒數</p>
          <div className="flex gap-2">
            {[
              { s: 5, label: "5秒", cost: "4-6點" },
              { s: 10, label: "10秒", cost: "8-12點" },
            ].map((item) => (
              <button
                key={item.s}
                onClick={() => setVideoDuration(item.s)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  videoDuration === item.s
                    ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                }`}
              >
                {item.label} <span className="opacity-60">{item.cost}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
          >
            取消
          </button>
          <button
            onClick={() => {
              const refs = videoModel === "seedance" ? [omniRef1, omniRef2, omniRef3] : [];
              onGenerate(refs, videoRatio, videoDuration);
              setOmniRef1(null);
              setOmniRef2(null);
              setOmniRef3(null);
            }}
            className="py-3 rounded-xl bg-gradient-to-r from-[#89f5a2] to-[#4ade80] text-[#0d2318] text-sm font-bold hover:opacity-90 transition-all"
          >
            🎬 開始生成
          </button>
        </div>
      </div>
    </div>
  );
}
