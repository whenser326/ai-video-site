'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface GalleryItem {
  id: string
  name: string
  age: number | null
  personality_tags: string[]
  story: string
  story_type: string
  image_url: string
  video_url: string
  like_count_min: number
  like_count_max: number
  chat_count_min: number
  chat_count_max: number
  is_featured: boolean
  is_active: boolean
  appearance?: string
  sort_order: number
  model_label: string
  hidden_story?: string
  created_at: string
}

const EMPTY_ITEM: Omit<GalleryItem, 'id' | 'created_at'> = {
  name: '', age: null, personality_tags: [], story: '',
  story_type: 'mid', image_url: '', video_url: '',
  like_count_min: 100, like_count_max: 500,
  chat_count_min: 50, chat_count_max: 300,
  is_featured: false, is_active: false,
  sort_order: 0, model_label: '', hidden_story: '',
}

export default function AdminGalleryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<Partial<GalleryItem> & { id?: string }>(EMPTY_ITEM)
  const [editMode, setEditMode] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingImg, setGeneratingImg] = useState(false)
  const [imgPrompt, setImgPrompt] = useState('')
  const [storyLength, setStoryLength] = useState<'short' | 'mid' | 'long'>('mid')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatingStory, setGeneratingStory] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [adminTab, setAdminTab] = useState<'gallery' | 'pending'>('gallery')
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reviewMsg, setReviewMsg] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return }
    if (session?.user?.email !== 'whenser@gmail.com') { router.push('/'); return }
  }, [session, status])

  const loadItems = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/gallery?email=${session?.user?.email}`)
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!session?.user?.email) return;
    loadItems();
    setPendingLoading(true);
    fetch(`/api/public-characters/admin?email=${session.user.email}`)
      .then(r => r.json())
      .then(d => setPendingItems(d.items || []))
      .finally(() => setPendingLoading(false));
  }, [session])

  // 隨機產生角色資料
  const handleGenerate = async () => {
    setGenerating(true)
    setMsg('')
    try {
      const genRes = await fetch('/api/admin/gallery/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: session?.user?.email, storyLength })
      })
      const genData = await genRes.json()
      if (genData.character) {
        setEditItem(prev => ({ ...prev, ...genData.character, story_type: storyLength }))
        setTagsInput((genData.character.personality_tags || []).join('、'))
        const genderHint = genData.character.gender === '男性' ? 'man, male' : 'woman, female'
        const age = genData.character.age
        const ageHint = age >= 50 ? 'middle-aged, visible age signs, slight wrinkles, mature face' : age >= 40 ? 'early middle-aged, mature face, slight laugh lines' : age >= 35 ? 'adult, mature, late 30s look' : age >= 28 ? 'young adult, late 20s' : 'young adult, early 20s'
        const appearanceHint = genData.character.appearance || ''
        const occupation = (genData.character.personality_tags || [])[0] || ''
        const occupationScene: Record<string, string> = {
          '刑警': 'detective office, dim lighting, serious atmosphere, wearing dark suit and tie, badge visible',
          '外科醫生': 'hospital corridor, clinical lighting, wearing green surgical scrubs and white coat, stethoscope around neck',
          '建築師': 'modern office with blueprints, natural light, wearing smart casual blazer, holding design plans',
          '飛行員': 'airport terminal, bright lighting, wearing navy pilot uniform with gold stripes and captain hat',
          '音樂製作人': 'recording studio, warm lighting, wearing casual streetwear, headphones around neck',
          '律師': 'law office, bookshelves background, wearing sharp tailored suit, holding legal documents',
          '電競選手': 'gaming setup, RGB lighting, wearing team jersey, gaming headset on head',
          '街舞老師': 'dance studio, urban setting, wearing sportswear and sneakers, casual athletic outfit',
          '紋身師': 'tattoo parlor, artistic background, wearing black apron, tattooed arms visible, artistic casual wear',
          '消防員': 'fire station, dramatic lighting, wearing heavy fireproof uniform with reflective stripes and helmet',
          '心理諮商師': 'therapy office, soft warm lighting, wearing professional smart casual attire, calm demeanor',
          '登山嚮導': 'mountain background, outdoor natural light, wearing technical outdoor jacket and hiking gear',
          '珠寶設計師': 'jewelry workshop, studio lighting, wearing elegant professional attire, magnifying loupe around neck',
          '獸醫': 'veterinary clinic, bright lighting, wearing teal scrubs and white lab coat, stethoscope',
          '氣象主播': 'TV studio, broadcast lighting, wearing formal business attire, professional makeup',
          '調酒師': 'bar counter, moody lighting, wearing black vest and white dress shirt, bow tie, holding cocktail shaker',
          '動畫導演': 'creative studio, colorful background, wearing creative casual wear, drawing tablet nearby',
          '廚師': 'professional kitchen, warm lighting, wearing white double-breasted chef coat and black apron, chef hat',
          '賽車手': 'race track, dramatic sunlight, wearing colorful racing suit with sponsor logos, helmet under arm',
          '潛水教練': 'tropical beach, bright outdoor lighting, wearing wetsuit or rash guard, diving equipment nearby',
          '馴獸師': 'nature reserve, outdoor lighting, wearing khaki field uniform and boots, utility belt',
          '考古學家': 'excavation site, natural outdoor light, wearing khaki field shirt and wide-brim hat, holding brush',
          '魔術師': 'stage setting, dramatic spotlight, wearing elegant black tuxedo and top hat, white gloves',
          '戰地記者': 'urban environment, photojournalism style, wearing tactical vest over casual shirt, press badge visible',
          '茶藝師': 'traditional tea house, warm soft lighting, wearing elegant traditional Chinese dress or hanfu',
          '釀酒師': 'winery cellar, warm golden lighting, wearing casual linen shirt and leather apron, wine glass in hand',
          '海洋研究員': 'marine research vessel, coastal natural light, wearing waterproof field jacket and cargo pants',
          '爆破工程師': 'industrial construction site, dramatic outdoor lighting, wearing hard hat and high-visibility safety vest',
          '義肢師': 'medical prosthetics workshop, clean bright lighting, wearing white lab coat, professional medical attire',
          '密室設計師': 'mysterious escape room, atmospheric dim lighting, wearing smart casual dark clothing, creative accessories',
          '法醫': 'forensic laboratory, cold clinical lighting, wearing white lab coat and blue latex gloves, serious expression',
          '拍賣官': 'auction house, elegant grand lighting, wearing formal business suit, holding auction gavel',
          '冰雕師': 'ice sculpture workshop, cold blue lighting, wearing thick insulated jacket and work gloves, ice tools nearby',
          '皮革職人': 'leather craft workshop, warm artisan lighting, wearing brown leather apron, artisan casual wear',
          '星象師': 'observatory dome, dark starry atmosphere, wearing dark academic robe or smart casual, telescope nearby',
          '暗網分析師': 'dark room with multiple monitors, blue screen glow, wearing casual dark hoodie, focused expression',
          '特技替身': 'film set behind the scenes, dramatic lighting, wearing stunt protective gear or action costume',
          '仿古修復師': 'antique restoration studio, soft warm lighting, wearing white conservation gloves and work apron',
          '海關緝毒犬訓練師': 'outdoor training field, bright natural light, wearing official uniform with agency badge',
          '競技麻將選手': 'mahjong competition hall, bright overhead lighting, wearing smart casual formal attire',
          '劇本殺設計師': 'mystery themed room, moody atmospheric lighting, wearing creative dark casual with unique accessories',
          '環境藝術家': 'outdoor installation art site, natural light, wearing paint-stained casual creative outfit',
          '冷凍食品研發師': 'modern food laboratory, bright white lighting, wearing white lab coat and food safety cap',
          '私人保鑣': 'luxury hotel lobby, sophisticated lighting, wearing sharp black suit and earpiece, alert posture',
          '極地探險家': 'snowy arctic landscape, cold blue natural light, wearing heavy insulated expedition parka and goggles',
          '靈媒': 'candlelit mystical room, warm flickering light, wearing flowing dark robes or mystical draped clothing',
          '蜘蛛毒素研究員': 'biology research laboratory, clinical lighting, wearing full protective lab coat and safety goggles',
          '流浪動物救援員': 'animal shelter, soft warm caring lighting, wearing casual work clothes and rescue organization vest',
          '陶藝師': 'pottery studio, earthy warm lighting, wearing clay-stained apron over casual comfortable clothing',
          '深海打撈員': 'harbor dock, dramatic coastal lighting, wearing weathered maritime work jacket and waterproof gear',
        }
        const sceneHint = occupationScene[occupation] || 'natural outdoor lighting, lifestyle photography'
        const bodyTypes = ['slender build', 'athletic build', 'average build', 'petite frame', 'tall and lean']
        const expressions = ['serious expression', 'gentle smile', 'confident look', 'thoughtful expression', 'calm composed look', 'warm smile', 'focused expression']
        const randomBody = bodyTypes[Math.floor(Math.random() * bodyTypes.length)]
        const randomExpression = expressions[Math.floor(Math.random() * expressions.length)]
        setImgPrompt(`${genderHint}, ${age} years old, ${ageHint}, ${randomBody}, ${randomExpression}${appearanceHint ? ', ' + appearanceHint : ''}, ${sceneHint}`)
      }
    } catch {
      setMsg('❌ 產生失敗')
    }
    setGenerating(false)
  }

  // 產圖
  const handleGenImage = async () => {
    if (!imgPrompt) { setMsg('請輸入圖片 Prompt'); return }
    setGeneratingImg(true)
    setMsg('🎨 產圖中，約30-60秒...')
    try {
      const res = await fetch('/api/admin/gallery/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: session?.user?.email, prompt: imgPrompt, appearance: editItem.appearance || '' })
      })
      const data = await res.json()
      if (data.id) {
        let attempts = 0
        const poll = setInterval(async () => {
          attempts++
          const pollRes = await fetch(`/api/admin/gallery/generate-image?id=${data.id}`)
          const pollData = await pollRes.json()
          if (pollData.status === 'succeeded') {
            clearInterval(poll)
            const imgUrl = pollData.permanentUrl
              || (Array.isArray(pollData.output) ? pollData.output[0] : pollData.output)
            setEditItem(prev => ({ ...prev, image_url: imgUrl }))
            setMsg('✅ 圖片產出完成')
            setGeneratingImg(false)
          } else if (pollData.status === 'failed' || attempts > 30) {
            clearInterval(poll)
            setMsg('❌ 產圖失敗')
            setGeneratingImg(false)
          }
        }, 3000)
      }
    } catch {
      setMsg('❌ 產圖失敗')
      setGeneratingImg(false)
    }
  }

  const handleGenHiddenStory = async () => {
    if (!editItem.name) { setMsg('請先填入角色名稱'); return }
    if (!editItem.story) { setMsg('請先填入公開故事'); return }
    setGeneratingStory(true)
    setMsg('✍️ 產生隱藏故事中，約10秒...')
    try {
      const res = await fetch('/api/admin/gallery/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: session?.user?.email,
          mode: 'hidden_story',
          name: editItem.name,
          age: editItem.age,
          personality_tags: editItem.personality_tags,
          story: editItem.story,
          appearance: editItem.appearance || '',
        })
      })
      const data = await res.json()
      if (data.hiddenStory) {
        setEditItem(p => ({ ...p, hidden_story: data.hiddenStory }))
        setMsg('✅ 隱藏故事產生完成，可手動微調後儲存')
      } else {
        setMsg('❌ ' + (data.error || '產生失敗'))
      }
    } catch {
      setMsg('❌ 產生失敗')
    }
    setGeneratingStory(false)
  }

  const handleSave = async () => {
    if (!editItem.name) { setMsg('角色名稱必填'); return }
    setSaving(true)
    const tags = tagsInput ? tagsInput.split(/[,，、]/).map(t => t.trim()).filter(Boolean) : []
    const payload = { ...editItem, personality_tags: tags, adminEmail: session?.user?.email }
    const res = await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.ok) {
      setMsg('✅ 儲存成功')
      setEditMode(false)
      setEditItem(EMPTY_ITEM)
      setTagsInput('')
      await loadItems()
    } else {
      setMsg('❌ ' + data.error)
    }
    setSaving(false)
  }

  const handleToggleActive = async (item: GalleryItem) => {
    await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, is_active: !item.is_active, adminEmail: session?.user?.email })
    })
    await loadItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除？')) return
    await fetch(`/api/admin/gallery?email=${session?.user?.email}&id=${id}`, { method: 'DELETE' })
    await loadItems()
  }

  const openEdit = (item: GalleryItem) => {
    setEditItem(item)
    setTagsInput((item.personality_tags || []).join('、'))
    setEditMode(true)
    setMsg('')
  }

  if (loading) return <div className="min-h-screen bg-[#0d2318] flex items-center justify-center text-[#89f5a2]">載入中...</div>

  return (
    <div className="min-h-screen bg-[#0d2318] p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-[#89f5a2] hover:underline text-sm">← 返回後台</button>
            <p className="text-[#89f5a2] font-bold text-2xl">🎭 角色上架管理</p>
          </div>
          <button onClick={() => { setEditItem(EMPTY_ITEM); setTagsInput(''); setEditMode(true); setMsg('') }}
            className="px-4 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-full text-[#89f5a2] text-sm font-bold hover:bg-[#89f5a2]/30 transition">
            ＋ 新增角色
          </button>
        </div>

        {/* 統計列 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: '總角色數', value: items.length },
            { label: '已上架', value: items.filter(i => i.is_active).length },
            { label: '官方精選', value: items.filter(i => i.is_featured).length },
          ].map(c => (
            <div key={c.label} className="bg-[#1a3a28] border border-[#2d5a3d] rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-[#89f5a2]">{c.value}</p>
              <p className="text-gray-400 text-sm mt-1">{c.label}</p>
            </div>
          ))}
        </div>
{/* Tab 切換 */}
      <div className="flex gap-2 mb-6">
        {([
          { value: 'gallery', label: '📋 角色管理' },
          { value: 'pending', label: `📬 待審核${pendingItems.length > 0 ? ` (${pendingItems.length})` : ''}` },
        ] as const).map(t => (
          <button key={t.value}
            onClick={() => {
              setAdminTab(t.value)
              if (t.value === 'pending' && pendingItems.length === 0) {
                setPendingLoading(true)
                fetch(`/api/public-characters/admin?email=${session?.user?.email}`)
                  .then(r => r.json())
                  .then(d => setPendingItems(d.items || []))
                  .finally(() => setPendingLoading(false))
              }
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${adminTab === t.value ? 'bg-[#89f5a2]/20 border-[#89f5a2]/40 text-[#89f5a2]' : 'border-white/15 text-white/40 hover:border-white/30'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 待審核 Tab 內容 */}
      {adminTab === 'pending' && (
        <div className="space-y-4 mb-8">
          {pendingLoading && <p className="text-white/30 text-sm">載入中...</p>}
          {!pendingLoading && pendingItems.length === 0 && (
            <p className="text-white/20 text-sm">目前沒有待審核的投稿</p>
          )}
          {pendingItems.map(item => (
            <div key={item.id} className="bg-[#0d2318]/60 border border-white/10 rounded-2xl p-4 flex gap-4">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-black text-sm">{item.name}</p>
                  <span className="text-[10px] bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-full px-2 py-0.5">
                    {item.visibility === 'anonymous' ? '🎭 匿名' : '🌐 公開'}
                  </span>
                </div>
                <p className="text-white/30 text-xs mb-1 truncate">{item.user_email}</p>
                {item.description && <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-2">{item.description}</p>}

                {rejectingId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="填寫退件原因（用戶會收到通知）"
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-white/20 outline-none border border-red-400/30 resize-none"
                      style={{ background: "#111" }} />
                    <div className="flex gap-2">
                      <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="px-3 py-1.5 rounded-lg border border-white/15 text-white/40 text-xs hover:bg-white/5 transition-all">
                        取消
                      </button>
                      <button
                        disabled={!rejectReason}
                        onClick={async () => {
                          const res = await fetch('/api/public-characters', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: item.id, action: 'reject', reject_reason: rejectReason, adminEmail: session?.user?.email }),
                          })
                          const d = await res.json()
                          if (d.success) {
                            setPendingItems(prev => prev.filter(i => i.id !== item.id))
                            setRejectingId(null); setRejectReason('')
                            setReviewMsg('已退件並通知用戶')
                            setTimeout(() => setReviewMsg(''), 3000)
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-all disabled:opacity-40">
                        確認退件
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/public-characters', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: item.id, action: 'approve', adminEmail: session?.user?.email }),
                        })
                        const d = await res.json()
                        if (d.success) {
                          setPendingItems(prev => prev.filter(i => i.id !== item.id))
                          setReviewMsg('✅ 已核准上架')
                          setTimeout(() => setReviewMsg(''), 3000)
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] text-xs font-bold hover:bg-[#89f5a2]/30 transition-all">
                      ✅ 核准上架
                    </button>
                    <button onClick={() => { setRejectingId(item.id); setRejectReason(''); }}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-400/30 text-red-300 text-xs font-bold hover:bg-red-500/20 transition-all">
                      ❌ 退件
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {reviewMsg && <p className="text-[#89f5a2] text-sm">{reviewMsg}</p>}
        </div>
      )}
        {/* 角色列表 */}
        {adminTab === 'gallery' && (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-[#1a3a28] border border-[#2d5a3d] rounded-2xl p-4 flex items-center gap-4">
              {item.image_url
                ? <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-16 h-16 rounded-xl bg-[#0d2318] flex items-center justify-center text-2xl flex-shrink-0">👤</div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold">{item.name}</span>
                  {item.age && <span className="text-white/40 text-xs">{item.age}歲</span>}
                  {item.is_featured && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">⭐ 精選</span>}
                  {item.is_active
                    ? <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">✅ 上架中</span>
                    : <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">⏸ 未上架</span>
                  }
                </div>
                <div className="flex gap-1 flex-wrap mb-1">
                  {(item.personality_tags || []).map(t => (
                    <span key={t} className="px-2 py-0.5 bg-[#89f5a2]/10 text-[#89f5a2] text-xs rounded-full">{t}</span>
                  ))}
                </div>
                <p className="text-white/50 text-xs truncate">{item.story}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(item)} className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 text-xs hover:bg-blue-500/30 transition">✏️ 編輯</button>
                <button onClick={() => handleToggleActive(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition border ${item.is_active ? 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30' : 'bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30'}`}>
                  {item.is_active ? '下架' : '上架'}
                </button>
                <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs hover:bg-red-500/20 transition">🗑️</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-gray-400 py-12">還沒有角色，點右上角新增</div>
          )}
        </div>
        )}

        {/* 編輯 Modal */}
        {editMode && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8">
            <div className="bg-[#1a3a28] border border-[#2d5a3d] rounded-2xl p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#89f5a2] font-bold text-lg">{editItem.id ? '✏️ 編輯角色' : '➕ 新增角色'}</p>
                <button onClick={() => setEditMode(false)} className="text-white/40 hover:text-white text-xl">✕</button>
              </div>

              {/* 隨機產生區 */}
              {!editItem.id && (
                <div className="mb-4 p-4 bg-[#0d2318]/60 rounded-xl border border-[#2d5a3d]/60">
                  <p className="text-white/70 text-sm mb-3">🎲 AI 隨機產生角色資料</p>
                  <div className="flex gap-2 items-center">
                    <select value={storyLength} onChange={e => setStoryLength(e.target.value as 'short'|'mid'|'long')}
                      className="bg-[#0d2318] border border-[#2d5a3d] rounded-lg px-3 py-1.5 text-white text-sm">
                      <option value="short">短故事（20字）</option>
                      <option value="mid">中故事（200字）</option>
                      <option value="long">長故事（400字）</option>
                    </select>
                    <button onClick={handleGenerate} disabled={generating}
                      className="px-4 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 text-sm font-bold hover:bg-purple-500/30 transition disabled:opacity-40">
                      {generating ? '產生中...' : '🎲 隨機產生'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">角色名稱 *</label>
                  <input value={editItem.name || ''} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]" />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">年齡</label>
                  <input type="number" value={editItem.age || ''} onChange={e => setEditItem(p => ({ ...p, age: parseInt(e.target.value) || null }))}
                    className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]" />
                </div>
              </div>

              <div className="mb-3">
                <label className="text-white/60 text-xs mb-1 block">個性標籤（用逗號或頓號分隔）</label>
                <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="例：軟萌、初戀、活潑"
                  className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]" />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/60 text-xs">背景故事</label>
                  <select value={editItem.story_type || 'mid'} onChange={e => setEditItem(p => ({ ...p, story_type: e.target.value }))}
                    className="bg-[#0d2318] border border-[#2d5a3d] rounded-lg px-2 py-1 text-white text-xs">
                    <option value="short">短</option>
                    <option value="mid">中</option>
                    <option value="long">長</option>
                  </select>
                </div>
                <textarea value={editItem.story || ''} onChange={e => setEditItem(p => ({ ...p, story: e.target.value }))}
                  rows={3} className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2] resize-none" />
              </div>

              {/* 產圖區 */}
              <div className="mb-3 p-3 bg-[#0d2318]/60 rounded-xl border border-[#2d5a3d]/60">
                <label className="text-white/60 text-xs mb-2 block">🎨 產圖 Prompt</label>
                <div className="flex gap-2 mb-2">
                  <input value={imgPrompt} onChange={e => setImgPrompt(e.target.value)} placeholder="輸入圖片描述..."
                    className="flex-1 bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]" />
                  <button onClick={handleGenImage} disabled={generatingImg}
                    className="px-4 py-2 bg-[#89f5a2]/20 border border-[#89f5a2]/40 rounded-xl text-[#89f5a2] text-sm font-bold hover:bg-[#89f5a2]/30 transition disabled:opacity-40">
                    {generatingImg ? '產圖中...' : '產圖'}
                  </button>
                </div>
                {editItem.image_url && (
                  <img src={editItem.image_url} alt="預覽" className="w-32 h-32 rounded-xl object-cover" />
                )}
                <div className="mt-2">
                  <label className="text-white/60 text-xs mb-1 block">或直接貼圖片 URL</label>
                  <input value={editItem.image_url || ''} onChange={e => setEditItem(p => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]" />
                </div>
              </div>

              <div className="mb-3">
                <label className="text-white/60 text-xs mb-1 block">影片 URL（選填）</label>
                <input value={editItem.video_url || ''} onChange={e => setEditItem(p => ({ ...p, video_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]" />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/60 text-xs">🔒 隱藏故事（付費解鎖，選填）</label>
                  <button onClick={handleGenHiddenStory} disabled={generatingStory}
                    className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition disabled:opacity-40">
                    {generatingStory ? '產生中...' : '✨ AI 產生'}
                  </button>
                </div>
                <textarea value={editItem.hidden_story || ''} onChange={e => setEditItem(p => ({ ...p, hidden_story: e.target.value }))}
                  rows={6} placeholder="填入角色隱藏背景，用戶花費點數才能解鎖閱讀，或點右上角 AI 產生..."
                  className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2] resize-none" />
                {editItem.hidden_story && (
                  <p className="text-white/30 text-xs mt-1 text-right">{(editItem.hidden_story || '').length} 字</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">按讚數範圍</label>
                  <div className="flex gap-2">
                    <input type="number" value={editItem.like_count_min || 0} onChange={e => setEditItem(p => ({ ...p, like_count_min: parseInt(e.target.value) }))}
                      className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none" placeholder="min" />
                    <input type="number" value={editItem.like_count_max || 0} onChange={e => setEditItem(p => ({ ...p, like_count_max: parseInt(e.target.value) }))}
                      className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none" placeholder="max" />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">對話數範圍</label>
                  <div className="flex gap-2">
                    <input type="number" value={editItem.chat_count_min || 0} onChange={e => setEditItem(p => ({ ...p, chat_count_min: parseInt(e.target.value) }))}
                      className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none" placeholder="min" />
                    <input type="number" value={editItem.chat_count_max || 0} onChange={e => setEditItem(p => ({ ...p, chat_count_max: parseInt(e.target.value) }))}
                      className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none" placeholder="max" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">排列順序（數字越小越前）</label>
                  <input type="number" value={editItem.sort_order || 0} onChange={e => setEditItem(p => ({ ...p, sort_order: parseInt(e.target.value) }))}
                    className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">模型標注（選填）</label>
                  <input value={editItem.model_label || ''} onChange={e => setEditItem(p => ({ ...p, model_label: e.target.value }))} placeholder="例：Flux 1.1 Pro"
                    className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none" />
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editItem.is_featured} onChange={e => setEditItem(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-white/70 text-sm">⭐ 官方精選</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editItem.is_active} onChange={e => setEditItem(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-white/70 text-sm">立即上架</span>
                </label>
              </div>

              {msg && <p className="text-sm mb-3 text-[#89f5a2]">{msg}</p>}

              <div className="flex gap-3">
                <button onClick={() => setEditMode(false)} className="flex-1 py-2 rounded-xl border border-white/20 text-white/50 text-sm hover:bg-white/5 transition">取消</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-[#89f5a2]/20 border border-[#89f5a2]/40 text-[#89f5a2] font-bold text-sm hover:bg-[#89f5a2]/30 transition disabled:opacity-40">
                  {saving ? '儲存中...' : '💾 儲存'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}