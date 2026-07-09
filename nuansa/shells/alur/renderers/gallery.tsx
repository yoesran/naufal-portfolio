'use client'

import type { GalleryContent } from '@/sections'

import { Title } from '../primitives'

/** Vertical-only: a grid needs the scroll that the paged shell doesn't have. */
export function Gallery({ content }: { content: GalleryContent }) {
  const photos = (content?.photos ?? []).filter((photo) => photo?.url)

  return (
    <div>
      <Title>{content?.title}</Title>
      {photos.length === 0 ? (
        <p className="text-sm">Belum ada foto.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={index}>
              {/* eslint-disable-next-line @next/next/no-img-element -- content URLs are arbitrary */}
              <img
                src={photo.url}
                alt=""
                className="aspect-square w-full rounded-sm object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
