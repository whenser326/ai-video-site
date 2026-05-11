"use client";
import { useState } from "react";

// app/components/TtsModal.tsx
// Code Splitting — TTS 語音合成 + Wav2Lip Modal（兩者整合在同一元件）

interface TtsModalProps {
  plan: string;
  videoDuration: number;
  ttsText: string;
  setTtsText: (t: string) => void;
  ttsVoice: string;
  setTtsVoice: (v: string) => void;
  ttsAudio: string | null;
  setTtsAudio: (a: string | null) => void;
  isTtsLoading: boolean;
  setIsTtsLoading: (b: boolean) => void;
  ttsTrimmed: boolean;
  setTtsTrimmed: (b: boolean) => void;
  ttsCache: Record<string, string>;
  setTtsCache: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  ttsPreviewCount: number;
  setTtsPreviewCount: (fn: (prev: number) => number) => void;
  TTS_MAX_PREVIEW: number;
  ttsSeconds: number;
  isWav2lipLoading: boolean;
  setIsWav2lipLoading: (b: boolean) => void;
  wav2lipResult: string | null;
  setWav2lipResult: (r: string | null) => void;
  wav2lipSeconds: number;
  prediction: any;
  mediaUrl?: string;
  userEmail: string | null | undefined;
  setCredits: (fn: (prev: number | null) => number | null) => void;
  onClose: () => void;
  downloadFile: (url: string) => void;
  lockedCharacterUrl?: string | null;
}

