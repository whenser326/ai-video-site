"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "whenser@gmail.com";

// [DNA_PATCH_START]
type Settings = {
  referral_credits_starter: string;
  referral_credits_standard: string;
  referral_credits_pro: string;
  plan_credits_starter: string;
  plan_credits_standard: string;
  plan_credits_pro: string;
  plan_price_starter: string;
  plan_price_standard: string;
  plan_price_pro: string;
  tts_credits_starter: string;
  tts_credits_standard: string;
  tts_credits_pro: string;
  wav2lip_credits_starter: string;
  wav2lip_credits_standard: string;
  wav2lip_credits_pro: string;
  kling_5s_starter: string;
  kling_5s_standard: string;
  kling_5s_pro: string;
  kling_10s_starter: string;
  kling_10s_standard: string;
  kling_10s_pro: string;
  seedance_5s_starter: string;
  seedance_5s_standard: string;
  seedance_5s_pro: string;
  seedance_10s_starter: string;
  seedance_10s_standard: string;
  seedance_10s_pro: string;
  omni_extra_starter: string;
  omni_extra_standard: string;
  omni_extra_pro: string;
  motion_max_size_mb: string;
  motion_min_duration_sec: string;
  motion_max_duration_sec: string;
  adult_section_enabled: string;
};
// [DNA_PATCH_END]

