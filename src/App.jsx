const listings = [
  {
    id: 1,
    title: 'Modern Studio in Austin',
    location: 'Austin, Texas',
    price: 1050,
    type: 'Studio',
    beds: '1 Bed',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    badge: 'Available now',
    features: ['Fully furnished', 'Pet friendly', 'Near downtown'],
  },
  {
    id: 2,
    title: 'Cozy 2BR House in Phoenix',
    location: 'Phoenix, Arizona',
    price: 1350,
    type: 'House',
    beds: '2 Beds',
    image:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    badge: 'Best value',
    features: ['Private parking', 'Spacious kitchen', 'Quiet neighborhood'],
  },
  {
    id: 3,
    title: 'Garden Apartment in Charlotte',
    location: 'Charlotte, North Carolina',
    price: 1200,
    type: 'Apartment',
    beds: '1 Bed',
    image:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    badge: 'Limited offer',
    features: ['Balcony', 'Gym access', 'Safe complex'],
  },
  {
    id: 4,
    title: 'Family Home in Atlanta',
    location: 'Atlanta, Georgia',
    price: 1750,
    type: 'Family Home',
    beds: '3 Beds',
    image:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80',
    badge: 'New listing',
    features: ['Large backyard', '2 baths', 'School district'],
  },
  {
    id: 5,
    title: 'Bright Apartment in Miami',
    location: 'Miami, Florida',
    price: 1450,
    type: 'Apartment',
    beds: '2 Beds',
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
    badge: 'Hot pick',
    features: ['Ocean view', 'Pool', 'Walk to transit'],
  },
  {
    id: 6,
    title: 'Townhome in Denver',
    location: 'Denver, Colorado',
    price: 1680,
    type: 'Townhome',
    beds: '2 Beds',
    image:
      'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=80',
    badge: 'Move-in ready',
    features: ['Washer & dryer', 'Mountain views', 'Near trails'],
  },
]

const priceList = [
  { city: 'Austin, TX', studio: '$1,050', oneBed: '$1,250', twoBed: '$1,500' },
  { city: 'Phoenix, AZ', studio: '$1,100', oneBed: '$1,350', twoBed: '$1,750' },
  { city: 'Charlotte, NC', studio: '$1,050', oneBed: '$1,200', twoBed: '$1,650' },
  { city: 'Atlanta, GA', studio: '$1,150', oneBed: '$1,400', twoBed: '$1,900' },
]

const locations = [
  'Austin, TX',
  'Phoenix, AZ',
  'Charlotte, NC',
  'Atlanta, GA',
  'Miami, FL',
  'Denver, CO',
]

const features = [
  'Affordable monthly pricing',
  'Verified clean apartments',
  'Flexible booking and offers',
  'Great locations near work and schools',
]

const stats = [
  { value: '3.4k+', label: 'happy renters' },
  { value: '250+', label: 'homes available' },
  { value: '12 cities', label: 'across the US' },
  { value: '24/7', label: 'support assistance' },
]

