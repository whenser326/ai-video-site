// [DNA_PATCH_START] middleware.ts — 移除 IP 限制，OAuth callback 直接放行
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/callback/:path*'],
}
// [DNA_PATCH_END]