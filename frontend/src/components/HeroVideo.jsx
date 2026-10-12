import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Cinematic hero clip. Autoplays muted + looping; falls back to the poster frame when the
// visitor prefers reduced motion or the browser blocks autoplay.
export default function HeroVideo({ src = '/hero-web.mp4', poster = '/hero-poster.jpg' }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    v.muted = true // React does not reliably reflect the `muted` attribute; autoplay needs it.
    v.play().catch(() => {})
  }, [])

  return (
    <motion.div
      className="hero-video"
      initial={{ opacity: 0, y: 60, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hero-video-frame">
        {failed ? (
          <img src={poster} alt="Fortuner driving off-road" />
        ) : (
          <video
            ref={ref}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setFailed(true)}
          />
        )}
        <div className="hero-video-shade" />
        <span className={`live-chip ${playing ? 'on' : ''}`}>
          <i /> Live drive
        </span>
        <span className="corner corner-tl" />
        <span className="corner corner-tr" />
        <span className="corner corner-bl" />
        <span className="corner corner-br" />
      </div>
    </motion.div>
  )
}
