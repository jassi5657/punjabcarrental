import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api.js'
import { useLoad, useTitle } from '../hooks.js'
import { Counter, Reveal, SectionTitle } from '../components/ui.jsx'
import CarCard from '../components/CarCard.jsx'
import HeroVideo from '../components/HeroVideo.jsx'
import OfferCard from '../components/OfferCard.jsx'

const WORDS = ['Rent', 'the', 'Ride.', 'Own', 'the', 'Road.']
const BRANDS = ['TOYOTA', 'MAHINDRA', 'HYUNDAI', 'MARUTI SUZUKI', 'HONDA', 'FORTUNER', 'THAR', 'SCORPIO']
// `always` categories are shown even when empty; the rest only appear once they have cars.
const CATEGORIES = [
  { name: 'Hatchback', img: '/logos/hatchback.webp', tag: 'Easy city drives', always: true },
  { name: 'Sedan', img: '/logos/sedan.jpg', tag: 'Comfort & style', always: true },
  { name: 'SUV', img: '/logos/suv.avif', tag: 'Family & highway kings', always: true },
  { name: 'Off-road', img: '/logos/offroad.jpg', tag: 'Thar & 4x4 adventure', always: true },
  { name: 'Pickup', img: '/logos/pickup.webp', tag: 'Tough & capable', always: true },
  { name: 'MUV', img: '/logos/muv.jpg', tag: 'Big group travel', always: true },
]
const STEPS = [
  { n: '01', t: 'Pick your ride', d: 'Browse SUVs, sedans, hatchbacks and 4x4s with live pricing and offers.' },
  { n: '02', t: 'Choose your dates', d: 'Get an instant quote with your discount applied automatically.' },
  { n: '03', t: 'Hit the road', d: 'Confirm your booking in seconds and pick up your car. It is that simple.' },
]
const WHY = [
  { i: '⚡', t: 'Instant booking', d: 'No paperwork queues. Reserve in under a minute.' },
  { i: '🛡', t: 'Fully insured', d: 'Comprehensive cover and 24/7 roadside assistance included.' },
  { i: '♾', t: 'No KM restriction', d: 'Drive as far as you like. Zero per-kilometre charges, ever.' },
  { i: '🏷', t: 'Live deals', d: 'Seasonal offers and promo codes that stack up real savings.' },
]

export default function Home() {
  useTitle('')
  const cars = useLoad(api.cars)
  const offers = useLoad(api.offers)
  const all = cars.data || []
  const popular = all.filter((c) => c.popular).slice(0, 4)
  const counts = all.reduce((m, c) => ({ ...m, [c.category]: (m[c.category] || 0) + 1 }), {})
  const cats = CATEGORIES.filter((c) => c.always || counts[c.name])
  const top = (offers.data || [])[0]

  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <motion.span className="kicker" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            Self-drive car rental
          </motion.span>
          <motion.div className="tagline" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <span className="dot" /> No KM restriction &middot; Drive unlimited
          </motion.div>
          <h1>
            {WORDS.map((w, i) => (
              <motion.span
                key={`${w}-${i}`}
                className={`hero-word ${i > 2 ? 'grad' : ''}`}
                initial={{ opacity: 0, y: 60, rotateX: -80 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.25 + i * 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}{' '}
              </motion.span>
            ))}
          </h1>
          <motion.p className="lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
            Fortuner, Thar, Scorpio, XUV700, Verna and more. Unlimited kilometres, transparent pricing and live offers - just book and drive.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
            <Link to="/fleet" className="btn btn-lg">Explore fleet</Link>
            <Link to="/offers" className="btn btn-lg btn-ghost">
              {top ? `${top.label} deals` : 'View offers'}
            </Link>
          </motion.div>
          <motion.div className="hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
            <div><strong><Counter to={all.length || 16} suffix="+" /></strong><span>Cars</span></div>
            <div><strong>&infin;</strong><span>No KM limit</span></div>
            <div><strong><Counter to={98} suffix="%" /></strong><span>Happy riders</span></div>
          </motion.div>
        </div>

        <HeroVideo />
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...BRANDS, ...BRANDS, ...BRANDS].map((b, i) => <span key={i}>{b}</span>)}
        </div>
      </div>

      {(offers.data || []).length > 0 && (
        <section className="section container">
          <SectionTitle kicker="Hot right now" title="Live offers" sub="Limited-time deals set by our team - grab them before they expire." />
          <div className="grid grid-3">
            {offers.data.slice(0, 3).map((o, i) => <OfferCard key={o.id} offer={o} index={i} />)}
          </div>
        </section>
      )}

      {cats.length > 0 && (
        <section className="section container">
          <SectionTitle kicker="Browse by type" title="Pick your category" sub="Hatchback, sedan, SUV or full 4x4 - whatever the trip needs." />
          <div className="grid grid-cats">
            {cats.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.07}>
                <Link to={`/fleet?cat=${encodeURIComponent(c.name)}`} className="card cat-card">
                  {c.img ? (
                    <div className="cat-photo"><img src={c.img} alt={c.name} loading="lazy" /></div>
                  ) : (
                    <span className="cat-icon">{c.icon}</span>
                  )}
                  <h3>{c.name}</h3>
                  <p className="muted small">{c.tag}</p>
                  <span className="chip">
                    {counts[c.name] ? `${counts[c.name]} car${counts[c.name] > 1 ? 's' : ''}` : 'Coming soon'}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="section container">
        <SectionTitle kicker="Most booked" title="People's top choices" sub="The cars our customers pick the most - all with no KM restriction." />
        <div className="grid grid-4">
          {popular.map((c, i) => <CarCard key={c.id} car={c} index={i} />)}
        </div>
        <Reveal className="center mt">
          <Link to="/fleet" className="btn btn-ghost">See the whole fleet &rarr;</Link>
        </Reveal>
      </section>

      <section className="section container">
        <SectionTitle kicker="How it works" title="Three steps to the open road" />
        <div className="grid grid-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12} className="card step">
              <span className="step-n">{s.n}</span>
              <h3>{s.t}</h3>
              <p className="muted">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <SectionTitle kicker="Why Nova" title="Built for the next generation" />
        <div className="grid grid-4">
          {WHY.map((w, i) => (
            <Reveal key={w.t} delay={i * 0.08} className="card why">
              <span className="why-i">{w.i}</span>
              <h3>{w.t}</h3>
              <p className="muted small">{w.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal className="cta">
          <h2>Ready to <span className="grad">launch</span>?</h2>
          <p className="muted">Your next ride is a few clicks away.</p>
          <Link to="/fleet" className="btn btn-lg">Book now</Link>
        </Reveal>
      </section>
    </>
  )
}
