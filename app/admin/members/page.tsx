'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface MemberProfile {
  email: string
  plan: string
  credits: number
  generations: number
  created_at: string
}

interface MemberStats {
  totalMembers: number
  newToday: number
  totalGenerations: number
  planCount: { free: number; starter: number; standard: number; pro: number }
  profiles: MemberProfile[]
}

const PLAN_LABEL: Record<string, string> = {
  free: '🆓 免費',
  starter: '🌱 入門',
  standard: '⭐ 標準',
  pro: '🚀 專業',
}

export default function AdminMembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [adjustments, setAdjustments] = useState<{id:string; user_email:string; amount:number; reason:string|null; created_at:string}[]>([])
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  // [DNA_PATCH_START] 補點功能
  const [adjustModal, setAdjustModal] = useState<{ email: string } | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  // [DNA_PATCH_START] 批量刪帳號 state
const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
const [deleting, setDeleting] = useState(false)
const [deleteMsg, setDeleteMsg] = useState('')

const toggleSelect = (email: string) => {
  setSelectedEmails(prev => {
    const next = new Set(prev)
    if (next.has(email)) next.delete(email)
    else next.add(email)
    return next
  })
}

const handleBulkDelete = async () => {
  if (selectedEmails.size === 0) return
  if (!confirm(`確定要刪除這 ${selectedEmails.size} 個帳號嗎？此操作不可復原！`)) return
  setDeleting(true)
  try {
    const res = await fetch('/api/admin/delete-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail: session?.user?.email,
        emails: Array.from(selectedEmails),
      }),
    })
    const data = await res.json()
    if (data.ok) {
      setDeleteMsg(`✅ 已刪除 ${data.deleted} 個帳號`)
      setSelectedEmails(new Set())
      await loadStats()
      setTimeout(() => setDeleteMsg(''), 3000)
    } else {
      setDeleteMsg('❌ 刪除失敗：' + data.error)
    }
  } catch {
    setDeleteMsg('❌ 連線失敗')
  }
  setDeleting(false)
}
// [DNA_PATCH_END]
  const [adjustMsg, setAdjustMsg] = useState('')
  // [DNA_PATCH_END]

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return }
    if (session?.user?.email !== 'whenser@gmail.com') { router.push('/'); return }
  }, [session, status])

  const loadStats = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/members')
    const data = await res.json()
    setStats(data)
    setAdjustments(data.adjustments || [])
    setLoading(false)
  }

  useEffect(() => { loadStats() }, [])

  // [DNA_PATCH_START] 補點函數
  const handleAdjustCredits = async () => {
    if (!adjustModal || !adjustAmount) return
    const amount = parseInt(adjustAmount)
    if (isNaN(amount) || amount === 0) return
    setAdjusting(true)
    try {
      const res = await fetch('/api/admin/adjust-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: session?.user?.email,
          userEmail: adjustModal.email,
          amount,
          reason: adjustReason || '',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setAdjustMsg(`✅ 已補 ${amount} 點給 ${adjustModal.email}`)
        await loadStats()
        setTimeout(() => {
          setAdjustModal(null)
          setAdjustAmount('')
          setAdjustReason('')
          setAdjustMsg('')
        }, 1500)
      } else {
        setAdjustMsg('❌ 操作失敗：' + data.error)
      }
    } catch {
      setAdjustMsg('❌ 連線失敗')
    }
    setAdjusting(false)
  }
  // [DNA_PATCH_END]

  const filtered = stats?.profiles.filter(p => {
    const matchSearch = p.email.toLowerCase().includes(search.toLowerCase())
    const matchPlan = filterPlan === 'all' || p.plan === filterPlan
    return matchSearch && matchPlan
  }) || []

  if (loading) return (
    <div className="min-h-screen bg-[#0d2318] flex items-center justify-center text-[#89f5a2]">載入中...</div>
  )

  return (
    <div className="min-h-screen bg-[#0d2318] p-6">
      <div className="max-w-6xl mx-auto">
        {/* 頂部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-[#89f5a2] hover:underline text-sm">← 返回後台</button>
            <p className="text-[#89f5a2] font-bold text-2xl">👥 會員統計</p>
          </div>
          <button
            onClick={loadStats}
            className="px-4 py-1.5 rounded-full border border-[#89f5a2]/40 text-[#89f5a2] text-sm hover:bg-[#89f5a2]/10 transition"
          >
            🔄 重新整理
          </button>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: '總會員數', value: stats?.totalMembers || 0, color: 'text-[#89f5a2]' },
            { label: '今日新增', value: stats?.newToday || 0, color: 'text-yellow-300' },
            { label: '總生成次數', value: stats?.totalGenerations || 0, color: 'text-purple-300' },
            { label: '付費會員', value: (stats?.planCount.starter || 0) + (stats?.planCount.standard || 0) + (stats?.planCount.pro || 0), color: 'text-orange-300' },
          ].map(card => (
            <div key={card.label} className="bg-[#1a3a28] border border-[#2d5a3d] rounded-2xl p-4 text-center">
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-gray-400 text-sm mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* 方案分布 */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {(['free', 'starter', 'standard', 'pro'] as const).map(plan => (
            <div key={plan} className="bg-[#1a3a28] border border-[#2d5a3d] rounded-xl p-3 text-center">
              <p className="text-white font-bold text-xl">{stats?.planCount[plan] || 0}</p>
              <p className="text-gray-400 text-xs mt-1">{PLAN_LABEL[plan]}</p>
            </div>
          ))}
        </div>

{/* [DNA_PATCH_START] 批量刪除操作列 */}
{selectedEmails.size > 0 && (
  <div className="flex items-center gap-3 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
    <span className="text-red-300 text-sm">已選 {selectedEmails.size} 個帳號</span>
    <button
      onClick={handleBulkDelete}
      disabled={deleting}
      className="px-4 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm font-bold hover:bg-red-500/30 transition disabled:opacity-40"
    >
      {deleting ? '刪除中...' : '🗑️ 批量刪除'}
    </button>
    <button
      onClick={() => setSelectedEmails(new Set())}
      className="px-3 py-1.5 text-white/40 text-sm hover:text-white/70 transition"
    >取消選取</button>
    {deleteMsg && <span className="text-sm">{deleteMsg}</span>}
  </div>
)}
{/* [DNA_PATCH_END] */}
        {/* 搜尋過濾 */}
        <div className="flex gap-3 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋 Email..."
            className="flex-1 bg-[#1a3a28] border border-[#2d5a3d] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]"
          />
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="bg-[#1a3a28] border border-[#2d5a3d] rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
          >
            <option value="all">全部方案</option>
            <option value="free">免費</option>
            <option value="starter">入門</option>
            <option value="standard">標準</option>
            <option value="pro">專業</option>
          </select>
        </div>

        {/* 會員列表 */}
        <div className="bg-[#1a3a28] border border-[#2d5a3d] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d5a3d]">
                {/* [DNA_PATCH_START] 全選欄 */}
<th className="text-center text-[#89f5a2] px-4 py-3">
  <input type="checkbox"
    onChange={e => {
      if (e.target.checked) setSelectedEmails(new Set(filtered.map(p => p.email)))
      else setSelectedEmails(new Set())
    }}
    checked={filtered.length > 0 && selectedEmails.size === filtered.length}
    className="w-4 h-4"
  />
</th>
{/* [DNA_PATCH_END] */}
                <th className="text-left text-[#89f5a2] px-4 py-3">Email</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">方案</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">點數</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">生成次數</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">註冊日期</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.email} className={`border-b border-[#2d5a3d]/50 ${i % 2 === 0 ? '' : 'bg-[#0d2318]/40'}`}>
                  <td className="px-4 py-3 text-white">{p.email}</td>
                  {/* [DNA_PATCH_START] 每列勾選欄 */}
<td className="px-4 py-3 text-center">
  <input type="checkbox"
    checked={selectedEmails.has(p.email)}
    onChange={() => toggleSelect(p.email)}
    className="w-4 h-4"
  />
</td>
{/* [DNA_PATCH_END] */}
                  <td className="px-4 py-3 text-center">{PLAN_LABEL[p.plan] || p.plan}</td>
                  <td className="px-4 py-3 text-center text-yellow-300">{p.credits}</td>
                  <td className="px-4 py-3 text-center text-purple-300">{p.generations}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{new Date(p.created_at).toLocaleDateString('zh-TW')}</td>
                  {/* [DNA_PATCH_START] 補點按鈕 */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => { setAdjustModal({ email: p.email }); setAdjustAmount(''); setAdjustReason(''); setAdjustMsg('') }}
                      className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs font-bold hover:bg-yellow-500/30 transition"
                    >
                      💰 補點
                    </button>
                  </td>
                  {/* [DNA_PATCH_END] */}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">沒有符合的會員</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* [DNA_PATCH_START] 補點 Modal */}
        {adjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1a3a28] border border-[#2d5a3d] rounded-2xl p-6 w-full max-w-sm mx-4">
              <h2 className="text-[#89f5a2] font-bold text-lg mb-1">💰 補點數</h2>
              <p className="text-white/50 text-xs mb-4">{adjustModal.email}</p>
              <div className="mb-3">
                <label className="text-white/60 text-xs mb-1 block">點數（正數補點、負數扣點）</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="例如：10 或 -5"
                  className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]"
                />
              </div>
              <div className="mb-4">
                <label className="text-white/60 text-xs mb-1 block">備註原因（選填）</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="例如：BUG補償、活動獎勵..."
                  className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]"
                />
              </div>
              {adjustMsg && <p className="text-sm mb-3">{adjustMsg}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setAdjustModal(null)}
                  className="flex-1 py-2 rounded-xl border border-white/20 text-white/50 text-sm hover:bg-white/5 transition"
                >取消</button>
                <button
                  onClick={handleAdjustCredits}
                  disabled={adjusting || !adjustAmount}
                  className="flex-1 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold text-sm hover:bg-yellow-500/30 transition disabled:opacity-40"
                >
                  {adjusting ? '處理中...' : '確認補點'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* [DNA_PATCH_END] */}

        {/* [DNA_PATCH_START] 補點紀錄 */}
        {adjustments.length > 0 && (
          <div className="bg-[#1a3a28] border border-[#2d5a3d] rounded-2xl p-6 mt-6">
            <h2 className="text-[#89f5a2] font-bold text-lg mb-4">📋 補點紀錄</h2>
            <div className="space-y-2">
              {adjustments.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-[#0d2318]/40 rounded-xl px-4 py-3 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white">{a.user_email}</span>
                    {a.reason && <span className="text-white/40 text-xs">{a.reason}</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${a.amount > 0 ? 'text-yellow-300' : 'text-red-400'}`}>
                      {a.amount > 0 ? '+' : ''}{a.amount} 點
                    </span>
                    <span className="text-white/30 text-xs">{new Date(a.created_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* [DNA_PATCH_END] */}

      </div>
    </div>
  )
}