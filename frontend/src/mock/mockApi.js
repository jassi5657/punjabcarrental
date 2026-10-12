// In-browser stand-in for the Express API: same method names and response shapes as ../api.js's
// real client, backed by seed data + localStorage so admin changes survive a refresh.
import { getToken } from '../auth.js'
import { seedBookings, seedCars, seedOffers } from './seed.js'

const KEY = 'nova_demo_db_v1'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DELAY = 140

const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
const str = (v) => String(v ?? '').trim()
const todayStr = () => new Date().toISOString().slice(0, 10)
const clone = (v) => JSON.parse(JSON.stringify(v))

function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status })
}
function needAuth() {
  if (!getToken()) fail('Unauthorized', 401)
}

/* ---------------------------------- store --------------------------------- */

let state = null

function createInitial() {
  const now = new Date().toISOString()
  const cars = seedCars().map((c) => ({ ...c, id: uid(), createdAt: now }))
  return {
    cars,
    offers: seedOffers(cars).map((o) => ({ ...o, id: uid(), createdAt: now })),
    bookings: seedBookings(cars).map((b) => ({ ...b, id: uid() })),
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode / quota: keep working in memory */
  }
}

function db() {
  if (state) return state
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) state = JSON.parse(raw)
  } catch {
    state = null
  }
  if (!state || !Array.isArray(state.cars)) {
    state = createInitial()
    persist()
  }
  return state
}

/* --------------------------------- pricing -------------------------------- */

