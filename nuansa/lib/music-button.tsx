'use client'

import { useRef, useState } from 'react'

import { Music, Pause } from 'lucide-react'

/**
 * Shared behaviour, shell-supplied styling. State follows the audio element's
 * own events, so it stays correct even when playback is interrupted (autoplay
 * policy, another tab, end of track) rather than only when we click.
 */
export function MusicButton({
  url,
  className,
}: {
  url: string
  className?: string
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void audio.play()
    else audio.pause()
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={url}
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Hentikan musik' : 'Putar musik'}
        className={className}
      >
        {playing ? (
          <Pause className="size-5" aria-hidden />
        ) : (
          <Music className="size-5" aria-hidden />
        )}
      </button>
    </>
  )
}
