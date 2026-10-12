import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, fmtDate, getToken, isMock, money, setToken } from '../api.js'
import { useLoad, useTitle } from '../hooks.js'
import { Counter, ErrorBox, Loader } from '../components/ui.jsx'

const CATEGORIES = ['Hatchback', 'Sedan', 'SUV', 'Off-road', 'Pickup', 'MUV', 'Luxury']
const todayIso = () => new Date().toISOString().slice(0, 10)

function addDuration(from, value, unit) {
  const d = new Date(from + 'T00:00:00Z')
  const n = Number(value) || 0
  if (unit === 'months') d.setUTCMonth(d.getUTCMonth() + n)
  else if (unit === 'years') d.setUTCFullYear(d.getUTCFullYear() + n)
  else d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/* ---------------------------------- shell --------------------------------- */

export default function Admin() {
  useTitle('Admin')
  const [authed, setAuthed] = useState(!!getToken())
  const logout = useCallback(() => {
    setToken(null)
    setAuthed(false)
  }, [])
  return authed ? <Dashboard onLogout={logout} /> : <Login onDone={() => setAuthed(true)} />
}

function Login({ onDone }) {
  const [f, setF] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const { token } = await api.login(f)
      setToken(token)
      onDone()
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section container page-top login-wrap">
      <motion.form className="card login" onSubmit={submit} initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <div className="logo-mark big">N</div>
        <h2>Admin access</h2>
        <p className="muted small">Sign in to manage cars, offers and bookings.</p>
        {isMock && <p className="demo-hint">Demo mode - login <b>admin</b> / <b>admin123</b></p>}
        <label>Username<input className="input" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoComplete="username" required /></label>
        <label>Password<input className="input" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" required /></label>
        {err && <ErrorBox>{err}</ErrorBox>}
        <button className="btn btn-block" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </motion.form>
    </section>
  )
}

