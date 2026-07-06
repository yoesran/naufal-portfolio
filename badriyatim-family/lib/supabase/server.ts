import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

// Server Supabase client (Server Components / Route Handlers). cookies() is async
// in Next 16. Writes from a Server Component throw — caught and ignored, since
// proxy.ts refreshes the session cookie on the way through.
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — ignore; proxy.ts handles the refresh.
          }
        },
      },
    }
  )
}
