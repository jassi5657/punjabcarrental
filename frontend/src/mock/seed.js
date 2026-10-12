// Dummy data used when the site runs without a backend (see ../api.js).
// Images live in /public/cars and are served from /cars/...
const today = new Date()
const iso = (d) => d.toISOString().slice(0, 10)
const plusDays = (n) => {
  const d = new Date(today)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

export function seedCars() {
  const base = { image: '', available: true, featured: false, popular: false, rating: 4.7 }
  const car = (o) => ({ ...base, ...o })
  return [
    car({ name: 'Fortuner', image: '/cars/fortuner.avif', brand: 'Toyota', category: 'SUV', year: 2024, pricePerDay: 6500, seats: 7, transmission: 'Automatic', fuel: 'Diesel', power: 204, topSpeed: 180, popular: true, featured: true, rating: 4.9, description: 'The road-presence king. 2.8L diesel with automatic gearbox, 7 seats and a commanding drive.' }),
    car({ name: 'Thar 4x4', image: '/cars/thar.avif', brand: 'Mahindra', category: 'Off-road', year: 2024, pricePerDay: 4000, seats: 4, transmission: 'Manual', fuel: 'Diesel', power: 150, topSpeed: 155, popular: true, featured: true, rating: 4.8, description: 'Go anywhere. Real 4x4 with low-range transfer case, built for mountains, trails and highways alike.' }),
    car({ name: 'Verna 2023 Top Model', image: '/cars/verna.avif', brand: 'Hyundai', category: 'Sedan', year: 2023, pricePerDay: 2500, seats: 5, transmission: 'Automatic', fuel: 'Petrol', power: 115, topSpeed: 190, popular: true, featured: true, rating: 4.8, description: 'Top variant with sunroof, ventilated seats, ADAS and a premium feature-loaded cabin.' }),
    car({ name: 'Scorpio N', image: '/cars/scorpion.avif', brand: 'Mahindra', category: 'SUV', year: 2024, pricePerDay: 4000, seats: 7, transmission: 'Automatic', fuel: 'Diesel', power: 175, topSpeed: 170, popular: true, featured: true, rating: 4.8, description: 'Big, bold and comfortable. The new-gen Scorpio with strong diesel torque and 7 seats.' }),
    car({ name: 'Fortuner 4x4', image: '/cars/fortuner.avif', brand: 'Toyota', category: 'SUV', year: 2024, pricePerDay: 7500, seats: 7, transmission: 'Automatic', fuel: 'Diesel', power: 204, topSpeed: 180, featured: true, rating: 4.9, description: 'Fortuner with 4WD and low-range gearing - unstoppable on any terrain.' }),
    car({ name: 'Hilux', image: '/cars/hillux.webp', brand: 'Toyota', category: 'Pickup', year: 2024, pricePerDay: 5500, seats: 5, transmission: 'Automatic', fuel: 'Diesel', power: 204, topSpeed: 170, description: 'Legendary 4x4 pickup. Tough, reliable and ready for work or adventure.' }),
    car({ name: 'Scorpio S11', image: '/cars/scorpio.avif', brand: 'Mahindra', category: 'SUV', year: 2023, pricePerDay: 3200, seats: 7, transmission: 'Manual', fuel: 'Diesel', power: 140, topSpeed: 165, rating: 4.6, description: 'The classic Scorpio S11 - rugged, spacious and a favourite for long family trips.' }),
    car({ name: 'XUV700', image: '/cars/xuv.webp', brand: 'Mahindra', category: 'SUV', year: 2024, pricePerDay: 4500, seats: 7, transmission: 'Automatic', fuel: 'Diesel', power: 197, topSpeed: 190, description: 'Tech-loaded SUV with panoramic sunroof, ADAS and powerful turbo diesel.' }),
    car({ name: 'Thar 5-Door (Roxx)', image: '/cars/thar5.jpg', brand: 'Mahindra', category: 'Off-road', year: 2024, pricePerDay: 4800, seats: 5, transmission: 'Automatic', fuel: 'Diesel', power: 175, topSpeed: 160, rating: 4.8, description: 'The bigger Thar with 5 doors, more space and more comfort - without losing the off-road spirit.' }),
    car({ name: 'Innova Crysta', image: '/cars/crysta.jpg', brand: 'Toyota', category: 'MUV', year: 2023, pricePerDay: 4500, seats: 7, transmission: 'Manual', fuel: 'Diesel', power: 150, topSpeed: 170, description: 'The ultimate family traveller. Smooth, quiet and incredibly comfortable on long drives.' }),
    car({ name: 'Brezza', image: '/cars/brezza.avif', brand: 'Maruti Suzuki', category: 'SUV', year: 2024, pricePerDay: 2500, seats: 5, transmission: 'Manual', fuel: 'Petrol', power: 103, topSpeed: 165, rating: 4.5, description: 'Easy to drive compact SUV with great mileage and sunroof.' }),
    car({ name: 'City', image: '/cars/city.avif', brand: 'Honda', category: 'Sedan', year: 2024, pricePerDay: 2800, seats: 5, transmission: 'Automatic', fuel: 'Petrol', power: 121, topSpeed: 190, rating: 4.7, description: 'Refined, spacious and fun - the sedan that does everything well.' }),
    car({ name: 'Dzire', image: '/cars/dzire.avif', brand: 'Maruti Suzuki', category: 'Sedan', year: 2024, pricePerDay: 1800, seats: 5, transmission: 'Manual', fuel: 'Petrol', power: 82, topSpeed: 160, rating: 4.4, description: 'Affordable, efficient and easy to drive - perfect for city and airport trips.' }),
    car({ name: 'Swift', image: '/cars/swift.jpg', brand: 'Maruti Suzuki', category: 'Hatchback', year: 2024, pricePerDay: 1500, seats: 5, transmission: 'Manual', fuel: 'Petrol', power: 82, topSpeed: 160, rating: 4.5, description: 'Nimble and fun city hatchback with excellent fuel efficiency.' }),
    car({ name: 'i20', image: '/cars/i20.avif', brand: 'Hyundai', category: 'Hatchback', year: 2024, pricePerDay: 1800, seats: 5, transmission: 'Automatic', fuel: 'Petrol', power: 118, topSpeed: 180, rating: 4.6, description: 'Premium hatchback with sunroof, turbo power and a stylish interior.' }),
    car({ name: 'Baleno', image: '/cars/baleno.avif', brand: 'Maruti Suzuki', category: 'Hatchback', year: 2024, pricePerDay: 1700, seats: 5, transmission: 'Manual', fuel: 'Petrol', power: 90, topSpeed: 165, rating: 4.4, description: 'Spacious premium hatchback, comfortable for long drives.' }),
    car({ name: 'Polo', image: '/cars/polo.jpg', brand: 'Volkswagen', category: 'Hatchback', year: 2022, pricePerDay: 1900, seats: 5, transmission: 'Manual', fuel: 'Petrol', power: 110, topSpeed: 190, rating: 4.6, description: 'German-built hatchback with solid road feel and a fun turbo engine.' }),
    car({ name: 'Ertiga', image: '/cars/ertiga.avif', brand: 'Maruti Suzuki', category: 'MUV', year: 2024, pricePerDay: 2800, seats: 7, transmission: 'Manual', fuel: 'Petrol', power: 103, topSpeed: 165, rating: 4.5, description: 'The family 7-seater - roomy, efficient and easy on the wallet.' }),
  ]
}

export function seedOffers(cars) {
  return [
    { title: 'Launch Week Mega Deal', description: 'Kick off your trip with a big saving on every car in the fleet.', code: '', discountType: 'percent', discountValue: 15, applyTo: 'all', carIds: [], validFrom: iso(today), durationValue: 30, durationUnit: 'days', validUntil: iso(plusDays(30)), active: true },
    { title: 'NRI Special - 40% OFF', description: 'Exclusive for NRIs on every car. Enter code NRI40 at checkout and show your passport / OCI at pickup.', code: 'NRI40', discountType: 'percent', discountValue: 40, applyTo: 'all', carIds: [], validFrom: iso(today), durationValue: 6, durationUnit: 'months', validUntil: iso(plusDays(182)), active: true },
    { title: 'Thar Weekend Special', description: 'Extra savings on our Thar range. Enter the code at checkout.', code: 'THAR10', discountType: 'percent', discountValue: 20, applyTo: 'cars', carIds: cars.filter((c) => c.name.startsWith('Thar')).map((c) => c.id), validFrom: iso(today), durationValue: 3, durationUnit: 'months', validUntil: iso(plusDays(90)), active: true },
  ]
}

// A few sample bookings so the admin dashboard is not empty.
export function seedBookings(cars) {
  const by = (n) => cars.find((c) => c.name === n)
  const mk = (carName, name, email, phone, fromOffset, days, status, discount = 0) => {
    const c = by(carName)
    const from = iso(plusDays(fromOffset))
    const to = iso(plusDays(fromOffset + days))
    const subtotal = c.pricePerDay * days
    return {
      carId: c.id, carName: c.name, from, to, days,
      total: Math.round(subtotal * (1 - discount / 100)), discount: Math.round((subtotal * discount) / 100),
      offerTitle: discount ? 'Launch Week Mega Deal' : '', name, email, phone, status,
      createdAt: new Date(today.getTime() - Math.abs(fromOffset) * 86400000).toISOString(),
    }
  }
  return [
    mk('Fortuner', 'Rahul Sharma', 'rahul@example.com', '98765 43210', 3, 4, 'pending', 15),
    mk('Thar 4x4', 'Simran Kaur', 'simran@example.com', '99887 76655', 7, 3, 'confirmed', 15),
    mk('Verna 2023 Top Model', 'Amit Verma', 'amit@example.com', '90000 11122', -10, 2, 'completed'),
    mk('Scorpio N', 'Gurpreet Singh', 'gurpreet@example.com', '98140 22334', 12, 5, 'confirmed', 15),
    mk('Swift', 'Neha Gupta', 'neha@example.com', '', -4, 1, 'cancelled'),
  ]
}
