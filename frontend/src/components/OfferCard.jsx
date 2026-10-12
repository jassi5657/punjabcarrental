import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Tilt } from './ui.jsx'
import { daysLeft, fmtDate } from '../api.js'

export default function OfferCard({ offer, index = 0 }) {
  const [copied, setCopied] = useState(false)
  const left = daysLeft(offer.validUntil)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Tilt className="card offer-card" max={6}>
        <div className="offer-big">{offer.label}</div>
        <h3>{offer.title}</h3>
        {offer.description && <p className="muted">{offer.description}</p>}
        <div className="offer-meta">
          <span className={`chip ${left <= 3 ? 'chip-warn' : ''}`}>
            {left === 0 ? 'Ends today' : `${left} day${left === 1 ? '' : 's'} left`}
          </span>
          <span className="muted small">Valid until {fmtDate(offer.validUntil)}</span>
        </div>
        <p className="muted small">
          {offer.applyTo === 'all' ? 'Applies to every car' : `Applies to: ${offer.cars.map((c) => c.name).join(', ') || 'selected cars'}`}
        </p>
        <div className="offer-actions">
          {offer.code ? (
            <button className="code-btn" onClick={copy} title="Copy code">
              <span>{copied ? 'Copied!' : offer.code}</span>
              <small>{copied ? '' : 'tap to copy'}</small>
            </button>
          ) : (
            <span className="chip chip-ok">Auto-applied</span>
          )}
          <Link to="/fleet" className="btn btn-sm">Browse cars</Link>
        </div>
      </Tilt>
    </motion.div>
  )
}
