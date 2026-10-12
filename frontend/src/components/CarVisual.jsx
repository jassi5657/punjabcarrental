import { useState } from 'react'

const HUES = { Hatchback: 45, Sedan: 32, SUV: 22, 'Off-road': 14, Pickup: 38, MUV: 50, Luxury: 8 }
const BOXY = new Set(['SUV', 'Off-road', 'Pickup', 'MUV'])

// Shows the car photo when there is one, otherwise a stylised neon silhouette.
export default function CarVisual({ car, className = '' }) {
  const [broken, setBroken] = useState(false)
  if (car.image && !broken) {
    return (
      <div className={`car-visual car-photo ${className}`}>
        <img src={car.image} alt={car.name} loading="lazy" onError={() => setBroken(true)} />
      </div>
    )
  }
  const hue = HUES[car.category] ?? 200
  const c1 = `hsl(${hue} 100% 60%)`
  const c2 = `hsl(${(hue + 25) % 360} 100% 65%)`
  const boxy = BOXY.has(car.category)
  const gid = `g${String(car.id || car.name).replace(/[^a-z0-9]/gi, '')}`
  return (
    <div className={`car-visual ${className}`}>
      <svg viewBox="0 0 400 170" role="img" aria-label={car.name}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c1} stopOpacity="0.9" />
            <stop offset="1" stopColor={c2} stopOpacity="0.35" />
          </linearGradient>
          <filter id={`${gid}b`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <ellipse cx="200" cy="150" rx="170" ry="9" fill={c1} opacity="0.25" filter={`url(#${gid}b)`} />
        <g className="car-body">
          <path
            d={
              boxy
                ? 'M20 112 Q20 96 40 92 L78 88 L108 42 L292 42 Q316 44 326 86 L366 92 Q386 96 386 112 L386 124 L20 124 Z'
                : 'M20 112 Q20 96 46 91 L96 86 Q130 50 182 48 L252 48 Q292 52 322 86 L366 93 Q386 97 386 113 L386 124 L20 124 Z'
            }
            fill={`url(#${gid})`}
            stroke={c1}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d={boxy ? 'M116 50 L206 50 L206 86 L92 86 Z' : 'M112 86 Q136 58 182 56 L206 56 L206 86 Z'} fill="#0b0a09" opacity="0.65" stroke={c1} strokeWidth="1" />
          <path d={boxy ? 'M216 50 L288 50 Q306 56 316 86 L216 86 Z' : 'M216 56 L250 56 Q278 60 298 86 L216 86 Z'} fill="#0b0a09" opacity="0.65" stroke={c1} strokeWidth="1" />
          <rect x="360" y="100" width="22" height="6" rx="3" fill="#fff" opacity="0.9" />
          <rect x="18" y="100" width="16" height="6" rx="3" fill="#ff2b5e" />
        </g>
        {[96, 306].map((x) => (
          <g key={x} className="wheel" style={{ transformOrigin: `${x}px 126px` }}>
            <circle cx={x} cy="126" r="24" fill="#14110e" stroke={c1} strokeWidth="2" />
            <circle cx={x} cy="126" r="12" fill="none" stroke={c2} strokeWidth="2" strokeDasharray="6 5" />
            <circle cx={x} cy="126" r="3" fill={c1} />
          </g>
        ))}
      </svg>
    </div>
  )
}
