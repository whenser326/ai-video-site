import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { adminEmail, emails } = await req.json()

    if (adminEmail !== 'whenser@gmail.com') {
      return NextResponse.json({ ok: false, error: '權限不足' }, { status: 403 })
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ ok: false, error: '沒有選擇帳號' }, { status: 400 })
    }

    let deleted = 0

    for (const email of emails) {
      // 從 profiles 刪除
      await supabase.from('profiles').delete().eq('email', email)

      // 從 auth.users 刪除（需要 service role key）
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find((u: { email?: string }) => u.email === email)
      if (user) {
        await supabase.auth.admin.deleteUser(user.id)
      }

      deleted++
    }

    return NextResponse.json({ ok: true, deleted })
  } catch (err) {
    console.error('delete-users error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}