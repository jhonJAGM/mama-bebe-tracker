import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ISleep extends Document {
  babyId: Types.ObjectId
  startTime: Date
  endTime?: Date
  durationMinutes?: number
  type: 'day' | 'night'
  quality?: 1 | 2 | 3 | 4 | 5
  location?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const SleepSchema = new Schema<ISleep>(
  {
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number, min: 0 },
    type: {
      type: String,
      enum: ['day', 'night'],
      required: true,
    },
    quality: { type: Number, min: 1, max: 5 },
    location: { type: String, maxlength: 100 },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

SleepSchema.index({ babyId: 1, startTime: -1 })

export default mongoose.models.Sleep ||
  mongoose.model<ISleep>('Sleep', SleepSchema)
