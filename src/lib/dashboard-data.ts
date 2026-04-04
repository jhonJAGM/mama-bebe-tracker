// Funciones de fetching para el dashboard (solo server-side).
// Cada funcion captura errores internamente y devuelve null en caso de fallo,
// de modo que el dashboard siempre renderiza aunque MongoDB no este disponible.

import connectDB from '@/lib/mongodb'
import Feeding from '@/models/Feeding'
import Diaper from '@/models/Diaper'
import Sleep from '@/models/Sleep'
import Medication from '@/models/Medication'
import MomLog from '@/models/MomLog'
import Baby from '@/models/Baby'

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export async function getDashboardData() {
  try {
    await connectDB()
  } catch {
    // MongoDB no disponible — devuelve estructura vacia
    return { dbError: true, baby: null, lastFeeding: null, diaperSummary: null, sleepSummary: null, momLog: null, upcomingMeds: [] }
  }

  const { start, end } = todayRange()

  const [baby, lastFeeding, diapersToday, sleepsToday, momLog, upcomingMeds] =
    await Promise.allSettled([
      Baby.findOne().sort({ createdAt: 1 }).lean(),
      Feeding.findOne().sort({ startTime: -1 }).lean(),
      Diaper.find({ time: { $gte: start, $lte: end } }).lean(),
      Sleep.find({ startTime: { $gte: start, $lte: end } }).lean(),
      MomLog.findOne().sort({ date: -1 }).lean(),
      Medication.find({ active: true, nextDue: { $gte: new Date(), $lte: end } })
        .sort({ nextDue: 1 })
        .limit(5)
        .lean(),
    ])

  const diapers = diapersToday.status === 'fulfilled' ? diapersToday.value : []
  const sleeps = sleepsToday.status === 'fulfilled' ? sleepsToday.value : []
  const meds = upcomingMeds.status === 'fulfilled' ? upcomingMeds.value : []
  const totalSleepMin = sleeps.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0)
  const lastSleep = sleeps.sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )[0] ?? null

  return {
    dbError: false,
    baby: baby.status === 'fulfilled' ? baby.value : null,
    lastFeeding: lastFeeding.status === 'fulfilled' ? lastFeeding.value : null,
    diaperSummary: {
      total: diapers.length,
      pee: diapers.filter((d) => d.type === 'pee' || d.type === 'both').length,
      poop: diapers.filter((d) => d.type === 'poop' || d.type === 'both').length,
    },
    sleepSummary: {
      totalHours: +(totalSleepMin / 60).toFixed(1),
      lastSleepStart: lastSleep ? new Date(lastSleep.startTime).toISOString() : null,
    },
    momLog: momLog.status === 'fulfilled' ? momLog.value : null,
    upcomingMeds: meds.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      nextDue: new Date(m.nextDue!).toISOString(),
      patientType: m.patientType,
    })),
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
