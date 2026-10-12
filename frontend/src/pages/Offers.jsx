import { api } from '../api.js'
import { useLoad, useTitle } from '../hooks.js'
import { ErrorBox, Loader, SectionTitle } from '../components/ui.jsx'
import OfferCard from '../components/OfferCard.jsx'

export default function Offers() {
  useTitle('Offers')
  const { data, error, loading } = useLoad(api.offers)

  return (
    <section className="section container page-top">
      <SectionTitle kicker="Save more" title="Current offers" sub="Discounts applied at checkout. Coded offers need the promo code." />
      {loading && <Loader label="Loading offers" />}
      {error && <ErrorBox>{error.message}</ErrorBox>}
      {data && data.length === 0 && <p className="muted center">No active offers right now - check back soon.</p>}
      <div className="grid grid-3">
        {(data || []).map((o, i) => <OfferCard key={o.id} offer={o} index={i} />)}
      </div>
    </section>
  )
}
