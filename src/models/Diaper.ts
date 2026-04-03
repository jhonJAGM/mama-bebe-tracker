import mongoose, { Schema, Document } from 'mongoose'

export interface IDiaper extends Document {}

const DiaperSchema = new Schema({}, { timestamps: true })

export default mongoose.models.Diaper || mongoose.model<IDiaper>('Diaper', DiaperSchema)
