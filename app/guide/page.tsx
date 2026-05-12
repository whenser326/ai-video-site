// [DNA_PATCH_START] 使用指南頁面 v2
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const lines = [
  {
    id: "A",
    icon: "🎨",
    title: "線A｜創作內容 - 生成角色圖片",
    color: "#89f5a2",
    colorBg: "rgba(137,245,162,0.08)",
    colorBorder: "rgba(137,245,162,0.25)",
    colorText: "#89f5a2",
    steps: [
      { icon: "🖼️", label: "生成圖片", cost: "1點/張", detail: "選風格、設定外觀、輸入描述，支援多種比例" },
      { icon: "⭐", label: "收藏角色", cost: "免費", detail: "生成滿意的圖後點「⭐ 收藏」，後續可批次生成、聊天、鎖定使用" },
      { icon: "⚡", label: "批次生成", cost: "1點/張", detail: "鎖定角色後一次產出多張（入門 2張・標準 4張・專業 6張），付費限定" },
      { icon: "🎬", label: "轉成影片", cost: "4–17點/支", detail: "鎖定角色後生成影片，Kling 3.0（4–6點）或 Seedance 2.0（13–17點）" },
      { icon: "🎙️", label: "加語音／說話影片", cost: "6–10點/次", detail: "10種聲音 TTS 合成（6–8點），或搭配 Kling Avatar 生成說話影片（8–10點）" },
    ],
    note: "💡 免費用戶每日最多 2 張圖片、1 支影片。批次生成需先鎖定角色，確保多張圖片角色一致",
    billing: null,
  },
  {
    id: "B",
    icon: "💬",
    title: "線B｜角色互動 - 圖片轉影片",
    color: "#a78bfa",
    colorBg: "rgba(167,139,250,0.08)",
    colorBorder: "rgba(167,139,250,0.25)",
    colorText: "#a78bfa",
    steps: [
      { icon: "🎭", label: "挑選或建立角色", cost: "1點/張", detail: "直接選預設角色（免費），或生成圖片後點「⭐ 收藏」建立專屬角色" },
      { icon: "⚙️", label: "設定個性", cost: "免費", detail: "選個性標籤、職業，角色會依設定風格回應" },
      { icon: "💬", label: "開始聊天", cost: "次數制", detail: "免費 100 次・入門 2,000 次・標準 5,000 次・專業 10,000 次，用完後 1點/次。✅ 支援：暖昧挑逗、情感親密 🚫 自動過濾：明確性描述、未成年內容" },
      { icon: "📸", label: "AI 自拍", cost: "照片 1點・影片 4–6點", detail: "聊天中說「拍張照片」或「錄段影片」，角色自動生成回傳，可指定場景" },
      { icon: "🎬", label: "讓角色說話", cost: "8–10點/次", detail: "點「🎬 轉成影片」，角色照片 + 台詞 → Kling Avatar 說話影片，直接在聊天室播放" },
    ],
    note: "💡 不知道說什麼？點 💬 讓 AI 幫你想開場白。群組聊天：入門/標準最多 3 角色，專業最多 5 角色同時對話，每個角色回覆算一次",
    billing: [
      { plan: "免費", chat: "100次", group: "不開放" },
      { plan: "入門包", chat: "2,000次", group: "最多3角色" },
      { plan: "標準包", chat: "5,000次", group: "最多3角色" },
      { plan: "專業包", chat: "10,000次", group: "最多5角色" },
    ],
  },
  {
    id: "C",
    icon: "📁",
    title: "線C｜上傳照片轉影片",
    color: "#f97316",
    colorBg: "rgba(249,115,22,0.08)",
    colorBorder: "rgba(249,115,22,0.25)",
    colorText: "#f97316",
    steps: [
      { icon: "📤", label: "上傳主角照片", cost: "免費", detail: "JPG/PNG，建議正臉清晰、光線均勻效果最佳" },
      { icon: "🗣️", label: "說話影片", cost: "8–10點/次", detail: "輸入台詞 → TTS 語音合成 → Kling Avatar 生成說話影片，免費付費皆可" },
      { icon: "🪄", label: "AI 自由發揮", cost: "4–6點/支", detail: "不輸入動作，AI 自動安排最自然的動作（Kling 3.0）" },
      { icon: "✍️", label: "文字指定動作", cost: "4–6點/支", detail: "輸入動作描述，例如「轉身微笑、緩緩走向鏡頭」（Kling 3.0）" },
      { icon: "▶️", label: "套用動作影片", cost: "4–6點/支", detail: "上傳 MP4，角色模仿影片動作（Kling 3.0），付費限定，需 5–10 秒影片" },
      { icon: "🖼️", label: "高精度角色影片", cost: "13–17點/支", detail: "可加入第二角色/場景參考圖，Seedance 2.0 引擎，付費限定。⚠️ 參考圖若含真實人臉可能失敗，建議用 AI 生成圖" },
    ],
    note: "💡 說話影片免費用戶也可使用。其他影片功能免費用戶每日限 1 支",
    billing: null,
  },
  {
    id: "D",
    icon: "⚡",
    title: "線D｜快速產出 - 文字或批次生成",
    color: "#fbbf24",
    colorBg: "rgba(251,191,36,0.08)",
    colorBorder: "rgba(251,191,36,0.25)",
    colorText: "#fbbf24",
    steps: [
      { icon: "✍️", label: "文字生影片", cost: "13–17點/支", detail: "直接輸入文字描述場景，跳過生圖步驟，Seedance 2.0 引擎，支援 5秒/10秒、多種比例，付費限定" },
      { icon: "⚡", label: "批次生成", cost: "1點/張", detail: "一次生成多張圖片，付費限定，快速取得素材" },
    ],
    note: "💡 文字生影片不支援角色一致性，適合快速測試場景或背景素材",
    billing: null,
  },
];

