import mongoose, { Schema, Document } from 'mongoose'

export interface ISleep extends Document {}

const SleepSchema = new Schema({}, { timestamps: true })

export default mongoose.models.Sleep || mongoose.model<ISleep>('Sleep', SleepSchema)
