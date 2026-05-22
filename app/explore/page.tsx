"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface GalleryItem {
  id: string;
  name: string;
  age: number;
  gender?: string;
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

function seededRandom(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash) / 2147483647;
  return Math.floor(normalized * (max - min + 1)) + min;
}

const FREE_LIMIT = 12;
const PAGE_SIZE = 20;

export default function ExplorePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [plan, setPlan] = useState<string>("free");

  // 資料
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [displayItems, setDisplayItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  // 篩選
  const [tab, setTab] = useState<"hot" | "new">("hot");
  const [gender, setGender] = useState<"all" | "female" | "male">("all");
  const [activeTag, setActiveTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);

  // Modal
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [expandedStory, setExpandedStory] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const displayCountsRef = useRef<Map<string, { like: number; chat: number }>>(new Map());

  // 無限捲動
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 取得方案
  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/user/credits?email=${session.user.email}`)
      .then(r => r.json())
      .then(d => { if (d.plan) setPlan(d.plan); });
  }, [session]);

  function getDisplayCount(item: GalleryItem): { like: number; chat: number } {
    const map = displayCountsRef.current;
    if (!map.has(item.id)) {
      map.set(item.id, {
        like: seededRandom(item.id + "_like", item.like_count_min, item.like_count_max),
        chat: seededRandom(item.id + "_chat", item.chat_count_min, item.chat_count_max) + (item.actual_chat_count || 0),
      });
    }
    return map.get(item.id)!;
  }

  // 初始載入（tab / tag 變更時重置）
  useEffect(() => {
    setLoading(true);
    offsetRef.current = 0;
    setAllItems([]);
    setDisplayItems([]);
    setHasMore(true);

    const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : "";
    fetch(`/api/gallery?tab=${tab}${tagParam}&limit=50`)
      .then(r => r.json())
      .then(data => {
        const fetched: GalleryItem[] = data.items || [];
        setAllItems(fetched);
        const tagSet = new Set<string>();
        fetched.forEach(item => item.personality_tags?.forEach((t: string) => tagSet.add(t)));
        setAllTags(Array.from(tagSet));
      })
      .finally(() => setLoading(false));
  }, [tab, activeTag]);

  // 前端篩選（搜尋 + 性別）後分頁切片
  const filtered = allItems.filter(item => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) ||
      (item.personality_tags || []).some(t => t.toLowerCase().includes(q)) ||
      item.story.toLowerCase().includes(q);
    const matchGender = gender === "all" || item.gender === (gender === "female" ? "女性" : "男性");
    return matchSearch && matchGender;
  });

  // 搜尋/性別變更時重置顯示
  useEffect(() => {
    offsetRef.current = PAGE_SIZE;
    setDisplayItems(filtered.slice(0, PAGE_SIZE));
    setHasMore(filtered.length > PAGE_SIZE);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, gender, allItems]);

  // 載入更多
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const next = filtered.slice(offsetRef.current, offsetRef.current + PAGE_SIZE);
      setDisplayItems(prev => [...prev, ...next]);
      offsetRef.current += PAGE_SIZE;
      setHasMore(offsetRef.current < filtered.length);
      setLoadingMore(false);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, filtered]);

  // IntersectionObserver 無限捲動
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore();
    }, { threshold: 0.1 });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadMore]);

  // 點外部關閉 Modal
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
  const featured = displayItems.filter(i => i.is_featured);
  const regular = displayItems.filter(i => !i.is_featured);

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
    <div className="min-h-screen w-full" style={{ background: "#0d2318" }}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 pt-6 pb-24">

        {/* 頁首 */}
        <div className="mb-6">
          <p className="text-white font-black text-xl tracking-tight">🌐 探索角色</p>
          <p className="text-white/30 text-xs mt-1">發現你喜歡的 AI 角色，開始對話</p>
        </div>

        {/* 搜尋框 */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋名字、標籤、關鍵字..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm text-white placeholder-white/25 outline-none border border-white/10 focus:border-[#89f5a2]/40 transition-all"
            style={{ background: "#111" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all text-xs"
            >✕</button>
          )}
        </div>

        {/* 排序 Tab + 性別篩選 */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(["hot", "new"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${tab === t ? "bg-[#89f5a2] text-[#0d2318]" : "bg-white/5 border border-white/15 text-white/40 hover:border-white/30"}`}>
              {t === "hot" ? "🔥 熱門" : "✨ 最新"}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            {([
              { value: "all", label: "全部" },
              { value: "female", label: "👩 女" },
              { value: "male", label: "👨 男" },
            ] as const).map(g => (
              <button key={g.value} onClick={() => setGender(g.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${gender === g.value ? "bg-[#89f5a2]/20 border border-[#89f5a2]/50 text-[#89f5a2]" : "bg-white/5 border border-white/10 text-white/30 hover:border-white/25"}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 標籤篩選橫向滑動 */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
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

        {/* 載入中 */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#89f5a2]/30 border-t-[#89f5a2] animate-spin" />
          </div>
        )}

        {/* 搜尋結果數量 */}
        {!loading && searchQuery && (
          <p className="text-white/25 text-[11px] mb-3">找到 {filtered.length} 個角色</p>
        )}

        {!loading && (
          <>
            {/* 精選橫向捲動（只有無搜尋且有精選時顯示） */}
            {!searchQuery && featured.length > 0 && (
              <div className="mb-8">
                <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-3">⭐ 官方精選</p>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {featured.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex-shrink-0 w-36 rounded-2xl overflow-hidden border border-white/8 cursor-pointer hover:border-white/20 transition-all hover:scale-[1.02] relative"
                      style={{ background: "#111" }}
                      onClick={() => handleCardClick(item, idx)}
                    >
                      {item.image_url && (
                        <div className="relative">
                          <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
                          <span className="absolute top-2 left-2 text-[10px] bg-amber-500/80 text-white rounded-full px-2 py-0.5 font-bold backdrop-blur-sm">⭐</span>
                          {item.video_url && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                <div style={{ borderLeft: "8px solid white", borderTop: "5px solid transparent", borderBottom: "5px solid transparent", marginLeft: 2 }} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-2.5">
                        <p className="text-white font-black text-xs">{item.name}</p>
                        <p className="text-white/30 text-[10px]">{item.age}歲</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 一般瀑布流 */}
            {regular.length > 0 && (
              <div>
                {!searchQuery && <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-3">全部角色</p>}
                <div className="columns-2 sm:columns-3 gap-3">
                  {regular.map((item, idx) => {
                    const globalIdx = featured.length + idx;
                    const locked = isFree && globalIdx >= FREE_LIMIT;
                    const counts = getDisplayCount(item);
                    return (
                      <div
                        key={item.id}
                        className={`break-inside-avoid mb-3 rounded-2xl overflow-hidden border border-white/8 cursor-pointer transition-all hover:border-white/20 hover:scale-[1.01] relative ${locked ? "opacity-50" : ""}`}
                        style={{ background: "#111" }}
                        onClick={() => handleCardClick(item, globalIdx)}
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
                          <p className="text-white/40 text-[10px] leading-relaxed line-clamp-2">{item.story}</p>
                          <div className="flex gap-2 text-[9px] text-white/20 pt-0.5">
                            <span>❤️ {counts.like.toLocaleString()}</span>
                            <span>💬 {counts.chat.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 無結果 */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <p className="text-4xl">🔍</p>
                <p className="text-white/30 text-sm">找不到符合的角色</p>
                <button onClick={() => { setSearchQuery(""); setGender("all"); setActiveTag(""); }}
                  className="px-4 py-2 rounded-full text-xs border border-white/15 text-white/40 hover:border-white/30 transition-all">
                  清除篩選
                </button>
              </div>
            )}

            {/* 無限捲動 sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {/* 載入更多 spinner */}
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 border-[#89f5a2]/30 border-t-[#89f5a2] animate-spin" />
              </div>
            )}

            {/* 免費升級提示（第12張後） */}
            {isFree && filtered.length > FREE_LIMIT && (
              <div className="mt-6 rounded-2xl border border-[#89f5a2]/20 p-4 text-center"
                style={{ background: "rgba(137,245,162,0.04)" }}>
                <p className="text-white/50 text-xs mb-2">🔒 免費版僅顯示前 {FREE_LIMIT} 位角色</p>
                <button onClick={() => router.push("/pricing")}
                  className="px-5 py-2 bg-[#89f5a2] text-[#0d2318] rounded-xl text-xs font-black hover:bg-[#89f5a2]/90 transition-all">
                  升級解鎖全部 →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 置中 Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:py-10"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => { setSelected(null); setExpandedStory(false); }}>
          <div ref={panelRef}
            className="relative w-full rounded-3xl overflow-hidden"
            style={{ maxWidth: 420, background: "#111" }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}>

            {/* 媒體區：固定比例 3:4 */}
            <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
              {selected.video_url ? (
                <video src={selected.video_url} autoPlay loop muted playsInline
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : selected.image_url ? (
                <img src={selected.image_url} alt={selected.name}
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[#1a1a1a]" />
              )}

              {/* 關閉按鈕 */}
              <button
                onClick={() => { setSelected(null); setExpandedStory(false); }}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white/70 hover:text-white flex items-center justify-center text-sm transition-all">
                ✕
              </button>

              {/* 漸層遮罩 + 文字 */}
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
                <div className="flex gap-3 mb-1 text-[10px] text-white/25">
                  <span>❤️ {getDisplayCount(selected).like.toLocaleString()}</span>
                  <span>💬 {getDisplayCount(selected).chat.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* CTA 按鈕 */}
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
