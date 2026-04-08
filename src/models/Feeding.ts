import mongoose, { Schema, Document, Types } from 'mongoose'
import { CYCLE_TIMES, type CycleTime } from '@/lib/cycle-constants'
export { CYCLE_TIMES, type CycleTime } from '@/lib/cycle-constants'

export interface IFeeding extends Document {
  babyId: Types.ObjectId
  date: Date              // medianoche del día (para agrupar por día sin TZ issues)
  cycleTime: CycleTime   // uno de los 8 ciclos fijos
  wakeTime?: Date        // HD — hora de despertar
  startTime?: Date       // HI — inicio de lactancia
  endTime?: Date         // HF — fin de lactancia
  durationMinutes?: number   // calculado automático (HF - HI)
  breastMilkMl: number       // LM — leche materna
  complementMl: number       // C — complemento/fórmula
  totalMl: number            // LM + C, calculado automático
  maxLimitMl: number         // límite máximo configurado
  minLimitMl: number         // límite mínimo configurado
  exceededLimit: boolean
  belowMinimum: boolean
  compensationFromPrevious: boolean
  diaperChanges: number
  diaperType: 'pee' | 'poop' | 'both' | 'none'
  observations?: string
  createdAt: Date
  updatedAt: Date
}

const FeedingSchema = new Schema<IFeeding>(
  {
    babyId: { type: Schema.Types.ObjectId, ref: 'Baby', required: true },
    date: { type: Date, required: true },
    cycleTime: {
      type: String,
      enum: CYCLE_TIMES,
      required: true,
    },
    wakeTime: { type: Date },
    startTime: { type: Date },
    endTime: { type: Date },
    durationMinutes: { type: Number, min: 0 },
    breastMilkMl: { type: Number, default: 0, min: 0 },
    complementMl: { type: Number, default: 0, min: 0 },
    totalMl: { type: Number, default: 0, min: 0 },
    maxLimitMl: { type: Number, default: 120 },
    minLimitMl: { type: Number, default: 60 },
    exceededLimit: { type: Boolean, default: false },
    belowMinimum: { type: Boolean, default: false },
    compensationFromPrevious: { type: Boolean, default: false },
    diaperChanges: { type: Number, default: 0, min: 0 },
    diaperType: {
      type: String,
      enum: ['pee', 'poop', 'both', 'none'],
      default: 'none',
    },
    observations: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
)

// Un solo registro por bebé/día/ciclo
FeedingSchema.index({ babyId: 1, date: 1, cycleTime: 1 }, { unique: true })
FeedingSchema.index({ babyId: 1, date: -1 })

export default mongoose.models.Feeding ||
  mongoose.model<IFeeding>('Feeding', FeedingSchema)