function App() {
  const previewOffer = 1300

  return (
    <div className="page-shell">
      <header className="topbar container">
        <div className="brand-wrap">
          <div className="brand-mark">OD</div>
          <div>
            <span className="brand-name">OpenDoor</span>
            <span className="brand-sub">Living</span>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#featured">Homes</a>
          <a href="#prices">Pricing</a>
          <a href="#locations">Locations</a>
          <a href="#offers">Offers</a>
        </nav>

        <button className="nav-button">Book a tour</button>
      </header>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">Find your next home</span>
            <h1>Affordable rentals with comfort, style, and peace of mind.</h1>
            <p>
              Discover clean apartments and spacious homes in top U.S. neighborhoods.
              Browse listings, compare prices, and choose a place that fits your lifestyle.
            </p>

            <div className="cta-row">
              <button className="primary-btn">Explore homes</button>
              <button className="secondary-btn">View price list</button>
            </div>

            <div className="mini-stats">
              {stats.map((item) => (
                <div key={item.label} className="mini-stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-label="Featured home visual">
            <img
              src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80"
              alt="Modern apartment exterior"
            />
            <div className="floating-card">
              <span className="card-label">Featured</span>
              <h3>City View Apartment</h3>
              <p>From $1,250/mo</p>
            </div>
          </div>
        </section>

        <section className="filter-strip container">
          <div className="filter-item">
            <label>Location</label>
            <select defaultValue="Any city">
              <option>Any city</option>
              {locations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Rent</label>
            <select defaultValue="Any budget">
              <option>Any budget</option>
              <option>$800-$1,200</option>
              <option>$1,200-$1,600</option>
              <option>$1,600-$2,000</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Bedrooms</label>
            <select defaultValue="Any">
              <option>Any</option>
              <option>Studio</option>
              <option>1 Bed</option>
              <option>2 Beds</option>
              <option>3 Beds</option>
            </select>
          </div>

          <button className="primary-btn filter-btn">Search homes</button>
        </section>

        <section id="featured" className="container section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Available today</span>
              <h2>Beautiful apartments and homes to rent</h2>
            </div>
            <a href="#prices">See all listings</a>
          </div>

          <div className="listing-grid">
            {listings.map((listing) => (
              <article key={listing.id} className="listing-card">
                <div className="card-image-wrap">
                  <img src={listing.image} alt={listing.title} />
                  <span className="badge">{listing.badge}</span>
                </div>
                <div className="card-content">
                  <div className="card-topline">
                    <span>{listing.type}</span>
                    <strong>${listing.price.toLocaleString()}/mo</strong>
                  </div>
                  <h3>{listing.title}</h3>
                  <p className="location-row">{listing.location}</p>
                  <div className="meta-row">
                    <span>{listing.beds}</span>
                    <span>2 baths</span>
                    <span>1,200 sqft</span>
                  </div>
                  <ul>
                    {listing.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button className="card-button">Schedule a visit</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="locations" className="container section-block alt-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Top locations</span>
              <h2>Good neighborhoods, better living</h2>
            </div>
          </div>

          <div className="city-grid">
            {locations.map((city, index) => (
              <div className="city-card" key={city}>
                <div className="city-thumb" style={{ backgroundImage: `url(${[
                  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
                  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
                  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
                  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
                  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
                  'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=80',
                ][index]})` }} />
                <div className="city-card-body">
                  <h3>{city}</h3>
                  <p>Clean spaces, strong neighborhoods, and easy access to daily essentials.</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="prices" className="container section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Price guide</span>
              <h2>Flexible rent options for every lifestyle</h2>
            </div>
          </div>

          <div className="price-table-wrap">
            <table className="price-table">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Studio</th>
                  <th>1BR</th>
                  <th>2BR</th>
                </tr>
              </thead>
              <tbody>
                {priceList.map((row) => (
                  <tr key={row.city}>
                    <td>{row.city}</td>
                    <td>{row.studio}</td>
                    <td>{row.oneBed}</td>
                    <td>{row.twoBed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="offers" className="container section-block offer-panel">
          <div className="offer-copy">
            <span className="eyebrow">Easy and flexible</span>
            <h2>Choose a price plan or adjust your offer.</h2>
            <p>
              Looking for an even better deal? Submit your preferred price and we will help
              match you with available options that fit your budget.
            </p>

            <ul className="feature-list">
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="offer-card">
            <label className="offer-label">Preferred monthly rent</label>
            <div className="offer-amount">${previewOffer.toLocaleString()}</div>
            <input type="range" min="800" max="2500" step="50" defaultValue={1300} />
            <div className="range-scale">
              <span>$800</span>
              <span>$2,500</span>
            </div>
            <button className="primary-btn full-width">Request this price</button>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <div className="brand-wrap footer-brand">
              <div className="brand-mark">OD</div>
              <div>
                <span className="brand-name">OpenDoor</span>
                <span className="brand-sub">Living</span>
              </div>
            </div>
          </div>
          <div className="footer-links">
            <a href="#featured">Homes</a>
            <a href="#prices">Prices</a>
            <a href="#locations">Locations</a>
          </div>
          <p>© 2026 OpenDoor Living. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
