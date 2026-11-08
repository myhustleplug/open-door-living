import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
const statuses = ['new', 'contacted', 'tour_scheduled', 'approved', 'rejected', 'closed']
const label = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inquiries, setInquiries] = useState([])
  const [filter, setFilter] = useState('all')
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

  const loadInquiries = async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/inquiries', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to load inquiries.')
      setInquiries(payload.inquiries)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (session) loadInquiries() }, [session?.access_token])

  const signIn = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError(authError.message)
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    setBusyId(id)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Could not update status.')
      setInquiries((items) => items.map((item) => item.id === id ? { ...item, status: payload.inquiry.status } : item))
      setNotice('Inquiry status updated.')
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setBusyId('')
    }
  }

  if (!supabase) return <main className="admin-page"><section className="admin-login"><a className="brand-wrap brand-link" href="/"><span className="brand-mark">OD</span><span><span className="brand-name">OpenDoor</span><span className="brand-sub">Living</span></span></a><h1>Admin setup required</h1><p>Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for the frontend, then restart Vite.</p></section></main>

  if (!session) return <main className="admin-page"><form className="admin-login" onSubmit={signIn}><a className="brand-wrap brand-link" href="/"><span className="brand-mark">OD</span><span><span className="brand-name">OpenDoor</span><span className="brand-sub">Living</span></span></a><span className="eyebrow">Property team</span><h1>Admin sign in</h1><p>Sign in with an authorized Supabase account to manage rental inquiries.</p><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="primary-btn full-width" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button><a className="admin-home-link" href="/">← Back to homes</a></form></main>

  const visibleInquiries = filter === 'all' ? inquiries : inquiries.filter((inquiry) => inquiry.status === filter)
  const newCount = inquiries.filter((inquiry) => inquiry.status === 'new').length

  return <main className="admin-page"><header className="admin-header"><div><a className="brand-wrap brand-link" href="/"><span className="brand-mark">OD</span><span><span className="brand-name">OpenDoor</span><span className="brand-sub">Living · Admin</span></span></a></div><div className="admin-user"><span>{session.user.email}</span><button className="secondary-btn" onClick={() => supabase.auth.signOut()}>Sign out</button></div></header><section className="admin-content"><div className="admin-title-row"><div><span className="eyebrow">Property team dashboard</span><h1>Rental inquiries</h1><p>Review tour requests and rent offers submitted by prospective renters.</p></div><button className="secondary-btn" onClick={loadInquiries} disabled={loading}>{loading ? 'Refreshing…' : '↻ Refresh'}</button></div><div className="admin-stats"><article><span>Total requests</span><strong>{inquiries.length}</strong></article><article><span>New requests</span><strong>{newCount}</strong></article><article><span>Tour requests</span><strong>{inquiries.filter((item) => item.request_type === 'Tour request').length}</strong></article></div><div className="admin-toolbar"><label>Show<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All requests</option>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label><span>{visibleInquiries.length} shown</span></div>{error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}{loading && !inquiries.length ? <div className="admin-empty">Loading inquiries…</div> : visibleInquiries.length ? <div className="inquiry-list">{visibleInquiries.map((inquiry) => <article className="inquiry-card" key={inquiry.id}><div className="inquiry-head"><div><span className={`status-pill status-${inquiry.status}`}>{label(inquiry.status)}</span><h2>{inquiry.name}</h2><p>{inquiry.listings?.title || `Listing #${inquiry.listing_id}`} · {inquiry.listings?.location || ''}</p></div><time dateTime={inquiry.created_at}>{new Date(inquiry.created_at).toLocaleString()}</time></div><div className="inquiry-facts"><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>{inquiry.phone && <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>}<span>{label(inquiry.request_type)}</span><strong>Offer: {money(inquiry.offer)}/mo</strong>{inquiry.preferred_date && <span>Preferred date: {inquiry.preferred_date}</span>}</div>{inquiry.message && <p className="inquiry-message">{inquiry.message}</p>}<label className="status-control">Update status<select value={inquiry.status} disabled={busyId === inquiry.id} onChange={(event) => updateStatus(inquiry.id, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label></article>)}</div> : <div className="admin-empty"><h2>No inquiries found</h2><p>New renter requests will appear here after they submit the booking form.</p></div>}<p className="admin-security-note">Personal renter information is visible only to authorized admins. Keep access credentials private and follow applicable privacy and data-retention requirements.</p></section></main>
}
