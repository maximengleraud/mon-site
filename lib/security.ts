// Protection anti-bots : Cloudflare Turnstile + limitation de débit en mémoire + piège à robots (honeypot)
import { createHmac, timingSafeEqual } from 'crypto'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(token: string | undefined | null, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY manquant : vérification anti-bot impossible')
    return false
  }
  if (!token || typeof token !== 'string' || token.length > 2048) return false
  try {
    const form = new URLSearchParams()
    form.append('secret', secret)
    form.append('response', token)
    if (ip) form.append('remoteip', ip)
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form })
    const data = await res.json()
    return data?.success === true
  } catch (err) {
    console.error('Erreur de vérification Turnstile:', err)
    return false
  }
}

export function getClientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return headers.get('cf-connecting-ip') || headers.get('x-real-ip') || 'unknown'
}

// Ticket de connexion à usage court, émis juste après une inscription validée par Turnstile
// (un jeton Turnstile ne peut être utilisé qu'une seule fois).

function ticketSign(payload: string): string {
  return createHmac('sha256', process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').update(payload).digest('hex')
}

export function createLoginTicket(userId: string): string {
  const payload = `${userId}.${Date.now() + 2 * 60 * 1000}`
  return `${payload}.${ticketSign(payload)}`
}

export function verifyLoginTicket(ticket: string | undefined | null, userId: string): boolean {
  if (!ticket || typeof ticket !== 'string') return false
  const parts = ticket.split('.')
  if (parts.length !== 3) return false
  const [uid, exp, sig] = parts
  if (uid !== userId || Number(exp) < Date.now()) return false
  const expected = Buffer.from(ticketSign(`${uid}.${exp}`))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

/** Renvoie true si la requête est autorisée, false si la limite est dépassée. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 10000) {
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k)
    }
    return true
  }
  b.count++
  return b.count <= max
}
