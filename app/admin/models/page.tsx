"use client";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "whenser@gmail.com";

const CURRENT_MODELS = [
  "black-forest-labs/flux-1.1-pro",
  "black-forest-labs/flux-kontext-pro",
  "kwaivgi/kling-v3-omni-video",
  "kwaivgi/kling-lip-sync",
  "bytedance/seedance-1.5-pro",
];

const CATEGORY_CURRENT_MODEL: Record<string, string> = {
  "image generation": "black-forest-labs/flux-1.1-pro",
  "video generation": "kwaivgi/kling-v3-omni-video",
  "image to video": "kwaivgi/kling-v3-omni-video",
  "text to video": "kwaivgi/kling-v3-omni-video",
  "lip sync": "kwaivgi/kling-lip-sync",
};

const getHotness = (runs: number) => {
  if (runs >= 100000) return { label: "超熱門", icon: "🔥" };
  if (runs >= 10000) return { label: "熱門", icon: "⭐" };
  if (runs >= 1000) return { label: "上升中", icon: "📈" };
  return { label: "新模型", icon: "🆕" };
};

const SEARCH_CATEGORIES = [
  { label: "圖片生成", query: "image generation" },
  { label: "影片生成", query: "video generation" },
  { label: "圖生影片", query: "image to video" },
  { label: "文生影片", query: "text to video" },
  { label: "嘴型同步", query: "lip sync" },
];

const STATUS_OPTIONS = [
  { value: "none", label: "未標記", color: "text-white/30" },
  { value: "watching", label: "觀察中", color: "text-yellow-300" },
  { value: "testing", label: "待測試", color: "text-blue-300" },
  { value: "adopted", label: "已採用", color: "text-green-400" },
  { value: "rejected", label: "不適用", color: "text-red-400" },
];

export default function ModelTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(0);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackerData, setTrackerData] = useState<Record<string, any>>({});
   
const [savingId, setSavingId] = useState<string | null>(null);
 
  const [compareList, setCompareList] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = sessionStorage.getItem("compare_models");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleCompare = (modelId: string) => {
    setCompareList(prev => {
      const next = prev.includes(modelId)
        ? prev.filter(m => m !== modelId)
        : prev.length < 3 ? [...prev, modelId] : prev;
      sessionStorage.setItem("compare_models", JSON.stringify(next));
      return next;
    });
  };
 
const [searchText, setSearchText] = useState("");
const filteredModels = models.filter((model: any) => {
  const modelId = (model.owner + "/" + model.name).toLowerCase();
  const desc = (model.description || "").toLowerCase();
  return modelId.includes(searchText.toLowerCase()) || desc.includes(searchText.toLowerCase());
});
 

  useEffect(() => {
    if (status === "unauthenticated") { signIn("google"); return; }
    if (session && session.user?.email !== ADMIN_EMAIL) { router.push("/"); return; }
    if (session) loadTrackerData();
  }, [session, status]);

   
