"use client";
import { useState, useEffect } from "react";

export const VOICE_OPTIONS = [
  { id: "female-1", label: "👩 低沉女聲", name: "Jane" },
  { id: "female-2", label: "👩 甜美女聲", name: "Stacy" },
  { id: "female-3", label: "👩 清晰女聲", name: "Anna" },
  { id: "female-4", label: "👩 活潑女聲", name: "Xiaoxi" },
  { id: "female-5", label: "👩 溫柔女聲", name: "Maya" },
  { id: "male-1", label: "👨 專業男聲", name: "Aliby" },
  { id: "male-2", label: "👨 溫暖男聲", name: "Evan" },
  { id: "male-3", label: "👨 成熟男聲", name: "Liu" },
  { id: "male-4", label: "👨 旁白男聲", name: "Adrian" },
  { id: "male-5", label: "👨 深沉男聲", name: "Wilson" },
];

const PRESET_IDS = new Set(VOICE_OPTIONS.map(v => v.id));

interface ClonedVoice {
  voice_id: string;
  name: string;
  character_id?: number;
}

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onChange: (voiceId: string) => void;
  userEmail: string;
  plan: string;
  characterId?: number;
}

// 克隆聲音上傳 Modal
function CloneVoiceModal({
  userEmail,
  characterId,
  onSuccess,
  onClose,
}: {
  userEmail: string;
  characterId?: number;
  onSuccess: (voiceId: string) => void;
  onClose: () => void;
}) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const handleUpload = async () => {
    if (!audioFile || !agreed) return;
    setUploading(true);
    setProgress("上傳音頻中...");

    const formData = new FormData();
    formData.append("audioFile", audioFile);
    formData.append("email", userEmail);
    if (characterId != null) formData.append("characterId", String(characterId));

    try {
      const res = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setProgress("克隆完成！");
        onSuccess(data.voice_id);
        alert("✅ 聲音克隆成功！已套用至此角色。");
        onClose();
      }
    } catch {
      alert("上傳失敗，請重試");
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#0d2318] border border-[#89f5a2]/20 rounded-3xl p-6 space-y-4 shadow-2xl">
        <div className="text-center">
          <p className="text-3xl mb-1">🎤</p>
          <h2 className="text-white font-black text-lg">上傳聲音克隆</h2>
          <p className="text-white/40 text-xs mt-1">
            上傳 1-2 分鐘本人錄音（MP3/WAV），AI 將克隆此聲音用於說話影片
          </p>
        </div>

        {/* 建議說明 */}
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1">
          <p className="text-white/60 text-xs font-bold">📋 錄音建議</p>
          <p className="text-white/35 text-[11px]">• 1-2 分鐘清晰錄音效果最佳</p>
          <p className="text-white/35 text-[11px]">• 安靜環境，避免背景噪音</p>
          <p className="text-white/35 text-[11px]">• MP3 或 WAV 格式，128kbps 以上</p>
        </div>

        {/* 檔案上傳 */}
        <div>
          <label className="block w-full cursor-pointer">
            <div className={`border-2 border-dashed rounded-xl px-4 py-5 text-center transition-all ${
              audioFile ? "border-[#89f5a2]/50 bg-[#89f5a2]/5" : "border-white/15 hover:border-white/30"
            }`}>
              {audioFile ? (
                <>
                  <p className="text-[#89f5a2] text-sm font-bold">✅ {audioFile.name}</p>
                  <p className="text-white/30 text-[11px] mt-0.5">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </>
              ) : (
                <>
                  <p className="text-white/40 text-sm">點擊選擇音頻檔案</p>
                  <p className="text-white/20 text-[11px] mt-0.5">MP3 / WAV</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept="audio/mp3,audio/mpeg,audio/wav,audio/*"
              className="hidden"
              onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* 免責聲明 */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setAgreed(prev => !prev)}
            className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all ${
              agreed ? "bg-[#89f5a2] border-[#89f5a2]" : "border-white/20"
            }`}
          >
            {agreed && <span className="text-[#0d2318] text-[10px] font-black">✓</span>}
          </div>
          <p className="text-white/35 text-[11px] leading-relaxed">
            我確認此為本人聲音，已獲授權使用。不得克隆他人聲音，違者自負法律責任。
          </p>
        </label>

        {uploading && (
          <p className="text-[#89f5a2] text-xs text-center animate-pulse">{progress}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all disabled:opacity-40"
          >
            取消
          </button>
          <button
            disabled={!audioFile || !agreed || uploading}
            onClick={handleUpload}
            className="py-3 rounded-xl bg-gradient-to-r from-[#89f5a2] to-[#4ade80] text-[#0d2318] text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
          >
            {uploading ? "上傳中..." : "🎤 開始克隆"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VoiceSelector({
  selectedVoiceId,
  onChange,
  userEmail,
  plan,
  characterId,
}: VoiceSelectorProps) {
  const isPaid = plan !== "free";
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [showCloneModal, setShowCloneModal] = useState(false);

  // 讀取已克隆聲音（voice_id 不在預設10個內的 saved_characters）
  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/saved-characters?email=${userEmail}`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const cloned = data
          .filter((c: any) => c.voice_id && !PRESET_IDS.has(c.voice_id))
          .map((c: any) => ({ voice_id: c.voice_id, name: c.name, character_id: c.id }));
        // 去重（同一個 voice_id 可能對應多個角色）
        const seen = new Set<string>();
        setClonedVoices(cloned.filter((v: ClonedVoice) => {
          if (seen.has(v.voice_id)) return false;
          seen.add(v.voice_id);
          return true;
        }));
      })
      .catch(() => {});
  }, [userEmail]);

  const femaleOptions = VOICE_OPTIONS.filter(v => v.id.startsWith("female"));
  const maleOptions = VOICE_OPTIONS.filter(v => v.id.startsWith("male"));

  return (
    <>
      <div className="space-y-3">

        {/* 已克隆聲音（有才顯示） */}
        {clonedVoices.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-white/40 text-[11px] font-bold">🎤 我的克隆聲音</p>
            <div className="flex flex-col gap-1.5">
              {clonedVoices.map(v => (
                <button
                  key={v.voice_id}
                  type="button"
                  onClick={() => onChange(v.voice_id)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all text-left ${
                    selectedVoiceId === v.voice_id
                      ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                  }`}
                >
                  🎙️ {v.name} 的聲音
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 預設聲線10個（兩欄） */}
        <div className="space-y-1.5">
          <p className="text-white/40 text-[11px] font-bold">🔊 預設聲線</p>
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              {femaleOptions.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange(v.id)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedVoiceId === v.id
                      ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {maleOptions.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange(v.id)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedVoiceId === v.id
                      ? "bg-[#89f5a2] text-[#0d2318] border-[#89f5a2]"
                      : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 上傳聲音克隆 */}
        <button
          type="button"
          disabled={!isPaid}
          onClick={() => isPaid && setShowCloneModal(true)}
          className={`w-full py-2.5 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${
            isPaid
              ? "bg-[#89f5a2]/10 border-[#89f5a2]/30 text-[#89f5a2] hover:bg-[#89f5a2]/20"
              : "bg-white/3 border-white/10 text-white/25 cursor-not-allowed"
          }`}
        >
          {isPaid ? "🎤 上傳聲音克隆（付費限定）" : "🔒 上傳聲音克隆（付費限定）"}
        </button>

      </div>

      {showCloneModal && (
        <CloneVoiceModal
          userEmail={userEmail}
          characterId={characterId}
          onSuccess={(voiceId) => {
            onChange(voiceId);
            // 重新拉一次已克隆列表
            fetch(`/api/saved-characters?email=${userEmail}`)
              .then(res => res.json())
              .then(data => {
                if (!Array.isArray(data)) return;
                const cloned = data
                  .filter((c: any) => c.voice_id && !PRESET_IDS.has(c.voice_id))
                  .map((c: any) => ({ voice_id: c.voice_id, name: c.name, character_id: c.id }));
                const seen = new Set<string>();
                setClonedVoices(cloned.filter((v: ClonedVoice) => {
                  if (seen.has(v.voice_id)) return false;
                  seen.add(v.voice_id);
                  return true;
                }));
              });
          }}
          onClose={() => setShowCloneModal(false)}
        />
      )}
    </>
  );
}
