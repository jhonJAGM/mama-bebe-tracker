import mongoose, { Schema, Document } from 'mongoose'

export interface IMedication extends Document {}

const MedicationSchema = new Schema({}, { timestamps: true })

export default mongoose.models.Medication || mongoose.model<IMedication>('Medication', MedicationSchema)
