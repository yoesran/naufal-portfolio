import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Area Keluarga' }

// Members-only landing. proxy.ts already gates /keluarga; this re-checks server-
// side (defense in depth) and is where the directory / iuran / events will live.
export default async function KeluargaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-marun-soft text-sm font-semibold tracking-wide uppercase">
        Area Keluarga
      </p>
      <h1 className="font-heading text-marun mt-1 text-3xl font-semibold">
        Selamat datang
      </h1>
      <p className="text-tanah-soft mt-2">Masuk sebagai {user.email}.</p>
      <div className="hairline-emas my-6 w-24" />
      <p className="text-tanah-soft">
        Direktori anggota, iuran, dan acara keluarga akan muncul di sini.
      </p>
    </div>
  )
}
