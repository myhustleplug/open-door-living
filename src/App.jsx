import { useMemo, useState } from 'react'

const listings = [
  {
    id: 1,
    title: 'Modern Studio in Austin',
    location: 'Austin, TX',
    fullLocation: 'East Austin, Austin, Texas',
    price: 1050,
    type: 'Studio',
    beds: 0,
    baths: 1,
    sqft: 540,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80'],
    badge: 'Available now',
    features: ['Furnished', 'Pet friendly', 'Near downtown', 'In-unit laundry'],
    description: 'A bright, thoughtfully designed studio with an open layout, modern finishes, and easy access to East Austin cafes, parks, and transit.',
    available: 'Available now',
  },
  {
    id: 2,
    title: 'Cozy 2BR House in Phoenix',
    location: 'Phoenix, AZ',
    fullLocation: 'North Mountain, Phoenix, Arizona',
    price: 1350,
    type: 'House',
    beds: 2,
    baths: 2,
    sqft: 1180,
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80'],
    badge: 'Best value',
    features: ['Private parking', 'Spacious kitchen', 'Quiet neighborhood', 'Patio'],
    description: 'Settle into a comfortable home with a roomy kitchen, private outdoor space, and convenient access to neighborhood shops and mountain trails.',
    available: 'Available Dec 1',
  },
  {
    id: 3,
    title: 'Garden Apartment in Charlotte',
    location: 'Charlotte, NC',
    fullLocation: 'Dilworth, Charlotte, North Carolina',
    price: 1200,
    type: 'Apartment',
    beds: 1,
    baths: 1,
    sqft: 760,
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80'],
    badge: 'Limited offer',
    features: ['Private balcony', 'Fitness room', 'Secure entry', 'Near light rail'],
    description: 'Enjoy a calm garden-facing apartment in a walkable neighborhood, with a private balcony and the comforts of a well-maintained community.',
    available: 'Available now',
  },
  {
    id: 4,
    title: 'Family Home in Atlanta',
    location: 'Atlanta, GA',
    fullLocation: 'East Atlanta, Atlanta, Georgia',
    price: 1750,
    type: 'Family home',
    beds: 3,
    baths: 2,
    sqft: 1560,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80'],
    badge: 'New listing',
    features: ['Large backyard', 'Two bathrooms', 'Off-street parking', 'Near parks'],
    description: 'A welcoming family home with generous living areas and a fenced backyard, close to local parks, groceries, and neighborhood dining.',
    available: 'Available Jan 1',
  },
  {
    id: 5,
    title: 'Bright Apartment in Miami',
    location: 'Miami, FL',
    fullLocation: 'Little Havana, Miami, Florida',
    price: 1450,
    type: 'Apartment',
    beds: 2,
    baths: 1,
    sqft: 920,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80'],
    badge: 'Popular',
    features: ['Pool access', 'Bright open plan', 'Walk to transit', 'On-site laundry'],
    description: 'A sunlit apartment with a practical open layout and community pool, placed close to transit, everyday essentials, and Miami neighborhood favorites.',
    available: 'Available now',
  },
  {
    id: 6,
    title: 'Townhome in Denver',
    location: 'Denver, CO',
    fullLocation: 'Sloan Lake, Denver, Colorado',
    price: 1680,
    type: 'Townhome',
    beds: 2,
    baths: 2,
    sqft: 1240,
    image: 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=85',
    images: ['https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=85', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80'],
    badge: 'Move-in ready',
    features: ['Washer & dryer', 'Private entrance', 'Near trails', 'Attached garage'],
    description: 'Make yourself at home in this welcoming townhome near Sloan Lake, with a private entrance, practical storage, and room to unwind after exploring the city.',
    available: 'Available now',
  },
]

const locations = [...new Set(listings.map((listing) => listing.location))]
const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

function Brand() {
  return <a className="brand-wrap brand-link" href="#home" aria-label="OpenDoor Living home"><span className="brand-mark">OD</span><span><span className="brand-name">OpenDoor</span><span className="brand-sub">Living</span></span></a>
}

function App() {
  const [filters, setFilters] = useState({ location: 'Any city', budget: 'Any budget', beds: 'Any' })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [selectedListing, setSelectedListing] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [bookingListing, setBookingListing] = useState(null)
  const [offer, setOffer] = useState(1300)
  const [submitted, setSubmitted] = useState(false)

  const filteredListings = useMemo(() => listings.filter((listing) => {
    const matchesLocation = appliedFilters.location === 'Any city' || listing.location === appliedFilters.location
    const matchesBeds = appliedFilters.beds === 'Any' || (appliedFilters.beds === 'Studio' ? listing.beds === 0 : listing.beds === Number(appliedFilters.beds))
    const [min, max] = appliedFilters.budget === 'Any budget' ? [0, Infinity] : appliedFilters.budget.split('-').map((value) => Number(value.replace(/[$,]/g, '')))
    return matchesLocation && matchesBeds && listing.price >= min && listing.price <= max
  }), [appliedFilters])

  const openBooking = (listing) => {
    setBookingListing(listing)
    setOffer(listing.price)
    setSubmitted(false)
    window.setTimeout(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const toggleFavorite = (id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])

  const submitBooking = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  const showListings = () => {
    setSelectedListing(null)
    setBookingListing(null)
    window.setTimeout(() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  return (
    <div className="page-shell">
      <header className="topbar container">
        <Brand />
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#featured">Explore homes</a><a href="#how-it-works">How it works</a><a href="#prices">Price guide</a>
        </nav>
        <button className="nav-button" onClick={() => openBooking(listings[0])}>Book a tour</button>
      </header>

      <main>
        {selectedListing ? (
          <section className="container detail-page">
            <button className="back-link" onClick={() => setSelectedListing(null)}>← Back to homes</button>
            <div className="detail-heading"><div><span className="eyebrow">{selectedListing.badge}</span><h1>{selectedListing.title}</h1><p className="location-row">⌖ {selectedListing.fullLocation}</p></div><strong className="detail-price">{money(selectedListing.price)}<small> / month</small></strong></div>
            <div className="detail-gallery">{selectedListing.images.map((image, index) => <img key={image} className={index === 0 ? 'gallery-main' : ''} src={image} alt={`${selectedListing.title} interior ${index + 1}`} />)}</div>
            <div className="detail-layout"><div className="detail-main"><div className="detail-facts"><span>🛏 {selectedListing.beds === 0 ? 'Studio' : `${selectedListing.beds} bedrooms`}</span><span>♧ {selectedListing.baths} bathroom{selectedListing.baths > 1 ? 's' : ''}</span><span>⌂ {selectedListing.sqft.toLocaleString()} sq ft</span><span>✓ {selectedListing.available}</span></div><h2>About this home</h2><p>{selectedListing.description}</p><h2>Home highlights</h2><div className="amenity-grid">{selectedListing.features.map((feature) => <span key={feature}>✓ &nbsp;{feature}</span>)}</div><div className="neighborhood-note"><h2>About the neighborhood</h2><p>Enjoy the convenience of nearby groceries, local cafes, parks, and public transit. Exact address and tour details are shared by the property team.</p></div></div><aside className="detail-booking"><span className="eyebrow">Make it yours</span><h2>{money(selectedListing.price)} <small>/ month</small></h2><p>Ask a question, propose a price, or request a tour. Requests are not reservations.</p><button className="primary-btn full-width" onClick={() => openBooking(selectedListing)}>Request a tour or apply</button><button className="secondary-btn full-width favorite-detail" onClick={() => toggleFavorite(selectedListing.id)}>{favorites.includes(selectedListing.id) ? '♥ Saved to favorites' : '♡ Save this home'}</button><small>Sample listing for demonstration. Availability and terms must be confirmed.</small></aside></div>
          </section>
        ) : (
          <>
            <section id="home" className="hero container">
              <div className="hero-copy"><span className="eyebrow">A better way to rent</span><h1>Find a place that feels like <em>home.</em></h1><p>Explore welcoming rentals, clear monthly prices, and a simple way to request a tour or make an offer.</p><div className="cta-row"><a className="primary-btn button-link" href="#featured">Explore available homes</a><a className="secondary-btn button-link" href="#how-it-works">How it works</a></div><div className="hero-trust"><span>✓ Clear monthly pricing</span><span>✓ Flexible requests</span><span>✓ No-pressure browsing</span></div></div>
              <div className="hero-visual"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85" alt="Warm, bright modern apartment living room"/><div className="floating-card"><span className="card-label">A place to settle in</span><h3>Room for your next chapter</h3><p>Explore homes from {money(1050)} / month</p></div></div>
            </section>

            <section className="filter-strip container" aria-label="Search rental homes">
              <div className="filter-item"><label htmlFor="location-filter">Location</label><select id="location-filter" value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })}><option>Any city</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></div>
              <div className="filter-item"><label htmlFor="budget-filter">Monthly budget</label><select id="budget-filter" value={filters.budget} onChange={(event) => setFilters({ ...filters, budget: event.target.value })}><option>Any budget</option><option>$800-$1,200</option><option>$1,200-$1,600</option><option>$1,600-$2,000</option><option>$2,000-$3,000</option></select></div>
              <div className="filter-item"><label htmlFor="beds-filter">Bedrooms</label><select id="beds-filter" value={filters.beds} onChange={(event) => setFilters({ ...filters, beds: event.target.value })}><option>Any</option><option>Studio</option><option value="1">1 bedroom</option><option value="2">2 bedrooms</option><option value="3">3 bedrooms</option></select></div>
              <button className="primary-btn filter-btn" onClick={() => { setAppliedFilters(filters); document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }) }}>Search homes</button>
            </section>

            <section id="featured" className="container section-block">
              <div className="section-heading"><div><span className="eyebrow">Find your fit</span><h2>Homes worth coming home to</h2><p className="section-intro">Browse our sample collection and open a listing to explore the details.</p></div><span className="results-count">{filteredListings.length} homes to explore</span></div>
              {filteredListings.length ? <div className="listing-grid">{filteredListings.map((listing) => <article key={listing.id} className="listing-card"><div className="card-image-wrap"><button className={`save-button ${favorites.includes(listing.id) ? 'is-saved' : ''}`} aria-label={favorites.includes(listing.id) ? 'Remove from saved homes' : 'Save home'} onClick={() => toggleFavorite(listing.id)}>{favorites.includes(listing.id) ? '♥' : '♡'}</button><button className="image-open" onClick={() => setSelectedListing(listing)} aria-label={`View ${listing.title}`}><img src={listing.image} alt={listing.title}/></button><span className="badge">{listing.badge}</span></div><div className="card-content"><div className="card-topline"><span>{listing.type}</span><strong>{money(listing.price)}<small>/mo</small></strong></div><button className="listing-title-button" onClick={() => setSelectedListing(listing)}><h3>{listing.title}</h3></button><p className="location-row">⌖ {listing.location}</p><div className="meta-row"><span>{listing.beds === 0 ? 'Studio' : `${listing.beds} bed${listing.beds > 1 ? 's' : ''}`}</span><span>{listing.baths} bath</span><span>{listing.sqft.toLocaleString()} sq ft</span></div><div className="card-feature">{listing.features.slice(0, 2).join(' · ')}</div><button className="card-button" onClick={() => setSelectedListing(listing)}>View home details <span>→</span></button></div></article>)}</div> : <div className="empty-results"><h3>No homes match those filters yet</h3><p>Try a different city, bedroom count, or monthly budget.</p><button className="secondary-btn" onClick={() => { const reset = { location: 'Any city', budget: 'Any budget', beds: 'Any' }; setFilters(reset); setAppliedFilters(reset) }}>Clear filters</button></div>}
            </section>

            <section id="how-it-works" className="container section-block how-panel"><div className="section-heading"><div><span className="eyebrow">Simple from start to finish</span><h2>Your next home, in three steps</h2></div></div><div className="steps-grid"><article><span>01</span><h3>Find your fit</h3><p>Filter by city, budget, and bedrooms to narrow down homes that suit your needs.</p></article><article><span>02</span><h3>Explore the details</h3><p>Review the sample rent, home features, and neighborhood information before you reach out.</p></article><article><span>03</span><h3>Send a request</h3><p>Ask for a tour or submit an offer request. The property team can confirm availability and terms.</p></article></div></section>

            <section id="prices" className="container section-block"><div className="section-heading"><div><span className="eyebrow">Clear price guide</span><h2>Sample monthly rent by city</h2><p className="section-intro">Illustrative starting rents only. Actual pricing depends on the specific property.</p></div></div><div className="price-cards">{locations.map((location) => { const lowest = Math.min(...listings.filter((item) => item.location === location).map((item) => item.price)); return <article key={location}><span>⌖ {location}</span><strong>From {money(lowest)}<small> / month</small></strong><button onClick={() => { const next = { ...filters, location }; setFilters(next); setAppliedFilters(next); showListings() }}>Explore homes →</button></article> })}</div></section>

            <section className="container section-block offer-panel"><div className="offer-copy"><span className="eyebrow">Flexible rent requests</span><h2>Your budget matters.</h2><p>Found a home you love? Choose a listing and send a proposed monthly rent. Offers are requests only and are subject to the property team's approval.</p><ul className="feature-list"><li>Choose an available home first</li><li>Set a rent proposal that works for you</li><li>Request a tour or ask a question in the same form</li></ul></div><div className="offer-card"><span className="offer-label">Explore a sample monthly offer</span><div className="offer-amount">{money(offer)}</div><input aria-label="Sample offer amount" type="range" min="800" max="2500" step="50" value={offer} onChange={(event) => setOffer(Number(event.target.value))}/><div className="range-scale"><span>$800</span><span>$2,500</span></div><button className="primary-btn full-width" onClick={() => openBooking(listings[0])}>Choose a home and make a request</button><p className="offer-disclaimer">The slider is a preview. Final offers are submitted for a specific listing.</p></div></section>
          </>
        )}

        {bookingListing && <section id="booking" className="container booking-section"><div className="booking-heading"><div><span className="eyebrow">A simple next step</span><h2>{submitted ? 'Your request is ready' : 'Request a tour or apply'}</h2><p>For <strong>{bookingListing.title}</strong> · {money(bookingListing.price)} / month</p></div><button className="close-button" onClick={() => { setBookingListing(null); setSubmitted(false) }} aria-label="Close request form">×</button></div>{submitted ? <div className="confirmation-panel" role="status"><span className="confirmation-icon">✓</span><h3>Thanks for reaching out!</h3><p>Your demo request has been recorded on this page. No message was sent to a landlord. Connect a backend or email service to receive real inquiries.</p><div className="confirmation-summary"><span>Home</span><strong>{bookingListing.title}</strong><span>Monthly rent request</span><strong>{money(offer)}</strong></div><button className="primary-btn" onClick={() => { setBookingListing(null); setSubmitted(false) }}>Continue exploring</button></div> : <form className="booking-form" onSubmit={submitBooking}><div className="form-grid"><label>Full name<input name="name" autoComplete="name" required placeholder="Your name"/></label><label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label><label>Phone number <span className="optional">(optional)</span><input name="phone" type="tel" autoComplete="tel" placeholder="(555) 555-0123"/></label><label>What would you like to do?<select name="requestType" defaultValue="Tour request"><option>Tour request</option><option>Rental application inquiry</option><option>Ask a question</option></select></label><label>Preferred tour date <span className="optional">(optional)</span><input name="date" type="date" min={new Date().toISOString().slice(0, 10)}/></label><label>Proposed monthly rent<input name="offer" type="number" min="500" max="10000" step="25" required value={offer} onChange={(event) => setOffer(Number(event.target.value))}/></label></div><label className="message-label">Message <span className="optional">(optional)</span><textarea name="message" rows="4" placeholder="Tell us what you'd like to know or share your move-in timeline."/></label><p className="form-note">Submitting this demo form does not reserve a home or send your information anywhere. Offers and availability must be confirmed by the property manager.</p><button className="primary-btn" type="submit">Send request</button></form>}</section>}
      </main>

      <footer className="site-footer"><div className="container footer-inner"><Brand /><div className="footer-links"><a href="#featured">Explore homes</a><a href="#how-it-works">How it works</a><a href="#prices">Price guide</a></div><p>© 2026 OpenDoor Living · Sample listings for demonstration</p></div></footer>
    </div>
  )
}

export default App
