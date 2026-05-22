"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface GalleryItem {
  id: string;
  name: string;
  age: number;
  personality_tags: string[];
  story: string;
  story_type: "short" | "mid" | "long";
  image_url: string | null;
  video_url: string | null;
  like_count_min: number;
  like_count_max: number;
  chat_count_min: number;
  chat_count_max: number;
  is_featured: boolean;
  model_label: string | null;
  actual_chat_count: number;
}

interface Props {
  userEmail: string;
  plan: string;
}

function randomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seededRandom(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash) / 2147483647;
  return Math.floor(normalized * (max - min + 1)) + min;
}

const HERO_VIDEO = "https://ahctwdttcecmqnjjibdo.supabase.co/storage/v1/object/public/character-images/hero.mp4";
const FREE_LIMIT = 12;

export default function GallerySection({ userEmail, plan }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"hot" | "new">("hot");
  const [activeTag, setActiveTag] = useState<string>("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [expandedStory, setExpandedStory] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitStep, setSubmitStep] = useState<"selectChar" | "selectImages" | "confirm">("selectChar");
  const [myCharacters, setMyCharacters] = useState<{id: number; name: string; image_url: string}[]>([]);
  const [myCharLoading, setMyCharLoading] = useState(false);
  const [selectedChar, setSelectedChar] = useState<{id: number; name: string; image_url: string} | null>(null);
  const [charImages, setCharImages] = useState<{id: string; image_url: string}[]>([]);
  const [charImgLoading, setCharImgLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [submitVisibility, setSubmitVisibility] = useState<"anonymous" | "public">("public");
  const [submitDesc, setSubmitDesc] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const displayCountsRef = useRef<Map<string, { like: number; chat: number }>>(new Map());
  const panelRef = useRef<HTMLDivElement>(null);

  function getDisplayCount(item: GalleryItem): { like: number; chat: number } {
    const map = displayCountsRef.current;
    if (!map.has(item.id)) {
      map.set(item.id, {
        like: seededRandom(item.id + "_like", item.like_count_min, item.like_count_max),
        chat: seededRandom(item.id + "_chat", item.chat_count_min, item.chat_count_max),
      });
    }
    return map.get(item.id)!;
  }

  useEffect(() => {
    setLoading(true);
    const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : "";
    fetch(`/api/gallery?tab=${tab}${tagParam}&limit=50`)
      .then(r => r.json())
      .then(data => {
        const fetched: GalleryItem[] = data.items || [];
        setItems(fetched);
        const tagSet = new Set<string>();
        fetched.forEach(item => item.personality_tags?.forEach((t: string) => tagSet.add(t)));
        setAllTags(Array.from(tagSet));
      })
      .finally(() => setLoading(false));
  }, [tab, activeTag]);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelected(null);
        setExpandedStory(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  const isFree = plan === "free";
  const featured = items.filter(i => i.is_featured);
  const regular = items.filter(i => !i.is_featured);

  const handleCardClick = (item: GalleryItem, index: number) => {
    if (isFree && index >= FREE_LIMIT) {
      setShowUpgradeHint(true);
      return;
    }
    setSelected(item);
    setExpandedStory(false);
  };

  const handleChat = (item: GalleryItem) => {
    router.push(`/chat/gallery/${item.id}`);
  };

  const handleCreate = (item: GalleryItem) => {
    const prompt = [item.name, `${item.age}歲`, ...item.personality_tags].join("，");
    router.push(`/create?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="w-full">
      {/* Hero 影片 */}
      <div className="w-full max-w-lg -mt-4 mb-2 relative z-10 mx-auto px-3 sm:px-0">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-lg">
            AI Character Studio
          </h1>
          <p className="text-white/40 text-xs mt-1.5 font-medium tracking-widest uppercase">
            高精度角色生成平台
          </p>
        </div>
        <div className="w-full mb-6 rounded-2xl overflow-hidden border border-white/10 relative"
          style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#091c10] gap-3">
            <div className="w-12 h-12 rounded-full border border-[#89f5a2]/30 flex items-center justify-center">
              <div style={{ borderLeft: '14px solid #89f5a2', borderTop: '9px solid transparent', borderBottom: '9px solid transparent', marginLeft: '3px', opacity: 0.7 }} />
            </div>
          </div>
          <video src={HERO_VIDEO} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>

      {/* 瀑布流區 */}
      <div className="w-full px-3 sm:px-6 pb-20 pt-6">

        {/* Tab + 篩選標籤 */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-3">
            {(["hot", "new"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${tab === t ? "bg-[#89f5a2] text-[#0d2318]" : "bg-white/5 border border-white/15 text-white/40 hover:border-white/30"}`}>
                {t === "hot" ? "🔥 熱門" : "✨ 最新"}
              </button>
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setActiveTag("")}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${activeTag === "" ? "bg-[#89f5a2]/20 border border-[#89f5a2]/50 text-[#89f5a2]" : "bg-white/5 border border-white/10 text-white/30 hover:border-white/25"}`}>
                全部
              </button>
              {allTags.map((tag: string) => (
                <button key={tag} onClick={() => setActiveTag(tag)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${activeTag === tag ? "bg-[#89f5a2]/20 border border-[#89f5a2]/50 text-[#89f5a2]" : "bg-white/5 border border-white/10 text-white/30 hover:border-white/25"}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#89f5a2]/30 border-t-[#89f5a2] animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {featured.length > 0 && (
              <div className="mb-8">
                <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-3">⭐ 官方精選</p>
                <div className="columns-2 sm:columns-3 gap-3">
                  {featured.map((item, idx) => (
                    <GalleryCard key={item.id} item={item} index={idx} isFree={isFree} freeLimit={FREE_LIMIT} onClick={handleCardClick} getCount={getDisplayCount} featured />
                  ))}
                </div>
              </div>
            )}

            {regular.length > 0 && (
              <div>
                {featured.length > 0 && <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-3">全部角色</p>}
                <div className="columns-2 sm:columns-3 gap-3">
                  {regular.map((item, idx) => (
                    <GalleryCard key={item.id} item={item} index={idx + featured.length} isFree={isFree} freeLimit={FREE_LIMIT} onClick={handleCardClick} getCount={getDisplayCount} />
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <p className="text-white/20 text-sm">還沒有角色，請先到後台上架</p>
              </div>
            )}

            {/* 投稿入口 */}
            <div className="mt-8 border-2 border-dashed border-[#89f5a2]/20 rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-[#89f5a2]/40 transition-all"
              onClick={() => {
                setShowSubmitModal(true);
                setSubmitStep("selectChar");
                setSelectedChar(null);
                setSelectedImages([]);
                setMyCharLoading(true);
                fetch(`/api/saved-characters?email=${userEmail}`)
                  .then(r => r.json())
                  .then(data => setMyCharacters(Array.isArray(data) ? data : []))
                  .finally(() => setMyCharLoading(false));
              }}>
              <p className="text-[#89f5a2]/40 text-2xl">＋</p>
              <p className="text-[#89f5a2]/50 text-xs font-bold">投稿你的角色</p>
              <p className="text-white/20 text-[10px]">讓更多人認識你的角色</p>
            </div>

            {/* 免費升級提示 */}
            {isFree && items.length > FREE_LIMIT && (
              <div className="mt-6 flex flex-col items-center gap-3 py-8">
                <p className="text-white/60 text-sm font-black">還有更多角色等你探索</p>
                <p className="text-white/30 text-xs">升級方案，解鎖全部角色</p>
                <button onClick={() => router.push("/pricing")}
                  className="px-6 py-2.5 bg-[#89f5a2] text-[#0d2318] rounded-full text-sm font-black hover:bg-[#89f5a2]/90 transition-all">
                  查看方案 →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 全螢幕預覽 Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-10"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => { setSelected(null); setExpandedStory(false); }}>
          <div ref={panelRef}
            className="relative w-full rounded-3xl overflow-hidden"
            style={{ maxWidth: 420, background: "#111" }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>

            {/* 媒體區：固定比例 3:4 直向 */}
            <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
              {selected.video_url ? (
                <video
                  src={selected.video_url}
                  autoPlay loop muted playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : selected.image_url ? (
                <img
                  src={selected.image_url}
                  alt={selected.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[#1a1a1a]" />
              )}

              {/* 關閉按鈕 */}
              <button
                onClick={() => { setSelected(null); setExpandedStory(false); }}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white/70 hover:text-white flex items-center justify-center text-sm transition-all">
                ✕
              </button>

              {/* 漸層遮罩 + 文字資訊覆蓋在圖片下方 */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-20"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 55%, transparent 100%)" }}>

                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <p className="text-white font-black text-lg">{selected.name}</p>
                  <p className="text-white/40 text-xs">{selected.age}歲</p>
                  {selected.is_featured && (
                    <span className="text-[9px] bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-full px-2 py-0.5">⭐ 精選</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {selected.personality_tags.map((t: string) => (
                    <span key={t} className="text-[9px] bg-[#89f5a2]/12 border border-[#89f5a2]/25 text-[#89f5a2]/70 rounded-full px-2 py-0.5">{t}</span>
                  ))}
                </div>

                <p className={`text-white/55 text-[11px] leading-relaxed mb-1 ${!expandedStory && selected.story_type !== "short" ? "line-clamp-2" : ""}`}>
                  {selected.story}
                </p>
                {selected.story_type !== "short" && !expandedStory && (
                  <button onClick={() => setExpandedStory(true)} className="text-[#89f5a2]/50 text-[10px] mb-2 hover:text-[#89f5a2] transition-all">
                    ⋯ 更多
                  </button>
                )}
                {(selected.story_type === "short" || expandedStory) && <div className="mb-2" />}

                <div className="flex gap-3 mb-3 text-[10px] text-white/25">
                  <span>❤️ {getDisplayCount(selected).like.toLocaleString()}</span>
                  <span>💬 {getDisplayCount(selected).chat.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* CTA 按鈕：圖片外面，卡片底部 */}
            <div className="flex gap-3 px-4 pt-4 pb-2">
              <button onClick={() => handleChat(selected)}
                className="flex-1 py-3 bg-[#89f5a2] text-[#0d2318] rounded-2xl text-sm font-black hover:bg-[#89f5a2]/90 transition-all">
                💬 開始聊天
              </button>
              <button onClick={() => handleCreate(selected)}
                className="flex-1 py-3 bg-transparent border border-white/20 text-white/60 rounded-2xl text-sm font-black hover:border-white/40 hover:text-white transition-all">
                🎨 生成同款
              </button>
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => router.push(`/gallery/${selected.id}`)}
                className="w-full py-2 text-white/25 text-xs hover:text-white/50 transition-all text-center">
                查看角色詳細頁面 →
              </button>
            </div>
          </div>
        </div>
      )}
{/* 投稿 Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => { setShowSubmitModal(false); setSubmitMsg(""); setSubmitStep("selectChar"); setSelectedChar(null); setSelectedImages([]); }}>
          <div className="w-full max-w-sm bg-[#0d2318] border border-white/15 rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>

            {/* 標題 + 步驟 */}
            <div className="flex items-center justify-between">
              <p className="text-white font-black text-base">📬 投稿你的角色</p>
              <p className="text-white/25 text-xs">
                {submitStep === "selectChar" ? "1/3" : submitStep === "selectImages" ? "2/3" : "3/3"}
              </p>
            </div>

            {/* Step 1：選角色 */}
            {submitStep === "selectChar" && (
              <>
                <p className="text-white/30 text-xs">選擇你要投稿的角色</p>
                {myCharLoading && <p className="text-white/30 text-sm text-center py-4">載入中...</p>}
                {!myCharLoading && myCharacters.length === 0 && (
                  <p className="text-white/20 text-sm text-center py-4">還沒有收藏角色，請先建立角色</p>
                )}
                <div className="space-y-2">
                  {myCharacters.map(char => (
                    <div key={char.id}
                      onClick={() => setSelectedChar(char)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedChar?.id === char.id ? "border-[#89f5a2]/50 bg-[#89f5a2]/10" : "border-white/10 hover:border-white/25"}`}>
                      <img src={char.image_url} alt={char.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      <p className="text-white text-sm font-bold">{char.name}</p>
                      {selectedChar?.id === char.id && <span className="ml-auto text-[#89f5a2] text-sm">✓</span>}
                    </div>
                  ))}
                </div>
                <button
                  disabled={!selectedChar}
                  onClick={async () => {
                    setSubmitStep("selectImages");
                    setCharImgLoading(true);
                    setCharImages([]);
                    setSelectedImages([]);
                    // 撈該角色歷史圖片（含角色主圖）
                    const res = await fetch(`/api/history?email=${userEmail}&character_id=${selectedChar!.id}`);
                    const data = await res.json();
                    const imgs = Array.isArray(data)
                      ? data.filter((g: any) => g.image_url).map((g: any) => ({ id: g.id, image_url: g.image_url }))
                      : [];
                    // 角色主圖放最前面（如果不在歷史裡）
                    const mainImg = selectedChar!.image_url;
                    const hasMain = imgs.some(i => i.image_url === mainImg);
                    if (!hasMain && mainImg) imgs.unshift({ id: "main", image_url: mainImg });
                    setCharImages(imgs);
                    setCharImgLoading(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#89f5a2] text-[#0d2318] text-sm font-black hover:bg-[#89f5a2]/90 transition-all disabled:opacity-40">
                  下一步：選擇圖片 →
                </button>
              </>
            )}

            {/* Step 2：選圖片（可多選） */}
            {submitStep === "selectImages" && (
              <>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSubmitStep("selectChar")} className="text-white/30 hover:text-white/60 text-sm transition-all">← 返回</button>
                  <p className="text-white/30 text-xs">選擇要投稿的圖片（可多選）</p>
                </div>
                {charImgLoading && <p className="text-white/30 text-sm text-center py-4">載入中...</p>}
                {!charImgLoading && charImages.length === 0 && (
                  <p className="text-white/20 text-sm text-center py-4">找不到圖片，請先生成角色圖片</p>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {charImages.map(img => {
                    const isSelected = selectedImages.includes(img.image_url);
                    return (
                      <div key={img.id}
                        onClick={() => setSelectedImages(prev =>
                          isSelected ? prev.filter(u => u !== img.image_url) : [...prev, img.image_url]
                        )}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? "border-[#89f5a2]" : "border-transparent hover:border-white/30"}`}>
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#89f5a2]/20 flex items-center justify-center">
                            <span className="text-[#89f5a2] text-xl font-black">✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedImages.length > 0 && (
                  <p className="text-[#89f5a2]/60 text-xs text-center">已選 {selectedImages.length} 張</p>
                )}
                <button
                  disabled={selectedImages.length === 0}
                  onClick={() => setSubmitStep("confirm")}
                  className="w-full py-2.5 rounded-xl bg-[#89f5a2] text-[#0d2318] text-sm font-black hover:bg-[#89f5a2]/90 transition-all disabled:opacity-40">
                  下一步：確認投稿 →
                </button>
              </>
            )}

            {/* Step 3：確認送出 */}
            {submitStep === "confirm" && (
              <>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSubmitStep("selectImages")} className="text-white/30 hover:text-white/60 text-sm transition-all">← 返回</button>
                  <p className="text-white/30 text-xs">確認投稿資訊</p>
                </div>

                {/* 預覽已選圖片 */}
                <div className="flex gap-2 flex-wrap">
                  {selectedImages.slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                  ))}
                  {selectedImages.length > 4 && (
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-xs">
                      +{selectedImages.length - 4}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-1 block">角色描述（選填）</label>
                  <textarea value={submitDesc} onChange={e => setSubmitDesc(e.target.value)}
                    placeholder="描述角色個性、背景，讓其他用戶更了解這個角色..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/20 outline-none border border-white/10 focus:border-[#89f5a2]/40 transition-all resize-none"
                    style={{ background: "#111" }} />
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">公開方式</label>
                  <div className="flex gap-2">
                    {([
                      { value: "public", label: "🌐 公開分享", desc: "顯示投稿者" },
                      { value: "anonymous", label: "🎭 匿名公開", desc: "隱藏投稿者" },
                    ] as const).map(v => (
                      <button key={v.value} onClick={() => setSubmitVisibility(v.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${submitVisibility === v.value ? "bg-[#89f5a2]/15 border-[#89f5a2]/40 text-[#89f5a2]" : "border-white/10 text-white/40 hover:border-white/25"}`}>
                        <p>{v.label}</p>
                        <p className="text-[10px] opacity-60 mt-0.5">{v.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {submitMsg && (
                  <p className={`text-xs ${submitMsg.includes("成功") ? "text-[#89f5a2]" : "text-red-400"}`}>{submitMsg}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setShowSubmitModal(false); setSubmitMsg(""); setSubmitStep("selectChar"); setSelectedChar(null); setSelectedImages([]); }}
                    className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/40 text-sm hover:bg-white/5 transition-all">
                    取消
                  </button>
                  <button
                    disabled={submitLoading}
                    onClick={async () => {
                      setSubmitLoading(true);
                      setSubmitMsg("");
                      try {
                        const res = await fetch("/api/public-characters", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            characterId: selectedChar!.id,
                            name: selectedChar!.name,
                            image_url: selectedImages[0],
                            description: submitDesc,
                            visibility: submitVisibility,
                            userEmail,
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setSubmitMsg("✅ 投稿成功！審核通過後會通知你。");
                          setTimeout(() => {
                            setShowSubmitModal(false);
                            setSubmitMsg("");
                            setSubmitStep("selectChar");
                            setSelectedChar(null);
                            setSelectedImages([]);
                          }, 2000);
                        } else {
                          setSubmitMsg(data.error || "投稿失敗，請稍後再試");
                        }
                      } catch {
                        setSubmitMsg("投稿失敗，請稍後再試");
                      } finally {
                        setSubmitLoading(false);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#89f5a2] text-[#0d2318] text-sm font-black hover:bg-[#89f5a2]/90 transition-all disabled:opacity-40">
                    {submitLoading ? "投稿中..." : "📬 送出投稿"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* 升級提示彈窗 */}
      {showUpgradeHint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowUpgradeHint(false)}>
          <div className="w-full max-w-sm bg-[#0d2318] border border-[#89f5a2]/25 rounded-3xl p-6 space-y-4"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <p className="text-white font-black text-base">🔒 解鎖更多角色</p>
            <p className="text-white/40 text-xs leading-relaxed">免費版可預覽前 {FREE_LIMIT} 位角色，升級後解鎖全部。</p>
            <button onClick={() => router.push("/pricing")}
              className="w-full py-3 bg-[#89f5a2] text-[#0d2318] rounded-xl text-sm font-black hover:bg-[#89f5a2]/90 transition-all">
              查看升級方案 →
            </button>
            <button onClick={() => setShowUpgradeHint(false)}
              className="w-full py-2 text-white/20 text-xs hover:text-white/40 transition-all">
              繼續免費瀏覽
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface GalleryCardProps {
  item: GalleryItem;
  index: number;
  isFree: boolean;
  freeLimit: number;
  onClick: (item: GalleryItem, index: number) => void;
  getCount: (item: GalleryItem) => { like: number; chat: number };
  featured?: boolean;
}

function GalleryCard({ item, index, isFree, freeLimit, onClick, getCount, featured = false }: GalleryCardProps) {
  const locked = isFree && index >= freeLimit;
  const counts = getCount(item);

  return (
    <div
      className={`break-inside-avoid mb-3 rounded-2xl overflow-hidden border border-white/8 cursor-pointer transition-all hover:border-white/20 hover:scale-[1.01] relative ${locked ? "opacity-50" : ""}`}
      style={{ background: "#111" }}
      onClick={() => onClick(item, index)}
    >
      {item.image_url && (
        <div className="relative">
          <img src={item.image_url} alt={item.name} className="w-full object-cover" style={{ maxHeight: 280 }} />
          {item.video_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <div style={{ borderLeft: "10px solid white", borderTop: "6px solid transparent", borderBottom: "6px solid transparent", marginLeft: 3 }} />
              </div>
            </div>
          )}
          {featured && (
            <span className="absolute top-2 left-2 text-[10px] bg-amber-500/80 text-white rounded-full px-2 py-0.5 font-bold backdrop-blur-sm">⭐</span>
          )}
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <span className="text-2xl">🔒</span>
            </div>
          )}
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <p className="text-white font-black text-sm">{item.name}</p>
          <p className="text-white/30 text-[10px]">{item.age}歲</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {item.personality_tags.slice(0, 2).map((t: string) => (
            <span key={t} className="text-[9px] bg-white/5 border border-white/10 text-white/40 rounded-full px-1.5 py-0.5">{t}</span>
          ))}
        </div>
        <p className={`text-white/40 text-[10px] leading-relaxed ${item.story_type === "short" ? "" : "line-clamp-2"}`}>
          {item.story}
        </p>
        <div className="flex gap-2 text-[9px] text-white/20 pt-0.5">
          <span>❤️ {counts.like.toLocaleString()}</span>
          <span>💬 {counts.chat.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
