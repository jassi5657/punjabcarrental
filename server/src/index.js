import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { load, save, db, uid, UPLOAD_DIR } from './db.js'
import { computeValidUntil, isLive, todayStr, decorateCar, bestOfferFor, publicOffer, appliesTo } from './pricing.js'

load()
const app = express()
const PORT = process.env.PORT || 5055
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(UPLOAD_DIR))

// ---------- auth ----------
const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  try {
    jwt.verify(token, db().meta.jwtSecret)
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const m = db().meta
  if (username !== m.adminUser || !bcrypt.compareSync(String(password || ''), m.adminHash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  res.json({ token: jwt.sign({ role: 'admin' }, m.jwtSecret, { expiresIn: '12h' }) })
})

// ---------- validation helpers ----------
const bad = (res, msg) => res.status(400).json({ error: msg })
const str = (v) => String(v ?? '').trim()
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function cleanCar(b) {
  const car = {
    name: str(b.name),
    brand: str(b.brand),
    category: str(b.category) || 'Sedan',
    year: Number(b.year) || new Date().getFullYear(),
    pricePerDay: Number(b.pricePerDay),
    seats: Number(b.seats) || 4,
    transmission: str(b.transmission) || 'Automatic',
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
  if (!car.name) return { error: 'Car name is required' }
  if (!(car.pricePerDay > 0)) return { error: 'Price per day must be greater than 0' }
  return { car }
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
  if (!o.title) return { error: 'Offer title is required' }
  if (!DATE_RE.test(o.validFrom)) return { error: 'Invalid start date' }
  if (!(o.discountValue > 0)) return { error: 'Discount must be greater than 0' }
  if (o.discountType === 'percent' && o.discountValue > 100) return { error: 'Percent cannot exceed 100' }
  if (o.durationValue < 1) return { error: 'Duration must be at least 1' }
  if (o.applyTo === 'cars' && !o.carIds.length) return { error: 'Select at least one car' }
  o.validUntil = computeValidUntil(o.validFrom, o.durationValue, o.durationUnit)
  return { offer: o }
}

// ---------- cars ----------
app.get('/api/cars', (_req, res) => res.json(db().cars.map(decorateCar)))

app.get('/api/cars/:id', (req, res) => {
  const car = db().cars.find((c) => c.id === req.params.id)
  if (!car) return res.status(404).json({ error: 'Car not found' })
  res.json(decorateCar(car))
})

app.post('/api/cars', auth, (req, res) => {
  const { car, error } = cleanCar(req.body || {})
  if (error) return bad(res, error)
  const row = { ...car, id: uid(), createdAt: new Date().toISOString() }
  db().cars.unshift(row)
  save()
  res.status(201).json(decorateCar(row))
})

app.put('/api/cars/:id', auth, (req, res) => {
  const i = db().cars.findIndex((c) => c.id === req.params.id)
  if (i < 0) return res.status(404).json({ error: 'Car not found' })
  const { car, error } = cleanCar(req.body || {})
  if (error) return bad(res, error)
  db().cars[i] = { ...db().cars[i], ...car }
  save()
  res.json(decorateCar(db().cars[i]))
})

app.delete('/api/cars/:id', auth, (req, res) => {
  const d = db()
  const before = d.cars.length
  d.cars = d.cars.filter((c) => c.id !== req.params.id)
  if (d.cars.length === before) return res.status(404).json({ error: 'Car not found' })
  d.offers.forEach((o) => (o.carIds = o.carIds.filter((id) => id !== req.params.id)))
  save()
  res.json({ ok: true })
})

// ---------- offers ----------
const withStatus = (o) => ({ ...o, live: isLive(o), expired: o.validUntil < todayStr() })

app.get('/api/offers', (_req, res) => {
  const cars = db().cars
  res.json(
    db()
      .offers.filter((o) => isLive(o))
      .map((o) => ({
        ...withStatus(o),
        label: publicOffer(o).label,
        cars: cars.filter((c) => appliesTo(o, c)).map((c) => ({ id: c.id, name: c.name })),
      })),
  )
})

app.get('/api/admin/offers', auth, (_req, res) =>
  res.json(db().offers.map((o) => ({ ...withStatus(o), label: publicOffer(o).label }))),
)

app.post('/api/offers', auth, (req, res) => {
  const { offer, error } = cleanOffer(req.body || {})
  if (error) return bad(res, error)
  const row = { ...offer, id: uid(), createdAt: new Date().toISOString() }
  db().offers.unshift(row)
  save()
  res.status(201).json(withStatus(row))
})

app.put('/api/offers/:id', auth, (req, res) => {
  const i = db().offers.findIndex((o) => o.id === req.params.id)
  if (i < 0) return res.status(404).json({ error: 'Offer not found' })
  const { offer, error } = cleanOffer(req.body || {})
  if (error) return bad(res, error)
  db().offers[i] = { ...db().offers[i], ...offer }
  save()
  res.json(withStatus(db().offers[i]))
})

app.delete('/api/offers/:id', auth, (req, res) => {
  const d = db()
  const before = d.offers.length
  d.offers = d.offers.filter((o) => o.id !== req.params.id)
  if (d.offers.length === before) return res.status(404).json({ error: 'Offer not found' })
  save()
  res.json({ ok: true })
})

// ---------- quote + bookings ----------
function quote(carId, from, to, code) {
  const car = db().cars.find((c) => c.id === carId)
  if (!car) return { error: 'Car not found' }
  if (!DATE_RE.test(from || '') || !DATE_RE.test(to || '')) return { error: 'Choose pickup and return dates' }
  const days = Math.round((new Date(to) - new Date(from)) / 86400000)
  if (days < 1) return { error: 'Return date must be after pickup date' }
  if (from < todayStr()) return { error: 'Pickup date cannot be in the past' }
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

app.post('/api/quote', (req, res) => {
  const { carId, from, to, code } = req.body || {}
  const { car, error, ...rest } = quote(carId, from, to, code)
  if (error) return bad(res, error)
  res.json(rest)
})

app.post('/api/bookings', (req, res) => {
  const { carId, from, to, code, name, email, phone } = req.body || {}
  if (!str(name) || !/^\S+@\S+\.\S+$/.test(str(email))) return bad(res, 'Name and a valid email are required')
  const q = quote(carId, from, to, code)
  if (q.error) return bad(res, q.error)
  if (!q.car.available) return bad(res, 'This car is currently unavailable')
  const row = {
    id: uid(),
    carId,
    carName: q.car.name,
    from,
    to,
    days: q.days,
    total: q.total,
    discount: q.discount,
    offerTitle: q.offer?.title || '',
    name: str(name),
    email: str(email),
    phone: str(phone),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  db().bookings.unshift(row)
  save()
  res.status(201).json({ id: row.id, total: row.total })
})

app.get('/api/bookings', auth, (_req, res) => res.json(db().bookings))

app.patch('/api/bookings/:id', auth, (req, res) => {
  const b = db().bookings.find((x) => x.id === req.params.id)
  if (!b) return res.status(404).json({ error: 'Booking not found' })
  if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(req.body?.status)) return bad(res, 'Invalid status')
  b.status = req.body.status
  save()
  res.json(b)
})

app.delete('/api/bookings/:id', auth, (req, res) => {
  db().bookings = db().bookings.filter((b) => b.id !== req.params.id)
  save()
  res.json({ ok: true })
})

// ---------- stats ----------
app.get('/api/stats', auth, (_req, res) => {
  const d = db()
  res.json({
    cars: d.cars.length,
    availableCars: d.cars.filter((c) => c.available).length,
    liveOffers: d.offers.filter((o) => isLive(o)).length,
    bookings: d.bookings.length,
    pendingBookings: d.bookings.filter((b) => b.status === 'pending').length,
    revenue: d.bookings.filter((b) => ['confirmed', 'completed'].includes(b.status)).reduce((s, b) => s + b.total, 0),
  })
})

// ---------- uploads ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_r, file, cb) => cb(null, uid() + path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => cb(null, /^image\/(png|jpe?g|webp|gif|avif)$/.test(file.mimetype)),
})

app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return bad(res, 'Upload a PNG, JPG, WEBP, GIF or AVIF image (max 5MB)')
  res.json({ url: '/uploads/' + req.file.filename })
})

// ---------- serve built frontend in production ----------
const dist = path.join(__dirname, '..', '..', 'frontend', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^\/(?!api|uploads).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Server error' })
})

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
