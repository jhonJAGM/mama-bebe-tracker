import mongoose, { Schema, Document } from 'mongoose'

export interface IMomLog extends Document {
  date: Date
  painLevel?: number
  painZone?: string
  temperature?: number
  woundStatus?: 'clean' | 'red' | 'secretion' | 'open'
  woundPhoto?: string
  lochiaColor?: 'red' | 'pink' | 'brown' | 'yellow' | 'white'
  lochiaAmount?: 'light' | 'moderate' | 'heavy'
  activityLevel?: 'bed_rest' | 'walking' | 'light' | 'normal'
  mood?: 1 | 2 | 3 | 4 | 5
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const MomLogSchema = new Schema<IMomLog>(
  {
    date: { type: Date, required: true },
    painLevel: { type: Number, min: 1, max: 10 },
    painZone: { type: String, maxlength: 100 },
    temperature: { type: Number, min: 30, max: 45 },
    woundStatus: {
      type: String,
      enum: ['clean', 'red', 'secretion', 'open'],
    },
    woundPhoto: { type: String },
    lochiaColor: {
      type: String,
      enum: ['red', 'pink', 'brown', 'yellow', 'white'],
    },
    lochiaAmount: {
      type: String,
      enum: ['light', 'moderate', 'heavy'],
    },
    activityLevel: {
      type: String,
      enum: ['bed_rest', 'walking', 'light', 'normal'],
    },
    mood: { type: Number, min: 1, max: 5 },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
)

MomLogSchema.index({ date: -1 })

export default mongoose.models.MomLog ||
  mongoose.model<IMomLog>('MomLog', MomLogSchema)