export default function TtsModal({
  plan,
  videoDuration,
  ttsText,
  setTtsText,
  ttsVoice,
  setTtsVoice,
  ttsAudio,
  setTtsAudio,
  isTtsLoading,
  setIsTtsLoading,
  ttsTrimmed,
  setTtsTrimmed,
  ttsCache,
  setTtsCache,
  ttsPreviewCount,
  setTtsPreviewCount,
  TTS_MAX_PREVIEW,
  ttsSeconds,
  isWav2lipLoading,
  setIsWav2lipLoading,
  wav2lipResult,
  setWav2lipResult,
wav2lipSeconds,
prediction,
mediaUrl,
userEmail,
  setCredits,
  onClose,
  downloadFile,
  lockedCharacterUrl,
}: TtsModalProps) {
  const maxChars = videoDuration === 5 ? 30 : 55;
  const planCredits = plan === "starter" ? 8 : plan === "standard" ? 7 : 6;
  const wav2lipCredits = plan === "starter" ? 10 : plan === "standard" ? 9 : 8;
  const avatarCredits = plan === "starter" ? 10 : plan === "standard" ? 9 : 8;

  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarResult, setAvatarResult] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState("");

  const handlePreview = async () => {
    // 已 cache 直接播放
    if (ttsCache[ttsVoice]) {
      setTtsAudio(ttsCache[ttsVoice]);
      return;
    }
    // 次數用完
    if (!ttsCache[ttsVoice] && ttsPreviewCount >= TTS_MAX_PREVIEW) {
      alert("本影片試聽次數已用完");
      return;
    }
    setIsTtsLoading(true);
    setTtsAudio(null);
    setTtsTrimmed(false);
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: ttsText, voiceId: ttsVoice, videoDuration }),
    });
    const data = await res.json();
    if (data.audio) {
      setTtsAudio(data.audio);
      setTtsTrimmed(data.trimmed);
      setTtsCache((prev) => ({ ...prev, [ttsVoice]: data.audio }));
      setTtsPreviewCount((prev) => prev + 1);
    } else {
      alert(data.error || "語音生成失敗");
    }
    setIsTtsLoading(false);
  };

  const handleDownload = async () => {
    if (!ttsAudio) return;
    const link = document.createElement("a");
    link.href = `data:audio/mp3;base64,${ttsAudio}`;
    link.download = `ai-voice-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await fetch("/api/character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refundCredits: -planCredits, userEmail }),
    });
    fetch(`/api/user/credits?email=${userEmail}`)
      .then((r) => r.json())
      .then((d) => setCredits(() => d.credits));
    alert("✅ 語音已下載，點數已扣除！");
  };

  const handleWav2lip = async () => {
    const finalMediaUrl = mediaUrl || prediction?.output;
    if (!finalMediaUrl) {
      alert("找不到圖片或影片，請先選擇後再試");
      return;
    }
    setIsWav2lipLoading(true);
    setWav2lipResult(null);
    try {
      const startRes = await fetch("/api/wav2lip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: finalMediaUrl,
          audioBase64: ttsAudio,
          userEmail,
          plan,
        }),
      });
      const startData = await startRes.json();
      if (!startData.id) {
        alert(startData.error || "合成啟動失敗");
        setIsWav2lipLoading(false);
        return;
      }
      fetch(`/api/user/credits?email=${userEmail}`)
        .then((r) => r.json())
        .then((d) => setCredits(() => d.credits));

      const pollWav2lip = async (id: string) => {
        const pollRes = await fetch(`/api/wav2lip?id=${id}&email=${userEmail}`);
        const pollData = await pollRes.json();
        if (pollData.status === "succeeded" && pollData.output) {
          setWav2lipResult(pollData.output);
          setIsWav2lipLoading(false);
        } else if (pollData.status === "failed") {
          alert("合成失敗，點數已退還");
          fetch(`/api/user/credits?email=${userEmail}`)
            .then((r) => r.json())
            .then((d) => setCredits(() => d.credits));
          setIsWav2lipLoading(false);
        } else {
          setTimeout(() => pollWav2lip(id), 3000);
        }
      };
      pollWav2lip(startData.id);
    } catch {
      alert("合成失敗，請重試");
      setIsWav2lipLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#0d2318] border border-purple-500/20 rounded-3xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="text-center">
          <p className="text-3xl mb-1">🎙️</p>
          <h2 className="text-white font-black text-lg">語音合成</h2>
          <p className="text-white/40 text-xs mt-1">輸入台詞，讓角色開口說話</p>
        </div>

        {/* 聲音選擇 */}
        <div>
          <p className="text-white/40 text-xs font-bold mb-2">選擇聲音</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: "female-1", label: "👩 低沉女聲" },
              { id: "female-2", label: "👩 甜美女聲" },
              { id: "female-3", label: "👩 清晰女聲" },
              { id: "female-4", label: "👩 活潑女聲" },
              { id: "female-5", label: "👩 溫柔女聲" },
              { id: "male-1", label: "👨 專業男聲" },
              { id: "male-2", label: "👨 溫暖男聲" },
              { id: "male-3", label: "👨 成熟男聲" },
              { id: "male-4", label: "👨 旁白男聲" },
              { id: "male-5", label: "👨 深沉男聲" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setTtsVoice(v.id);
                  setTtsTrimmed(false);
                  if (ttsCache[v.id]) {
                    setTtsAudio(ttsCache[v.id]);
                  } else {
                    setTtsAudio(null);
                  }
                }}
                className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                  ttsVoice === v.id
                    ? "bg-purple-500/30 text-purple-200 border-purple-500"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* 台詞輸入 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-white/40 text-xs font-bold">輸入台詞</p>
            <p className={`text-xs ${ttsText.length > maxChars ? "text-red-400 font-bold" : "text-white/30"}`}>
              {ttsText.length}/{maxChars}字
              {ttsText.length > maxChars ? "　⚠ 已超過上限，請刪減後再試聽" : ""}
            </p>
          </div>
          <textarea
            value={ttsText}
            onChange={(e) => { setTtsText(e.target.value); setTtsAudio(null); }}
            placeholder="中英文皆可，例如：大家好，我是AI生成的角色！"
            rows={3}
            maxLength={maxChars}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-purple-500/50"
          />
          {ttsTrimmed && (
            <p className="text-yellow-300 text-xs mt-1">⚠️ 文字已超過上限，自動截斷</p>
          )}
        </div>

        {/* 試聽結果 */}
        {ttsAudio && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 space-y-3">
            <p className="text-purple-300 text-xs font-bold">🎵 試聽結果</p>
            <audio controls className="w-full" src={`data:audio/mp3;base64,${ttsAudio}`} />
            <button
              onClick={handleDownload}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-black hover:opacity-90 transition-all"
            >
              ⬇️ 下載語音（扣 {planCredits} 點）
            </button>

            {/* Wav2Lip 區塊 */}
            <div className="border border-orange-400/30 bg-orange-400/5 rounded-xl p-3 space-y-2">
              <p className="text-orange-300 font-black text-sm">🎬 合成到影片（讓角色開口說話）</p>
              {!mediaUrl && !prediction?.output && (
                <p className="text-white/40 text-xs">⚠️ 需要先有圖片或影片才能合成</p>
              )}

              {/* Wav2Lip 進度條 */}
              {isWav2lipLoading && (
                <div className="p-4 bg-black/25 rounded-2xl border border-orange-400/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-300 text-xs font-black tracking-widest uppercase">🎬 合成中</span>
                    <span className="text-white/60 text-xs font-mono">
                      {wav2lipSeconds >= 120
                        ? "請保持頁面開啟"
                        : `剩餘約 ${Math.max(120 - wav2lipSeconds, 0)} 秒`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((wav2lipSeconds / 120) * 100, 95)}%` }}
                    />
                  </div>
                  <p className="text-white/25 text-[10px] text-center">
                    {wav2lipSeconds >= 60
                      ? "⚠️ 合成時間較長，請保持頁面開啟，若超過 3 分鐘仍未完成，可能是影片臉部不夠清晰導致，建議換一支影片重試"
                      : "嘴型合成約需 60～120 秒，請耐心等候"}
                  </p>
                </div>
              )}

              <p className="text-orange-200 text-xs font-bold leading-relaxed">
                ⚠️ 注意：影片必須包含<span className="text-orange-300 font-black">清晰正面人臉</span>，側臉或無臉的影片將會合成失敗！
              </p>
              <p className="text-white/40 text-xs">扣 {wav2lipCredits} 點，失敗自動退點</p>

              {wav2lipResult ? (
                <div className="space-y-2">
                  <video controls className="w-full rounded-lg" src={wav2lipResult} />
                  <button
                    onClick={() => downloadFile(wav2lipResult!)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-black hover:opacity-90 transition-all"
                  >
                    ⬇️ 下載說話影片
                  </button>
                  <button
                    onClick={() => { setWav2lipResult(null); onClose(); setTtsAudio(null); }}
                    className="w-full py-2 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
                  >
                    ✅ 完成，關閉視窗
                  </button>
                </div>
              ) : (
                <button
                  disabled={isWav2lipLoading}
                  onClick={handleWav2lip}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-black hover:opacity-90 transition-all disabled:opacity-40"
                >
                  {isWav2lipLoading
                    ? "⏳ 合成中，請稍候..."
                    : `🎬 合成到影片（扣 ${wav2lipCredits} 點）`}
                </button>
              )}
              {/* Kling Avatar 區塊 */}
            {lockedCharacterUrl && (
              <div className="border border-purple-400/30 bg-purple-400/5 rounded-xl p-3 space-y-2 mt-2">
                <p className="text-purple-300 font-black text-sm">🎭 Kling Avatar 說話影片（更自然）</p>
                <p className="text-white/40 text-xs">用鎖定角色的照片直接生成說話影片，無需影片素材</p>
                <p className="text-white/40 text-xs">扣 {avatarCredits} 點，失敗自動退點</p>

                {isAvatarLoading && (
                  <div className="p-3 bg-black/25 rounded-xl border border-purple-400/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-300 text-xs font-black">🎭 生成中</span>
                      <span className="text-white/50 text-xs">{avatarStatus}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                    <p className="text-white/25 text-[10px] text-center">說話影片約需 3-5 分鐘，請勿關閉視窗</p>
                  </div>
                )}
                {!isAvatarLoading && avatarStatus && (
                  <p className="text-purple-300/70 text-xs text-center">{avatarStatus}</p>
                )}

                {avatarResult ? (
                  <div className="space-y-2">
                    <video controls className="w-full rounded-lg" src={avatarResult} />
                    <button
                      onClick={() => downloadFile(avatarResult!)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-black hover:opacity-90 transition-all"
                    >
                      ⬇️ 下載說話影片
                    </button>
                    <button
                      onClick={() => { setAvatarResult(null); setAvatarStatus(""); onClose(); }}
                      className="w-full py-2 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
                    >
                      ✅ 完成，關閉視窗
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={isAvatarLoading}
                    onClick={async () => {
                      if (!ttsAudio || !userEmail || !lockedCharacterUrl) return;
                      setIsAvatarLoading(true);
                      setAvatarStatus("🎬 合成說話影片中...");
                      try {
                        const avatarRes = await fetch("/api/kling-avatar", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            imageUrl: lockedCharacterUrl,
                            audioBase64: ttsAudio,
                            prompt: "natural talking",
                            mode: "std",
                            userEmail,
                            plan,
                          }),
                        });
                        const avatarData = await avatarRes.json();
                        if (!avatarData.id) throw new Error(avatarData.error || "生成失敗");
                        setAvatarStatus("⏳ 生成中，請稍候約 3-5 分鐘...");
                        setCredits(prev => prev !== null ? prev - avatarData.creditCost : prev);
                        for (let i = 0; i < 60; i++) {
                          await new Promise(r => setTimeout(r, 5000));
                          const poll = await fetch(`/api/kling-avatar?id=${avatarData.id}`);
                          const pollData = await poll.json();
                          if (pollData.status === "succeeded") {
                            const url = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
                            setAvatarResult(url);
                            setAvatarStatus("");
                            setIsAvatarLoading(false);
                            return;
                          }
                          if (pollData.status === "failed") throw new Error("影片生成失敗");
                        }
                        throw new Error("生成逾時");
                      } catch (err: any) {
                        setAvatarStatus(`❌ ${err.message}`);
                        setIsAvatarLoading(false);
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-black hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    {isAvatarLoading ? "⏳ 生成中..." : `🎭 生成說話影片（扣 ${avatarCredits} 點）`}
                  </button>
                )}
              </div>
            )}
            </div>
          </div>
        )}

        {/* TTS 載入進度條 */}
        {isTtsLoading && (
          <div className="p-4 bg-black/25 rounded-2xl border border-purple-500/20 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-purple-300 text-xs font-black tracking-widest uppercase">🎙️ 語音生成中</span>
              <span className="text-white/60 text-xs font-mono">
                {ttsSeconds >= 60 ? "請耐心等候" : `剩餘約 ${Math.max(60 - ttsSeconds, 0)} 秒`}
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((ttsSeconds / 60) * 100, 95)}%` }}
              />
            </div>
            <p className="text-white/25 text-[10px] text-center">
              {ttsSeconds >= 60
                ? "語音生成時間較長，請保持頁面開啟"
                : "語音生成約需 30 至 60 秒，請耐心等候"}
            </p>
          </div>
        )}

        {/* 試聽次數 + 按鈕 */}
        <p className="text-center text-xs font-black text-yellow-300">
          ⚠️ 本影片免費試聽 {TTS_MAX_PREVIEW} 次（剩餘 {Math.max(TTS_MAX_PREVIEW - ttsPreviewCount, 0)} 次）
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { onClose(); setTtsAudio(null); }}
            className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
          >
            取消
          </button>
          <button
            disabled={isTtsLoading || !ttsText.trim() || ttsText.length > maxChars}
            onClick={handlePreview}
            className="py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
          >
            {isTtsLoading
              ? "生成中..."
              : ttsCache[ttsVoice]
              ? "🔄 重新播放"
              : ttsPreviewCount >= TTS_MAX_PREVIEW
              ? "🚫 試聽次數已用完"
              : "🎙️ 免費試聽"}
          </button>
        </div>
      </div>
    </div>
  );
}
