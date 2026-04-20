'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Message {
  id: string
  user_email: string
  subject: string
  content: string
  status: string
  admin_reply: string | null
  replied_at: string | null
  created_at: string
  is_read_by_user: boolean
}

export default function AdminFeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/'); return }
    if (session?.user?.email !== 'whenser@gmail.com') { router.push('/'); return }
  }, [session, status])

  const loadMessages = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/feedback')
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
    setLoading(false)
  }

  useEffect(() => { loadMessages() }, [])

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    await fetch('/api/admin/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, reply }),
    })
    setSending(false)
    setReply('')
    await loadMessages()
    setSelected(prev => prev ? { ...prev, admin_reply: reply, status: 'replied' } : null)
  }

  const filtered = messages.filter(m =>
    filterStatus === 'all' || m.status === filterStatus
  )

  const unreadCount = messages.filter(m => m.status === 'unread').length

  if (loading) return (
    <div className="min-h-screen bg-[#0d2318] flex items-center justify-center text-[#89f5a2]">載入中...</div>
  )

  return (
    <div className="min-h-screen bg-[#0d2318] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-[#89f5a2] hover:underline text-sm">← 返回後台</button>
            <p className="text-[#89f5a2] font-bold text-2xl">
              💬 留言管理
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">{unreadCount} 未讀</span>
              )}
            </p>
          </div>
          <button
            onClick={loadMessages}
            className="px-4 py-1.5 rounded-full border border-[#89f5a2]/40 text-[#89f5a2] text-sm hover:bg-[#89f5a2]/10 transition"
          >
            🔄 重新整理
          </button>
        </div>

        <div className="flex gap-4">
          {/* 左側列表 */}
          <div className="w-96 flex-shrink-0">
            <div className="flex gap-2 mb-3">
              {[
                { value: 'all', label: '全部' },
                { value: 'unread', label: '未讀' },
                { value: 'replied', label: '已回覆' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition ${filterStatus === f.value ? 'bg-[#89f5a2] text-[#0d2318]' : 'border border-[#2d5a3d] text-gray-400 hover:border-[#89f5a2]/60'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <p className="text-gray-400 text-center py-8">沒有留言</p>
              )}
              {filtered.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => { setSelected(msg); setReply('') }}
                  className={`cursor-pointer p-3 rounded-xl border transition ${selected?.id === msg.id ? 'border-[#89f5a2] bg-[#1a3a28]' : 'border-[#2d5a3d] hover:border-[#89f5a2]/50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${msg.status === 'unread' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {msg.status === 'unread' ? '未讀' : '已回覆'}
                    </span>
                    <span className="text-gray-500 text-xs">{new Date(msg.created_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                  <p className="text-white text-sm font-medium truncate">{msg.subject}</p>
                  <p className="text-gray-400 text-xs truncate">{msg.user_email}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 右側詳情 */}
          <div className="flex-1">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                ← 點選左側留言查看詳情
              </div>
            ) : (
              <div className="bg-[#1a3a28] border border-[#2d5a3d] rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">{selected.user_email} · {new Date(selected.created_at).toLocaleString('zh-TW')}</p>
                  <p className="text-[#89f5a2] font-bold text-lg">{selected.subject}</p>
                </div>
                <div className="bg-[#0d2318] rounded-xl p-4 border border-[#2d5a3d]">
                  <p className="text-white text-sm whitespace-pre-wrap">{selected.content}</p>
                </div>

                {selected.admin_reply && (
                  <div className="bg-[#0d2318] rounded-xl p-4 border border-[#89f5a2]/30">
                    <p className="text-[#89f5a2] text-xs font-bold mb-2">✅ 已回覆內容</p>
                    <p className="text-white text-sm whitespace-pre-wrap">{selected.admin_reply}</p>
                    <p className="text-gray-500 text-xs mt-2">{selected.replied_at ? new Date(selected.replied_at).toLocaleString('zh-TW') : ''}</p>
                  </div>
                )}

                <div>
                  <label className="text-[#89f5a2] text-sm mb-2 block">
                    {selected.admin_reply ? '修改回覆' : '回覆留言'}
                  </label>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="輸入回覆內容..."
                    rows={5}
                    className="w-full bg-[#0d2318] border border-[#2d5a3d] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#89f5a2] resize-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={sending || !reply.trim()}
                    className="mt-2 w-full py-2 rounded-xl bg-[#89f5a2] text-[#0d2318] font-bold hover:opacity-90 transition disabled:opacity-50"
                  >
                    {sending ? '送出中...' : '送出回覆'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}