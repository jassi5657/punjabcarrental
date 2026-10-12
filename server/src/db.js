import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { seedCars, seedOffers, RETIRED_CARS } from './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = path.join(__dirname, '..', 'data')
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
const FILE = path.join(DATA_DIR, 'db.json')

fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

let state

// Bump SEED_VERSION when seed.js changes. On the next start: retired cars are removed, missing seed
// cars are added, and seed photos are filled in for cars that have none. Other edits are kept.
const SEED_VERSION = 4

function migrate() {
  if ((state.meta.seedVersion || 1) >= SEED_VERSION) return false
  const now = new Date().toISOString()
  const retired = new Set(RETIRED_CARS)
  const removed = new Set(state.cars.filter((c) => retired.has(c.name)).map((c) => c.id))
  state.cars = state.cars.filter((c) => !removed.has(c.id))
  state.offers = state.offers.filter((o) => o.title !== 'Electric Escape')
  state.offers.forEach((o) => (o.carIds = (o.carIds || []).filter((id) => !removed.has(id))))

  const byName = new Map(state.cars.map((c) => [c.name, c]))
  for (const c of seedCars()) {
    const existing = byName.get(c.name)
    if (!existing) state.cars.push({ ...c, id: crypto.randomUUID(), createdAt: now })
    else if (!existing.image && c.image) existing.image = c.image
  }
  // Add seed promo-code offers (THAR10, NRI40, ...) that are not in the database yet.
  const haveCodes = new Set(state.offers.map((o) => o.code).filter(Boolean))
  seedOffers(state.cars)
    .filter((o) => o.code && !haveCodes.has(o.code))
    .forEach((o) => state.offers.push({ ...o, id: crypto.randomUUID(), createdAt: now }))
  state.meta.seedVersion = SEED_VERSION
  return true
}

function createInitial() {
  const now = new Date().toISOString()
  const cars = seedCars().map((c) => ({ ...c, id: crypto.randomUUID(), createdAt: now }))
  return {
    meta: {
      jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
      adminUser: process.env.ADMIN_USER || 'admin',
      adminHash: bcrypt.hashSync(process.env.ADMIN_PASS || 'admin123', 10),
      seedVersion: SEED_VERSION,
    },
    cars,
    offers: seedOffers(cars).map((o) => ({ ...o, id: crypto.randomUUID(), createdAt: now })),
    bookings: [],
  }
}

export function load() {
  if (fs.existsSync(FILE)) {
    state = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    if (migrate()) save()
  } else {
    state = createInitial()
    save()
  }
  return state
}

export function save() {
  const tmp = FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2))
  fs.renameSync(tmp, FILE)
}

export const db = () => state
export const uid = () => crypto.randomUUID()
