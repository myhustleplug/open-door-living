import { createClient } from '@supabase/supabase-js'
import { createServer } from 'node:http'

const port = Number(process.env.PORT || 3001)
const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure server environment before starting the API.')
  process.exit(1)
}

// Privileged client stays server-side; never expose the service-role key in Vite/browser code.
const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const maxBodyBytes = 24 * 1024
const rateWindowMs = 15 * 60 * 1000
const maxRequestsPerWindow = 8
const requestCounts = new Map()
const inquiryStatuses = ['new', 'contacted', 'tour_scheduled', 'approved', 'rejected', 'closed']
const listingFields = ['title', 'location', 'full_location', 'price', 'type', 'beds', 'baths', 'sqft', 'image', 'images', 'badge', 'features', 'description', 'available']

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
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error()
    return value
  } catch {
    throw Object.assign(new Error('Request body must be a JSON object.'), { status: 400 })
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

async function getUser(req) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  return error ? null : data.user
}

async function requireStaff(req) {
  const user = await getUser(req)
  const role = user?.app_metadata?.role
  return user && ['admin', 'owner'].includes(role) ? { user, role } : null
}

async function requireAdmin(req) {
  const user = await getUser(req)
  return user?.app_metadata?.role === 'admin' ? user : null
}

function validText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
}

