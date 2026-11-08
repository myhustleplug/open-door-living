import { createClient } from '@supabase/supabase-js'
import { createServer } from 'node:http'

const port = Number(process.env.PORT || 3001)
const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure server environment before starting the API.')
  process.exit(1)
}

// This privileged client is server-only. Never expose the service-role key to Vite/browser code.
const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const maxBodyBytes = 16 * 1024
const rateWindowMs = 15 * 60 * 1000
const maxRequestsPerWindow = 8
const requestCounts = new Map()

const send = (res, status, payload) => {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
  })
  res.end(body)
}

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBodyBytes) throw Object.assign(new Error('Request body is too large.'), { status: 413 })
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })
  }
}

function withinRateLimit(req, res) {
  const key = req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const current = requestCounts.get(key)
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + rateWindowMs })
    return true
  }
  if (current.count >= maxRequestsPerWindow) {
    send(res, 429, { error: 'Too many requests. Please try again later.' })
    return false
  }
  current.count += 1
  return true
}

async function requireAdmin(req) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  const metadata = data.user.app_metadata || {}
  return metadata.role === 'admin' || metadata.is_admin === true ? data.user : null
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
}

async function handle(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname
  if (!path.startsWith('/api/')) return send(res, 404, { error: 'Not found.' })
  if (req.method === 'GET' && path === '/api/health') return send(res, 200, { status: 'ok' })

  if (req.method === 'GET' && path === '/api/listings') {
    let query = supabase.from('listings').select('*').eq('is_active', true).order('id')
    const search = (url.searchParams.get('q') || '').trim()
    const location = url.searchParams.get('location')
    const maxPrice = Number(url.searchParams.get('maxPrice'))
    const bedrooms = url.searchParams.get('bedrooms')
    if (location) query = query.eq('location', location)
    if (Number.isFinite(maxPrice) && maxPrice > 0) query = query.lte('price', maxPrice)
    if (bedrooms) query = query.eq('beds', bedrooms.toLowerCase() === 'studio' ? 0 : Number(bedrooms))
    const { data, error } = await query
    if (error) throw error
    const listings = search ? data.filter((item) => `${item.title} ${item.location} ${item.full_location} ${item.type}`.toLowerCase().includes(search.toLowerCase())) : data
    return send(res, 200, { listings: listings.map(({ full_location, ...item }) => ({ ...item, fullLocation: full_location })) })
  }

  const listingMatch = path.match(/^\/api\/listings\/([1-9]\d*)$/)
  if (req.method === 'GET' && listingMatch) {
    const { data, error } = await supabase.from('listings').select('*').eq('id', Number(listingMatch[1])).eq('is_active', true).maybeSingle()
    if (error) throw error
    if (!data) return send(res, 404, { error: 'Home not found.' })
    const { full_location, ...listing } = data
    return send(res, 200, { listing: { ...listing, fullLocation: full_location } })
  }

  if (req.method === 'POST' && path === '/api/inquiries') {
    if (!withinRateLimit(req, res)) return
    if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return send(res, 415, { error: 'Content-Type must be application/json.' })
    const body = await readBody(req)
    const listingId = Number(body.listingId)
    const { data: listing, error: listingError } = await supabase.from('listings').select('id,title').eq('id', listingId).eq('is_active', true).maybeSingle()
    if (listingError) throw listingError
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const offer = Number(body.offer)
    const requestTypes = ['Tour request', 'Rental application inquiry', 'Ask a question']
    if (!listing) return send(res, 400, { error: 'Choose a valid available home.' })
    if (!validText(body.name, 120)) return send(res, 400, { error: 'Enter your name (up to 120 characters).' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return send(res, 400, { error: 'Enter a valid email address.' })
    if (body.phone != null && (typeof body.phone !== 'string' || body.phone.length > 40)) return send(res, 400, { error: 'Phone number must be 40 characters or fewer.' })
    if (!requestTypes.includes(body.requestType)) return send(res, 400, { error: 'Choose a valid request type.' })
    if (!Number.isInteger(offer) || offer < 500 || offer > 10000) return send(res, 400, { error: 'Proposed rent must be between $500 and $10,000.' })
    if (body.message != null && (typeof body.message !== 'string' || body.message.length > 2000)) return send(res, 400, { error: 'Message must be 2,000 characters or fewer.' })
    if (body.preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.preferredDate)) return send(res, 400, { error: 'Preferred date must use YYYY-MM-DD format.' })
    const { data, error } = await supabase.from('inquiries').insert({
      listing_id: listing.id,
      name: body.name.trim(),
      email,
      phone: body.phone?.trim() || null,
      request_type: body.requestType,
      preferred_date: body.preferredDate || null,
      offer,
      message: body.message?.trim() || null,
    }).select('id,created_at,status').single()
    if (error) throw error
    return send(res, 201, { message: 'Your request has been received.', inquiry: data })
  }

  if (path === '/api/admin/inquiries' && req.method === 'GET') {
    const admin = await requireAdmin(req)
    if (!admin) return send(res, 401, { error: 'Admin sign-in required.' })
    const { data, error } = await supabase.from('inquiries').select('id,created_at,listing_id,name,email,phone,request_type,preferred_date,offer,message,status,listings(title,location)').order('created_at', { ascending: false }).limit(500)
    if (error) throw error
    return send(res, 200, { inquiries: data })
  }

  const inquiryMatch = path.match(/^\/api\/admin\/inquiries\/([0-9a-f-]{36})$/i)
  if (inquiryMatch && req.method === 'PATCH') {
    const admin = await requireAdmin(req)
    if (!admin) return send(res, 401, { error: 'Admin sign-in required.' })
    const body = await readBody(req)
    const allowed = ['new', 'contacted', 'tour_scheduled', 'approved', 'rejected', 'closed']
    if (!allowed.includes(body.status)) return send(res, 400, { error: 'Choose a valid inquiry status.' })
    const { data, error } = await supabase.from('inquiries').update({ status: body.status }).eq('id', inquiryMatch[1]).select('id,status').maybeSingle()
    if (error) throw error
    if (!data) return send(res, 404, { error: 'Inquiry not found.' })
    return send(res, 200, { inquiry: data })
  }

  return send(res, 404, { error: 'Not found.' })
}

const server = createServer(async (req, res) => {
  try { await handle(req, res) } catch (error) {
    console.error('API request failed:', error.message)
    send(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' })
  }
})
server.listen(port, '0.0.0.0', () => console.log(`OpenDoor API listening on http://localhost:${port}`))
