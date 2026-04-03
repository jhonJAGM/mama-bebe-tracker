import mongoose, { Schema, Document } from 'mongoose'

export interface IFeeding extends Document {}

const FeedingSchema = new Schema({}, { timestamps: true })

export default mongoose.models.Feeding || mongoose.model<IFeeding>('Feeding', FeedingSchema)
