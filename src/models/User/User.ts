// src/models/User/User.ts
import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

export type UserRole = 'dev' | 'admin' | 'editor' | 'viewer'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_\.]*[a-z0-9])?$/i // letters/numbers/._ , no leading/trailing symbol

const normalizeEmail = (v: unknown) =>
  typeof v === 'string' ? v.trim().toLowerCase() : v

const normalizeUsername = (v: unknown) =>
  typeof v === 'string' ? v.trim().toLowerCase() : v

const UserSchema = new Schema(
  {
    // Identity (normalized + validated)
    email: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 254,
      trim: true,
      lowercase: true,
      match: EMAIL_REGEX,
      set: normalizeEmail,
    },

    // Optional public identifier (unique)
    username: {
      type: String,
      required: false,
      minlength: 3,
      maxlength: 30,
      trim: true,
      lowercase: true,
      match: USERNAME_REGEX,
      set: normalizeUsername,
      // NOTE: unique index added via schema.index() below (partial)
    },

    // Secret (never returned unless explicitly selected)
    passwordHash: {
      type: String,
      required: true,
      minlength: 20,
      select: false,
    },

    // RBAC (safe default)
    role: {
      type: String,
      required: true,
      default: 'viewer',
      enum: ['dev', 'admin', 'editor', 'viewer'],
    },

    // Account state
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Auditing
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
      select: false,
    },

    // Brute-force protection helpers
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    strict: 'throw',
    minimize: true,

    // Hide internal version key + strip sensitive fields
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        const {
          passwordHash,
          passwordChangedAt,
          loginAttempts,
          lockUntil,
          ...safe
        } = ret as Record<string, unknown>
        return safe
      },
    },
    toObject: {
      versionKey: false,
      transform(_doc, ret) {
        const {
          passwordHash,
          passwordChangedAt,
          loginAttempts,
          lockUntil,
          ...safe
        } = ret as Record<string, unknown>
        return safe
      },
    },
  },
)

// Indexes
UserSchema.index({ email: 1 }, { unique: true, name: 'uniq_email' })

// Unique username only when it exists (allows many docs with username: null/undefined)
UserSchema.index(
  { username: 1 },
  {
    unique: true,
    name: 'uniq_username',
    partialFilterExpression: { username: { $type: 'string' } },
  },
)

UserSchema.index({ role: 1, isActive: 1 }, { name: 'role_active' })

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId
}

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>('User', UserSchema)
