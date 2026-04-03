import mongoose, { Schema, Document } from 'mongoose'

export interface IBaby extends Document {}

const BabySchema = new Schema({}, { timestamps: true })

export default mongoose.models.Baby || mongoose.model<IBaby>('Baby', BabySchema)
