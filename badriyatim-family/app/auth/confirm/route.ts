import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// Magic-link landing: exchanges the PKCE code for a session, then sends the
// member into the family area. Bad/expired link → back to login.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/keluarga`)
  }

  return NextResponse.redirect(`${origin}/login?error=tautan`)
}
