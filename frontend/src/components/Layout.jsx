import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/fleet', label: 'Fleet' },
  { to: '/offers', label: 'Offers' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <div className="container nav-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">N</span>
          <span>NOVA<b>DRIVE</b></span>
        </Link>
        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/admin" className={({ isActive }) => `nav-admin ${isActive ? 'active' : ''}`}>
            Admin
          </NavLink>
        </nav>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="logo">
            <span className="logo-mark">N</span>
            <span>NOVA<b>DRIVE</b></span>
          </div>
          <p className="muted small">Tomorrow's cars, available today. Rent electric, sports and luxury in minutes.</p>
        </div>
        <div className="footer-links">
          <Link to="/fleet">Fleet</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/admin">Admin</Link>
        </div>
        <p className="muted small">&copy; {new Date().getFullYear()} Nova Drive. All rights reserved.</p>
      </div>
    </footer>
  )
}

export function PageTransition({ children }) {
  const { pathname } = useLocation()
  // Enter-only animation: waiting on an exit animation (mode="wait") can leave the page blank
  // when navigating quickly or pressing the browser Back button.
  return (
    <motion.main key={pathname} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {children}
    </motion.main>
  )
}
