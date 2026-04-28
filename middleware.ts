// [DNA_PATCH_START] 新建 middleware.ts（根目錄）
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ipRegisterMap = new Map<string, { count: number; resetAt: number }>()

export function middleware(request: NextRequest) {
  // 只攔截 NextAuth signIn 請求
  if (request.nextUrl.pathname.startsWith('/api/auth/callback')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const now = Date.now()
    const windowMs = 24 * 60 * 60 * 1000 // 24小時
    const maxRegistrations = 3 // 同一 IP 24小時內最多建 3 個帳號

    const record = ipRegisterMap.get(ip)
    if (!record || now > record.resetAt) {
      ipRegisterMap.set(ip, { count: 1, resetAt: now + windowMs })
    } else {
      record.count++
      if (record.count > maxRegistrations) {
        console.log(`❌ IP 限制：${ip} 24小時內已建立 ${record.count} 個帳號`)
        return NextResponse.json(
          { error: '同一 IP 每天最多建立 3 個帳號' },
          { status: 429 }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/callback/:path*'],
}
// [DNA_PATCH_END]