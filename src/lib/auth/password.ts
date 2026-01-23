// src/lib/auth/password.ts
import crypto from 'crypto'

/**
 * Hash format:
 * scrypt$N$r$p$saltBase64Url$hashBase64Url
 */

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1

const KEYLEN = 64
const SALT_LEN = 16

function b64url(buf: Buffer) {
  return buf.toString('base64url')
}

function fromB64url(s: string) {
  return Buffer.from(s, 'base64url')
}

function scryptPromise(
  password: string,
  salt: Buffer,
  keylen: number,
  opts: crypto.ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, opts, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey as Buffer)
    })
  })
}

// Keep it sane to reduce abuse / huge payloads
export function isSafePasswordLength(password: string) {
  return password.length >= 8 && password.length <= 200
}

// Optional: basic strength check (tune to your taste)
export function isStrongPassword(password: string) {
  if (!isSafePasswordLength(password)) return false
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNum = /\d/.test(password)
  const hasSym = /[^a-zA-Z0-9]/.test(password)
  return hasLower && hasUpper && hasNum && hasSym
}

export async function hashPassword(password: string): Promise<string> {
  if (!isSafePasswordLength(password))
    throw new Error('Invalid password length')
  // If you want to enforce strength globally, uncomment:
  // if (!isStrongPassword(password)) throw new Error('Weak password')

  const salt = crypto.randomBytes(SALT_LEN)
  const derived = await scryptPromise(password, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${b64url(salt)}$${b64url(
    derived,
  )}`
}

type ParsedScrypt = {
  N: number
  r: number
  p: number
  salt: Buffer
  expected: Buffer
}

function parseStoredScrypt(stored: string): ParsedScrypt | null {
  const parts = stored.split('$')
  if (parts.length !== 6) return null

  const [kind, nStr, rStr, pStr, saltStr, hashStr] = parts
  if (kind !== 'scrypt') return null

  const N = Number(nStr)
  const r = Number(rStr)
  const p = Number(pStr)

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p))
    return null
  if (N <= 0 || r <= 0 || p <= 0) return null

  let salt: Buffer
  let expected: Buffer
  try {
    salt = fromB64url(saltStr)
    expected = fromB64url(hashStr)
  } catch {
    return null
  }

  if (salt.length < 8 || salt.length > 64) return null
  if (expected.length < 32 || expected.length > 128) return null

  return { N, r, p, salt, expected }
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (!isSafePasswordLength(password)) return false

  const parsed = parseStoredScrypt(stored)
  if (!parsed) return false

  try {
    const derived = await scryptPromise(
      password,
      parsed.salt,
      parsed.expected.length,
      {
        N: parsed.N,
        r: parsed.r,
        p: parsed.p,
      },
    )

    if (derived.length !== parsed.expected.length) return false
    return crypto.timingSafeEqual(derived, parsed.expected)
  } catch {
    return false
  }
}

// Optional: if you ever change SCRYPT params, detect old hashes
export function needsRehash(stored: string): boolean {
  const parsed = parseStoredScrypt(stored)
  if (!parsed) return true
  return parsed.N !== SCRYPT_N || parsed.r !== SCRYPT_R || parsed.p !== SCRYPT_P
}

// Optional helper: verify + tell caller if rehash is recommended
export async function verifyPasswordWithMeta(
  password: string,
  stored: string,
): Promise<{ ok: boolean; rehashNeeded: boolean }> {
  const ok = await verifyPassword(password, stored)
  return { ok, rehashNeeded: ok ? needsRehash(stored) : false }
}
