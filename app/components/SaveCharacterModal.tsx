"use client";

// app/components/SaveCharacterModal.tsx
// Code Splitting — 收藏角色命名 Modal

interface SaveCharacterModalProps {
  saveCharacterName: string;
  setSaveCharacterName: (n: string) => void;
  isSaving: boolean;
  selectedPersonality: string;
  selectedJob: string;
  customPersonality: string;
  selectedHair: string;
  selectedEye: string;
  selectedBody: string;
  customAppearance: string;
  predictionOutput: string | null;
  userEmail: string | null | undefined;
  plan: string;
  onSaveSuccess: (data: any) => void;
  onClose: () => void;
}

export default function SaveCharacterModal({
  saveCharacterName,
  setSaveCharacterName,
  isSaving,
  selectedPersonality,
  selectedJob,
  customPersonality,
  selectedHair,
  selectedEye,
  selectedBody,
  customAppearance,
  predictionOutput,
  userEmail,
  plan,
  onSaveSuccess,
  onClose,
}: SaveCharacterModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#0d2318] border border-yellow-400/20 rounded-3xl p-6 space-y-4 shadow-2xl">
        <div className="text-center">
          <p className="text-3xl mb-1">⭐</p>
          <h2 className="text-white font-black text-lg">收藏此角色</h2>
          <p className="text-white/40 text-xs mt-1">幫這個角色取個名字吧！</p>
        </div>
        <input
          type="text"
          value={saveCharacterName}
          onChange={(e) => setSaveCharacterName(e.target.value)}
          placeholder="例如：我的主角、帥氣男生..."
          maxLength={20}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:border-yellow-400/50"
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
          >
            取消
          </button>
          <button
            disabled={isSaving}
            onClick={async () => {
              if (!predictionOutput) return;
              const res = await fetch("/api/saved-characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: userEmail,
                  name: saveCharacterName || "未命名角色",
                  image_url: predictionOutput,
                  plan,
                  description:
                    [selectedPersonality, selectedJob, customPersonality, selectedHair, selectedEye, selectedBody, customAppearance]
                      .filter(Boolean)
                      .join("・") || null,
                }),
              });
              const data = await res.json();
              if (data.error) {
                alert(data.error);
              } else {
                onSaveSuccess(data.data);
                alert("✅ 角色已收藏！");
              }
            }}
            className="py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-300 text-[#0d2318] text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
          >
            {isSaving ? "收藏中..." : "⭐ 確認收藏"}
          </button>
        </div>
      </div>
    </div>
  );
}