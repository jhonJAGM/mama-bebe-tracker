import connectDB from '@/lib/mongodb'
import Feeding, { CYCLE_TIMES } from '@/models/Feeding'
import Diaper from '@/models/Diaper'
import Sleep from '@/models/Sleep'
import Medication from '@/models/Medication'
import MomLog from '@/models/MomLog'
import Baby from '@/models/Baby'

// Colombia = UTC-5. Calcula medianoche y fin del día en hora local Colombia,
// devuelve fechas UTC para comparar contra los documentos de MongoDB.
const COL_OFFSET_MS = -5 * 60 * 60 * 1000

function todayRange() {
  // Hora actual ajustada a Colombia
  const nowLocal = new Date(Date.now() + COL_OFFSET_MS)
  // Medianoche Colombia en UTC
  const start = new Date(
    Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate(), 5, 0, 0, 0)
  ) // 00:00 COL = 05:00 UTC
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
  return { start, end }
}

// Próximo ciclo a partir de ahora (en hora Colombia)
function getNextCycleISO(): string {
  const nowLocal = new Date(Date.now() + COL_OFFSET_MS)
  const h = nowLocal.getUTCHours()
  const m = nowLocal.getUTCMinutes()
  const nowMin = h * 60 + m

  const cycleMins = CYCLE_TIMES.map((ct) => {
    const [ch, cm] = ct.split(':').map(Number)
    return ch * 60 + cm
  })

  // Convierte minutos Colombia → Date UTC
  function colMinToDate(colMin: number, dayOffset = 0): Date {
    const colH = Math.floor(colMin / 60)
    const colM = colMin % 60
    // Medianoche Colombia del día de hoy en UTC
    const todayMidnightUTC = new Date(
      Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate() + dayOffset, 5, 0, 0, 0)
    )
    return new Date(todayMidnightUTC.getTime() + (colH * 60 + colM) * 60 * 1000)
  }

  const nextMin = cycleMins.find((cm) => cm > nowMin)
  if (nextMin != null) {
    return colMinToDate(nextMin).toISOString()
  }
  // Si ya pasaron todos los ciclos del día, el siguiente es 06:00 Colombia del día siguiente
  return colMinToDate(6 * 60, 1).toISOString()
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
      todayCycles: [] as {
        cycleTime: string; status: string;
        wakeTime: string | null; startTime: string | null; endTime: string | null;
        durationMinutes: number | null;
        breastMilkMl: number; complementMl: number; totalMl: number;
        exceededLimit: boolean; belowMinimum: boolean;
      }[],
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

  // Timeline de ciclos para el dashboard — incluye todos los campos HD/HI/HF/LM/C
  const todayCycles = CYCLE_TIMES.map((ct) => {
    const f = feedings.find((x) => x.cycleTime === ct)
    let status = 'pending'
    if (f) {
      if (f.exceededLimit) status = 'alert'
      else if (f.endTime) status = 'completed'
      else if (f.startTime) status = 'in_progress'
      else if (f.wakeTime) status = 'awake'
    }
    return {
      cycleTime: ct,
      status,
      wakeTime:        f?.wakeTime  ? new Date(f.wakeTime).toISOString()  : null,
      startTime:       f?.startTime ? new Date(f.startTime).toISOString() : null,
      endTime:         f?.endTime   ? new Date(f.endTime).toISOString()   : null,
      durationMinutes: f?.durationMinutes ?? null,
      breastMilkMl:    f?.breastMilkMl ?? 0,
      complementMl:    f?.complementMl ?? 0,
      totalMl:         f?.totalMl ?? 0,
      exceededLimit:   f?.exceededLimit ?? false,
      belowMinimum:    f?.belowMinimum ?? false,
    }
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
