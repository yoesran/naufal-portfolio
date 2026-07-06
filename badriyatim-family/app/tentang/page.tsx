import type { Metadata } from 'next'

import { PageHeading } from '@/components/page-heading'
import { counts, silsila } from '@/lib/family'

export const metadata: Metadata = { title: 'Tentang' }

export default function TentangPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        eyebrow="Tentang"
        title="Keluarga Besar Badriyatim & Anizir"
        intro="Catatan keluarga — siapa kita, dari mana, dan apa yang ingin kita jaga bersama."
      />

      <div className="text-tanah space-y-5">
        <p>
          Himpunan ini adalah keluarga besar keturunan{' '}
          <strong>{silsila.root.ayah}</strong> dan{' '}
          <strong>{silsila.root.ibu}</strong>, sebuah keluarga Minangkabau
          dengan akar di Gasang, Sumatera Barat, dan Curup, Bengkulu. Dari
          keduanya lahir {counts.anak} anak, {counts.cucu} cucu, dan{' '}
          {counts.cicit} cicit yang kini tersebar di berbagai daerah di
          Indonesia.
        </p>
        <p>
          Seiring keluarga berkembang dan merantau, semakin sulit untuk saling
          bertemu. Himpunan keluarga ini dibentuk sebagai ikhtiar agar tali
          persaudaraan tetap terjaga — agar kita tetap menjadi satu keluarga
          besar, dan agar anak cucu mengenal dari mana mereka berasal.
        </p>

        <h2 className="font-heading text-marun text-xl font-semibold">
          Yang ingin kita jaga bersama
        </h2>
        <p>
          Dari program kerja keluarga, niat itu diterjemahkan menjadi kegiatan
          nyata: menghimpun iuran anggota, merenovasi rumah di kampung, lalu{' '}
          <strong>Pulang Basamo</strong> untuk memperkenalkan tanah leluhur
          kepada generasi muda dan yang di rantau. Keluarga juga merencanakan
          bantuan pendidikan bagi anak cucu yang masih sekolah, kredit usaha
          bagi anggota yang membutuhkan, pengajian bulanan secara virtual, album
          foto digital, serta demo masak resep <strong>Bunda Anizir</strong>{' '}
          agar kuliner kampung tetap dikenal.
        </p>

        <h2 className="font-heading text-marun text-xl font-semibold">
          Membaca silsilah
        </h2>
        {/* Mirrors the node colours on the Silsilah page (FILL in pohon-canvas);
            keep the two in sync. Pasangan/menantu are not drawn as nodes — they
            appear in each person's profile. */}
        <p>
          Pada halaman Silsilah, warna menandai generasi:{' '}
          <strong>anak kandung</strong> berwarna marun, <strong>cucu</strong>{' '}
          berwarna gading, dan <strong>cicit</strong> berwarna emas. Pasangan
          (menantu) tidak digambar sebagai kotak sendiri — ketuk nama seseorang
          untuk melihat pasangan, catatan, dan keturunannya.
        </p>
        <ul className="space-y-2">
          {[
            { cls: 'bg-marun', label: 'Anak kandung' },
            { cls: 'border border-border bg-gading-warm', label: 'Cucu' },
            { cls: 'bg-emas-pale', label: 'Cicit' },
          ].map((k) => (
            <li key={k.label} className="flex items-center gap-3">
              <span
                className={`size-3.5 flex-none rounded-full ${k.cls}`}
                aria-hidden="true"
              />
              <span>{k.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
