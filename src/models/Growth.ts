import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IGrowth extends Document {
  babyId: Types.ObjectId
  date: Date
  weightKg?: number    // ej: 3.250
  heightCm?: number    // ej: 50.5
  headCircumferenceCm?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const GrowthSchema = new Schema<IGrowth>(
  {
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true },
    date: { type: Date, required: true },
    weightKg: { type: Number, min: 0, max: 30 },
    heightCm: { type: Number, min: 0, max: 120 },
    headCircumferenceCm: { type: Number, min: 0, max: 60 },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

GrowthSchema.index({ babyId: 1, date: 1 })

export default mongoose.models.Growth ||
  mongoose.model<IGrowth>('Growth', GrowthSchema)