const TABS = [
  ['overview', 'Overview'],
  ['cars', 'Cars'],
  ['offers', 'Offers'],
  ['bookings', 'Bookings'],
]

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind, id: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Any 401 from the API (expired token) bounces to the login screen.
  const guard = useCallback(
    (e) => {
      if (e.status === 401) onLogout()
      else notify(e.message, 'err')
    },
    [onLogout, notify],
  )

  const [resetKey, setResetKey] = useState(0)
  const resetDemo = async () => {
    if (!window.confirm('Reset all demo cars, offers and bookings to the defaults?')) return
    try {
      await api.resetDemo()
      setResetKey((k) => k + 1)
      notify('Demo data reset')
    } catch (e) {
      guard(e)
    }
  }

  const props = { notify, guard }
  return (
    <section className="section container page-top">
      <div className="admin-head">
        <h1>Control center</h1>
        <div className="admin-head-actions">
          {isMock && <span className="chip">Demo data</span>}
          {isMock && <button className="btn btn-sm btn-ghost" onClick={resetDemo}>Reset demo data</button>}
          <button className="btn btn-sm btn-ghost" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {tab === k && <motion.span layoutId="tab-bg" className="chip-bg" />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${tab}-${resetKey}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {tab === 'overview' && <Overview {...props} />}
          {tab === 'cars' && <Cars {...props} />}
          {tab === 'offers' && <Offers {...props} />}
          {tab === 'bookings' && <Bookings {...props} />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} className={`toast toast-${toast.kind}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* -------------------------------- helpers --------------------------------- */

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const on = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])
  return (
    <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className="modal card" role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30 }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function confirmDelete(what) {
  return window.confirm(`Delete ${what}? This cannot be undone.`)
}

/* -------------------------------- overview -------------------------------- */

function Overview({ guard }) {
  const { data, error, loading } = useLoad(api.stats)
  useEffect(() => {
    if (error) guard(error)
  }, [error, guard])
  if (loading) return <Loader />
  if (!data) return null
  const items = [
    ['Cars in fleet', data.cars, ''],
    ['Available now', data.availableCars, ''],
    ['Live offers', data.liveOffers, ''],
    ['Total bookings', data.bookings, ''],
    ['Pending bookings', data.pendingBookings, ''],
    ['Revenue (confirmed)', Math.round(data.revenue), '₹'],
  ]
  return (
    <div className="grid grid-3">
      {items.map(([label, v, prefix], i) => (
        <motion.div key={label} className="card stat" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
          <span className="muted">{label}</span>
          <strong><Counter to={v} prefix={prefix} /></strong>
        </motion.div>
      ))}
    </div>
  )
}

/* ---------------------------------- cars ---------------------------------- */

const EMPTY_CAR = {
  name: '', brand: '', category: 'SUV', year: new Date().getFullYear(), pricePerDay: 3000, seats: 5,
  transmission: 'Manual', fuel: 'Diesel', power: 150, topSpeed: 170, rating: 4.5, image: '', description: '',
  available: true, featured: false, popular: false,
}

function Cars({ notify, guard }) {
  const { data, error, loading, reload } = useLoad(api.cars)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (error) notify(error.message, 'err')
  }, [error, notify])

  const remove = async (c) => {
    if (!confirmDelete(`"${c.name}"`)) return
    try {
      await api.deleteCar(c.id)
      notify('Car deleted')
      reload()
    } catch (e) {
      guard(e)
    }
  }
  const toggle = async (c, field) => {
    try {
      await api.saveCar({ ...c, [field]: !c[field] })
      reload()
    } catch (e) {
      guard(e)
    }
  }

  return (
    <>
      <div className="admin-bar">
        <p className="muted">{data ? `${data.length} cars` : ''}</p>
        <button className="btn btn-sm" onClick={() => setEditing({ ...EMPTY_CAR })}>+ Add car</button>
      </div>
      {loading && <Loader />}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Car</th><th>Category</th><th>Price/day</th><th>Offer</th><th>Available</th><th>Featured</th><th /></tr>
          </thead>
          <tbody>
            {(data || []).map((c) => (
              <motion.tr key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <td><strong>{c.name}</strong><br /><span className="muted small">{c.brand} &middot; {c.year}</span></td>
                <td>{c.category}</td>
                <td>{c.offer ? <><s className="muted">{money(c.pricePerDay)}</s> {money(c.finalPrice)}</> : money(c.pricePerDay)}</td>
                <td>{c.offer ? <span className="chip chip-ok">{c.offer.label}</span> : <span className="muted">-</span>}</td>
                <td><button className={`switch ${c.available ? 'on' : ''}`} onClick={() => toggle(c, 'available')} aria-label="Toggle available" /></td>
                <td><button className={`switch ${c.featured ? 'on' : ''}`} onClick={() => toggle(c, 'featured')} aria-label="Toggle featured" /></td>
                <td className="actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditing(c)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>Delete</button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {editing && (
          <CarForm
            key="carform"
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              notify('Car saved')
              reload()
            }}
            guard={guard}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function CarForm({ initial, onClose, onSaved, guard }) {
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErr('')
    try {
      const { url } = await api.upload(file)
      setF((x) => ({ ...x, image: url }))
    } catch (ex) {
      if (ex.status === 401) guard(ex)
      else setErr(ex.message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await api.saveCar(f)
      onSaved()
    } catch (ex) {
      if (ex.status === 401) guard(ex)
      else setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={f.id ? 'Edit car' : 'Add car'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="row">
          <label>Name<input className="input" value={f.name} onChange={set('name')} required /></label>
          <label>Brand<input className="input" value={f.brand} onChange={set('brand')} /></label>
        </div>
        <div className="row">
          <label>Category
            <select className="input" value={f.category} onChange={set('category')}>
              {[...new Set([...CATEGORIES, f.category])].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Price per day (₹)<input className="input" type="number" min="1" step="0.01" value={f.pricePerDay} onChange={set('pricePerDay')} required /></label>
        </div>
        <div className="row row-4">
          <label>Year<input className="input" type="number" value={f.year} onChange={set('year')} /></label>
          <label>Seats<input className="input" type="number" min="1" value={f.seats} onChange={set('seats')} /></label>
          <label>Power (hp)<input className="input" type="number" min="0" value={f.power} onChange={set('power')} /></label>
          <label>Top speed<input className="input" type="number" min="0" value={f.topSpeed} onChange={set('topSpeed')} /></label>
        </div>
        <div className="row row-3">
          <label>Transmission
            <select className="input" value={f.transmission} onChange={set('transmission')}>
              <option>Automatic</option><option>Manual</option>
            </select>
          </label>
          <label>Fuel
            <select className="input" value={f.fuel} onChange={set('fuel')}>
              <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>CNG</option>
            </select>
          </label>
          <label>Rating (0-5)<input className="input" type="number" min="0" max="5" step="0.1" value={f.rating} onChange={set('rating')} /></label>
        </div>
        <label>Description<textarea className="input" rows="3" value={f.description} onChange={set('description')} /></label>
        <label>Image URL (or upload below - leave empty for the neon illustration)
          <input className="input" value={f.image} onChange={set('image')} placeholder="https://... or /uploads/..." />
        </label>
        <div className="upload-row">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={onFile} />
          {f.image && <img className="thumb" src={f.image} alt="preview" onError={(e) => (e.currentTarget.style.display = 'none')} />}
        </div>
        <div className="row">
          <label className="check"><input type="checkbox" checked={f.available} onChange={set('available')} /> Available for rent</label>
          <label className="check"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Featured</label>
        </div>
        <div className="row">
          <label className="check"><input type="checkbox" checked={!!f.popular} onChange={set('popular')} /> Most booked (home top 4)</label>
        </div>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save car'}</button>
        </div>
      </form>
    </Modal>
  )
}

/* --------------------------------- offers --------------------------------- */

const EMPTY_OFFER = {
  title: '', description: '', code: '', discountType: 'percent', discountValue: 10, applyTo: 'all', carIds: [],
  validFrom: todayIso(), durationValue: 7, durationUnit: 'days', active: true,
}

function Offers({ notify, guard }) {
  const { data, error, loading, reload } = useLoad(api.adminOffers)
  const cars = useLoad(api.cars)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (error) guard(error)
  }, [error, guard])

  const remove = async (o) => {
    if (!confirmDelete(`offer "${o.title}"`)) return
    try {
      await api.deleteOffer(o.id)
      notify('Offer deleted')
      reload()
    } catch (e) {
      guard(e)
    }
  }
  const toggle = async (o) => {
    try {
      await api.saveOffer({ ...o, active: !o.active })
      reload()
    } catch (e) {
      guard(e)
    }
  }

  const status = (o) => (o.expired ? ['Expired', 'chip-warn'] : !o.active ? ['Paused', ''] : o.live ? ['Live', 'chip-ok'] : ['Scheduled', ''])

  return (
    <>
      <div className="admin-bar">
        <p className="muted">{data ? `${data.length} offers` : ''}</p>
        <button className="btn btn-sm" onClick={() => setEditing({ ...EMPTY_OFFER, validFrom: todayIso() })}>+ Add offer</button>
      </div>
      {loading && <Loader />}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Offer</th><th>Discount</th><th>Code</th><th>Applies to</th><th>Valid</th><th>Status</th><th>Active</th><th /></tr>
          </thead>
          <tbody>
            {(data || []).map((o) => {
              const [label, cls] = status(o)
              return (
                <motion.tr key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td><strong>{o.title}</strong><br /><span className="muted small">{o.description}</span></td>
                  <td><strong>{o.label}</strong></td>
                  <td>{o.code ? <code>{o.code}</code> : <span className="muted">auto</span>}</td>
                  <td>{o.applyTo === 'all' ? 'All cars' : `${o.carIds.length} car(s)`}</td>
                  <td className="small">{fmtDate(o.validFrom)}<br />&rarr; {fmtDate(o.validUntil)}</td>
                  <td><span className={`chip ${cls}`}>{label}</span></td>
                  <td><button className={`switch ${o.active ? 'on' : ''}`} onClick={() => toggle(o)} aria-label="Toggle active" /></td>
                  <td className="actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditing(o)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(o)}>Delete</button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {editing && (
          <OfferForm
            key="offerform"
            initial={editing}
            cars={cars.data || []}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              notify('Offer saved')
              reload()
            }}
            guard={guard}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function OfferForm({ initial, cars, onClose, onSaved, guard }) {
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const toggleCar = (id) =>
    setF((x) => ({ ...x, carIds: x.carIds.includes(id) ? x.carIds.filter((c) => c !== id) : [...x.carIds, id] }))
  const until = addDuration(f.validFrom, f.durationValue, f.durationUnit)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await api.saveOffer(f)
      onSaved()
    } catch (ex) {
      if (ex.status === 401) guard(ex)
      else setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={f.id ? 'Edit offer' : 'Add offer'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>Title<input className="input" value={f.title} onChange={set('title')} placeholder="Summer Mega Sale" required /></label>
        <label>Description<textarea className="input" rows="2" value={f.description} onChange={set('description')} /></label>
        <div className="row">
          <label>Discount type
            <select className="input" value={f.discountType} onChange={set('discountType')}>
              <option value="percent">Percent (% off)</option>
              <option value="flat">Flat (₹ off per day)</option>
            </select>
          </label>
          <label>{f.discountType === 'percent' ? 'Percent off' : 'Amount off / day (₹)'}
            <input className="input" type="number" min="1" max={f.discountType === 'percent' ? 100 : undefined} step="0.01" value={f.discountValue} onChange={set('discountValue')} required />
          </label>
        </div>
        <div className="row row-3">
          <label>Starts<input className="input" type="date" value={f.validFrom} onChange={set('validFrom')} required /></label>
          <label>Valid for<input className="input" type="number" min="1" value={f.durationValue} onChange={set('durationValue')} required /></label>
          <label>Unit
            <select className="input" value={f.durationUnit} onChange={set('durationUnit')}>
              <option value="days">Days</option><option value="months">Months</option><option value="years">Years</option>
            </select>
          </label>
        </div>
        <p className="hint small">Runs {fmtDate(f.validFrom)} &rarr; <b>{fmtDate(until)}</b></p>
        <label>Promo code (leave empty to apply automatically)
          <input className="input" value={f.code} onChange={set('code')} placeholder="SUMMER25" style={{ textTransform: 'uppercase' }} />
        </label>
        <label>Applies to
          <select className="input" value={f.applyTo} onChange={set('applyTo')}>
            <option value="all">All cars</option>
            <option value="cars">Selected cars only</option>
          </select>
        </label>
        {f.applyTo === 'cars' && (
          <div className="car-pick">
            {cars.map((c) => (
              <label key={c.id} className={`pick ${f.carIds.includes(c.id) ? 'on' : ''}`}>
                <input type="checkbox" checked={f.carIds.includes(c.id)} onChange={() => toggleCar(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        )}
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> Active</label>
        {err && <ErrorBox>{err}</ErrorBox>}
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save offer'}</button>
        </div>
      </form>
    </Modal>
  )
}

/* -------------------------------- bookings -------------------------------- */

function Bookings({ notify, guard }) {
  const { data, error, loading, reload } = useLoad(api.bookings)

  useEffect(() => {
    if (error) guard(error)
  }, [error, guard])

  const setStatus = async (b, status) => {
    try {
      await api.setBookingStatus(b.id, status)
      notify(`Booking ${status}`)
      reload()
    } catch (e) {
      guard(e)
    }
  }
  const remove = async (b) => {
    if (!confirmDelete('this booking')) return
    try {
      await api.deleteBooking(b.id)
      reload()
    } catch (e) {
      guard(e)
    }
  }

  return (
    <>
      {loading && <Loader />}
      {data && data.length === 0 && <p className="muted center">No bookings yet.</p>}
      {data && data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Car</th><th>Dates</th><th>Total</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong><br /><span className="muted small">{b.email}{b.phone ? ` · ${b.phone}` : ''}</span></td>
                  <td>{b.carName}</td>
                  <td className="small">{fmtDate(b.from)}<br />&rarr; {fmtDate(b.to)} ({b.days}d)</td>
                  <td>{money(b.total)}{b.discount > 0 && <><br /><span className="muted small">saved {money(b.discount)}</span></>}</td>
                  <td>
                    <select className={`input status status-${b.status}`} value={b.status} onChange={(e) => setStatus(b, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="actions"><button className="btn btn-sm btn-danger" onClick={() => remove(b)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
