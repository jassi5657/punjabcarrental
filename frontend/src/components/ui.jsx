import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function Reveal({ children, delay = 0, y = 40, className = '', as = 'div' }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}

export function Counter({ to, suffix = '', prefix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { duration: 1800, bounce: 0 })
  const text = useTransform(spring, (v) => prefix + Math.round(v).toLocaleString() + suffix)
  useEffect(() => {
    if (inView) mv.set(to)
  }, [inView, to, mv])
  return <motion.span ref={ref}>{text}</motion.span>
}

// 3D tilt-on-hover wrapper that follows the pointer.
export function Tilt({ children, className = '', max = 10 }) {
  const ref = useRef(null)
  const [style, setStyle] = useState({})
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    setStyle({
      transform: `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`,
      '--mx': `${px * 100}%`,
      '--my': `${py * 100}%`,
    })
  }
  return (
    <div ref={ref} className={`tilt ${className}`} style={style} onPointerMove={onMove} onPointerLeave={() => setStyle({})}>
      {children}
    </div>
  )
}

export function SectionTitle({ kicker, title, sub }) {
  return (
    <Reveal className="section-title">
      {kicker && <span className="kicker">{kicker}</span>}
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </Reveal>
  )
}

export function Stars({ value }) {
  return (
    <span className="stars" title={`${value} / 5`}>
      <span className="star">&#9733;</span> {Number(value).toFixed(1)}
    </span>
  )
}

export function Loader({ label = 'Loading' }) {
  return (
    <div className="loader" role="status">
      <span className="loader-ring" />
      <span>{label}...</span>
    </div>
  )
}

export function ErrorBox({ children }) {
  return <div className="error-box">{children}</div>
}
