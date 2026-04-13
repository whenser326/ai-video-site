// [DNA_PATCH_START]
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { id } = await req.json()

  const { error } = await supabase
    .from('feedback_messages')
    .update({ is_read_by_user: true })
    .eq('id', id)
    .eq('user_email', session.user.email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
// [DNA_PATCH_END]