// [DNA_PATCH_START] 使用指南頁面
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const lines = [
  {
    id: "A",
    icon: "🎨",
    title: "線A｜創作內容",
    color: "#89f5a2",
    colorBg: "rgba(137,245,162,0.08)",
    colorBorder: "rgba(137,245,162,0.25)",
    colorText: "#89f5a2",
    steps: [
      { icon: "🖼️", label: "生成圖片", cost: "1點/張", detail: "選風格、設定外觀、輸入描述，支援 1:1/16:9 等多種比例" },
      { icon: "⚡", label: "批次生成", cost: "1點/張", detail: "生成第一張圖後，可一次批次產出多張（入門2張・標準4張・專業6張），快速取得素材，付費方案限定" },
      { icon: "🎬", label: "轉成影片", cost: "4-17點/支", detail: "鎖定角色後生成影片，Kling 3.0（4-6點）或 Seedance 2.0（13-17點）自動對應選擇的功能" },
      { icon: "🎙️", label: "加語音", cost: "6-8點/次", detail: "10種聲音、中英文TTS合成，5秒影片限30字，10秒限55字" },
      { icon: "👄", label: "嘴型同步", cost: "8-10點/次", detail: "Wav2Lip 技術讓角色嘴型對應語音（需先有影片），或用 Kling Avatar V2 直接從靜態照片生成說話影片，合計扣點依方案不同" },
    ],
    note: "💡 批次生成可一次產出多張圖片（入門2張・標準4張・專業6張），效率翻倍",
    billing: null,
  },
  {
    id: "B",
    icon: "💬",
    title: "線B｜角色互動",
    color: "#a78bfa",
    colorBg: "rgba(167,139,250,0.08)",
    colorBorder: "rgba(167,139,250,0.25)",
    colorText: "#a78bfa",
    steps: [
      { icon: "🎭", label: "建立角色", cost: "1點/張", detail: "生成圖片後點「⭐ 收藏此角色」，設定名字與個性描述" },
      { icon: "⚡", label: "批次生成", cost: "1點/張", detail: "收藏角色後可批次產出多張一致性圖片（入門2張・標準4張・專業6張），快速累積角色素材" },
      { icon: "⚙️", label: "設定個性", cost: "免費", detail: "選擇個性標籤、職業，角色會依設定風格回應你" },
      { icon: "💬", label: "互動聊天", cost: "次數制", detail: "免費100次・入門2,000次・標準5,000次・專業10,000次，用完後1點/次，聊天內容可一鍵轉成說話影片" },
      { icon: "📸", label: "AI 自拍", cost: "照片1點・影片4-6點", detail: "自然說出「拍張照片」或「錄段影片」，角色自動生成回傳，也可指定場景" },
      { icon: "🎬", label: "說話影片", cost: "8-10點/次", detail: "聊天中點「🎬 轉成影片」，自動用角色照片 + 台詞生成說話影片（Kling Avatar V2），選擇聲音後直接在聊天室播放，可存入相簿" },
    ],
    note: "💡 免費用戶可直接點選預設角色開始聊天，無需建立角色。群組聊天：入門/標準最多3個角色同時對話，專業最多5個，每個角色回覆算一次。也可上傳圖片/影片到聊天室，角色會看圖回應。建角色時可設定預設聲音，說話影片自動套用",
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
      { icon: "📤", label: "上傳照片", cost: "免費", detail: "上傳自己或他人的照片（JPG/PNG），支援人臉、全身、半身照" },
      { icon: "✍️", label: "選擇功能", cost: "免費", detail: "三種功能可選：🎬 隨意動作（輸入提示詞或不填讓 AI 自動安排）、💃 套用動作參考影片（上傳 MP4 讓角色模仿動作，付費限定）、🎨 多重參考圖（上傳 1-3 張圖指定第二角色/場景/動作，Seedance 引擎，付費限定）" },
      { icon: "🎬", label: "生成影片", cost: "4-17點/支", detail: "依功能不同：隨意動作/套用動作 4-6點（Kling 3.0），多重參考圖 13-17點+額外加費（Seedance 2.0），支援 5 秒或 10 秒" },
      { icon: "🔒", label: "鎖定角色", cost: "免費", detail: "生成後可點「鎖定角色」，後續生成影片都會維持同一人物外觀一致性" },
      { icon: "🎙️", label: "說話影片", cost: "8-10點/次", detail: "生成圖片後點「🎙️ 讓她說話」，輸入台詞選擇聲音，用 Kling Avatar V2 直接從照片生成說話影片，無需影片素材" },
    ],
    note: "💡 上傳的照片建議正臉清晰、光線均勻，效果最佳。功能選單預設摺疊，點開後選擇功能，系統自動套用對應 AI 引擎。多重參考圖至少需上傳 1 張，套用動作參考影片需上傳 MP4 才能生成",
    billing: null,
  },
  {
    id: "D",
    icon: "⚡",
    title: "線D｜快速產出",
    color: "#fbbf24",
    colorBg: "rgba(251,191,36,0.08)",
    colorBorder: "rgba(251,191,36,0.25)",
    colorText: "#fbbf24",
    steps: [
      { icon: "✍️", label: "文字生影片", cost: "13-17點/支", detail: "直接輸入文字描述，跳過生圖步驟，Seedance 2.0 引擎生成" },
      { icon: "⚡", label: "批次生成", cost: "1點/張", detail: "一次生成多張圖片，付費方案限定功能，快速取得素材。" },
    ],
    note: "💡 文字生影片不支援角色一致性（Omni-Reference），適合快速測試場景",
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

        {/* 三條主線 */}
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
            {/* 標題列（點擊展開） */}
            <button
              onClick={() => toggle(line.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
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

            {/* 展開內容 */}
            {expanded === line.id && (
              <div style={{ padding: '0 16px 20px' }}>

                {/* 步驟列表 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {line.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {/* 步驟連線 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: `${line.colorBg}`,
                          border: `1px solid ${line.colorBorder}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>{step.icon}</div>
                        {idx < line.steps.length - 1 && (
                          <div style={{ width: 1, height: 10, background: line.colorBorder, margin: '3px 0' }} />
                        )}
                      </div>
                      {/* 步驟說明 */}
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

                {/* 提示 */}
                <div style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '10px 14px',
                  fontSize: 11, color: 'rgba(184,255,200,0.5)', lineHeight: 1.6, marginBottom: line.billing ? 14 : 0,
                }}>
                  {line.note}
                </div>

                {/* 聊天計費表（只有線B） */}
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
          borderRadius: 20,
          padding: '18px 20px',
        }}>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#5bd4f0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
            🧠 為什麼我們不一樣？
          </p>
          {[
            { text: '對話超過50則自動摘要，角色永遠記得你說過的每一件事' },
            { text: '不知道說什麼？點 💬 讓 AI 幫你想開場白' },
            { text: '圖片＋影片＋說話影片，一站完成' },
            { text: '你建立的角色，個性外觀只有你有' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ color: '#5bd4f0', flexShrink: 0, fontSize: 13, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 12, color: 'rgba(180,240,255,0.65)', lineHeight: 1.6 }}>{item.text}</span>
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
              { name: "🆓 免費", credits: "5點", price: "$0", limit: "每日2圖/1影片(簽到+1)" },
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
