import { type NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'

// Next 16 renamed Middleware → Proxy (same mechanism). Refreshes the Supabase
// session and gates the members area: any /keluarga request without a logged-in
// user is bounced to /login. Scoped to /keluarga (the only authed area).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = { matcher: ['/keluarga/:path*'] }
