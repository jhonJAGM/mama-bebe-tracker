import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Feeding, { CYCLE_TIMES } from '@/models/Feeding'

// Devuelve la fecha a medianoche para agrupar por día
function dayMidnight(dateParam?: string | null): Date {
  const d = dateParam ? new Date(dateParam) : new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// GET /api/feed?babyId=xxx&date=2025-04-01
// Devuelve los 8 ciclos del día, incluyendo los no registrados (status: pending)
export async function GET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const date = dayMidnight(searchParams.get('date'))

    if (!babyId) {
      return NextResponse.json({ error: 'babyId es requerido' }, { status: 400 })
    }

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const feedings = await Feeding.find({
      babyId,
      date: { $gte: date, $lte: endOfDay },
    }).lean()

    // Merge feedings con los 8 ciclos fijos
    const cycles = CYCLE_TIMES.map((cycleTime) => {
      const feeding = feedings.find((f) => f.cycleTime === cycleTime)
      if (feeding) return { ...feeding, status: feedingStatus(feeding) }
      return {
        cycleTime,
        status: 'pending',
        breastMilkMl: 0,
        complementMl: 0,
        totalMl: 0,
        diaperChanges: 0,
        diaperType: 'none',
      }
    })

    const todayTotalMl = feedings.reduce((acc, f) => acc + (f.totalMl ?? 0), 0)

    return NextResponse.json({ cycles, todayTotalMl })
  } catch (error) {
    console.error('GET /api/feed error:', error)
    return NextResponse.json({ error: 'Error al obtener tomas' }, { status: 500 })
  }
}

function feedingStatus(f: any): string {
  if (f.exceededLimit) return 'alert'
  if (f.endTime) return 'completed'
  if (f.startTime) return 'in_progress'
  return 'pending'
}

// POST /api/feed — crea o actualiza el ciclo de un día específico
// Body: { babyId, cycleTime, date?, breastMilkMl, complementMl, maxLimitMl, minLimitMl,
//         diaperChanges, diaperType, observations, startTime?, endTime? }
export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const {
      babyId,
      cycleTime,
      date,
      breastMilkMl = 0,
      complementMl = 0,
      maxLimitMl = 120,
      minLimitMl = 60,
      diaperChanges = 0,
      diaperType = 'none',
      observations,
      startTime,
      endTime,
    } = body

    if (!babyId || !cycleTime) {
      return NextResponse.json({ error: 'babyId y cycleTime son requeridos' }, { status: 400 })
    }
    if (!CYCLE_TIMES.includes(cycleTime)) {
      return NextResponse.json({ error: `cycleTime debe ser uno de: ${CYCLE_TIMES.join(', ')}` }, { status: 400 })
    }

    const dayDate = dayMidnight(date)
    const totalMl = breastMilkMl + complementMl

    // Calcular duración si hay start y end
    let durationMinutes: number | undefined
    if (startTime && endTime) {
      durationMinutes = Math.round(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
      )
    }

    const exceededLimit = totalMl > maxLimitMl
    const belowMinimum = totalMl > 0 && totalMl < minLimitMl

    // Busca ciclo anterior para compensación
    let compensationFromPrevious = false
    if (belowMinimum) {
      const prevIdx = CYCLE_TIMES.indexOf(cycleTime)
      if (prevIdx > 0) {
        const prevCycleTime = CYCLE_TIMES[prevIdx - 1]
        const prevFeeding = await Feeding.findOne({ babyId, date: dayDate, cycleTime: prevCycleTime })
        if (prevFeeding && prevFeeding.belowMinimum) {
          compensationFromPrevious = true
        }
      }
    }

    const feeding = await Feeding.findOneAndUpdate(
      { babyId, date: dayDate, cycleTime },
      {
        $set: {
          breastMilkMl,
          complementMl,
          totalMl,
          maxLimitMl,
          minLimitMl,
          exceededLimit,
          belowMinimum,
          compensationFromPrevious,
          diaperChanges,
          diaperType,
          observations,
          ...(startTime ? { startTime: new Date(startTime) } : {}),
          ...(endTime ? { endTime: new Date(endTime) } : {}),
          ...(durationMinutes != null ? { durationMinutes } : {}),
        },
        $setOnInsert: { babyId, date: dayDate, cycleTime },
      },
      { upsert: true, new: true }
    )

    const alerts: string[] = []
    if (exceededLimit) alerts.push(`⚠️ Total (${totalMl} ml) supera el límite máximo (${maxLimitMl} ml)`)
    if (belowMinimum) alerts.push(`⚠️ Total (${totalMl} ml) está por debajo del mínimo (${minLimitMl} ml)`)

    return NextResponse.json({ feeding, alerts }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/feed error:', error)
    return NextResponse.json({ error: error.message ?? 'Error al registrar toma' }, { status: 500 })
  }
}