function normalizeListing(body) {
  const price = Number(body.price)
  const beds = Number(body.beds)
  const baths = Number(body.baths)
  const sqft = Number(body.sqft)
  if (!validText(body.title, 140)) throw Object.assign(new Error('Title is required (up to 140 characters).'), { status: 400 })
  if (!validText(body.location, 100) || !validText(body.fullLocation, 180)) throw Object.assign(new Error('City and neighborhood are required.'), { status: 400 })
  if (!Number.isInteger(price) || price < 1 || price > 100000) throw Object.assign(new Error('Monthly rent must be between $1 and $100,000.'), { status: 400 })
  if (!validText(body.type, 50)) throw Object.assign(new Error('Property type is required.'), { status: 400 })
  if (!Number.isInteger(beds) || beds < 0 || beds > 20) throw Object.assign(new Error('Bedrooms must be between 0 and 20 (use 0 for a studio).'), { status: 400 })
  if (!Number.isFinite(baths) || baths < 0 || baths > 99) throw Object.assign(new Error('Enter a valid bathroom count.'), { status: 400 })
  if (!Number.isInteger(sqft) || sqft < 0 || sqft > 100000) throw Object.assign(new Error('Square footage must be a non-negative whole number.'), { status: 400 })
  if (!validText(body.image, 1000)) throw Object.assign(new Error('A primary image URL is required.'), { status: 400 })
  try { if (!['http:', 'https:'].includes(new URL(body.image).protocol)) throw new Error() } catch { throw Object.assign(new Error('Primary image must be a valid HTTP(S) URL.'), { status: 400 }) }
  const images = Array.isArray(body.images) ? body.images.slice(0, 12) : []
  if (images.some((item) => typeof item !== 'string' || item.length > 1000 || !/^https?:\/\//i.test(item))) throw Object.assign(new Error('Gallery images must be HTTP(S) URLs.'), { status: 400 })
  const features = Array.isArray(body.features) ? body.features : typeof body.features === 'string' ? body.features.split(',') : []
  if (features.length > 30 || features.some((item) => typeof item !== 'string' || !item.trim() || item.trim().length > 80)) throw Object.assign(new Error('Enter up to 30 features (80 characters each).'), { status: 400 })
  if (body.description != null && (typeof body.description !== 'string' || body.description.length > 3000)) throw Object.assign(new Error('Description must be 3,000 characters or fewer.'), { status: 400 })
  return {
    title: body.title.trim(), location: body.location.trim(), full_location: body.fullLocation.trim(), price,
    type: body.type.trim(), beds, baths, sqft, image: body.image.trim(), images,
    badge: typeof body.badge === 'string' && body.badge.trim() ? body.badge.trim().slice(0, 60) : 'Available',
    features: features.map((item) => item.trim()),
    description: body.description?.trim() || '',
    available: typeof body.available === 'string' && body.available.trim() ? body.available.trim().slice(0, 100) : 'Contact for availability',
  }
}

function fromDbListing(row) {
  if (!row) return row
  const { full_location, owner_id, is_active, created_at, updated_at, ...listing } = row
  return { ...listing, fullLocation: full_location, ownerId: owner_id, isActive: is_active, createdAt: created_at, updatedAt: updated_at }
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
    const matched = search ? data.filter((item) => `${item.title} ${item.location} ${item.full_location} ${item.type}`.toLowerCase().includes(search.toLowerCase())) : data
    return send(res, 200, { listings: matched.map(fromDbListing) })
  }

  const listingMatch = path.match(/^\/api\/listings\/([1-9]\d*)$/)
  if (req.method === 'GET' && listingMatch) {
    const { data, error } = await supabase.from('listings').select('*').eq('id', Number(listingMatch[1])).eq('is_active', true).maybeSingle()
    if (error) throw error
    return data ? send(res, 200, { listing: fromDbListing(data) }) : send(res, 404, { error: 'Home not found.' })
  }

  if (req.method === 'POST' && path === '/api/inquiries') {
    if (!withinRateLimit(req, res)) return
    if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return send(res, 415, { error: 'Content-Type must be application/json.' })
    const body = await readBody(req)
    const { data: listing, error: listingError } = await supabase.from('listings').select('id').eq('id', Number(body.listingId)).eq('is_active', true).maybeSingle()
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
    const { data, error } = await supabase.from('inquiries').insert({ listing_id: listing.id, name: body.name.trim(), email, phone: body.phone?.trim() || null, request_type: body.requestType, preferred_date: body.preferredDate || null, offer, message: body.message?.trim() || null }).select('id,created_at,status').single()
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
    if (!await requireAdmin(req)) return send(res, 401, { error: 'Admin sign-in required.' })
    const body = await readBody(req)
    if (!inquiryStatuses.includes(body.status)) return send(res, 400, { error: 'Choose a valid inquiry status.' })
    const { data, error } = await supabase.from('inquiries').update({ status: body.status }).eq('id', inquiryMatch[1]).select('id,status').maybeSingle()
    if (error) throw error
    return data ? send(res, 200, { inquiry: data }) : send(res, 404, { error: 'Inquiry not found.' })
  }

  if (path === '/api/owner/listings' && req.method === 'GET') {
    const staff = await requireStaff(req)
    if (!staff) return send(res, 401, { error: 'Owner or admin sign-in required.' })
    let query = supabase.from('listings').select('*').order('created_at', { ascending: false })
    if (staff.role !== 'admin') query = query.eq('owner_id', staff.user.id)
    const { data, error } = await query.limit(500)
    if (error) throw error
    return send(res, 200, { listings: data.map(fromDbListing) })
  }

  if (path === '/api/owner/listings' && req.method === 'POST') {
    const staff = await requireStaff(req)
    if (!staff) return send(res, 401, { error: 'Owner or admin sign-in required.' })
    if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return send(res, 415, { error: 'Content-Type must be application/json.' })
    const body = await readBody(req)
    const listing = normalizeListing(body)
    listing.is_active = body.isActive !== false
    if (staff.role !== 'admin') listing.owner_id = staff.user.id
    const { data, error } = await supabase.from('listings').insert(listing).select('*').single()
    if (error) throw error
    return send(res, 201, { listing: fromDbListing(data) })
  }

  const ownerListingMatch = path.match(/^\/api\/owner\/listings\/([1-9]\d*)$/)
  if (ownerListingMatch && ['PATCH', 'DELETE'].includes(req.method)) {
    const staff = await requireStaff(req)
    if (!staff) return send(res, 401, { error: 'Owner or admin sign-in required.' })
    const id = Number(ownerListingMatch[1])
    let currentQuery = supabase.from('listings').select('id,owner_id').eq('id', id)
    if (staff.role !== 'admin') currentQuery = currentQuery.eq('owner_id', staff.user.id)
    const { data: current, error: currentError } = await currentQuery.maybeSingle()
    if (currentError) throw currentError
    if (!current) return send(res, 404, { error: 'Property not found or you do not have permission to manage it.' })
    if (req.method === 'DELETE') {
      const { error } = await supabase.from('listings').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      return send(res, 200, { message: 'Property archived.' })
    }
    const body = await readBody(req)
    const listing = normalizeListing(body)
    listing.is_active = body.isActive !== false
    listing.updated_at = new Date().toISOString()
    const { data, error } = await supabase.from('listings').update(listing).eq('id', id).select('*').single()
    if (error) throw error
    return send(res, 200, { listing: fromDbListing(data) })
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
