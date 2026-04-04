import connectDB from '@/lib/mongodb'
import Feeding, { CYCLE_TIMES } from '@/models/Feeding'
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

// Próximo ciclo a partir de ahora
function getNextCycleISO(): string {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const nowMin = h * 60 + m

  const cycleMins = CYCLE_TIMES.map((ct) => {
    const [ch, cm] = ct.split(':').map(Number)
    return ch * 60 + cm
  })

  // Próximo ciclo mayor al actual (si hay)
  const nextMin = cycleMins.find((cm) => cm > nowMin)
  if (nextMin != null) {
    const next = new Date()
    next.setHours(Math.floor(nextMin / 60), nextMin % 60, 0, 0)
    return next.toISOString()
  }
  // Si ya pasaron todos los ciclos del día, el siguiente es 06:00 del día siguiente
  const next = new Date()
  next.setDate(next.getDate() + 1)
  next.setHours(6, 0, 0, 0)
  return next.toISOString()
}

export async function getDashboardData() {
  try {
    await connectDB()
  } catch {
    return {
      dbError: true,
      baby: null,
      lastFeeding: null,
      diaperSummary: null,
      sleepSummary: null,
      momLog: null,
      upcomingMeds: [],
      todayMlTotal: 0,
      feedingsToday: 0,
      nextCycleISO: getNextCycleISO(),
      todayCycles: [] as { cycleTime: string; status: string; totalMl: number }[],
    }
  }

  const { start, end } = todayRange()

  const [baby, feedingsToday, diapersToday, sleepsToday, momLog, upcomingMeds] =
    await Promise.allSettled([
      Baby.findOne().sort({ createdAt: 1 }).lean(),
      Feeding.find({ date: { $gte: start, $lte: end } }).sort({ cycleTime: 1 }).lean(),
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
  const feedings = feedingsToday.status === 'fulfilled' ? feedingsToday.value : []

  const totalSleepMin = sleeps.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0)
  const lastSleep = [...sleeps].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )[0] ?? null

  const todayMlTotal = feedings.reduce((acc, f) => acc + (f.totalMl ?? 0), 0)
  const lastFeeding = feedings.length > 0
    ? feedings.sort((a, b) => {
        const aT = a.startTime ? new Date(a.startTime).getTime() : 0
        const bT = b.startTime ? new Date(b.startTime).getTime() : 0
        return bT - aT
      })[0]
    : null

  // Timeline de ciclos para el dashboard
  const todayCycles = CYCLE_TIMES.map((ct) => {
    const f = feedings.find((x) => x.cycleTime === ct)
    let status = 'pending'
    if (f) {
      if (f.exceededLimit) status = 'alert'
      else if (f.endTime) status = 'completed'
      else if (f.startTime) status = 'in_progress'
    }
    return { cycleTime: ct, status, totalMl: f?.totalMl ?? 0 }
  })

  return {
    dbError: false,
    baby: baby.status === 'fulfilled' ? baby.value : null,
    lastFeeding: lastFeeding ? {
      cycleTime: lastFeeding.cycleTime,
      startTime: lastFeeding.startTime ? new Date(lastFeeding.startTime).toISOString() : null,
      totalMl: lastFeeding.totalMl,
      breastMilkMl: lastFeeding.breastMilkMl,
      complementMl: lastFeeding.complementMl,
    } : null,
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
    todayMlTotal,
    feedingsToday: feedings.filter((f) => f.endTime).length,
    nextCycleISO: getNextCycleISO(),
    todayCycles,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
