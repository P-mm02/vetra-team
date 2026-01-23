// src/app/(admin)/admin/cms/users/add/validator.ts
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_\.]*[a-z0-9])?$/i

export type AddUserValues = {
  username: string
  email: string
  password: string
  password2: string
}

export type FieldErrors = Partial<Record<keyof AddUserValues, string>>

export function normalizeInput(v: string) {
  return v.trim()
}

export function normalizeLower(v: string) {
  return v.trim().toLowerCase()
}

export function validateAddUser(v: AddUserValues): FieldErrors {
  const e: FieldErrors = {}

  const username = normalizeLower(v.username)
  const email = normalizeLower(v.email)
  const password = normalizeInput(v.password)
  const password2 = normalizeInput(v.password2)

  // username
  if (!username) e.username = 'Username is required.'
  else if (username.length < 3 || username.length > 30)
    e.username = 'Username must be 3–30 characters.'
  else if (!USERNAME_REGEX.test(username))
    e.username =
      'Only letters/numbers, underscore (_) or dot (.), no leading/trailing symbol.'

  // email
  if (!email) e.email = 'Email is required.'
  else if (email.length < 3 || email.length > 254)
    e.email = 'Email must be 3–254 characters.'
  else if (!EMAIL_REGEX.test(email)) e.email = 'Email format looks invalid.'

  // password policy: matches password.ts isSafePasswordLength (8–200)
  if (!password) e.password = 'Password is required.'
  else if (password.length < 8 || password.length > 200)
    e.password = 'Password must be 8–200 characters.'

  if (!password2) e.password2 = 'Please confirm password.'
  else if (password !== password2) e.password2 = 'Passwords do not match.'

  return e
}

export function hasErrors(e: FieldErrors) {
  return Object.keys(e).length > 0
}
