'use client'
import { useState, useEffect } from 'react'

interface Message {
  id: string
  subject: string
  content: string
  status: string
  admin_reply: string | null
  replied_at: string | null
  created_at: string
  is_read_by_user: boolean
}

export default function FeedbackModal({
  userEmail,
  onClose,
}: {
  userEmail: string
  onClose: () => void
}) {
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const loadMessages = async () => {
    const res = await fetch('/api/feedback')
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
  }

  useEffect(() => {
    loadMessages()
  }, [])

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) return
    setSending(true)
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content }),
    })
    setSending(false)
    setSent(true)
    setSubject('')
    setContent('')
    await loadMessages()
    setTimeout(() => { setSent(false); setView('list') }, 1500)
  }

  const handleOpenDetail = async (msg: Message) => {
    setSelected(msg)
    setView('detail')
    if (msg.admin_reply && !msg.is_read_by_user) {
      await fetch('/api/feedback/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msg.id }),
      })
      await loadMessages()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#0d2318] border border-[#2d5a3d] rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d5a3d]">
          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <button onClick={() => setView('list')} className="text-[#89f5a2] text-sm">← 返回</button>
            )}
            <h2 className="text-[#89f5a2] font-bold text-lg">
              {view === 'list' ? '💬 我的留言' : view === 'new' ? '✏️ 新增留言' : '📩 留言詳情'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {view === 'list' && (
            <div className="space-y-3">
              <button
                onClick={() => setView('new')}
                className="w-full py-2 rounded-xl bg-[#89f5a2] text-[#0d2318] font-bold hover:opacity-90 transition"
              >
                ＋ 新增留言
              </button>
              {messages.length === 0 && (
                <p className="text-center text-gray-400 py-8">還沒有留言紀錄</p>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => handleOpenDetail(msg)}
                  className="cursor-pointer p-4 rounded-xl border border-[#2d5a3d] hover:border-[#89f5a2]/60 transition relative"
                >
                  {msg.admin_reply && !msg.is_read_by_user && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">新回覆</span>
                  )}
                  <p className="text-white font-medium">{msg.subject}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(msg.created_at).toLocaleDateString('zh-TW')} ·{' '}
                    {msg.status === 'replied' ? '✅ 已回覆' : '⏳ 待回覆'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {view === 'new' && (
            <div className="space-y-4">
              <div>
                <label className="text-[#89f5a2] text-sm mb-1 block">主旨</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="請輸入主旨"
                  className="w-full bg-[#1a3a28] border border-[#2d5a3d] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2]"
                />
              </div>
              <div>
                <label className="text-[#89f5a2] text-sm mb-1 block">內容</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="請描述你的問題或意見..."
                  rows={6}
                  className="w-full bg-[#1a3a28] border border-[#2d5a3d] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#89f5a2] resize-none"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={sending || sent}
                className="w-full py-2 rounded-xl bg-[#89f5a2] text-[#0d2318] font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {sent ? '✅ 已送出！' : sending ? '送出中...' : '送出留言'}
              </button>
            </div>
          )}

          {view === 'detail' && selected && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1a3a28] border border-[#2d5a3d]">
                <p className="text-[#89f5a2] font-bold mb-2">{selected.subject}</p>
                <p className="text-white text-sm whitespace-pre-wrap">{selected.content}</p>
                <p className="text-gray-500 text-xs mt-3">{new Date(selected.created_at).toLocaleString('zh-TW')}</p>
              </div>
              {selected.admin_reply ? (
                <div className="p-4 rounded-xl bg-[#0d2318] border border-[#89f5a2]/40">
                  <p className="text-[#89f5a2] text-xs font-bold mb-2">📩 管理員回覆</p>
                  <p className="text-white text-sm whitespace-pre-wrap">{selected.admin_reply}</p>
                  <p className="text-gray-500 text-xs mt-3">{selected.replied_at ? new Date(selected.replied_at).toLocaleString('zh-TW') : ''}</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-[#2d5a3d] text-center text-gray-400 text-sm">
                  ⏳ 管理員尚未回覆
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}