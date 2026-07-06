import Link from 'next/link'

import { Gonjong } from '@/components/gonjong'

// Bahasa 404 (the Next default is English) — same voice as the rest of the site.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <Gonjong className="text-emas mx-auto w-20" />
      <h1 className="font-heading text-marun mt-6 text-3xl font-semibold">
        Halaman tidak ditemukan
      </h1>
      <p className="text-tanah-soft mt-3">
        Alamat yang kamu buka tidak ada — mungkin tautannya salah ketik atau
        halamannya sudah dipindahkan.
      </p>
      <Link
        href="/"
        className="bg-marun text-gading hover:bg-marun-deep mt-6 inline-flex min-h-11 items-center rounded-lg px-5 font-medium transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}
