import { createBrowserClient } from '@supabase/ssr'

// Browser Supabase client (anon/publishable key — safe in the client, guarded by
// RLS). Used by client components like the login form.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
