import { getToken } from './auth.js'
import { mockApi } from './mock/mockApi.js'

// Auth helpers live in auth.js (shared with the mock layer); re-exported for existing imports.
export { getToken, setToken } from './auth.js'

// The site runs on built-in dummy data (no backend needed). Set VITE_USE_MOCK=false to talk to
// the Express server in /server instead.
export const isMock = import.meta.env.VITE_USE_MOCK !== 'false'

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

const realApi = {
  cars: () => request('/api/cars'),
  car: (id) => request(`/api/cars/${id}`),
  offers: () => request('/api/offers'),
  quote: (body) => request('/api/quote', { method: 'POST', body }),
  book: (body) => request('/api/bookings', { method: 'POST', body }),
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  // admin
  stats: () => request('/api/stats'),
  adminOffers: () => request('/api/admin/offers'),
  saveCar: (car) => (car.id ? request(`/api/cars/${car.id}`, { method: 'PUT', body: car }) : request('/api/cars', { method: 'POST', body: car })),
  deleteCar: (id) => request(`/api/cars/${id}`, { method: 'DELETE' }),
  saveOffer: (o) => (o.id ? request(`/api/offers/${o.id}`, { method: 'PUT', body: o }) : request('/api/offers', { method: 'POST', body: o })),
  deleteOffer: (id) => request(`/api/offers/${id}`, { method: 'DELETE' }),
  bookings: () => request('/api/bookings'),
  setBookingStatus: (id, status) => request(`/api/bookings/${id}`, { method: 'PATCH', body: { status } }),
  deleteBooking: (id) => request(`/api/bookings/${id}`, { method: 'DELETE' }),
  upload: (file) => {
    const form = new FormData()
    form.append('image', file)
    return request('/api/upload', { method: 'POST', form })
  },
}

export const api = isMock ? mockApi : realApi

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const daysLeft = (until) => {
  const end = new Date(until + 'T23:59:59')
  return Math.max(0, Math.ceil((end - new Date()) / 86400000))
}

export const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
