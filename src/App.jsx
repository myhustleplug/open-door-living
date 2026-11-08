import { useEffect, useMemo, useState } from 'react'

const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

function Brand() {
  return <a className="brand-wrap brand-link" href="#home" aria-label="OpenDoor Living home"><span className="brand-mark">OD</span><span><span className="brand-name">OpenDoor</span><span className="brand-sub">Living</span></span></a>
}

function App() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filters, setFilters] = useState({ location: 'Any city', budget: 'Any budget', beds: 'Any' })
  const [selectedListing, setSelectedListing] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [bookingListing, setBookingListing] = useState(null)
  const [offer, setOffer] = useState(1300)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [locations, setLocations] = useState([])

  const fetchListings = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch('/api/listings')
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to load homes.')
      setListings(payload.listings)
      setLocations([...new Set(payload.listings.map((item) => item.location))])
    } catch (error) {
      setLoadError(`${error.message} Start the API with npm run server.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchListings() }, [])

  const filteredListings = useMemo(() => listings.filter((listing) => {
    const matchesLocation = filters.location === 'Any city' || listing.location === filters.location
    const matchesBeds = filters.beds === 'Any' || (filters.beds === 'Studio' ? listing.beds === 0 : listing.beds === Number(filters.beds))
    const ranges = { '$800-$1,200': [800, 1200], '$1,200-$1,600': [1200, 1600], '$1,600-$2,000': [1600, 2000], '$2,000-$3,000': [2000, 3000] }
    const [min, max] = ranges[filters.budget] || [0, Infinity]
    return matchesLocation && matchesBeds && listing.price >= min && listing.price <= max
  }), [filters, listings])

  const openBooking = (listing) => {
    setBookingListing(listing)
    setOffer(listing.price)
    setSubmitted(false)
    setSubmitError('')
    window.setTimeout(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const toggleFavorite = (id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const submitBooking = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    const form = new FormData(event.currentTarget)
    const inquiry = {
      listingId: bookingListing.id,
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      requestType: form.get('requestType'),
      preferredDate: form.get('date'),
      offer: Number(form.get('offer')),
      message: form.get('message'),
    }
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiry),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Could not send your request.')
      setSubmitted(true)
    } catch (error) {
      setSubmitError(`${error.message} Please check that the API is running and try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  const showListings = () => {
    setSelectedListing(null)
    setBookingListing(null)
    window.setTimeout(() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  return (
    <div className="page-shell">
      <header className="topbar container"><Brand /><nav className="main-nav" aria-label="Main navigation"><a href="#featured">Explore homes</a><a href="#how-it-works">How it works</a><a href="#prices">Price guide</a></nav><button className="nav-button" onClick={() => listings[0] && openBooking(listings[0])}>Book a tour</button></header>
      <main>
        {selectedListing ? <section className="container detail-page"><button className="back-link" onClick={() => setSelectedListing(null)}>← Back to homes</button><div className="detail-heading"><div><span className="eyebrow">{selectedListing.badge}</span><h1>{selectedListing.title}</h1><p className="location-row">⌖ {selectedListing.fullLocation}</p></div><strong className="detail-price">{money(selectedListing.price)}<small> / month</small></strong></div><div className="detail-gallery">{selectedListing.images.map((image, index) => <img key={`${selectedListing.id}-${index}`} className={index === 0 ? 'gallery-main' : ''} src={image} alt={`${selectedListing.title} interior ${index + 1}`} />)}</div><div className="detail-layout"><div className="detail-main"><div className="detail-facts"><span>🛏 {selectedListing.beds === 0 ? 'Studio' : `${selectedListing.beds} bedrooms`}</span><span>♧ {selectedListing.baths} bathroom{selectedListing.baths > 1 ? 's' : ''}</span><span>⌂ {selectedListing.sqft.toLocaleString()} sq ft</span><span>✓ {selectedListing.available}</span></div><h2>About this home</h2><p>{selectedListing.description}</p><h2>Home highlights</h2><div className="amenity-grid">{selectedListing.features.map((feature) => <span key={feature}>✓ &nbsp;{feature}</span>)}</div><div className="neighborhood-note"><h2>About the neighborhood</h2><p>Enjoy nearby groceries, local cafes, parks, and public transit. Exact address and tour details are shared by the property team.</p></div></div><aside className="detail-booking"><span className="eyebrow">Make it yours</span><h2>{money(selectedListing.price)} <small>/ month</small></h2><p>Ask a question, propose a price, or request a tour. Requests are not reservations.</p><button className="primary-btn full-width" onClick={() => openBooking(selectedListing)}>Request a tour or apply</button><button className="secondary-btn full-width favorite-detail" onClick={() => toggleFavorite(selectedListing.id)}>{favorites.includes(selectedListing.id) ? '♥ Saved to favorites' : '♡ Save this home'}</button><small>Sample listing for demonstration. Confirm availability and terms with the property manager.</small></aside></div></section> : <>
          <section id="home" className="hero container"><div className="hero-copy"><span className="eyebrow">A better way to rent</span><h1>Find a place that feels like <em>home.</em></h1><p>Explore welcoming rentals, clear monthly prices, and a simple way to request a tour or make an offer.</p><div className="cta-row"><a className="primary-btn button-link" href="#featured">Explore available homes</a><a className="secondary-btn button-link" href="#how-it-works">How it works</a></div><div className="hero-trust"><span>✓ Clear monthly pricing</span><span>✓ Flexible requests</span><span>✓ No-pressure browsing</span></div></div><div className="hero-visual"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85" alt="Warm, bright modern apartment living room"/><div className="floating-card"><span className="card-label">A place to settle in</span><h3>Room for your next chapter</h3><p>Explore homes from {money(1050)} / month</p></div></div></section>
          <section className="filter-strip container" aria-label="Search rental homes"><div className="filter-item"><label htmlFor="location-filter">Location</label><select id="location-filter" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}><option>Any city</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></div><div className="filter-item"><label htmlFor="budget-filter">Monthly budget</label><select id="budget-filter" value={filters.budget} onChange={(event) => setFilters({ ...filters, budget: event.target.value })}><option>Any budget</option><option>$800-$1,200</option><option>$1,200-$1,600</option><option>$1,600-$2,000</option><option>$2,000-$3,000</option></select></div><div className="filter-item"><label htmlFor="beds-filter">Bedrooms</label><select id="beds-filter" value={filters.beds} onChange={(event) => setFilters({ ...filters, beds: event.target.value })}><option>Any</option><option>Studio</option><option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option></select></div><button className="primary-btn filter-btn" onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}>Search homes</button></section>
          <section id="featured" className="container section-block"><div className="section-heading"><div><span className="eyebrow">Find your fit</span><h2>Homes worth coming home to</h2><p className="section-intro">Browse our sample collection and open a listing to explore the details.</p></div><span className="results-count">{loading ? 'Loading homes…' : `${filteredListings.length} homes to explore`}</span></div>{loadError && <div className="empty-results"><h3>Could not connect to the rental service</h3><p>{loadError}</p><button className="secondary-btn" onClick={fetchListings}>Try again</button></div>}{!loadError && !loading && (filteredListings.length ? <div className="listing-grid">{filteredListings.map((listing) => <article key={listing.id} className="listing-card"><div className="card-image-wrap"><button className={`save-button ${favorites.includes(listing.id) ? 'is-saved' : ''}`} aria-label={favorites.includes(listing.id) ? 'Remove from saved homes' : 'Save home'} onClick={() => toggleFavorite(listing.id)}>{favorites.includes(listing.id) ? '♥' : '♡'}</button><button className="image-open" onClick={() => setSelectedListing(listing)} aria-label={`View ${listing.title}`}><img src={listing.image} alt={listing.title}/></button><span className="badge">{listing.badge}</span></div><div className="card-content"><div className="card-topline"><span>{listing.type}</span><strong>{money(listing.price)}<small>/mo</small></strong></div><button className="listing-title-button" onClick={() => setSelectedListing(listing)}><h3>{listing.title}</h3></button><p className="location-row">⌖ {listing.location}</p><div className="meta-row"><span>{listing.beds === 0 ? 'Studio' : `${listing.beds} bed${listing.beds > 1 ? 's' : ''}`}</span><span>{listing.baths} bath</span><span>{listing.sqft.toLocaleString()} sq ft</span></div><div className="card-feature">{listing.features.slice(0, 2).join(' · ')}</div><button className="card-button" onClick={() => setSelectedListing(listing)}>View home details <span>→</span></button></div></article>)}</div> : <div className="empty-results"><h3>No homes match those filters yet</h3><p>Try a different city, bedroom count, or monthly budget.</p><button className="secondary-btn" onClick={() => setFilters({ location: 'Any city', budget: 'Any budget', beds: 'Any' })}>Clear filters</button></div>)}</section>
          <section id="how-it-works" className="container section-block how-panel"><div className="section-heading"><div><span className="eyebrow">Simple from start to finish</span><h2>Your next home, in three steps</h2></div></div><div className="steps-grid"><article><span>01</span><h3>Find your fit</h3><p>Filter by city, budget, and bedrooms to narrow down homes that suit your needs.</p></article><article><span>02</span><h3>Explore the details</h3><p>Review sample rent, home features, and neighborhood information before you reach out.</p></article><article><span>03</span><h3>Send a request</h3><p>Ask for a tour or submit an offer request. The property team can confirm availability and terms.</p></article></div></section>
          <section id="prices" className="container section-block"><div className="section-heading"><div><span className="eyebrow">Clear price guide</span><h2>Sample monthly rent by city</h2><p className="section-intro">Illustrative rents only. Confirm actual pricing and availability with the property manager.</p></div></div><div className="price-cards">{locations.map((location) => { const lowest = Math.min(...listings.filter((item) => item.location === location).map((item) => item.price)); return <article key={location}><span>⌖ {location}</span><strong>From {money(lowest)}<small> / month</small></strong><button onClick={() => { setFilters({ ...filters, location }); showListings() }}>Explore homes →</button></article> })}</div></section>
          <section className="container section-block offer-panel"><div className="offer-copy"><span className="eyebrow">Flexible rent requests</span><h2>Your budget matters.</h2><p>Choose a home and send a proposed monthly rent. Offers are requests only and are subject to approval.</p><ul className="feature-list"><li>Choose an available home first</li><li>Set a rent proposal that works for you</li><li>Request a tour or ask a question in the same form</li></ul></div><div className="offer-card"><label className="offer-label" htmlFor="offer-preview">Explore a sample monthly offer</label><div className="offer-amount">{money(offer)}</div><input id="offer-preview" type="range" min="800" max="2500" step="50" value={offer} onChange={(event) => setOffer(Number(event.target.value))}/><div className="range-scale"><span>$800</span><span>$2,500</span></div><button className="primary-btn full-width" onClick={() => listings[0] && openBooking(listings[0])}>Choose a home and make a request</button><p className="offer-disclaimer">The slider is a preview; final offers are submitted for a specific listing.</p></div></section>
        </>}
        {bookingListing && <section id="booking" className="container booking-section"><div className="booking-heading"><div><span className="eyebrow">A simple next step</span><h2>{submitted ? 'Your request is received' : 'Request a tour or apply'}</h2><p>For <strong>{bookingListing.title}</strong> · {money(bookingListing.price)} / month</p></div><button className="close-button" onClick={() => { setBookingListing(null); setSubmitted(false) }} aria-label="Close request form">×</button></div>{submitted ? <div className="confirmation-panel" role="status"><span className="confirmation-icon">✓</span><h3>Thanks for reaching out!</h3><p>Your request was saved. The property team will need to contact you separately; automated email notifications are not configured.</p><div className="confirmation-summary"><span>Home</span><strong>{bookingListing.title}</strong><span>Monthly rent request</span><strong>{money(offer)}</strong></div><button className="primary-btn" onClick={() => { setBookingListing(null); setSubmitted(false) }}>Continue exploring</button></div> : <form className="booking-form" onSubmit={submitBooking}><div className="form-grid"><input type="hidden" name="listingId" value={bookingListing.id}/><label>Full name<input name="name" autoComplete="name" required maxLength="120" placeholder="Your name"/></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength="254" placeholder="you@example.com"/></label><label>Phone number <span className="optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength="40" placeholder="(555) 555-0123"/></label><label>What would you like to do?<select name="requestType" defaultValue="Tour request"><option>Tour request</option><option>Rental application inquiry</option><option>Ask a question</option></select></label><label>Preferred tour date <span className="optional">(optional)</span><input name="date" type="date" min={new Date().toISOString().slice(0, 10)}/></label><label>Proposed monthly rent<input name="offer" type="number" min="500" max="10000" step="1" required value={offer} onChange={(event) => setOffer(Number(event.target.value))}/></label></div><label className="message-label">Message <span className="optional">(optional)</span><textarea name="message" rows="4" maxLength="2000" placeholder="Tell us what you'd like to know or share your move-in timeline."/></label><p className="form-note">Your details will be saved for the property team. This request is not a reservation or lease and does not guarantee availability or approval.</p>{submitError && <p className="form-error" role="alert">{submitError}</p>}<button className="primary-btn" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send request'}</button></form>}</section>}
      </main>
      <footer className="site-footer"><div className="container footer-inner"><Brand /><div className="footer-links"><a href="#featured">Explore homes</a><a href="#how-it-works">How it works</a><a href="#prices">Price guide</a></div><p>© 2026 OpenDoor Living · Sample listings for demonstration</p></div></footer>
    </div>
  )
}

export default App
