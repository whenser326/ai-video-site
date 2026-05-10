"use client";
import { useState } from "react";

const VOICE_OPTIONS = [
  { id: "female-1", label: "Jane（女）低沉" },
  { id: "female-2", label: "Stacy（女）甜美" },
  { id: "female-3", label: "Anna（女）清晰" },
  { id: "female-4", label: "Xiaoxi（女）活潑" },
  { id: "female-5", label: "Maya（女）溫柔" },
  { id: "male-1", label: "Aliby（男）專業" },
  { id: "male-2", label: "Evan（男）溫暖" },
  { id: "male-3", label: "Liu（男）成熟" },
  { id: "male-4", label: "Adrian（男）旁白" },
  { id: "male-5", label: "Wilson（男）深沉" },
];

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
  lockedCharacterId?: number | null;       // 新增
  savedCharacters?: any[];                 // 新增
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
  lockedCharacterId,
  savedCharacters = [],
  onSaveSuccess,
  onClose,
}: SaveCharacterModalProps) {
  const [selectedVoice, setSelectedVoice] = useState("female-2");
  // 沒有鎖定角色時，用戶可選擇存入舊角色或新建
  const [mode, setMode] = useState<"existing" | "new">(
    lockedCharacterId ? "existing" : savedCharacters.length > 0 ? "existing" : "new"
  );
  const [selectedExistingId, setSelectedExistingId] = useState<number | null>(
    lockedCharacterId ?? (savedCharacters[0]?.id ?? null)
  );
  const [saving, setSaving] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState("");

  const handleSave = async () => {
    if (!predictionOutput || !userEmail) return;
    setSaving(true);

    // 先把圖片上傳到永久 Storage
    let finalImageUrl = predictionOutput;
    try {
      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: predictionOutput, email: userEmail }),
      });
      const uploadData = await uploadRes.json();
      if (uploadData.url) finalImageUrl = uploadData.url;
    } catch { /* 上傳失敗就用原始 URL */ }

    const description =
  [selectedRelation, selectedPersonality, selectedJob, customPersonality, selectedHair, selectedEye, selectedBody, customAppearance]
    .filter(Boolean)
    .join("・") || null;

    // 模式A：存入現有角色相簿（鎖定角色 or 用戶選的）
    if (mode === "existing" && selectedExistingId) {
      const res = await fetch("/api/user/save-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          imageUrl: finalImageUrl,
          characterId: selectedExistingId,
          status: "done",
        }),
      });
      const data = await res.json();
      setSaving(false);
      if (data.error) {
        alert(data.error);
      } else {
        onSaveSuccess(data);
        alert("✅ 已存入角色相簿！");
      }
      return;
    }

    // 模式B：新建角色
    const res = await fetch("/api/saved-characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        name: saveCharacterName || "未命名角色",
        image_url: finalImageUrl,
        plan,
        description,
        voice_id: selectedVoice,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) {
      alert(data.error);
    } else {
      onSaveSuccess(data.data);
      alert("✅ 角色已收藏！");
    }
  };

  // 有鎖定角色：直接顯示歸屬對象，不需要選
  const lockedChar = lockedCharacterId
    ? savedCharacters.find(c => c.id === lockedCharacterId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#0d2318] border border-yellow-400/20 rounded-3xl p-6 space-y-4 shadow-2xl">
        <div className="text-center">
          <p className="text-3xl mb-1">⭐</p>
          <h2 className="text-white font-black text-lg">收藏此角色</h2>
          <p className="text-white/40 text-xs mt-1">
            {lockedCharacterId ? "將存入鎖定角色的相簿" : "選擇存入方式"}
          </p>
        </div>

        {/* 有鎖定角色：直接顯示歸屬 */}
        {lockedChar && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#89f5a2]/10 border border-[#89f5a2]/30 rounded-xl">
            <img src={lockedChar.image_url} className="w-10 h-10 rounded-full object-cover border border-white/20" />
            <div>
              <p className="text-[#89f5a2] font-black text-sm">{lockedChar.name}</p>
              <p className="text-white/30 text-[10px]">圖片將存入此角色相簿</p>
            </div>
          </div>
        )}

        {/* 沒有鎖定角色：選擇模式 */}
        {!lockedCharacterId && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("existing")}
                disabled={savedCharacters.length === 0}
                className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                  mode === "existing"
                    ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-300"
                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                } disabled:opacity-25 disabled:cursor-not-allowed`}
              >
                存入舊角色
              </button>
              <button
                onClick={() => setMode("new")}
                className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                  mode === "new"
                    ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-300"
                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                }`}
              >
                新建角色
              </button>
            </div>

            {/* 存入舊角色：選擇哪個角色 */}
            {mode === "existing" && savedCharacters.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {savedCharacters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedExistingId(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                      selectedExistingId === c.id
                        ? "bg-[#89f5a2]/10 border-[#89f5a2]/40"
                        : "bg-white/3 border-white/8 hover:border-white/20"
                    }`}
                  >
                    <img src={c.image_url} className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0" />
                    <span className="text-white text-sm font-bold">{c.name}</span>
                    {selectedExistingId === c.id && <span className="ml-auto text-[#89f5a2] text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* 新建角色：輸入名稱 + 選聲音 */}
        {(mode === "new" || lockedCharacterId) && !lockedChar && (
          <>
            <input
              type="text"
              value={saveCharacterName}
              onChange={(e) => setSaveCharacterName(e.target.value)}
              placeholder="例如：我的主角、帥氣男生..."
              maxLength={20}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:border-yellow-400/50"
            />
            <div className="space-y-1.5">
  <p className="text-white/40 text-xs">💞 關係設定</p>
  <div className="flex gap-2 flex-wrap">
    {["初戀", "前輩", "青梅竹馬", "命中注定", "契約戀人", "死對頭"].map(r => (
      <button
        key={r}
        onClick={() => setSelectedRelation(prev => prev === r ? "" : r)}
        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
          selectedRelation === r
            ? "bg-yellow-400/20 border-yellow-400/50 text-yellow-300"
            : "bg-white/5 border-white/10 text-white/40 hover:border-white/25"
        }`}
      >
        {r}
      </button>
    ))}
  </div>
</div>
            <div className="space-y-1.5">
              <p className="text-white/40 text-xs">🎙️ 預設聲音</p>
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400/50 appearance-none"
              >
                {VOICE_OPTIONS.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#0d2318]">{v.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* 有鎖定角色且找到角色資料：只顯示聲音選擇讓用戶可以順便更新 */}
        {lockedChar && mode === "existing" && (
          <p className="text-white/20 text-[10px] text-center">圖片將新增至 {lockedChar.name} 的相簿</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:bg-white/5 transition-all"
          >
            取消
          </button>
          <button
            disabled={saving || (mode === "existing" && !selectedExistingId && !lockedCharacterId)}
            onClick={handleSave}
            className="py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-300 text-[#0d2318] text-sm font-black disabled:opacity-40 hover:opacity-90 transition-all"
          >
            {saving ? "儲存中..." : "⭐ 確認收藏"}
          </button>
        </div>
      </div>
    </div>
  );
}