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
  opts: crypto.ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, opts, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(derivedKey as Buffer)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 10) throw new Error('Password too short')
  if (password.length > 200) throw new Error('Password too long')

  const salt = crypto.randomBytes(SALT_LEN)
  const derived = await scryptPromise(password, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${b64url(salt)}$${b64url(
    derived
  )}`
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  try {
    const parts = stored.split('$')
    if (parts.length !== 6) return false
    const [kind, nStr, rStr, pStr, saltStr, hashStr] = parts
    if (kind !== 'scrypt') return false

    const N = Number(nStr)
    const r = Number(rStr)
    const p = Number(pStr)
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p))
      return false

    const salt = fromB64url(saltStr)
    const expected = fromB64url(hashStr)

    const derived = await scryptPromise(password, salt, expected.length, {
      N,
      r,
      p,
    })

    return crypto.timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}
