import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../api.js'
import { useLoad, useTitle } from '../hooks.js'
import { ErrorBox, Loader, SectionTitle } from '../components/ui.jsx'
import CarCard from '../components/CarCard.jsx'

const SORTS = {
  featured: { label: 'Most booked', fn: (a, b) => Number(b.popular) - Number(a.popular) || Number(b.featured) - Number(a.featured) },
  low: { label: 'Price: low to high', fn: (a, b) => a.finalPrice - b.finalPrice },
  high: { label: 'Price: high to low', fn: (a, b) => b.finalPrice - a.finalPrice },
  power: { label: 'Most powerful', fn: (a, b) => b.power - a.power },
  rating: { label: 'Top rated', fn: (a, b) => b.rating - a.rating },
}

export default function Fleet() {
  useTitle('Fleet')
  const { data, error, loading } = useLoad(api.cars)

  // Filters live in the URL (?cat=SUV&q=...&sort=...&offers=1), so the browser Back button
  // and shared links restore exactly what was selected.
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') || 'All'
  const q = params.get('q') || ''
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'featured'
  const onlyOffers = params.get('offers') === '1'

  const update = (key, value, empty = '') => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === empty || value === false) next.delete(key)
        else next.set(key, value === true ? '1' : value)
        return next
      },
      { replace: true },
    )
  }

  const cats = useMemo(() => {
    const found = [...new Set((data || []).map((c) => c.category))]
    return ['All', ...found, ...(cat !== 'All' && !found.includes(cat) ? [cat] : [])]
  }, [data, cat])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data || [])
      .filter((c) => cat === 'All' || c.category === cat)
      .filter((c) => !onlyOffers || c.offer)
      .filter((c) => !term || `${c.name} ${c.brand} ${c.category} ${c.fuel}`.toLowerCase().includes(term))
      .sort(SORTS[sort].fn)
  }, [data, q, cat, sort, onlyOffers])

  return (
    <section className="section container page-top">
      <SectionTitle kicker="The fleet" title="Choose your machine" sub="Every car with no KM restriction. Live prices - discounts already applied." />

      <div className="toolbar">
        <input className="input" placeholder="Search name, brand, fuel..." value={q} onChange={(e) => update('q', e.target.value)} aria-label="Search cars" />
        <select className="input" value={sort} onChange={(e) => update('sort', e.target.value, 'featured')} aria-label="Sort">
          {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={onlyOffers} onChange={(e) => update('offers', e.target.checked)} />
          <span>On offer only</span>
        </label>
      </div>

      <div className="chips">
        {cats.map((c) => (
          <button key={c} className={`chip-btn ${cat === c ? 'on' : ''}`} onClick={() => update('cat', c, 'All')}>
            {cat === c && <motion.span layoutId="chip-bg" className="chip-bg" />}
            <span>{c}</span>
          </button>
        ))}
      </div>

      {loading && <Loader label="Loading fleet" />}
      {error && <ErrorBox>Could not load cars: {error.message}</ErrorBox>}
      {!loading && !error && list.length === 0 && <p className="muted center mt">No cars match your filters.</p>}

      <div className="grid grid-3">
        <AnimatePresence initial={false}>
          {list.map((c, i) => <CarCard key={c.id} car={c} index={i} />)}
        </AnimatePresence>
      </div>
    </section>
  )
}
