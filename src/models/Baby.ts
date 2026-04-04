import mongoose, { Schema, Document } from 'mongoose'

export interface IBaby extends Document {
  name: string
  birthDate: Date
  birthWeight: number
  birthHeight: number
  bloodType?: string
  allergies: string[]
  createdAt: Date
  updatedAt: Date
}

const BabySchema = new Schema<IBaby>(
  {
    name: { type: String, required: true, maxlength: 100 },
    birthDate: { type: Date, required: true },
    birthWeight: { type: Number, required: true, min: 0 }, // gramos
    birthHeight: { type: Number, required: true, min: 0 }, // cm
    bloodType: { type: String, maxlength: 5 },
    allergies: { type: [String], default: [] },
  },
  { timestamps: true }
)

export default mongoose.models.Baby || mongoose.model<IBaby>('Baby', BabySchema)
