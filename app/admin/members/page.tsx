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
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return }
    if (session?.user?.email !== 'whenser@gmail.com') { router.push('/'); return }
  }, [session, status])

  const loadStats = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/members')
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  useEffect(() => { loadStats() }, [])

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
            <h1 className="text-[#89f5a2] font-bold text-2xl">👥 會員統計</h1>
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
                <th className="text-left text-[#89f5a2] px-4 py-3">Email</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">方案</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">點數</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">生成次數</th>
                <th className="text-center text-[#89f5a2] px-4 py-3">註冊日期</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.email} className={`border-b border-[#2d5a3d]/50 ${i % 2 === 0 ? '' : 'bg-[#0d2318]/40'}`}>
                  <td className="px-4 py-3 text-white">{p.email}</td>
                  <td className="px-4 py-3 text-center">{PLAN_LABEL[p.plan] || p.plan}</td>
                  <td className="px-4 py-3 text-center text-yellow-300">{p.credits}</td>
                  <td className="px-4 py-3 text-center text-purple-300">{p.generations}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{new Date(p.created_at).toLocaleDateString('zh-TW')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">沒有符合的會員</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}