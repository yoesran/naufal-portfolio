import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Masuk' }

export default async function LoginPage() {
  // Already signed in → straight to the family area instead of a dead form.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/keluarga')

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-marun-soft text-sm font-semibold tracking-wide uppercase">
        Area Keluarga
      </p>
      <h1 className="font-heading text-marun mt-1 text-3xl font-semibold">
        Masuk
      </h1>
      <p className="text-tanah-soft mt-2">
        Khusus anggota keluarga. Masukkan email yang sudah didaftarkan pengurus
        — kami kirim tautan masuk ke email itu.
      </p>
      <LoginForm />
    </div>
  )
}
