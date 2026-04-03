import mongoose, { Schema, Document } from 'mongoose'

export interface INote extends Document {}

const NoteSchema = new Schema({}, { timestamps: true })

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema)
