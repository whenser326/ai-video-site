"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

interface GalleryCharacter {
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
  actual_chat_count: number;
  hidden_story?: string;
}
interface GalleryWork {
  id: string;
  user_email: string;
  image_url: string | null;
  video_url: string | null;
  work_type: "photo" | "video";
  expires_at: string | null;
  created_at: string;
}
interface Comment {
  id: string;
  user_email: string;
  content: string;
  created_at: string;
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

function maskEmail(email: string) {
  const [name] = email.split("@");
  if (name.length <= 2) return name[0] + "**";
  return name[0] + "*".repeat(Math.min(name.length - 2, 4)) + name[name.length - 1];
}

export default function GalleryDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const galleryId = params?.id as string;

  const [character, setCharacter] = useState<GalleryCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState<{ type: "original" } | { type: "work"; work: GalleryWork }>({ type: "original" });
  const [works, setWorks] = useState<GalleryWork[]>([]);
  const [worksLoading, setWorksLoading] = useState(true);
  const [activeWorkIdx, setActiveWorkIdx] = useState(0);
  const [viewerPlan, setViewerPlan] = useState("free");
  const [hasUnlocked, setHasUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [hiddenStory, setHiddenStory] = useState("");
  const [unlockCost, setUnlockCost] = useState(3);

  // 讀取角色資料
  useEffect(() => {
    if (!galleryId) return;
    fetch(`/api/gallery?id=${galleryId}`)
      .then(r => r.json())
      .then(data => {
        if (data.item) {
          const item = data.item;
          setCharacter(item);
          // 查詢該用戶是否已點讚，並從 API 拿最新 like_count_min
          if (session?.user?.email) {
            fetch(`/api/gallery/like?galleryId=${item.id}&userEmail=${encodeURIComponent(session.user.email)}`)
              .then(r => r.json())
              .then(d => {
                if (d.hasLiked) setLiked(true);
                const base = d.likeCountMin ?? item.like_count_min ?? 100;
                setLikeCount(seededRandom(item.id + "_like", base, item.like_count_max ?? 500));
              })
              .catch(() => {
                setLikeCount(seededRandom(item.id + "_like", item.like_count_min ?? 100, item.like_count_max ?? 500));
              });
          } else {
            setLikeCount(seededRandom(item.id + "_like", item.like_count_min ?? 100, item.like_count_max ?? 500));
          }
          setChatCount(seededRandom(item.id + "_chat", item.chat_count_min ?? 50, item.chat_count_max ?? 300) + (item.actual_chat_count ?? 0));
        }
      })
      .finally(() => setLoading(false));
  }, [galleryId, session]);
  // 查詢解鎖狀態 + 讀取 unlock_story_credits
  useEffect(() => {
    if (!galleryId || !session?.user?.email) return;
    fetch(`/api/gallery/unlock?galleryId=${galleryId}&userEmail=${encodeURIComponent(session.user.email)}`)
      .then(r => r.json())
      .then(d => { if (d.hasUnlocked) setHasUnlocked(true); })
      .catch(() => {});
    fetch("/api/referral/settings-public")
      .then(r => r.json())
      .then(d => { if (d.unlock_story_credits) setUnlockCost(parseInt(d.unlock_story_credits)); })
      .catch(() => {});
  }, [galleryId, session]);
// 讀取公開作品
  useEffect(() => {
    if (!galleryId) return;
    const loadWorks = () => {
      const email = session?.user?.email ? `&email=${session.user.email}` : "";
      fetch(`/api/gallery-works?galleryId=${galleryId}${email}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.works)) setWorks(data.works);
          if (data.viewerPlan) setViewerPlan(data.viewerPlan);
        })
        .finally(() => setWorksLoading(false));
    };
    loadWorks();
    const onVisible = () => { if (document.visibilityState === "visible") loadWorks(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [galleryId, session]);
  // 讀取留言
  useEffect(() => {
    if (!galleryId) return;
    fetch(`/api/gallery/comments?gallery_id=${galleryId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.comments)) setComments(data.comments); });
  }, [galleryId]);
const handleDeleteWork = async (workId: string) => {
    if (!session?.user?.email) return;
    if (!confirm("確定要刪除這個作品嗎？")) return;
    const res = await fetch(`/api/gallery-works?id=${workId}&email=${encodeURIComponent(session.user.email)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setWorks(prev => prev.filter(w => w.id !== workId));
      if (activeWorkIdx >= works.length - 1) setActiveWorkIdx(Math.max(0, works.length - 2));
    } else {
      alert("刪除失敗");
    }
  };

  const getDaysLeft = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const canDelete = (work: GalleryWork) => {
    const email = session?.user?.email;
    if (!email) return false;
    if (email === "whenser@gmail.com") return true;
    if (viewerPlan === "pro") return true;
    if ((viewerPlan === "starter" || viewerPlan === "standard") && work.user_email === email) return true;
    return false;
  };
  const handleUnlock = async () => {
    if (!session?.user?.email) { setUnlockError("請先登入"); return; }
    setUnlocking(true);
    setUnlockError("");
    try {
      const res = await fetch("/api/gallery/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryId }),
      });
      const data = await res.json();
      if (data.ok) {
        setHasUnlocked(true);
        setHiddenStory(data.hiddenStory);
      } else {
        setUnlockError(data.error || "解鎖失敗");
      }
    } catch {
      setUnlockError("解鎖失敗，請重試");
    } finally {
      setUnlocking(false);
    }
  };

  const handleComment = async () => {
    if (!session?.user?.email) { setCommentError("請先登入才能留言"); return; }
    if (!commentInput.trim()) return;
    if (commentInput.trim().length > 200) { setCommentError("留言不能超過200字"); return; }
    setCommentLoading(true);
    setCommentError("");
    try {
      const res = await fetch("/api/gallery/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gallery_id: galleryId, user_email: session.user.email, content: commentInput.trim() }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments(prev => [data.comment, ...prev]);
        setCommentInput("");
      } else {
        setCommentError(data.error || "留言失敗");
      }
    } catch {
      setCommentError("留言失敗，請重試");
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#89f5a2]/30 border-t-[#89f5a2] animate-spin" />
    </div>
  );

  if (!character) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white/30 text-sm">找不到此角色</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="h-12" />

      {/* 頂部返回 */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all">
          ←
        </button>
        <p className="text-white/40 text-sm">角色詳情</p>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-20">

        {/* 角色主圖 */}
        <div className="relative w-full rounded-3xl overflow-hidden mb-5" style={{ aspectRatio: "3/4" }}>
          {activeSlide.type === "original" ? (
            character.video_url ? (
              <video src={character.video_url} autoPlay loop muted playsInline
                className="absolute inset-0 w-full h-full object-cover" />
            ) : character.image_url ? (
              <img src={character.image_url} alt={character.name}
                className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[#1a1a1a]" />
            )
          ) : (
            activeSlide.work.work_type === "video" && activeSlide.work.video_url ? (
              <video src={activeSlide.work.video_url} autoPlay loop controls playsInline
                className="absolute inset-0 w-full h-full object-cover" />
            ) : activeSlide.work.image_url ? (
              <img src={activeSlide.work.image_url} alt="作品"
                className="absolute inset-0 w-full h-full object-cover" />
            ) : null
          )}
          {character.is_featured && activeSlide.type === "original" && (
            <span className="absolute top-3 left-3 text-[10px] bg-amber-500/80 text-white rounded-full px-2.5 py-1 font-bold backdrop-blur-sm">⭐ 精選</span>
          )}
          {activeSlide.type === "work" && (
            <button onClick={() => setActiveSlide({ type: "original" })}
              className="absolute top-3 left-3 text-[10px] bg-black/60 border border-white/20 text-white/70 rounded-full px-2.5 py-1 hover:text-white transition-all">
              ← 角色原圖
            </button>
          )}
        </div>

        {/* 角色基本資訊 */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black text-white">{character.name}</h1>
            <span className="text-white/30 text-sm">{character.age}歲</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {character.personality_tags.map((t: string) => (
              <span key={t} className="text-[11px] bg-[#89f5a2]/10 border border-[#89f5a2]/25 text-[#89f5a2]/70 rounded-full px-2.5 py-1">{t}</span>
            ))}
          </div>
          <div className="flex gap-4 text-xs mb-4">
            <button
              onClick={async () => {
                if (likeLoading || !session?.user?.email) return;
                setLikeLoading(true);
                const newLiked = !liked;
                setLiked(newLiked);
                setLikeCount(prev => prev + (newLiked ? 1 : -1));
                await fetch("/api/gallery/like", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    galleryId,
                    userEmail: session.user.email,
                    action: newLiked ? "like" : "unlike",
                  }),
                }).catch(() => {
                  // 失敗時還原
                  setLiked(!newLiked);
                  setLikeCount(prev => prev + (newLiked ? -1 : 1));
                });
                setLikeLoading(false);
              }}
              className={`flex items-center gap-1.5 transition-all ${liked ? "text-red-400" : "text-white/25 hover:text-red-300"}`}
            >
              {liked ? "❤️" : "🤍"} {likeCount.toLocaleString()}
            </button>
            <span className="text-white/25 flex items-center gap-1.5">💬 {chatCount.toLocaleString()}</span>
          </div>
          <p className="text-white/55 text-sm leading-relaxed">{character.story}</p>
        </div>
{/* 分享按鈕 */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => {
              const url = `${window.location.origin}/gallery/${character.id}`;
              navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/30 text-xs hover:border-white/30 hover:text-white/60 transition-all"
          >
            {copied ? "✅ 已複製連結" : "🔗 分享角色"}
          </button>
        </div>
        {/* 隱藏故事解鎖區塊 */}
        {character.hidden_story || hiddenStory ? (
          <div className="mb-4 p-4 bg-[#1a1a1a] border border-white/10 rounded-2xl">
            <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mb-2">🔒 隱藏故事</p>
            {hasUnlocked ? (
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                {(hiddenStory || character.hidden_story || '').replace(/^#\s*隱藏故事\s*\n?/, '').trim()}
              </p>
            ) : (
              <div className="text-center py-2">
                <p className="text-white/30 text-xs mb-3">解鎖閱讀角色的隱藏背景故事，花費 <span className="text-[#89f5a2]">{unlockCost} 點</span></p>
                <p className="text-[#89f5a2] text-xs mt-1 mb-3 font-medium">✨ 解鎖後角色將對你敞開心扉，聊天內容將有所不同</p>
                {unlockError && <p className="text-red-400 text-xs mb-2">{unlockError}</p>}
                <button onClick={handleUnlock} disabled={unlocking || !session}
                  className="px-5 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] rounded-full text-sm font-bold hover:bg-[#89f5a2]/30 transition disabled:opacity-40">
                  {unlocking ? "解鎖中..." : `🔓 解鎖（${unlockCost} 點）`}
                </button>
                {!session && <p className="text-white/20 text-xs mt-2">請先登入</p>}
              </div>
            )}
          </div>
        ) : null}

        {/* CTA 按鈕 */}
        <div className="flex gap-3 mb-4">
          <button onClick={() => router.push(`/chat/gallery/${character.id}`)}
            className="flex-1 py-3.5 bg-[#89f5a2] text-[#0d2318] rounded-2xl text-sm font-black hover:bg-[#89f5a2]/90 transition-all">
            💬 開始聊天
          </button>
          <button onClick={() => {
            const prompt = [character.name, `${character.age}歲`, ...character.personality_tags].join("，");
            router.push(`/create?prompt=${encodeURIComponent(prompt)}`);
          }}
            className="flex-1 py-3.5 bg-transparent border border-white/20 text-white/60 rounded-2xl text-sm font-black hover:border-white/40 hover:text-white transition-all">
            🎨 生成同款
          </button>
        </div>
{/* 作品相簿 */}
        {works.length > 0 && (
          <div className="mb-8">
            <p className="text-white/30 text-[10px] font-black tracking-widest uppercase mb-3">📸 聊天作品，點擊會將圖放大至上方，手機長按可儲存</p>
            <div className="grid grid-cols-3 gap-2">
              {works.map((w, idx) => {
                const email = session?.user?.email;
                const canDel = email === "whenser@gmail.com" || viewerPlan === "pro";
                const daysLeft = w.expires_at ? Math.ceil((new Date(w.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <div key={w.id} className="relative rounded-xl overflow-hidden bg-[#1a1a1a] aspect-square cursor-pointer" onClick={() => setActiveSlide({ type: "work", work: w })}>
                    {w.work_type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/40 text-xl">▶</span>
                      </div>
                    ) : w.image_url ? (
                      <img src={w.image_url} alt="作品" className="w-full h-full object-cover" />
                    ) : null}
                    {daysLeft !== null && (
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-center" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}>
                        <p className="text-[9px] text-amber-400 font-bold">{daysLeft}天後過期</p>
                        <p className="text-[8px] text-white/40">升級可永久保留</p>
                      </div>
                    )}
                    {canDel && (
                      <button
                        onClick={() => handleDeleteWork(w.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white/60 hover:text-red-400 flex items-center justify-center text-xs transition-all">
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="mb-8 px-4 py-3 bg-[#89f5a2]/5 border border-[#89f5a2]/15 rounded-2xl flex items-center gap-3">
          <span className="text-xl flex-shrink-0">🔓</span>
          <p className="text-white/40 text-xs leading-relaxed">聊越多解鎖越多！每聊 <span className="text-[#89f5a2]/70 font-bold">50／100／200／500</span> 則，角色會說出只有你能看的隱藏內容</p>
        </div>
        {/* 留言區 */}
        <div>
          <p className="text-white/40 text-xs font-black tracking-widest uppercase mb-4">🗨️ {comments.length > 0 ? `${comments.length} 則留言` : "留言區"}</p>

          {/* 輸入框 */}
          <div className="mb-5">
            <textarea
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder={session ? `跟大家分享你對 ${character.name} 的想法...` : "登入後才能留言"}
              disabled={!session}
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-[#89f5a2]/40 leading-relaxed disabled:opacity-40"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-red-400 text-xs">{commentError}</p>
              <div className="flex items-center gap-3">
                <span className="text-white/20 text-xs">{commentInput.length}/200</span>
                <button
                  onClick={handleComment}
                  disabled={commentLoading || !commentInput.trim() || !session}
                  className="px-4 py-1.5 bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] rounded-full text-xs font-black hover:bg-[#89f5a2]/30 disabled:opacity-30 transition-all">
                  {commentLoading ? "送出中..." : "送出"}
                </button>
              </div>
            </div>
          </div>

          {/* 留言列表 */}
          {comments.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-8">還沒有留言，來第一個留言吧！</p>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="px-4 py-3 bg-white/3 border border-white/8 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[#89f5a2]/60 text-xs font-bold">{maskEmail(c.user_email)}</span>
                    <span className="text-white/20 text-[10px]">
                      {new Date(c.created_at).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}