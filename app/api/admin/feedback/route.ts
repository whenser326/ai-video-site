// [DNA_PATCH_START]
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'whenser@gmail.com'

// 後台查所有留言
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: '無權限' }, { status: 403 })

  const { data, error } = await supabase
    .from('feedback_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}

// 後台回覆留言
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: '無權限' }, { status: 403 })

  const { id, reply } = await req.json()

  const { error } = await supabase
    .from('feedback_messages')
    .update({
      admin_reply: reply,
      replied_at: new Date().toISOString(),
      status: 'replied',
      is_read_by_user: false, // 讓用戶紅點亮起
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
// [DNA_PATCH_END]