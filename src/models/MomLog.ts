import mongoose, { Schema, Document } from 'mongoose'

export interface IMomLog extends Document {}

const MomLogSchema = new Schema({}, { timestamps: true })

export default mongoose.models.MomLog || mongoose.model<IMomLog>('MomLog', MomLogSchema)
