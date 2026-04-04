import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IDiaper extends Document {
  babyId: Types.ObjectId
  time: Date
  type: 'pee' | 'poop' | 'both' | 'dry'
  color?: string
  consistency?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const DiaperSchema = new Schema<IDiaper>(
  {
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true },
    time: { type: Date, required: true },
    type: {
      type: String,
      enum: ['pee', 'poop', 'both', 'dry'],
      required: true,
    },
    color: { type: String, maxlength: 50 },
    consistency: { type: String, maxlength: 50 },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

DiaperSchema.index({ babyId: 1, time: -1 })

export default mongoose.models.Diaper ||
  mongoose.model<IDiaper>('Diaper', DiaperSchema)
