import mongoose, { Schema, Document } from 'mongoose'

export interface INote extends Document {
  date: Date
  title: string
  content: string
  type: 'note' | 'milestone' | 'photo'
  photoUrl?: string
  milestone?: string
  createdAt: Date
  updatedAt: Date
}

const NoteSchema = new Schema<INote>(
  {
    date: { type: Date, required: true, default: Date.now },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ['note', 'milestone', 'photo'], default: 'note' },
    photoUrl: { type: String },
    milestone: { type: String, maxlength: 200 },
  },
  { timestamps: true }
)

NoteSchema.index({ date: -1 })
NoteSchema.index({ type: 1, date: -1 })

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema)