function computeValidUntil(from, value, unit) {
  const d = new Date(from + 'T00:00:00Z')
  const n = Number(value)
  if (unit === 'months') d.setUTCMonth(d.getUTCMonth() + n)
  else if (unit === 'years') d.setUTCFullYear(d.getUTCFullYear() + n)
  else d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const isLive = (o, day = todayStr()) => o.active && o.validFrom <= day && day <= o.validUntil
const appliesTo = (o, car) => o.applyTo === 'all' || (o.carIds || []).includes(car.id)
function discountedPrice(price, o) {
  const v = Number(o.discountValue)
  const out = o.discountType === 'flat' ? price - v : price * (1 - v / 100)
  return Math.max(0, Math.round(out * 100) / 100)
}
function publicOffer(o) {
  const label = o.discountType === 'flat' ? `₹${o.discountValue} OFF/day` : `${o.discountValue}% OFF`
  return { id: o.id, title: o.title, code: o.code, discountType: o.discountType, discountValue: o.discountValue, validUntil: o.validUntil, label }
}
function bestOfferFor(car, code) {
  const wanted = str(code).toUpperCase()
  let best = null
  for (const o of db().offers) {
    if (!isLive(o) || !appliesTo(o, car)) continue
    if (o.code && o.code.toUpperCase() !== wanted) continue
    const price = discountedPrice(car.pricePerDay, o)
    if (!best || price < best.price) best = { offer: o, price }
  }
  return best
}
function decorateCar(car) {
  const best = bestOfferFor(car)
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
const withStatus = (o) => ({ ...o, live: isLive(o), expired: o.validUntil < todayStr(), label: publicOffer(o).label })

/* ------------------------------- validation ------------------------------- */

function cleanCar(b) {
  const car = {
    name: str(b.name),
    brand: str(b.brand),
    category: str(b.category) || 'SUV',
    year: Number(b.year) || new Date().getFullYear(),
    pricePerDay: Number(b.pricePerDay),
    seats: Number(b.seats) || 4,
    transmission: str(b.transmission) || 'Manual',
    fuel: str(b.fuel) || 'Petrol',
    power: Number(b.power) || 0,
    topSpeed: Number(b.topSpeed) || 0,
    rating: Math.min(5, Math.max(0, Number(b.rating) || 4.5)),
    image: str(b.image),
    description: str(b.description),
    available: b.available !== false,
    featured: !!b.featured,
    popular: !!b.popular,
  }
  if (!car.name) fail('Car name is required')
  if (!(car.pricePerDay > 0)) fail('Price per day must be greater than 0')
  return car
}

function cleanOffer(b) {
  const o = {
    title: str(b.title),
    description: str(b.description),
    code: str(b.code).toUpperCase(),
    discountType: b.discountType === 'flat' ? 'flat' : 'percent',
    discountValue: Number(b.discountValue),
    applyTo: b.applyTo === 'cars' ? 'cars' : 'all',
    carIds: Array.isArray(b.carIds) ? b.carIds.map(String) : [],
    validFrom: str(b.validFrom) || todayStr(),
    durationValue: Number(b.durationValue) || 1,
    durationUnit: ['days', 'months', 'years'].includes(b.durationUnit) ? b.durationUnit : 'days',
    active: b.active !== false,
  }
  if (!o.title) fail('Offer title is required')
  if (!DATE_RE.test(o.validFrom)) fail('Invalid start date')
  if (!(o.discountValue > 0)) fail('Discount must be greater than 0')
  if (o.discountType === 'percent' && o.discountValue > 100) fail('Percent cannot exceed 100')
  if (o.durationValue < 1) fail('Duration must be at least 1')
  if (o.applyTo === 'cars' && !o.carIds.length) fail('Select at least one car')
  o.validUntil = computeValidUntil(o.validFrom, o.durationValue, o.durationUnit)
  return o
}

function quote(carId, from, to, code) {
  const car = db().cars.find((c) => c.id === carId)
  if (!car) fail('Car not found', 404)
  if (!DATE_RE.test(from || '') || !DATE_RE.test(to || '')) fail('Choose pickup and return dates')
  const days = Math.round((new Date(to) - new Date(from)) / 86400000)
  if (days < 1) fail('Return date must be after pickup date')
  if (from < todayStr()) fail('Pickup date cannot be in the past')
  const best = bestOfferFor(car, code)
  const subtotal = Math.round(car.pricePerDay * days * 100) / 100
  const total = best ? Math.round(best.price * days * 100) / 100 : subtotal
  return {
    car,
    days,
    subtotal,
    discount: Math.round((subtotal - total) * 100) / 100,
    total,
    offer: best ? publicOffer(best.offer) : null,
    codeInvalid: !!str(code) && !(best && best.offer.code),
  }
}

/* ----------------------------------- api ---------------------------------- */

// Wrap a synchronous handler in a small async delay so loading states behave like a real network.
const run = (fn) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(clone(fn()))
      } catch (e) {
        reject(e)
      }
    }, DELAY)
  })