export default function GuidePage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pt-6 pb-16 bg-gradient-to-br from-[#0d2318] via-[#1a3a25] to-[#2d5a3d]">
      <div className="w-full max-w-lg space-y-5">

        {/* 頂部返回 */}
        <div className="flex items-center gap-3 mt-2 mb-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/50 text-xs font-bold hover:bg-white/10 hover:text-white/70 transition-all"
          >
            ← 返回首頁
          </button>
          <p className="text-white font-black text-xl">📖 使用指南</p>
        </div>

        {/* 副標 */}
        <p style={{ color: 'rgba(184,255,200,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
          選擇你的主線，每條線都有詳細步驟和點數說明
        </p>

        {/* 四條主線 */}
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              background: line.colorBg,
              border: `1px solid ${line.colorBorder}`,
              borderRadius: 20,
              overflow: 'hidden',
              transition: 'all 0.2s',
            }}
          >
            <button
              onClick={() => toggle(line.id)}
              style={{
                width: '100%', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{line.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: line.colorText }}>{line.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(184,255,200,0.4)', marginTop: 2 }}>
                  {line.steps.map(s => s.label).join(' → ')}
                </div>
              </div>
              <span style={{ color: line.colorText, fontSize: 16, transition: 'transform 0.2s', transform: expanded === line.id ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
            </button>

            {expanded === line.id && (
              <div style={{ padding: '0 16px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {line.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: line.colorBg, border: `1px solid ${line.colorBorder}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>{step.icon}</div>
                        {idx < line.steps.length - 1 && (
                          <div style={{ width: 1, height: 10, background: line.colorBorder, margin: '3px 0' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#d4ffe0' }}>{step.label}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: line.colorText,
                            background: line.colorBg, border: `1px solid ${line.colorBorder}`,
                            borderRadius: 20, padding: '1px 8px',
                          }}>{step.cost}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(184,255,200,0.45)', lineHeight: 1.5 }}>{step.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '10px 14px',
                  fontSize: 11, color: 'rgba(184,255,200,0.5)', lineHeight: 1.6, marginBottom: line.billing ? 14 : 0,
                }}>
                  {line.note}
                </div>

                {line.billing && (
                  <div style={{ marginTop: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(184,255,200,0.4)', marginBottom: 8, letterSpacing: '0.05em' }}>
                      對話次數方案對照
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {line.billing.map((row, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '8px 12px',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#d4ffe0' }}>{row.plan}</span>
                          <span style={{ fontSize: 11, color: 'rgba(184,255,200,0.6)' }}>{row.chat}</span>
                          <span style={{ fontSize: 11, color: line.colorText }}>{row.group}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(184,255,200,0.3)', marginTop: 8, lineHeight: 1.5 }}>
                      次數用完後改為 1點/次扣除，單人+群組共用同一計數器
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 為什麼我們不一樣 */}
        <div style={{
          background: 'rgba(29,158,200,0.12)',
          border: '1px solid rgba(29,158,200,0.35)',
          borderRadius: 20, padding: '18px 20px',
        }}>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#5bd4f0', marginBottom: 12 }}>🧠 為什麼我們不一樣？</p>
          {[
            '🧠 記憶系統：對話超過 50 則自動壓縮，角色永遠記得你說的每一件事——競品最大痛點，只有我們解決了',
            '圖片＋影片＋說話影片，一站完成，不需要切換平台',
            '你建立的角色，個性外觀只有你有',
            '不知道說什麼？點 💬 讓 AI 幫你想開場白',
            '✅ 支援暖昧互動　🚫 自動過濾露骨內容',
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ color: '#5bd4f0', flexShrink: 0, fontSize: 13, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 12, color: 'rgba(180,240,255,0.65)', lineHeight: 1.6 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* 點數方案快速對照 */}
        <div style={{
          background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '18px 20px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 900, color: '#d4ffe0', marginBottom: 14 }}>💎 點數方案對照</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: "🆓 免費", credits: "5點", price: "$0", limit: "每日 2圖 / 1影片" },
              { name: "🌱 入門包", credits: "30點", price: "$250", limit: "無限生成" },
              { name: "⭐ 標準包", credits: "80點", price: "$450", limit: "無限生成" },
              { name: "🚀 專業包", credits: "200點", price: "$799", limit: "無限生成" },
            ].map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 14px',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#d4ffe0', flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: '#89f5a2', fontWeight: 700 }}>{p.credits}</span>
                <span style={{ fontSize: 12, color: 'rgba(184,255,200,0.5)' }}>{p.price} NTD</span>
                <span style={{ fontSize: 10, color: 'rgba(184,255,200,0.35)' }}>{p.limit}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/pricing#plans')}
            style={{
              marginTop: 14, width: '100%', padding: '12px',
              background: 'rgba(137,245,162,0.1)', border: '1px solid rgba(137,245,162,0.3)',
              borderRadius: 12, color: '#89f5a2', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            💳 查看完整定價方案 →
          </button>
        </div>

        {/* 底部 */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 32px', background: 'rgba(137,245,162,0.12)',
              border: '1px solid rgba(137,245,162,0.3)', borderRadius: 50,
              color: '#89f5a2', fontSize: 13, fontWeight: 900, cursor: 'pointer',
            }}
          >
            ✨ 開始創作
          </button>
        </div>

      </div>
    </main>
  );
}
// [DNA_PATCH_END]