'use client'

import { useState } from 'react'

import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  // /auth/confirm bounces bad/expired magic links here with ?error=tautan —
  // without this message the failure is silent and the member just sees the
  // form again with no idea why.
  const linkError = useSearchParams().get('error') === 'tautan'
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Invite-only: only emails the pengurus pre-registered can sign in.
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })
    setLoading(false)
    if (error)
      setError(
        'Email belum terdaftar sebagai anggota, atau gagal mengirim. Hubungi pengurus untuk diundang.'
      )
    else setSent(true)
  }

  if (sent)
    return (
      <div className="border-emas/50 bg-gading-warm text-tanah mt-6 rounded-xl border p-4">
        Tautan masuk sudah dikirim ke <strong>{email}</strong>. Buka email (cek
        juga folder spam), lalu ketuk tautannya.
      </div>
    )

  return (
    <>
      {linkError && !error && (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive mt-6 rounded-xl border p-4 text-sm"
        >
          Tautan masuk tidak valid atau sudah kedaluwarsa. Masukkan email di
          bawah untuk minta tautan baru.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label htmlFor="email" className="text-tanah block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          autoComplete="email"
          className="border-border bg-card focus-visible:border-marun min-h-11 w-full rounded-lg border px-3 py-2.5 outline-none"
        />
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="min-h-11 w-full">
          {loading ? 'Mengirim…' : 'Kirim tautan masuk'}
        </Button>
      </form>
    </>
  )
}
