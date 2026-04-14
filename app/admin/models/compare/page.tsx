"use client";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "whenser@gmail.com";

const MODE_OPTIONS = [
  { value: "image", label: "圖片生成" },
  { value: "image-to-video", label: "圖生影片" },
  { value: "text-to-video", label: "文字生影片" },
];

const ASPECT_OPTIONS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const DURATION_OPTIONS = [5, 10];

interface Slot {
  modelId: string;
  customParams: string;
  predictionId: string | null;
  status: "idle" | "running" | "done" | "error";
  result: string | null;
  error: string | null;
  startTime: number | null;
  elapsed: number;
}

function emptySlot(): Slot {
  return { modelId: "", customParams: "", predictionId: null, status: "idle", result: null, error: null, startTime: null, elapsed: 0 };
}

export default function ModelComparePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState("image");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [duration, setDuration] = useState(5);
   
  const [translatedPrompt, setTranslatedPrompt] = useState<string | null>(null);
  const [useTranslated, setUseTranslated] = useState(false);
  const [translating, setTranslating] = useState(false);
 
  const [showModal, setShowModal] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState<number>(0);
  const [trackerModels, setTrackerModels] = useState<any[]>([]);
  const pollingRef = useRef<Record<number, NodeJS.Timeout>>({});

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialModel = searchParams?.get("model") || "";

  const [slots, setSlots] = useState<Slot[]>([
    { ...emptySlot(), modelId: initialModel },
    emptySlot(),
  ]);

  useEffect(() => {
    fetch("/api/admin/models")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTrackerModels(data.filter((m: any) => m.status === "testing" || m.status === "watching" || m.status === "adopted"));
        }
      });
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { signIn("google"); return; }
    if (session && session.user?.email !== ADMIN_EMAIL) { router.push("/"); return; }
  }, [session, status]);

   
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem("compare_models");
    const models = saved ? JSON.parse(saved) : [];
    const newSlots = [emptySlot(), emptySlot()];
    models.forEach((m: string, i: number) => {
      if (i < 3) newSlots[i] = { ...emptySlot(), modelId: m };
    });
    if (models.length === 3) newSlots.push(emptySlot());
    setSlots(newSlots.slice(0, 3));
  }, [mode]);
 

  const addSlot = () => {
    if (slots.length < 3) setSlots(prev => [...prev, emptySlot()]);
  };

  const removeSlot = (idx: number) => {
    if (pollingRef.current[idx]) clearInterval(pollingRef.current[idx]);
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, patch: Partial<Slot>) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const setModelId = (idx: number, modelId: string) => {
    updateSlot(idx, { modelId, status: "idle", result: null, error: null, predictionId: null });
  };

  const pollResult = (idx: number, predictionId: string, startTime: number) => {
    pollingRef.current[idx] = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      updateSlot(idx, { elapsed });
      const res = await fetch(`/api/admin/compare?id=${predictionId}`);
      const data = await res.json();
      if (data.status === "succeeded") {
        clearInterval(pollingRef.current[idx]);
        const output = Array.isArray(data.output) ? data.output[0] : data.output;
        updateSlot(idx, { status: "done", result: output, elapsed });
      } else if (data.status === "failed") {
        clearInterval(pollingRef.current[idx]);
        updateSlot(idx, { status: "error", error: data.error || "生成失敗", elapsed });
      }
    }, 3000);
  };

  const runSingle = async (idx: number) => {
    const slot = slots[idx];
    if (!slot.modelId || !prompt.trim()) return;
    updateSlot(idx, { status: "running", result: null, error: null, predictionId: null, elapsed: 0 });
    const res = await fetch("/api/admin/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminEmail: session?.user?.email,
        modelId: slot.modelId,
        mode,
        prompt,
        image: image || undefined,
        aspectRatio,
        duration,
        customParams: slot.customParams ? JSON.parse(slot.customParams) : {},
      })
    });
    const data = await res.json();
    if (data.error) {
      updateSlot(idx, { status: "error", error: data.error });
      return;
    }
    updateSlot(idx, { predictionId: data.predictionId, startTime: data.startTime });
    pollResult(idx, data.predictionId, data.startTime);
  };

  const runAll = () => {
    slots.forEach((slot, idx) => {
      if (slot.modelId) runSingle(idx);
    });
  };

  const isVideo = mode !== "image";
  const canRun = slots.some(s => s.modelId) && prompt.trim();

  if (status === "loading" || !session) return (
    <div className="min-h-screen bg-[#0d2318] flex items-center justify-center text-white">載入中...</div>
  );
  if (session.user?.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#0d2318] p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin/models')}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 transition-all"
          >
            ← 返回模型追蹤
          </button>
          <h1 className="text-2xl font-black text-[#89f5a2]">模型比對測試</h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-white/50 text-xs font-bold mb-3">測試模式</p>
          <div className="flex gap-2 flex-wrap">
            {MODE_OPTIONS.map(m => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${mode === m.value ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]" : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 space-y-4">
          <p className="text-white/50 text-xs font-bold">共用輸入（所有模型使用同一組設定）</p>
           
          <div className="relative">
            <textarea
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                setTranslatedPrompt(null);
                setUseTranslated(false);
              }}
              rows={3}
              placeholder="輸入 prompt（支援中文，偵測到中文會出現翻譯按鈕）..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 outline-none focus:border-[#89f5a2]/50 resize-none"
            />
            {/[\u4e00-\u9fff]/.test(prompt) && !useTranslated && (
              <button
                onClick={async () => {
                  setTranslating(true);
                  const res = await fetch("/api/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: prompt }),
                  });
                  const data = await res.json();
                  setTranslatedPrompt(data.translated || null);
                  setTranslating(false);
                }}
                disabled={translating}
                className="absolute right-2 bottom-2 px-3 py-1 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-lg text-[#89f5a2] text-xs font-bold hover:bg-[#89f5a2]/30 transition-all disabled:opacity-50"
              >
                {translating ? "翻譯中..." : "翻譯成英文"}
              </button>
            )}
          </div>
          {translatedPrompt && !useTranslated && (
            <div className="flex items-start gap-3 px-4 py-3 bg-white/5 border border-[#89f5a2]/20 rounded-xl">
              <div className="flex-1">
                <p className="text-white/30 text-xs mb-1">翻譯結果</p>
                <p className="text-white/70 text-sm">{translatedPrompt}</p>
              </div>
              <button
                onClick={() => { setPrompt(translatedPrompt); setUseTranslated(true); setTranslatedPrompt(null); }}
                className="flex-shrink-0 px-3 py-1 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-lg text-[#89f5a2] text-xs font-bold hover:bg-[#89f5a2]/30 transition-all"
              >
                採用
              </button>
            </div>
          )}
 
          {(mode === "image-to-video") && (
            <input
              type="text"
              value={image}
              onChange={e => setImage(e.target.value)}
              placeholder="參考圖片 URL（圖生影片必填）..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 outline-none focus:border-[#89f5a2]/50"
            />
          )}
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-white/30 text-xs mb-2">比例</p>
              <div className="flex gap-2">
                {ASPECT_OPTIONS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAspectRatio(a)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${aspectRatio === a ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]" : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            {isVideo && (
              <div>
                <p className="text-white/30 text-xs mb-2">秒數</p>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${duration === d ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]" : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"}`}
                    >
                      {d}秒
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`grid gap-4 mb-5 ${slots.length === 1 ? "grid-cols-1" : slots.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {slots.map((slot, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-xs font-bold">模型 {idx + 1}</p>
                {slots.length > 2 && (
                  <button onClick={() => removeSlot(idx)} className="text-white/20 text-xs hover:text-red-400 transition-colors">移除</button>
                )}
              </div>
              <input
                type="text"
                value={slot.modelId}
                onChange={e => setModelId(idx, e.target.value)}
                placeholder="輸入模型 ID，例如 owner/model-name"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-white/20 outline-none focus:border-[#89f5a2]/50"
              />
              <details className="w-full">
                <summary className="text-white/20 text-xs cursor-pointer hover:text-white/40 transition-colors py-1">
                  自訂參數（選填）— 填入 JSON 格式，例如 {`{"num_inference_steps": 30}`}，不同模型參數不同，請先至 Replicate 該模型頁面查詢
                </summary>
                <textarea
                  value={slot.customParams}
                  onChange={e => updateSlot(idx, { customParams: e.target.value })}
                  rows={2}
                  placeholder='{"key": "value"}'
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs placeholder-white/20 outline-none focus:border-[#89f5a2]/50 resize-none font-mono"
                />
              </details>
              <button
                onClick={() => { setSelectingSlot(idx); setShowModal(true); }}
                className="w-full py-1.5 bg-white/5 border border-white/10 rounded-xl text-white/40 text-xs hover:border-[#89f5a2]/50 hover:text-[#89f5a2] transition-all"
              >
                從追蹤清單選模型
              </button>
              <div className="rounded-xl overflow-hidden bg-white/5 min-h-[200px] flex items-center justify-center">
                {slot.status === "idle" && (
                  <p className="text-white/20 text-xs">等待執行...</p>
                )}
                {slot.status === "running" && (
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-[#89f5a2]/30 border-t-[#89f5a2] rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-[#89f5a2] text-xs">生成中... {slot.elapsed}秒</p>
                  </div>
                )}
                {slot.status === "done" && slot.result && (
                  isVideo
                    ? <video src={slot.result} controls className="w-full rounded-xl" />
                    : <img src={slot.result} alt="result" className="w-full rounded-xl" />
                )}
                {slot.status === "error" && (
                  <p className="text-red-400 text-xs px-4 text-center">{slot.error}</p>
                )}
              </div>
              {slot.status !== "idle" && (
                <div className="flex gap-4">
                  <span className="text-white/30 text-xs">時間 <span className="text-white/60">{slot.elapsed}秒</span></span>
                  <span className="text-white/30 text-xs">狀態 <span className={`${slot.status === "done" ? "text-green-400" : slot.status === "error" ? "text-red-400" : "text-yellow-300"}`}>{slot.status === "done" ? "完成" : slot.status === "error" ? "失敗" : "生成中"}</span></span>
                </div>
              )}
              <button
                onClick={() => runSingle(idx)}
                disabled={!slot.modelId || !prompt.trim() || slot.status === "running"}
                className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-white/50 text-xs font-bold hover:border-white/30 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                單獨執行
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          {slots.length < 3 && (
            <button
              onClick={addSlot}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/50 text-sm font-bold hover:border-white/30 transition-all"
            >
              + 新增模型欄位
            </button>
          )}
          <button
            onClick={runAll}
            disabled={!canRun}
            className="flex-1 py-3 bg-[#0F6E56] border border-[#1D9E75] rounded-xl text-white text-sm font-bold hover:bg-[#1D9E75] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            執行全部比對
          </button>
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="bg-[#0d2318] border border-[#89f5a2]/20 rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#89f5a2] font-black text-sm">選擇模型 → 欄位 {selectingSlot + 1}</p>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white text-xs">關閉</button>
            </div>
            {trackerModels.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">沒有待測試或觀察中的模型</p>
            )}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {trackerModels.map((m: any) => (
                <div
                  key={m.model_id}
                  onClick={() => {
                    setModelId(selectingSlot, m.model_id);
                    setShowModal(false);
                  }}
                  className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-[#89f5a2]/50 hover:bg-white/10 transition-all"
                >
                  <div>
                    <p className="text-white text-sm font-bold">{m.model_id}</p>
                    {m.note && <p className="text-white/30 text-xs mt-0.5">{m.note}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg border ${m.status === "testing" ? "border-blue-400/30 text-blue-300" : m.status === "adopted" ? "border-[#89f5a2]/30 text-[#89f5a2]" : "border-yellow-400/30 text-yellow-300"}`}>
                    {m.status === "testing" ? "待測試" : m.status === "adopted" ? "已採用" : "觀察中"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}