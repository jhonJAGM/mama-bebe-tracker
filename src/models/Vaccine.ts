import mongoose, { Schema, Document } from 'mongoose'

export interface IVaccine extends Document {}

const VaccineSchema = new Schema({}, { timestamps: true })

export default mongoose.models.Vaccine || mongoose.model<IVaccine>('Vaccine', VaccineSchema)
