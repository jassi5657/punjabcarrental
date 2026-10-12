import { useEffect } from 'react'
import { Route, Routes, useLocation, Link } from 'react-router-dom'
import Background from './components/Background.jsx'
import { Footer, Navbar, PageTransition } from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Fleet from './pages/Fleet.jsx'
import CarDetail from './pages/CarDetail.jsx'
import Offers from './pages/Offers.jsx'
import Admin from './pages/Admin.jsx'

function NotFound() {
  return (
    <section className="section container page-top center">
      <h1 className="grad">404</h1>
      <p className="muted">This road leads nowhere.</p>
      <Link to="/" className="btn mt">Back home</Link>
    </section>
  )
}

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <Background />
      <Navbar />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/fleet/:id" element={<CarDetail />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
      <Footer />
    </>
  )
}