useEffect(() => {
  if (session?.user?.email === ADMIN_EMAIL) {
    setSearchText("");
    fetchModels(SEARCH_CATEGORIES[activeCategory].query);
  }
}, [activeCategory, session]);
 

  const loadTrackerData = async () => {
    const res = await fetch("/api/admin/models");
    const data = await res.json();
    if (Array.isArray(data)) {
      const map: Record<string, any> = {};
      data.forEach((item: any) => { map[item.model_id] = item; });
      setTrackerData(map);
    }
  };

  const fetchModels = async (query: string) => {
    setLoading(true);
    setModels([]);
    const url = "/api/admin/models/search?query=" + encodeURIComponent(query);
    const res = await fetch(url).catch(() => null);
    if (res) {
      const data = await res.json();
      setModels(data.results || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (modelId: string, modelName: string, newStatus: string) => {
    setSavingId(modelId);
    await fetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_id: modelId, model_name: modelName, status: newStatus }),
    });
    setTrackerData(prev => ({ ...prev, [modelId]: { ...prev[modelId], model_id: modelId, status: newStatus } }));
    setSavingId(null);
  };

  const handleNoteChange = async (modelId: string, modelName: string, note: string) => {
    await fetch("/api/admin/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_id: modelId, model_name: modelName, note }),
    });
    setTrackerData(prev => ({ ...prev, [modelId]: { ...prev[modelId], note } }));
  };

  if (status === "loading" || !session) return (
    <div className="min-h-screen bg-[#0d2318] flex items-center justify-center text-white">載入中...</div>
  );
  if (session.user?.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#0d2318] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
           
          <button
            onClick={() => router.push('/admin')}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 transition-all"
          >
            ← 返回後台
          </button>
          <p className="text-2xl font-black text-[#89f5a2]">模型追蹤</p>
          <button
            onClick={() => router.push('/admin/models/compare')}
            className="px-3 py-1.5 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-full text-[#89f5a2] text-xs font-bold hover:bg-[#89f5a2]/20 transition-all"
          >
            模型比對測試 →
          </button>
 
        </div>
        <div className="bg-white/5 border border-[#89f5a2]/20 rounded-2xl p-5 mb-6">
          <p className="text-[#89f5a2] font-black text-sm mb-3">目前使用中的模型</p>
          <div className="flex flex-wrap gap-2">
            {CURRENT_MODELS.map(m => (
              <div key={m} className="flex items-center gap-1">
                <span className="px-3 py-1.5 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-full text-[#89f5a2] text-xs font-mono">{m}</span>
                <button
                  onClick={() => toggleCompare(m)}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${compareList.includes(m) ? "bg-[#89f5a2]/20 border-[#89f5a2]/50 text-[#89f5a2]" : "bg-white/5 border-white/10 text-white/30 hover:border-[#89f5a2]/30 hover:text-[#89f5a2]"}`}
                >
                  {compareList.includes(m) ? "已加入" : "+比對"}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mb-5">
          {SEARCH_CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(idx)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeCategory === idx ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]" : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="在結果中搜尋模型名稱或描述..."
          className="w-full px-4 py-2 mb-5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 outline-none focus:border-[#89f5a2]/50"
        />

        {!loading && models.length === 0 && (
          <div className="text-center py-16"><p className="text-white/30 text-sm">沒有找到模型</p></div>
        )}
        {!loading && models.length > 0 && filteredModels.length === 0 && (
          <div className="text-center py-16"><p className="text-white/30 text-sm">搜尋無結果</p></div>
        )}
        {!loading && filteredModels.length > 0 && (
          <div className="space-y-3">
            {filteredModels.map((model: any) => {
 
              const modelId = model.owner + "/" + model.name;
              const isCurrentlyUsed = CURRENT_MODELS.includes(modelId);
              const tracker = trackerData[modelId];
              const currentStatus = tracker?.status || "none";
              return (
                <div key={modelId} className={`bg-white/5 border rounded-2xl p-4 space-y-3 ${isCurrentlyUsed ? "border-[#89f5a2]/40" : "border-white/10"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={"https://replicate.com/" + modelId} target="_blank" rel="noopener noreferrer" className="text-white font-black text-sm hover:text-[#89f5a2] underline underline-offset-2 transition-colors">
                          {modelId}
                        </a>
                        {isCurrentlyUsed && <span className="px-2 py-0.5 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-full text-[#89f5a2] text-[10px] font-black">使用中</span>}
                        {!isCurrentlyUsed && CATEGORY_CURRENT_MODEL[SEARCH_CATEGORIES[activeCategory].query] && (
                          <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-white/30 text-[10px]">
                            同類現用：{CATEGORY_CURRENT_MODEL[SEARCH_CATEGORIES[activeCategory].query]}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-1">{model.description || "無描述"}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-white/50 text-xs">
                          {model.run_count >= 100000 ? "🔥 超熱門" : model.run_count >= 10000 ? "⭐ 熱門" : model.run_count >= 1000 ? "📈 上升中" : "🆕 新模型"}
                          {"（" + (model.run_count || 0).toLocaleString() + " runs）"}
                        </span>
                      </div>
                    </div>
                    <select
                      value={currentStatus}
                      disabled={savingId === modelId}
                      onChange={(e) => handleStatusChange(modelId, model.name, e.target.value)}
                      className="flex-shrink-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer text-white"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value} className="bg-[#0d2318] text-white">{s.label}</option>
                      ))}
                     
                </select>
                 
                    <button
                      onClick={() => toggleCompare(modelId)}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${compareList.includes(modelId) ? "bg-[#89f5a2]/20 border-[#89f5a2]/50 text-[#89f5a2]" : "bg-white/5 border-white/10 text-white/30 hover:border-[#89f5a2]/30 hover:text-[#89f5a2]"}`}
                    >
                      {compareList.includes(modelId) ? "已加入" : "加入比對"}
                    </button>
 
              </div>
              {currentStatus !== "none" && (
 
                    <input
                      type="text"
                      placeholder="備註"
                      defaultValue={tracker?.note || ""}
                      onBlur={(e) => handleNoteChange(modelId, model.name, e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs placeholder-white/20 outline-none focus:border-white/30"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}