export const mockApi = {
  isMock: true,

  cars: () => run(() => db().cars.map(decorateCar)),
  car: (id) =>
    run(() => {
      const car = db().cars.find((c) => c.id === id)
      if (!car) fail('Car not found', 404)
      return decorateCar(car)
    }),
  offers: () =>
    run(() =>
      db()
        .offers.filter((o) => isLive(o))
        .map((o) => ({ ...withStatus(o), cars: db().cars.filter((c) => appliesTo(o, c)).map((c) => ({ id: c.id, name: c.name })) })),
    ),
  quote: ({ carId, from, to, code }) =>
    run(() => {
      const { car, ...rest } = quote(carId, from, to, code)
      void car
      return rest
    }),
  book: ({ carId, from, to, code, name, email, phone }) =>
    run(() => {
      if (!str(name) || !/^\S+@\S+\.\S+$/.test(str(email))) fail('Name and a valid email are required')
      const q = quote(carId, from, to, code)
      if (!q.car.available) fail('This car is currently unavailable')
      const row = {
        id: uid(), carId, carName: q.car.name, from, to, days: q.days, total: q.total, discount: q.discount,
        offerTitle: q.offer?.title || '', name: str(name), email: str(email), phone: str(phone),
        status: 'pending', createdAt: new Date().toISOString(),
      }
      db().bookings.unshift(row)
      persist()
      return { id: row.id, total: row.total }
    }),

  login: ({ username, password }) =>
    run(() => {
      if (username !== 'admin' || password !== 'admin123') fail('Invalid credentials', 401)
      return { token: 'demo-token' }
    }),

  // admin
  stats: () =>
    run(() => {
      needAuth()
      const d = db()
      return {
        cars: d.cars.length,
        availableCars: d.cars.filter((c) => c.available).length,
        liveOffers: d.offers.filter((o) => isLive(o)).length,
        bookings: d.bookings.length,
        pendingBookings: d.bookings.filter((b) => b.status === 'pending').length,
        revenue: d.bookings.filter((b) => ['confirmed', 'completed'].includes(b.status)).reduce((s, b) => s + b.total, 0),
      }
    }),
  adminOffers: () =>
    run(() => {
      needAuth()
      return db().offers.map(withStatus)
    }),
  saveCar: (input) =>
    run(() => {
      needAuth()
      const car = cleanCar(input)
      if (input.id) {
        const i = db().cars.findIndex((c) => c.id === input.id)
        if (i < 0) fail('Car not found', 404)
        db().cars[i] = { ...db().cars[i], ...car }
        persist()
        return decorateCar(db().cars[i])
      }
      const row = { ...car, id: uid(), createdAt: new Date().toISOString() }
      db().cars.unshift(row)
      persist()
      return decorateCar(row)
    }),
  deleteCar: (id) =>
    run(() => {
      needAuth()
      const d = db()
      const before = d.cars.length
      d.cars = d.cars.filter((c) => c.id !== id)
      if (d.cars.length === before) fail('Car not found', 404)
      d.offers.forEach((o) => (o.carIds = o.carIds.filter((x) => x !== id)))
      persist()
      return { ok: true }
    }),
  saveOffer: (input) =>
    run(() => {
      needAuth()
      const offer = cleanOffer(input)
      if (input.id) {
        const i = db().offers.findIndex((o) => o.id === input.id)
        if (i < 0) fail('Offer not found', 404)
        db().offers[i] = { ...db().offers[i], ...offer }
        persist()
        return withStatus(db().offers[i])
      }
      const row = { ...offer, id: uid(), createdAt: new Date().toISOString() }
      db().offers.unshift(row)
      persist()
      return withStatus(row)
    }),
  deleteOffer: (id) =>
    run(() => {
      needAuth()
      const d = db()
      const before = d.offers.length
      d.offers = d.offers.filter((o) => o.id !== id)
      if (d.offers.length === before) fail('Offer not found', 404)
      persist()
      return { ok: true }
    }),
  bookings: () =>
    run(() => {
      needAuth()
      return db().bookings
    }),
  setBookingStatus: (id, status) =>
    run(() => {
      needAuth()
      const b = db().bookings.find((x) => x.id === id)
      if (!b) fail('Booking not found', 404)
      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) fail('Invalid status')
      b.status = status
      persist()
      return b
    }),
  deleteBooking: (id) =>
    run(() => {
      needAuth()
      db().bookings = db().bookings.filter((b) => b.id !== id)
      persist()
      return { ok: true }
    }),

  // Images are stored as data URLs in localStorage, so keep them small.
  upload: (file) =>
    new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) return reject(Object.assign(new Error('Please choose an image file'), { status: 400 }))
      if (file.size > 1.5 * 1024 * 1024) return reject(Object.assign(new Error('Demo mode: image must be under 1.5 MB'), { status: 400 }))
      const reader = new FileReader()
      reader.onload = () => resolve({ url: reader.result })
      reader.onerror = () => reject(new Error('Could not read the image'))
      reader.readAsDataURL(file)
    }),

  resetDemo: () =>
    run(() => {
      state = createInitial()
      persist()
      return { ok: true }
    }),
}
