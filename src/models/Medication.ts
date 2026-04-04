import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IMedication extends Document {
  patientType: 'baby' | 'mom'
  patientId: Types.ObjectId
  name: string
  dosage: string
  frequencyHours: number
  startDate: Date
  endDate?: Date
  lastTaken?: Date
  nextDue?: Date
  active: boolean
  alertWapp: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const MedicationSchema = new Schema<IMedication>(
  {
    patientType: { type: String, enum: ['baby', 'mom'], required: true },
    patientId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, maxlength: 200 },
    dosage: { type: String, required: true, maxlength: 100 },
    frequencyHours: { type: Number, required: true, min: 0.5 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    lastTaken: { type: Date },
    nextDue: { type: Date },
    active: { type: Boolean, default: true },
    alertWapp: { type: Boolean, default: true },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
)

MedicationSchema.index({ patientId: 1, active: 1 })
MedicationSchema.index({ nextDue: 1, active: 1 }) // para cron jobs de alertas

export default mongoose.models.Medication ||
  mongoose.model<IMedication>('Medication', MedicationSchema)