type Log = {
  id: string;
  referrer_email: string;
  referred_email: string;
  plan: string;
  credits_awarded: number;
  created_at: string;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    referral_credits_starter: "1",
    referral_credits_standard: "3",
    referral_credits_pro: "8",
    plan_credits_starter: "30",
    plan_credits_standard: "80",
    plan_credits_pro: "200",
    plan_price_starter: "250",
    plan_price_standard: "450",
    plan_price_pro: "799",
    tts_credits_starter: "8",
    tts_credits_standard: "7",
    tts_credits_pro: "6",
    wav2lip_credits_starter: "10",
    wav2lip_credits_standard: "9",
    wav2lip_credits_pro: "8",
    kling_5s_starter: "6",
    kling_5s_standard: "5",
    kling_5s_pro: "4",
    kling_10s_starter: "8",
    kling_10s_standard: "7",
    kling_10s_pro: "6",
    seedance_5s_starter: "17",
    seedance_5s_standard: "15",
    seedance_5s_pro: "13",
    seedance_10s_starter: "27",
    seedance_10s_standard: "25",
    seedance_10s_pro: "21",
    omni_extra_starter: "6",
    omni_extra_standard: "5",
    omni_extra_pro: "4",
    motion_max_size_mb: "30",
    motion_min_duration_sec: "5",
    motion_max_duration_sec: "10",
    adult_section_enabled: "false",
  });
  const [logs, setLogs] = useState<Log[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { signIn("google"); return; }
    if (session && session.user?.email !== ADMIN_EMAIL) { router.push("/"); return; }
    if (session) { fetchData(); }
  }, [session, status]);

  const fetchData = async () => {
    const res = await fetch(`/api/admin/settings?email=${session?.user?.email}`);
    const data = await res.json();
    if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
    if (data.logs) setLogs(data.logs);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/admin/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, adminEmail: session?.user?.email }),
    });
    const data = await res.json();
    setMsg(data.ok ? "✅ 儲存成功！" : "❌ 儲存失敗");
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  if (status === "loading" || !session) return <div className="min-h-screen bg-[#0d2318] flex items-center justify-center text-white">載入中...</div>;
  if (session.user?.email !== ADMIN_EMAIL) return null;

  return (
    <main className="min-h-screen bg-[#0d2318] p-6 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <p className="text-2xl font-black text-[#89f5a2]">🛠 後台管理</p>
          {/* [DNA_PATCH_START] */}
<div className="flex gap-2">
  <button
    onClick={() => router.push('/admin/members')}
    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-300 text-sm font-bold hover:bg-blue-500/30 transition-all"
  >
    👥 會員統計
  </button>
  <button
    onClick={() => router.push('/admin/feedback')}
    className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm font-bold hover:bg-green-500/30 transition-all"
  >
    💬 留言管理
  </button>
  <button
    onClick={() => router.push('/admin/models')}
    className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-bold hover:bg-purple-500/30 transition-all"
  >
    🔭 模型追蹤
  </button>
</div>
{/* [DNA_PATCH_END] */}
        </div>

        {/* 分潤設定 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">🎁 分潤點數設定</h2>
          <p className="text-white/40 text-xs mb-4">被介紹人每次付費，介紹人獲得的點數</p>
          {[
            { key: "referral_credits_starter", label: "🌱 入門包 NT$250" },
            { key: "referral_credits_standard", label: "⭐ 標準包 NT$450" },
            { key: "referral_credits_pro", label: "🚀 專業包 NT$799" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4 mb-3">
              <span className="text-sm w-36">{item.label}</span>
              <input
                type="number"
                min="0"
                value={settings[item.key as keyof Settings]}
                onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
              />
              <span className="text-white/40 text-sm">點</span>
            </div>
          ))}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-xl text-[#89f5a2] font-bold text-sm hover:bg-[#89f5a2]/30 transition-all"
          >
            {saving ? "儲存中..." : "儲存設定"}
          </button>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </div>

        {/* 方案設定 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-1">💰 方案設定</h2>
          <p className="text-white/40 text-xs mb-4">調整後影響前台顯示，綠界售價需另至綠界後台同步修改</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <span className="text-white/30 text-xs">方案</span>
            <span className="text-white/30 text-xs text-center">售價 (NTD)</span>
            <span className="text-white/30 text-xs text-center">給買家點數</span>
          </div>
          {[
            { label: "🌱 入門包", priceKey: "plan_price_starter", creditsKey: "plan_credits_starter" },
            { label: "⭐ 標準包", priceKey: "plan_price_standard", creditsKey: "plan_credits_standard" },
            { label: "🚀 專業包", priceKey: "plan_price_pro", creditsKey: "plan_credits_pro" },
          ].map((item) => (
            <div key={item.priceKey} className="grid grid-cols-3 gap-2 mb-3 items-center">
              <span className="text-sm">{item.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-white/40 text-sm">NT$</span>
                <input
                  type="number"
                  min="0"
                  value={settings[item.priceKey as keyof Settings]}
                  onChange={(e) => setSettings({ ...settings, [item.priceKey]: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
                />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={settings[item.creditsKey as keyof Settings]}
                  onChange={(e) => setSettings({ ...settings, [item.creditsKey]: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
                />
                <span className="text-white/40 text-sm">點</span>
              </div>
            </div>
          ))}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 px-6 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-xl text-[#89f5a2] font-bold text-sm hover:bg-[#89f5a2]/30 transition-all"
          >
            {saving ? "儲存中..." : "儲存設定"}
          </button>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </div>

        {/* [DNA_PATCH_START] TTS 點數設定 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-1">🎙️ 語音合成點數設定（下載才扣點）</h2>
          <p className="text-white/40 text-xs mb-4">用戶下載 TTS 語音時扣除的點數</p>
          {[
            { key: "tts_credits_starter", label: "🌱 入門包" },
            { key: "tts_credits_standard", label: "⭐ 標準包" },
            { key: "tts_credits_pro", label: "🚀 專業包" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4 mb-3">
              <span className="text-sm w-36">{item.label}</span>
              <input
                type="number"
                min="0"
                value={settings[item.key as keyof Settings]}
                onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
              />
              <span className="text-white/40 text-sm">點</span>
            </div>
          ))}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-xl text-[#89f5a2] font-bold text-sm hover:bg-[#89f5a2]/30 transition-all"
          >
            {saving ? "儲存中..." : "儲存設定"}
          </button>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-1">🎬 嘴型同步點數設定（Wav2Lip）</h2>
          <p className="text-white/40 text-xs mb-4">用戶合成語音到影片時扣除的點數</p>
          {[
            { key: "wav2lip_credits_starter", label: "🌱 入門包" },
            { key: "wav2lip_credits_standard", label: "⭐ 標準包" },
            { key: "wav2lip_credits_pro", label: "🚀 專業包" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4 mb-3">
              <span className="text-sm w-36">{item.label}</span>
              <input
                type="number"
                min="0"
                value={settings[item.key as keyof Settings]}
                onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
              />
              <span className="text-white/40 text-sm">點</span>
            </div>
          ))}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 px-6 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-xl text-[#89f5a2] font-bold text-sm hover:bg-[#89f5a2]/30 transition-all"
          >
            {saving ? "儲存中..." : "儲存設定"}
          </button>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </div>
        {/* [DNA_PATCH_START] 影片點數設定 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-1">🎬 影片生成點數設定</h2>
          <p className="text-white/40 text-xs mb-4">圖片轉影片 & 文字生成影片共用同一套定價</p>

          {/* Kling */}
          <p className="text-[#89f5a2] text-xs font-bold tracking-widest uppercase mb-2">⚡ Kling 3.0</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <span className="text-white/30 text-xs">方案</span>
            <span className="text-white/30 text-xs text-center">5秒</span>
            <span className="text-white/30 text-xs text-center">10秒</span>
            <span></span>
          </div>
          {[
            { label: "🌱 入門", k5: "kling_5s_starter", k10: "kling_10s_starter" },
            { label: "⭐ 標準", k5: "kling_5s_standard", k10: "kling_10s_standard" },
            { label: "🚀 專業", k5: "kling_5s_pro", k10: "kling_10s_pro" },
          ].map((item) => (
            <div key={item.k5} className="grid grid-cols-4 gap-2 mb-2 items-center">
              <span className="text-sm">{item.label}</span>
              <div className="flex items-center gap-1">
                <input type="number" min="0"
                  value={settings[item.k5 as keyof Settings]}
                  onChange={(e) => setSettings({ ...settings, [item.k5]: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
                />
                <span className="text-white/30 text-xs">點</span>
              </div>
              <div className="flex items-center gap-1">
                <input type="number" min="0"
                  value={settings[item.k10 as keyof Settings]}
                  onChange={(e) => setSettings({ ...settings, [item.k10]: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
                />
                <span className="text-white/30 text-xs">點</span>
              </div>
              <span></span>
            </div>
          ))}

          {/* Seedance */}
          <p className="text-orange-300 text-xs font-bold tracking-widest uppercase mb-2 mt-4">✨ Seedance 2.0（無 Omni）</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <span className="text-white/30 text-xs">方案</span>
            <span className="text-white/30 text-xs text-center">5秒</span>
            <span className="text-white/30 text-xs text-center">10秒</span>
            <span></span>
          </div>
          {[
            { label: "🌱 入門", k5: "seedance_5s_starter", k10: "seedance_10s_starter" },
            { label: "⭐ 標準", k5: "seedance_5s_standard", k10: "seedance_10s_standard" },
            { label: "🚀 專業", k5: "seedance_5s_pro", k10: "seedance_10s_pro" },
          ].map((item) => (
            <div key={item.k5} className="grid grid-cols-4 gap-2 mb-2 items-center">
              <span className="text-sm">{item.label}</span>
              <div className="flex items-center gap-1">
                <input type="number" min="0"
                  value={settings[item.k5 as keyof Settings]}
                  onChange={(e) => setSettings({ ...settings, [item.k5]: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
                />
                <span className="text-white/30 text-xs">點</span>
              </div>
              <div className="flex items-center gap-1">
                <input type="number" min="0"
                  value={settings[item.k10 as keyof Settings]}
                  onChange={(e) => setSettings({ ...settings, [item.k10]: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
                />
                <span className="text-white/30 text-xs">點</span>
              </div>
              <span></span>
            </div>
          ))}

          {/* Omni 加費 */}
          <p className="text-purple-300 text-xs font-bold tracking-widest uppercase mb-2 mt-4">🖼️ Omni-Reference 額外加費</p>
          <p className="text-white/30 text-[10px] mb-2">使用參考圖時在 Seedance 基本價上額外加收</p>
          {[
            { key: "omni_extra_starter", label: "🌱 入門" },
            { key: "omni_extra_standard", label: "⭐ 標準" },
            { key: "omni_extra_pro", label: "🚀 專業" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4 mb-2">
              <span className="text-sm w-24">{item.label}</span>
              <input type="number" min="0"
                value={settings[item.key as keyof Settings]}
                onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
              />
              <span className="text-white/40 text-sm">點（加費）</span>
            </div>
          ))}

          <button onClick={handleSave} disabled={saving}
            className="mt-4 px-6 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-xl text-[#89f5a2] font-bold text-sm hover:bg-[#89f5a2]/30 transition-all">
            {saving ? "儲存中..." : "儲存設定"}
          </button>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </div>
        {/* [DNA_PATCH_END] */}
        {/* [DNA_PATCH_END] */}

        {/* [DNA_PATCH_START] 動作參考影片設定 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-1">🎭 動作參考影片設定</h2>
          <p className="text-white/40 text-xs mb-4">用戶上傳動作參考影片時的限制（Kling 3.0 Motion Control）</p>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm w-36">最大檔案大小</span>
            <input type="number" min="1"
              value={settings.motion_max_size_mb}
              onChange={(e) => setSettings({ ...settings, motion_max_size_mb: e.target.value })}
              className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
            />
            <span className="text-white/40 text-sm">MB</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm w-36">最短影片秒數</span>
            <input type="number" min="1"
              value={settings.motion_min_duration_sec}
              onChange={(e) => setSettings({ ...settings, motion_min_duration_sec: e.target.value })}
              className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
            />
            <span className="text-white/40 text-sm">秒</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm w-36">最長影片秒數</span>
            <input type="number" min="1"
              value={settings.motion_max_duration_sec}
              onChange={(e) => setSettings({ ...settings, motion_max_duration_sec: e.target.value })}
              className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#89f5a2]/50"
            />
            <span className="text-white/40 text-sm">秒</span>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-4 px-6 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-xl text-[#89f5a2] font-bold text-sm hover:bg-[#89f5a2]/30 transition-all">
            {saving ? "儲存中..." : "儲存設定"}
          </button>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </div>
        {/* [DNA_PATCH_END] */}

        {/* [DNA_PATCH_START] 成人專區開關 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-1">🔞 成人專區開關</h2>
          <p className="text-white/40 text-xs mb-4">開啟後前台顯示成人專區按鈕，關閉後按鈕變灰色不可按</p>
          <div className="flex items-center gap-4">
            <span className="text-sm">前台顯示成人專區</span>
            <button
              onClick={() => setSettings(prev => ({ ...prev, adult_section_enabled: prev.adult_section_enabled === "true" ? "false" : "true" }))}
              className={`relative w-14 h-7 rounded-full transition-all ${settings.adult_section_enabled === "true" ? "bg-pink-500/60 border border-pink-400/50" : "bg-white/10 border border-white/20"}`}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${settings.adult_section_enabled === "true" ? "left-8 bg-pink-300" : "left-1 bg-white/40"}`} />
            </button>
            <span className={`text-sm font-bold ${settings.adult_section_enabled === "true" ? "text-pink-300" : "text-white/30"}`}>
              {settings.adult_section_enabled === "true" ? "✅ 開啟" : "❌ 關閉"}
            </span>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="mt-4 px-6 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-xl text-[#89f5a2] font-bold text-sm hover:bg-[#89f5a2]/30 transition-all">
            {saving ? "儲存中..." : "儲存設定"}
          </button>
          {msg && <p className="mt-2 text-sm">{msg}</p>}
        </div>
        {/* [DNA_PATCH_END] */}

        {/* 分潤紀錄 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📋 分潤紀錄</h2>
          {logs.length === 0 ? (
            <p className="text-white/30 text-sm">尚無分潤紀錄</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 text-sm">
                  <div>
                    <span className="text-white/60">{log.referrer_email}</span>
                    <span className="text-white/30 mx-2">介紹了</span>
                    <span className="text-white/60">{log.referred_email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40">{log.plan}</span>
                    <span className="text-[#89f5a2] font-bold">+{log.credits_awarded} 點</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}