// [DNA_PATCH_START]
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 用戶送出留言
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { subject, content } = await req.json()
  if (!subject || !content) return NextResponse.json({ error: '請填寫主旨和內容' }, { status: 400 })

  const { error } = await supabase.from('feedback_messages').insert({
    user_email: session.user.email,
    subject,
    content,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 用戶查詢自己的留言
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { data, error } = await supabase
    .from('feedback_messages')
    .select('*')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}
// [DNA_PATCH_END]