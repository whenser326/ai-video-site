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

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: '無權限' }, { status: 403 })

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, plan, credits, created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: generations } = await supabase
    .from('user_generations')
    .select('user_email, status')

  const planCount = { free: 0, starter: 0, standard: 0, pro: 0 }
  profiles?.forEach(p => {
    const plan = p.plan as keyof typeof planCount
    if (plan in planCount) planCount[plan]++
  })

  // 每位用戶的生成總次數
  const genMap: Record<string, number> = {}
  generations?.forEach(g => {
    if (g.status === 'succeeded') {
      genMap[g.user_email] = (genMap[g.user_email] || 0) + 1
    }
  })

  const totalMembers = profiles?.length || 0
  const totalGenerations = Object.values(genMap).reduce((a, b) => a + b, 0)

  // 今日新增會員
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const newToday = profiles?.filter(p => new Date(p.created_at) >= today).length || 0

  const { data: adjustments } = await supabase
    .from('credit_adjustments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({
    totalMembers,
    planCount,
    totalGenerations,
    newToday,
    profiles: profiles?.map(p => ({
      email: p.email,
      plan: p.plan,
      credits: p.credits,
      generations: genMap[p.email] || 0,
      created_at: p.created_at,
    })),
    adjustments: adjustments || [],
  })
}
// [DNA_PATCH_END]