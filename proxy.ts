import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const res = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  // Legacy storefront guard: /admin/signup pointed at the old sign-up page.
  // Public sign-up is closed, so bounce it to the login screen.
  if (path.startsWith('/admin/signup')) {
    const u = request.nextUrl.clone()
    u.pathname = '/admin/login'
    return NextResponse.redirect(u)
  }

  const headers = new Headers(request.headers)
  headers.set('x-logix-path', path)
  headers.set('x-logix-auth', 'mock')

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
