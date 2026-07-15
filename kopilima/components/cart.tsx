'use client'

import { useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { BRAND, MENU, rupiah } from '@/lib/content'
import { cn } from '@/lib/utils'

// The cart is deliberately EPHEMERAL: no storage, no backend, no checkout.
// Its whole job is to turn "what do I want" into something you can hold up at
// the counter — a struk on your screen — or paste into a DM. Refresh and it's
// gone, and the UI says so; pretending otherwise would be a lie about a site
// with no server.
export type Cart = Record<string, number> // nama → qty

export const cartCount = (c: Cart) =>
  Object.values(c).reduce((n, q) => n + q, 0)

// Food has no confirmed price yet, so it can't be totalled — it still rides
// the struk, marked, and the total says "+ makanan" instead of lying.
const hargaOf = (nama: string) =>
  MENU.find((s) => s.nama === nama)?.harga ?? null

export const cartTotal = (c: Cart) =>
  Object.entries(c).reduce(
    (sum, [nama, q]) => sum + (hargaOf(nama) ?? 0) * q,
    0
  )

const adaTanpaHarga = (c: Cart) =>
  Object.keys(c).some((nama) => hargaOf(nama) === null)

export function CartBar({
  cart,
  setCart,
}: {
  cart: Cart
  setCart: (c: Cart) => void
}) {
  const [open, setOpen] = useState(false)
  const n = cartCount(cart)
  const total = cartTotal(cart)
  const items = Object.entries(cart)

  const bump = (nama: string, d: 1 | -1) => {
    const q = (cart[nama] ?? 0) + d
    const next = { ...cart }
    if (q <= 0) delete next[nama]
    else next[nama] = q
    setCart(next)
  }

  const struk = [
    `KOPI LIMA — pesanan saya`,
    ``,
    ...items.map(
      ([nama, q]) =>
        `${q}×  ${nama}${hargaOf(nama) === null ? '  (harga menyusul)' : ''}`
    ),
    ``,
    `Total: ${rupiah(total)}${adaTanpaHarga(cart) ? ' + makanan' : ''}`,
    ``,
    `Kode: ${BRAND.kode}`,
  ].join('\n')

  const [copied, setCopied] = useState(false)
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(struk)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard denied — the struk is on screen to read out anyway */
    }
  }

  if (n === 0) return null

  return (
    <>
      {/* the bar only exists once something is in it — no empty-cart chrome */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3">
        <Button
          variant="cta"
          size="auto"
          className="cart-bar pointer-events-auto flex items-center gap-3 px-5 py-3"
          onClick={() => setOpen(true)}
        >
          <span className="grid size-7 place-items-center rounded-full border-2 border-tinta bg-panel font-mono text-[0.8rem] text-tinta not-italic">
            {n}
          </span>
          Lihat pesanan
          <span className="font-mono text-[0.8rem] not-italic tabular-nums">
            {rupiah(total)}
            {adaTanpaHarga(cart) ? '+' : ''}
          </span>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="struk sticker max-h-[88vh] gap-0 overflow-y-auto rounded-none p-5 ring-0">
          <DialogTitle className="font-display text-s2 text-biru italic">
            Pesanan saya
          </DialogTitle>

          <ul className="mt-4 grid list-none gap-2 border-y-2 border-dashed border-ink-soft py-3 pl-0 font-mono text-[0.82rem]">
            {items.map(([nama, q]) => (
              <li key={nama} className="flex items-center gap-2">
                <span className="flex-1">
                  {nama}
                  {hargaOf(nama) === null && (
                    <span className="block text-[0.68rem] text-ink-faint">
                      harga menyusul
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Button
                    variant="chip"
                    size="auto"
                    aria-label={`Kurangi ${nama}`}
                    className="size-11 justify-center px-0"
                    onClick={() => bump(nama, -1)}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center tabular-nums">{q}</span>
                  <Button
                    variant="chip"
                    size="auto"
                    aria-label={`Tambah ${nama}`}
                    className="size-11 justify-center px-0"
                    onClick={() => bump(nama, 1)}
                  >
                    +
                  </Button>
                </span>
                <span className="w-20 text-right tabular-nums">
                  {hargaOf(nama) === null
                    ? '—'
                    : rupiah((hargaOf(nama) ?? 0) * q)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-baseline justify-between font-mono">
            <span className="text-[0.8rem] tracking-[0.12em] uppercase">
              Total
            </span>
            <span className="cart-total font-display text-s2 text-biru italic tabular-nums">
              {rupiah(total)}
              {adaTanpaHarga(cart) && (
                <span className="ml-1 font-mono text-[0.7rem] text-ink-faint not-italic">
                  + makanan
                </span>
              )}
            </span>
          </div>

          <p className="mt-3 mb-0 border-l-4 border-amber pl-3 text-s-1 text-ink-soft">
            <strong>Tunjukkan layar ini ke kasir</strong> — atau salin dan kirim
            lewat DM. Keranjang ini cuma ada di layarmu: tidak dikirim ke mana
            pun, dan hilang kalau halaman ditutup.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="cta" size="auto" onClick={salin}>
              {copied ? 'Tersalin ✓' : 'Salin pesanan'}
            </Button>
            <a
              className={cn(
                buttonVariants({ variant: 'cta-ghost', size: 'auto' })
              )}
              href={BRAND.dmUrl}
              target="_blank"
              rel="noreferrer"
            >
              Kirim via DM
            </a>
            <Button
              variant="chip"
              size="auto"
              className="ml-auto"
              onClick={() => {
                setCart({})
                setOpen(false)
              }}
            >
              Kosongkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
