import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IFeeding extends Document {
  babyId: Types.ObjectId
  type: 'breast_left' | 'breast_right' | 'formula' | 'mixed'
  startTime: Date
  endTime?: Date
  durationMinutes?: number
  amountMl?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const FeedingSchema = new Schema<IFeeding>(
  {
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true },
    type: {
      type: String,
      enum: ['breast_left', 'breast_right', 'formula', 'mixed'],
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number, min: 0 },
    amountMl: { type: Number, min: 0 },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

// Index para consultas por bebe y fecha
FeedingSchema.index({ babyId: 1, startTime: -1 })

export default mongoose.models.Feeding ||
  mongoose.model<IFeeding>('Feeding', FeedingSchema)
