import { randomUUID, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, 'data')
const listingsPath = join(dataDir, 'listings.json')
const inquiriesPath = join(dataDir, 'inquiries.json')
const port = Number(process.env.PORT || 3001)
const maxBodyBytes = 16 * 1024
const rateWindowMs = 15 * 60 * 1000
const maxRequestsPerWindow = 8
const requestCounts = new Map()
let writeQueue = Promise.resolve()

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

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

async function persistInquiry(inquiry) {
  writeQueue = writeQueue.then(async () => {
    let records = []
    try {
      records = await readJson(inquiriesPath)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    records.push(inquiry)
    const tempPath = `${inquiriesPath}.${randomUUID()}.tmp`
    await writeFile(tempPath, `${JSON.stringify(records, null, 2)}\n`, { mode: 0o600 })
    await rename(tempPath, inquiriesPath)
  })
  return writeQueue
}

function isValidText(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
}

function withinRateLimit(req, res) {
  const address = req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const current = requestCounts.get(address)
  if (!current || current.resetAt <= now) {
    requestCounts.set(address, { count: 1, resetAt: now + rateWindowMs })
    return true
  }
  if (current.count >= maxRequestsPerWindow) {
    send(res, 429, { error: 'Too many requests. Please try again later.' })
    return false
  }
  current.count += 1
  return true
}

async function readRequestBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBodyBytes) {
      const error = new Error('Request body is too large.')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    const error = new Error('Request body must be valid JSON.')
    error.status = 400
    throw error
  }
}

function authorized(req) {
  const expected = process.env.ADMIN_API_TOKEN
  if (!expected) return false
  const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, '') || ''
  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(supplied)
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer)
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const path = url.pathname
    if (!path.startsWith('/api/')) return send(res, 404, { error: 'Not found.' })

    if (req.method === 'GET' && path === '/api/health') {
      return send(res, 200, { status: 'ok' })
    }

    if (req.method === 'GET' && path === '/api/listings') {
      const listings = await readJson(listingsPath)
      const search = (url.searchParams.get('q') || '').toLowerCase().trim()
      const location = url.searchParams.get('location')
      const maxPrice = Number(url.searchParams.get('maxPrice')) || Infinity
      const bedrooms = url.searchParams.get('bedrooms')
      const filtered = listings.filter((listing) => {
        const matchesSearch = !search || `${listing.title} ${listing.location} ${listing.fullLocation} ${listing.type}`.toLowerCase().includes(search)
        const matchesLocation = !location || listing.location === location
        const matchesPrice = listing.price <= maxPrice
        const matchesBedrooms = !bedrooms || (bedrooms === 'studio' ? listing.beds === 0 : listing.beds === Number(bedrooms))
        return matchesSearch && matchesLocation && matchesPrice && matchesBedrooms
      })
      return send(res, 200, { listings: filtered })
    }

    const listingMatch = path.match(/^\/api\/listings\/([1-9]\d*)$/)
    if (req.method === 'GET' && listingMatch) {
      const listings = await readJson(listingsPath)
      const listing = listings.find((item) => item.id === Number(listingMatch[1]))
      return listing ? send(res, 200, { listing }) : send(res, 404, { error: 'Home not found.' })
    }

    if (req.method === 'POST' && path === '/api/inquiries') {
      if (!withinRateLimit(req, res)) return
      if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
        return send(res, 415, { error: 'Content-Type must be application/json.' })
      }
      const body = await readRequestBody(req)
      const listings = await readJson(listingsPath)
      const listing = listings.find((item) => item.id === Number(body.listingId))
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
      const offer = Number(body.offer)
      const requestTypes = ['Tour request', 'Rental application inquiry', 'Ask a question']
      if (!listing) return send(res, 400, { error: 'Choose a valid home.' })
      if (!isValidText(body.name, 120)) return send(res, 400, { error: 'Enter your name (up to 120 characters).' })
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return send(res, 400, { error: 'Enter a valid email address.' })
      if (body.phone != null && (typeof body.phone !== 'string' || body.phone.length > 40)) return send(res, 400, { error: 'Phone number must be 40 characters or fewer.' })
      if (!requestTypes.includes(body.requestType)) return send(res, 400, { error: 'Choose a valid request type.' })
      if (!Number.isInteger(offer) || offer < 500 || offer > 10000) return send(res, 400, { error: 'Proposed rent must be between $500 and $10,000.' })
      if (body.message != null && (typeof body.message !== 'string' || body.message.length > 2000)) return send(res, 400, { error: 'Message must be 2,000 characters or fewer.' })
      if (body.preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.preferredDate)) return send(res, 400, { error: 'Preferred date must use YYYY-MM-DD format.' })

      const inquiry = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        listingId: listing.id,
        listingTitle: listing.title,
        name: body.name.trim(),
        email,
        phone: body.phone?.trim() || '',
        requestType: body.requestType,
        preferredDate: body.preferredDate || '',
        offer,
        message: body.message?.trim() || '',
        status: 'new',
      }
      await persistInquiry(inquiry)
      return send(res, 201, { message: 'Your request has been received.', inquiry: { id: inquiry.id, createdAt: inquiry.createdAt, status: inquiry.status } })
    }

    if (req.method === 'GET' && path === '/api/inquiries') {
      if (!authorized(req)) return send(res, 401, { error: 'Admin authorization required.' })
      let inquiries = []
      try {
        inquiries = await readJson(inquiriesPath)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
      return send(res, 200, { inquiries })
    }

    return send(res, 404, { error: 'Not found.' })
  } catch (error) {
    console.error('API request failed:', error.message)
    return send(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' })
  }
})

await mkdir(dataDir, { recursive: true })
server.listen(port, '0.0.0.0', () => {
  console.log(`OpenDoor API listening on http://localhost:${port}`)
})
