import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
const statuses = ['new', 'contacted', 'tour_scheduled', 'approved', 'rejected', 'closed']
const label = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
const emptyListing = () => ({ title: '', location: '', fullLocation: '', price: '', type: 'Apartment', beds: '1', baths: '1', sqft: '', image: '', images: '', badge: 'Available now', features: '', description: '', available: 'Contact for availability', isActive: true })

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inquiries, setInquiries] = useState([])
  const [listings, setListings] = useState([])
  const [tab, setTab] = useState('properties')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyListing())
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabase) return undefined
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  const request = async (path, options = {}) => {
    const response = await fetch(path, { ...options, headers: { Authorization: `Bearer ${session.access_token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Request failed.')
    return payload
  }

  const loadProperties = async () => {
    if (!session?.access_token) return
    setLoading(true); setError('')
    try { const payload = await request('/api/owner/listings'); setListings(payload.listings) } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }

  const loadInquiries = async () => {
    if (!session?.access_token) return
    setLoading(true); setError('')
    try { const payload = await request('/api/admin/inquiries'); setInquiries(payload.inquiries) } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }

  useEffect(() => { if (session) loadProperties() }, [session?.access_token])

  const signIn = async (event) => {
    event.preventDefault(); setError(''); setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError(authError.message)
    setLoading(false)
  }

  const saveListing = async (event) => {
    event.preventDefault(); setBusyId(editing?.id || 'new'); setError(''); setNotice('')
    const body = { ...form, price: Number(form.price), beds: Number(form.beds), baths: Number(form.baths), sqft: Number(form.sqft || 0), images: form.images.split('\n').map((item) => item.trim()).filter(Boolean), features: form.features.split(',').map((item) => item.trim()).filter(Boolean) }
    try {
      const payload = await request(editing ? `/api/owner/listings/${editing.id}` : '/api/owner/listings', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) })
      if (editing) setListings((items) => items.map((item) => item.id === payload.listing.id ? payload.listing : item))
      else setListings((items) => [payload.listing, ...items])
      setEditing(null); setForm(emptyListing()); setNotice(editing ? 'Property updated.' : 'Property created.')
    } catch (saveError) { setError(saveError.message) } finally { setBusyId('') }
  }

  const editListing = (listing) => {
    setEditing(listing)
    setForm({ title: listing.title, location: listing.location, fullLocation: listing.fullLocation, price: String(listing.price), type: listing.type, beds: String(listing.beds), baths: String(listing.baths), sqft: String(listing.sqft), image: listing.image, images: (listing.images || []).join('\n'), badge: listing.badge || '', features: (listing.features || []).join(', '), description: listing.description || '', available: listing.available || '', isActive: listing.isActive })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const archiveListing = async (listing) => {
    if (!window.confirm(`Archive “${listing.title}”? It will no longer appear in public search.`)) return
    setBusyId(String(listing.id)); setError(''); setNotice('')
    try { await request(`/api/owner/listings/${listing.id}`, { method: 'DELETE' }); setListings((items) => items.map((item) => item.id === listing.id ? { ...item, isActive: false } : item)); setNotice('Property archived.') } catch (archiveError) { setError(archiveError.message) } finally { setBusyId('') }
  }

  const updateStatus = async (id, status) => {
    setBusyId(id); setError(''); setNotice('')
    try { const payload = await request(`/api/admin/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); setInquiries((items) => items.map((item) => item.id === id ? { ...item, status: payload.inquiry.status } : item)); setNotice('Inquiry status updated.') } catch (updateError) { setError(updateError.message) } finally { setBusyId('') }
  }

  if (!supabase) return <main className="admin-page"><section className="admin-login"><a className="brand-wrap brand-link" href="/"><span className="brand-mark">OD</span><span><span className="brand-name">OpenDoor</span><span className="brand-sub">Living</span></span></a><h1>Staff portal setup required</h1><p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the frontend.</p></section></main>

  if (!session) return <main className="admin-page"><form className="admin-login" onSubmit={signIn}><a className="brand-wrap brand-link" href="/"><span className="brand-mark">OD</span><span><span className="brand-name">OpenDoor</span><span className="brand-sub">Living</span></span></a><span className="eyebrow">Owner & property team</span><h1>Staff sign in</h1><p>Sign in with an authorized Supabase account. Owners manage their properties; admins can manage all properties and inquiries.</p><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="primary-btn full-width" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button><a className="admin-home-link" href="/">← Back to homes</a></form></main>

  const role = session.user.app_metadata?.role || 'staff'
  const canViewInquiries = role === 'admin'
  const visibleInquiries = filter === 'all' ? inquiries : inquiries.filter((item) => item.status === filter)
  const newCount = inquiries.filter((item) => item.status === 'new').length

  return <main className="admin-page"><header className="admin-header"><a className="brand-wrap brand-link" href="/"><span className="brand-mark">OD</span><span><span className="brand-name">OpenDoor</span><span className="brand-sub">Owner portal</span></span></a><div className="admin-user"><span>{session.user.email} · {label(role)}</span><button className="secondary-btn" onClick={() => supabase.auth.signOut()}>Sign out</button></div></header><section className="admin-content"><div className="admin-title-row"><div><span className="eyebrow">Property management</span><h1>{canViewInquiries ? 'Owner & admin dashboard' : 'Your properties'}</h1><p>Manage listings and keep availability information up to date.</p></div><button className="secondary-btn" onClick={tab === 'properties' ? loadProperties : loadInquiries} disabled={loading}>{loading ? 'Refreshing…' : '↻ Refresh'}</button></div><nav className="admin-tabs" aria-label="Dashboard sections"><button className={tab === 'properties' ? 'active' : ''} onClick={() => { setTab('properties'); setError(''); loadProperties() }}>Properties ({listings.length})</button>{canViewInquiries && <button className={tab === 'inquiries' ? 'active' : ''} onClick={() => { setTab('inquiries'); setError(''); loadInquiries() }}>Inquiries ({inquiries.length})</button>}</nav>{error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    {tab === 'properties' ? <><div className="admin-stats"><article><span>Total properties</span><strong>{listings.length}</strong></article><article><span>Published</span><strong>{listings.filter((item) => item.isActive).length}</strong></article><article><span>Archived</span><strong>{listings.filter((item) => !item.isActive).length}</strong></article></div><section className="property-editor"><div className="editor-heading"><div><span className="eyebrow">{editing ? 'Edit listing' : 'Add to your portfolio'}</span><h2>{editing ? `Update ${editing.title}` : 'Create a property listing'}</h2><p>Fields with * are required. Archived homes are hidden from public search.</p></div>{editing && <button className="secondary-btn" type="button" onClick={() => { setEditing(null); setForm(emptyListing()) }}>Cancel edit</button>}</div><form className="property-form" onSubmit={saveListing}><div className="form-grid"><label>Listing title *<input required maxLength="140" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Property type *<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['Studio','Apartment','House','Townhome','Family home','Other'].map((type) => <option key={type}>{type}</option>)}</select></label><label>City, State *<input required maxLength="100" placeholder="Austin, TX" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label><label>Neighborhood *<input required maxLength="180" placeholder="East Austin, Austin, Texas" value={form.fullLocation} onChange={(e) => setForm({ ...form, fullLocation: e.target.value })} /></label><label>Monthly rent (USD) *<input type="number" required min="1" max="100000" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label><label>Bedrooms *<input type="number" required min="0" max="20" step="1" value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })} /></label><label>Bathrooms *<input type="number" required min="0" max="99" step="0.5" value={form.baths} onChange={(e) => setForm({ ...form, baths: e.target.value })} /></label><label>Area (sq ft)<input type="number" min="0" max="100000" step="1" value={form.sqft} onChange={(e) => setForm({ ...form, sqft: e.target.value })} /></label><label>Main image URL *<input type="url" required value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" /></label><label>Availability<input maxLength="100" value={form.available} onChange={(e) => setForm({ ...form, available: e.target.value })} placeholder="Available now" /></label><label>Listing badge<input maxLength="60" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} /></label><label>Gallery image URLs <span className="optional">(one per line)</span><textarea rows="3" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} /></label><label>Features <span className="optional">(comma-separated)</span><textarea rows="3" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Parking, laundry, balcony" /></label><label className="wide-field">Description<textarea rows="4" maxLength="3000" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label className="listing-active-toggle"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Publish listing (visible in public search)</label></div><button className="primary-btn" type="submit" disabled={Boolean(busyId)}>{busyId ? 'Saving…' : editing ? 'Save changes' : 'Create listing'}</button></form></section><h2 className="property-list-heading">Your listings</h2>{loading && !listings.length ? <div className="admin-empty">Loading properties…</div> : listings.length ? <div className="managed-properties">{listings.map((item) => <article className="managed-property" key={item.id}><img src={item.image} alt=""/><div className="managed-property-info"><span className={`status-pill ${item.isActive ? 'status-approved' : 'status-closed'}`}>{item.isActive ? 'Published' : 'Archived'}</span><h3>{item.title}</h3><p>{item.location} · {money(item.price)} / month · {item.beds === 0 ? 'Studio' : `${item.beds} bed`}</p></div><div className="managed-actions"><button className="secondary-btn" onClick={() => editListing(item)}>Edit</button>{item.isActive && <button className="archive-button" disabled={busyId === String(item.id)} onClick={() => archiveListing(item)}>{busyId === String(item.id) ? 'Archiving…' : 'Archive'}</button>}</div></article>)}</div> : <div className="admin-empty"><h2>No properties yet</h2><p>Use the form above to add your first rental listing.</p></div>}</> : <><div className="admin-stats"><article><span>Total requests</span><strong>{inquiries.length}</strong></article><article><span>New requests</span><strong>{newCount}</strong></article><article><span>Tour requests</span><strong>{inquiries.filter((item) => item.request_type === 'Tour request').length}</strong></article></div><div className="admin-toolbar"><label>Show<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All requests</option>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label><span>{visibleInquiries.length} shown</span></div>{visibleInquiries.length ? <div className="inquiry-list">{visibleInquiries.map((item) => <article className="inquiry-card" key={item.id}><div className="inquiry-head"><div><span className={`status-pill status-${item.status}`}>{label(item.status)}</span><h2>{item.name}</h2><p>{item.listings?.title || `Listing #${item.listing_id}`} · {item.listings?.location || ''}</p></div><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div><div className="inquiry-facts"><a href={`mailto:${item.email}`}>{item.email}</a>{item.phone && <a href={`tel:${item.phone}`}>{item.phone}</a>}<span>{label(item.request_type)}</span><strong>Offer: {money(item.offer)}/mo</strong>{item.preferred_date && <span>Preferred date: {item.preferred_date}</span>}</div>{item.message && <p className="inquiry-message">{item.message}</p>}<label className="status-control">Update status<select value={item.status} disabled={busyId === item.id} onChange={(e) => updateStatus(item.id, e.target.value)}>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label></article>)}</div> : <div className="admin-empty"><h2>No inquiries found</h2><p>New renter requests will appear here after submission.</p></div>}</>}
    <p className="admin-security-note">Owner access is limited to properties assigned to that account. Personal renter data is visible to admins only. Follow applicable privacy and data-retention requirements.</p></section></main>
}
