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

  // 讀取角色資料
  useEffect(() => {
    if (!galleryId) return;
    fetch(`/api/gallery?id=${galleryId}`)
      .then(r => r.json())
      .then(data => {
        if (data.item) {
          const item = data.item;
          setCharacter(item);
          setLikeCount(seededRandom(item.id + "_like", item.like_count_min ?? 100, item.like_count_max ?? 500));
          setChatCount(seededRandom(item.id + "_chat", item.chat_count_min ?? 50, item.chat_count_max ?? 300) + (item.actual_chat_count ?? 0));
        }
      })
      .finally(() => setLoading(false));
  }, [galleryId]);

  // 讀取留言
  useEffect(() => {
    if (!galleryId) return;
    fetch(`/api/gallery/comments?gallery_id=${galleryId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.comments)) setComments(data.comments); });
  }, [galleryId]);

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
          {character.video_url ? (
            <video src={character.video_url} autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover" />
          ) : character.image_url ? (
            <img src={character.image_url} alt={character.name}
              className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[#1a1a1a]" />
          )}
          {character.is_featured && (
            <span className="absolute top-3 left-3 text-[10px] bg-amber-500/80 text-white rounded-full px-2.5 py-1 font-bold backdrop-blur-sm">⭐ 精選</span>
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
          <div className="flex gap-4 text-xs text-white/25 mb-4">
            <span>❤️ 喜歡次數 {likeCount.toLocaleString()}</span>
            <span>💬 聊天次數 {chatCount.toLocaleString()}</span>
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
        {/* CTA 按鈕 */}
        <div className="flex gap-3 mb-8">
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