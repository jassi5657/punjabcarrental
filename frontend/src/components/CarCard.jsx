import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CarVisual from './CarVisual.jsx'
import { Stars, Tilt } from './ui.jsx'
import { money } from '../api.js'

export default function CarCard({ car, index = 0 }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Tilt className="card car-card">
        <Link to={`/fleet/${car.id}`} className="car-card-link">
          <div className="card-shine" />
          {car.offer && <span className="badge badge-offer">{car.offer.label}</span>}
          {!car.available && <span className="badge badge-off">Unavailable</span>}
          <CarVisual car={car} />
          <div className="car-meta">
            <span className="chip">{car.category}</span>
            <Stars value={car.rating} />
          </div>
          <h3>{car.name}</h3>
          <p className="muted small">
            {car.brand} &middot; {car.year} &middot; {car.seats} seats &middot; {car.fuel}
          </p>
          <p className="nokm">&infin; No KM restriction</p>
          <div className="car-foot">
            <div className="price">
              {car.offer && <s>{money(car.pricePerDay)}</s>}
              <strong>{money(car.finalPrice)}</strong>
              <span>/day</span>
            </div>
            <span className="btn btn-sm btn-ghost">Details &rarr;</span>
          </div>
        </Link>
      </Tilt>
    </motion.div>
  )
}
