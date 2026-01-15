// src/models/User/User.ts
import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer'

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      // stores scrypt hash string
    },
    role: {
      type: String,
      required: true,
      default: 'owner',
      enum: ['owner', 'admin', 'editor', 'viewer'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId
}

// Avoid model overwrite in dev/hot-reload
export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>('User', UserSchema)
