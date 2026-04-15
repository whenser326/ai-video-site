// [DNA_PATCH_START]
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'whenser@gmail.com'

export async function POST(req: NextRequest) {
  const { adminEmail, userEmail, amount, reason } = await req.json()

  if (adminEmail !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '無權限' }, { status: 403 })
  }
  if (!userEmail || typeof amount !== 'number' || amount === 0) {
    return NextResponse.json({ error: '參數錯誤' }, { status: 400 })
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credits')
    .eq('email', userEmail)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: '找不到會員' }, { status: 404 })
  }

  const newCredits = Math.max(0, (profile.credits || 0) + amount)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newCredits })
    .eq('email', userEmail)

  if (updateError) {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }

  await supabase.from('credit_adjustments').insert({
    admin_email: adminEmail,
    user_email: userEmail,
    amount,
    reason: reason || null,
  })

  return NextResponse.json({ ok: true, newCredits })
}
// [DNA_PATCH_END]