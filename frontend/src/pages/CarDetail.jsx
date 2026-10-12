import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api, fmtDate, money } from '../api.js'
import { useLoad, useTitle } from '../hooks.js'
import { ErrorBox, Loader, Stars } from '../components/ui.jsx'
import CarVisual from '../components/CarVisual.jsx'

const iso = (d) => d.toISOString().slice(0, 10)
const plus = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}

export default function CarDetail() {
  const { id } = useParams()
  const { data: car, error, loading } = useLoad(() => api.car(id), [id])
  useTitle(car?.name)

  const [form, setForm] = useState({ from: plus(1), to: plus(4), code: '', name: '', email: '', phone: '' })
  const [quote, setQuote] = useState(null)
  const [quoteErr, setQuoteErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [formErr, setFormErr] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Debounced live quote whenever dates or code change.
  useEffect(() => {
    if (!car) return
    let stale = false
    const t = setTimeout(() => {
      api
        .quote({ carId: car.id, from: form.from, to: form.to, code: form.code })
        .then((q) => !stale && (setQuote(q), setQuoteErr('')))
        .catch((e) => !stale && (setQuote(null), setQuoteErr(e.message)))
    }, 300)
    return () => {
      stale = true
      clearTimeout(t)
    }
  }, [car, form.from, form.to, form.code])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setFormErr('')
    try {
      const r = await api.book({ carId: car.id, ...form })
      setDone(r)
    } catch (err) {
      setFormErr(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <section className="section container page-top"><Loader /></section>
  if (error) {
    return (
      <section className="section container page-top">
        <ErrorBox>{error.status === 404 ? 'This car no longer exists.' : error.message}</ErrorBox>
        <Link to="/fleet" className="btn mt">Back to fleet</Link>
      </section>
    )
  }

  const specs = [
    ['Power', `${car.power} hp`],
    ['Distance', 'Unlimited KM'],
    ['Seats', car.seats],
    ['Gearbox', car.transmission],
    ['Fuel', car.fuel],
    ['Year', car.year],
  ]

  return (
    <section className="section container page-top">
      <Link to="/fleet" className="back">&larr; Back to fleet</Link>
      <div className="detail">
        <motion.div className="detail-main" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}>
          <div className="detail-stage">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="float"><CarVisual car={car} /></div>
          </div>
          <div className="detail-head">
            <div>
              <span className="chip">{car.category}</span>
              <h1>{car.name}</h1>
              <p className="muted">{car.brand} &middot; <span className="nokm-inline">No KM restriction</span></p>
            </div>
            <Stars value={car.rating} />
          </div>
          <p className="lead-sm">{car.description || 'No description yet.'}</p>
          <div className="specs">
            {specs.map(([k, v], i) => (
              <motion.div key={k} className="spec" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07 }}>
                <span>{k}</span>
                <strong>{v}</strong>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.aside className="card book" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}>
          <div className="price price-lg">
            {car.offer && <s>{money(car.pricePerDay)}</s>}
            <strong>{money(car.finalPrice)}</strong>
            <span>/day</span>
          </div>
          {car.offer && <span className="badge badge-inline">{car.offer.label} &middot; {car.offer.title}</span>}
          {car.codeOffer && !car.offer?.code && (
            <p className="small hint">Use code <b>{car.codeOffer.code}</b> for {car.codeOffer.label}</p>
          )}

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" className="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <svg viewBox="0 0 52 52" className="check">
                  <circle cx="26" cy="26" r="24" fill="none" />
                  <path d="M14 27l8 8 16-17" fill="none" />
                </svg>
                <h3>Booking received!</h3>
                <p className="muted">Total {money(done.total)}. We'll confirm shortly at {form.email}.</p>
                <Link to="/fleet" className="btn btn-sm">Book another</Link>
              </motion.div>
            ) : !car.available ? (
              <motion.p key="na" className="error-box">This car is currently unavailable.</motion.p>
            ) : (
              <motion.form key="form" onSubmit={submit} className="form" exit={{ opacity: 0 }}>
                <div className="row">
                  <label>Pickup<input className="input" type="date" min={iso(new Date())} value={form.from} onChange={set('from')} required /></label>
                  <label>Return<input className="input" type="date" min={form.from} value={form.to} onChange={set('to')} required /></label>
                </div>
                <label>Promo code (optional)<input className="input" value={form.code} onChange={set('code')} placeholder="e.g. VOLT20" /></label>
                <label>Full name<input className="input" value={form.name} onChange={set('name')} required /></label>
                <div className="row">
                  <label>Email<input className="input" type="email" value={form.email} onChange={set('email')} required /></label>
                  <label>Phone<input className="input" value={form.phone} onChange={set('phone')} /></label>
                </div>

                <div className="quote">
                  {quoteErr && <span className="small warn">{quoteErr}</span>}
                  {quote && (
                    <>
                      <div><span>{quote.days} day{quote.days > 1 ? 's' : ''} &times; {money(car.pricePerDay)}</span><span>{money(quote.subtotal)}</span></div>
                      {quote.discount > 0 && (
                        <div className="save"><span>{quote.offer?.title} ({quote.offer?.label})</span><span>-{money(quote.discount)}</span></div>
                      )}
                      {quote.codeInvalid && <div className="warn small">Code not valid for this car</div>}
                      <div className="total"><span>Total</span><motion.strong key={quote.total} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>{money(quote.total)}</motion.strong></div>
                      <small className="muted">{fmtDate(form.from)} &rarr; {fmtDate(form.to)}</small>
                    </>
                  )}
                </div>

                {formErr && <ErrorBox>{formErr}</ErrorBox>}
                <button className="btn btn-lg btn-block" disabled={busy || !quote}>{busy ? 'Booking...' : 'Reserve now'}</button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.aside>
      </div>
    </section>
  )
}
