// Fetching server-side para el módulo mamá.
// Todos los errores son capturados internamente — devuelve null/[] en fallo.

import connectDB from '@/lib/mongodb'
import MomLog from '@/models/MomLog'
import Medication from '@/models/Medication'

export async function getMomPageData() {
  try {
    await connectDB()
  } catch {
    return { dbError: true, recentLogs: [], activeMeds: [] }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [recentLogs, activeMeds] = await Promise.allSettled([
    // Últimos 7 registros para tendencia de dolor
    MomLog.find().sort({ date: -1 }).limit(7).lean(),
    // Medicamentos activos de mamá
    Medication.find({ patientType: 'mom', active: true })
      .sort({ nextDue: 1 })
      .lean(),
  ])

  const logs = recentLogs.status === 'fulfilled' ? recentLogs.value : []
  const meds = activeMeds.status === 'fulfilled' ? activeMeds.value : []

  return {
    dbError: false,
    // Más reciente primero
    recentLogs: logs.map((l: any) => ({
      id: String(l._id),
      date: new Date(l.date).toISOString(),
      painLevel: l.painLevel ?? null,
      painZone: l.painZone ?? null,
      temperature: l.temperature ?? null,
      woundStatus: l.woundStatus ?? null,
      lochiaColor: l.lochiaColor ?? null,
      lochiaAmount: l.lochiaAmount ?? null,
      activityLevel: l.activityLevel ?? null,
      mood: l.mood ?? null,
      notes: l.notes ?? null,
    })),
    activeMeds: meds.map((m: any) => ({
      id: String(m._id),
      name: m.name,
      dosage: m.dosage,
      frequencyHours: m.frequencyHours,
      lastTaken: m.lastTaken ? new Date(m.lastTaken).toISOString() : null,
      nextDue: m.nextDue ? new Date(m.nextDue).toISOString() : null,
    })),
  }
}

export type MomPageData = Awaited<ReturnType<typeof getMomPageData>>
export type MomLogEntry = MomPageData['recentLogs'][number]
export type MedEntry = MomPageData['activeMeds'][number]
