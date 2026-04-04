import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Feeding, { CYCLE_TIMES } from '@/models/Feeding'

type Context = { params: Promise<{ id: string }> }

// PATCH /api/feed/:id — acciones: start | end | update
// Body: { action: 'start' | 'end' | 'update', ...fields }
export async function PATCH(request: Request, context: Context) {
  try {
    await connectDB()
    const { id } = await context.params
    const body = await request.json()
    const { action } = body as { action?: string }

    const feeding = await Feeding.findById(id)
    if (!feeding) {
      return NextResponse.json({ error: 'Toma no encontrada' }, { status: 404 })
    }

    if (action === 'start') {
      feeding.startTime = new Date()
      feeding.status = 'in_progress'
      await feeding.save()
      return NextResponse.json({ feeding })
    }

    if (action === 'end') {
      feeding.endTime = new Date()
      feeding.status = 'completed'
      if (feeding.startTime) {
        feeding.durationMinutes = Math.round(
          (feeding.endTime.getTime() - feeding.startTime.getTime()) / 60000
        )
      }
      await feeding.save()
      return NextResponse.json({ feeding })
    }

    // action === 'update' (o sin action) — actualiza campos del formulario
    const {
      breastMilkMl,
      complementMl,
      maxLimitMl,
      minLimitMl,
      diaperChanges,
      diaperType,
      observations,
      startTime,
      endTime,
    } = body

    if (breastMilkMl != null) feeding.breastMilkMl = breastMilkMl
    if (complementMl != null) feeding.complementMl = complementMl
    if (maxLimitMl != null) feeding.maxLimitMl = maxLimitMl
    if (minLimitMl != null) feeding.minLimitMl = minLimitMl
    if (diaperChanges != null) feeding.diaperChanges = diaperChanges
    if (diaperType != null) feeding.diaperType = diaperType
    if (observations != null) feeding.observations = observations
    if (startTime) feeding.startTime = new Date(startTime)
    if (endTime) feeding.endTime = new Date(endTime)

    // Recalcular
    feeding.totalMl = feeding.breastMilkMl + feeding.complementMl
    feeding.exceededLimit = feeding.totalMl > feeding.maxLimitMl
    feeding.belowMinimum = feeding.totalMl > 0 && feeding.totalMl < feeding.minLimitMl

    if (feeding.startTime && feeding.endTime) {
      feeding.durationMinutes = Math.round(
        (feeding.endTime.getTime() - feeding.startTime.getTime()) / 60000
      )
    }

    // Busca compensación del ciclo anterior
    if (feeding.belowMinimum) {
      const prevIdx = CYCLE_TIMES.indexOf(feeding.cycleTime)
      if (prevIdx > 0) {
        const prev = await Feeding.findOne({
          babyId: feeding.babyId,
          date: feeding.date,
          cycleTime: CYCLE_TIMES[prevIdx - 1],
        })
        feeding.compensationFromPrevious = !!(prev?.belowMinimum)
      }
    } else {
      feeding.compensationFromPrevious = false
    }

    await feeding.save()

    const alerts: string[] = []
    if (feeding.exceededLimit) alerts.push(`⚠️ ${feeding.totalMl} ml supera el límite (${feeding.maxLimitMl} ml)`)
    if (feeding.belowMinimum) alerts.push(`⚠️ ${feeding.totalMl} ml por debajo del mínimo (${feeding.minLimitMl} ml)`)

    return NextResponse.json({ feeding, alerts })
  } catch (err: any) {
    console.error('PATCH /api/feed/[id] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/feed/:babyId/start — alias para crear e iniciar un ciclo
// (usado desde el frontend cuando no existe el registro aún)
export async function POST(request: Request, context: Context) {
  try {
    await connectDB()
    const { id: babyId } = await context.params
    const { cycleTime, date, maxLimitMl = 120, minLimitMl = 60 } = await request.json()

    if (!cycleTime || !CYCLE_TIMES.includes(cycleTime)) {
      return NextResponse.json({ error: 'cycleTime inválido' }, { status: 400 })
    }

    const dayDate = date ? new Date(date) : new Date()
    dayDate.setHours(0, 0, 0, 0)

    const feeding = await Feeding.findOneAndUpdate(
      { babyId, date: dayDate, cycleTime },
      {
        $setOnInsert: {
          babyId,
          date: dayDate,
          cycleTime,
          breastMilkMl: 0,
          complementMl: 0,
          totalMl: 0,
          maxLimitMl,
          minLimitMl,
          diaperChanges: 0,
          diaperType: 'none',
          exceededLimit: false,
          belowMinimum: false,
          compensationFromPrevious: false,
        },
        $set: { startTime: new Date() },
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({ feeding }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
