import { db } from './db.js'

export const todayStr = () => new Date().toISOString().slice(0, 10)

export function computeValidUntil(from, value, unit) {
  const d = new Date(from + 'T00:00:00Z')
  const n = Number(value)
  if (unit === 'months') d.setUTCMonth(d.getUTCMonth() + n)
  else if (unit === 'years') d.setUTCFullYear(d.getUTCFullYear() + n)
  else d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function isLive(offer, day = todayStr()) {
  return offer.active && offer.validFrom <= day && day <= offer.validUntil
}

export function appliesTo(offer, car) {
  return offer.applyTo === 'all' || (offer.carIds || []).includes(car.id)
}

export function discountedPrice(price, offer) {
  const v = Number(offer.discountValue)
  const out = offer.discountType === 'flat' ? price - v : price * (1 - v / 100)
  return Math.max(0, Math.round(out * 100) / 100)
}

export function publicOffer(o) {
  const label = o.discountType === 'flat' ? `₹${o.discountValue} OFF/day` : `${o.discountValue}% OFF`
  return { id: o.id, title: o.title, code: o.code, discountType: o.discountType, discountValue: o.discountValue, validUntil: o.validUntil, label }
}

// Offers without a code apply automatically; coded offers only when `code` matches.
export function bestOfferFor(car, code) {
  const wanted = (code || '').trim().toUpperCase()
  let best = null
  for (const o of db().offers) {
    if (!isLive(o) || !appliesTo(o, car)) continue
    if (o.code && o.code.toUpperCase() !== wanted) continue
    const price = discountedPrice(car.pricePerDay, o)
    if (!best || price < best.price) best = { offer: o, price }
  }
  return best
}

export function decorateCar(car) {
  const best = bestOfferFor(car)
  // Advertise the biggest promo-code deal available for this car.
  const hint = db()
    .offers.filter((o) => o.code && isLive(o) && appliesTo(o, car))
    .sort((a, b) => discountedPrice(car.pricePerDay, a) - discountedPrice(car.pricePerDay, b))[0]
  return {
    ...car,
    finalPrice: best ? best.price : car.pricePerDay,
    offer: best ? publicOffer(best.offer) : null,
    codeOffer: hint ? publicOffer(hint) : null,
  }
}
