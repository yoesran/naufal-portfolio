'use client'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// One profile card for every silsilah view (daftar, radial, linear) — the same
// person must read the same everywhere. Public-safe: names + relationships only.
export type Profile = {
  nama: string
  relasi: string
  pasangan?: string
  catatan?: string
  childrenLabel?: string
  children?: string[]
}

function initials(nama: string): string {
  const words = nama.split(/[,&]/)[0].trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function ProfileDialog({
  profile,
  onClose,
}: {
  profile: Profile | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!profile} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-gading">
        {profile && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div
                  className="bg-marun font-heading text-gading flex size-16 flex-none items-center justify-center rounded-full text-xl font-bold"
                  aria-hidden="true"
                >
                  {initials(profile.nama)}
                </div>
                <div className="min-w-0 text-left">
                  <DialogTitle className="font-heading text-marun text-xl">
                    {profile.nama}
                  </DialogTitle>
                  <DialogDescription>{profile.relasi}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <dl className="mt-1 space-y-3 text-sm">
              {profile.catatan && (
                <Field label="Catatan">
                  <Badge
                    variant="outline"
                    className="border-tanah-soft/40 text-tanah-soft"
                  >
                    {profile.catatan}
                  </Badge>
                </Field>
              )}
              {profile.pasangan && (
                <Field label="Pasangan">{profile.pasangan}</Field>
              )}
              {profile.children && profile.children.length > 0 && (
                <Field
                  label={`${profile.childrenLabel ?? 'Anak'} (${profile.children.length})`}
                >
                  <ul className="list-disc space-y-0.5 pl-5">
                    {profile.children.map((n, i) => (
                      <li key={`${n}-${i}`}>{n}</li>
                    ))}
                  </ul>
                </Field>
              )}
            </dl>

            <p className="border-emas/60 bg-gading-warm text-tanah-soft mt-4 rounded-lg border border-dashed px-3 py-2 text-xs">
              Foto, hobi, dan profil lengkap akan dilengkapi oleh masing-masing
              anggota.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-marun-soft text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-tanah mt-0.5">{children}</dd>
    </div>
  )
}

export function LegendDot({
  className,
  label,
}: {
  className: string
  label: string
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`size-3.5 flex-none rounded-full ${className}`}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
