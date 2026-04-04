import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Sleep from '@/models/Sleep'

// GET /api/sleep?babyId=xxx&date=2024-01-15
// Devuelve todos los periodos de sueno del dia (o hoy)
export async function GET(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const dateParam = searchParams.get('date')

    if (!babyId) {
      return NextResponse.json({ error: 'babyId es requerido' }, { status: 400 })
    }

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const sleeps = await Sleep.find({
      babyId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ startTime: -1 })

    // Calcula total de horas dormidas en el dia
    const totalMinutes = sleeps.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0)
    const summary = {
      totalSleeps: sleeps.length,
      totalMinutes,
      totalHours: +(totalMinutes / 60).toFixed(1),
      daySleeps: sleeps.filter((s) => s.type === 'day').length,
      nightSleeps: sleeps.filter((s) => s.type === 'night').length,
    }

    return NextResponse.json({ sleeps, summary })
  } catch (error) {
    console.error('GET /api/sleep error:', error)
    return NextResponse.json({ error: 'Error al obtener registros de sueno' }, { status: 500 })
  }
}

// POST /api/sleep
// Body: { babyId, startTime, type, endTime?, durationMinutes?, quality?, location?, notes? }
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const { babyId, startTime, endTime, durationMinutes, type, quality, location, notes } = body

    // Validacion
    if (!babyId) {
      return NextResponse.json({ error: 'babyId es requerido' }, { status: 400 })
    }
    if (!startTime || isNaN(new Date(startTime).getTime())) {
      return NextResponse.json({ error: 'startTime es requerido y debe ser una fecha valida' }, { status: 400 })
    }
    if (!type || !['day', 'night'].includes(type)) {
      return NextResponse.json({ error: 'type debe ser: day o night' }, { status: 400 })
    }
    if (quality !== undefined && (quality < 1 || quality > 5)) {
      return NextResponse.json({ error: 'quality debe ser un numero entre 1 y 5' }, { status: 400 })
    }

    // Calcular duracion automaticamente si hay startTime y endTime
    let calculatedDuration = durationMinutes
    if (endTime && startTime && !durationMinutes) {
      const ms = new Date(endTime).getTime() - new Date(startTime).getTime()
      calculatedDuration = Math.round(ms / 60000)
    }

    const sleep = await Sleep.create({
      babyId,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      durationMinutes: calculatedDuration,
      type,
      quality,
      location,
      notes,
    })

    return NextResponse.json({ sleep }, { status: 201 })
  } catch (error) {
    console.error('POST /api/sleep error:', error)
    return NextResponse.json({ error: 'Error al registrar sueno' }, { status: 500 })
  }
}
