import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Feeding from '@/models/Feeding'

// GET /api/feed?babyId=xxx&date=2024-01-15
// Devuelve todas las tomas del dia especificado (o hoy si no se pasa date)
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

    const feedings = await Feeding.find({
      babyId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ startTime: -1 })

    return NextResponse.json({ feedings, count: feedings.length })
  } catch (error) {
    console.error('GET /api/feed error:', error)
    return NextResponse.json({ error: 'Error al obtener tomas' }, { status: 500 })
  }
}

// POST /api/feed
// Body: { babyId, type, startTime, endTime?, durationMinutes?, amountMl?, notes? }
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const { babyId, type, startTime, endTime, durationMinutes, amountMl, notes } = body

    // Validacion
    if (!babyId) {
      return NextResponse.json({ error: 'babyId es requerido' }, { status: 400 })
    }
    if (!type || !['breast_left', 'breast_right', 'formula', 'mixed'].includes(type)) {
      return NextResponse.json(
        { error: 'type debe ser: breast_left, breast_right, formula o mixed' },
        { status: 400 }
      )
    }
    if (!startTime || isNaN(new Date(startTime).getTime())) {
      return NextResponse.json({ error: 'startTime es requerido y debe ser una fecha valida' }, { status: 400 })
    }
    if (type === 'formula' && !amountMl) {
      return NextResponse.json({ error: 'amountMl es requerido cuando type es formula' }, { status: 400 })
    }

    // Calcular duracion automaticamente si hay startTime y endTime
    let calculatedDuration = durationMinutes
    if (endTime && startTime && !durationMinutes) {
      const ms = new Date(endTime).getTime() - new Date(startTime).getTime()
      calculatedDuration = Math.round(ms / 60000)
    }

    const feeding = await Feeding.create({
      babyId,
      type,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      durationMinutes: calculatedDuration,
      amountMl,
      notes,
    })

    return NextResponse.json({ feeding }, { status: 201 })
  } catch (error) {
    console.error('POST /api/feed error:', error)
    return NextResponse.json({ error: 'Error al registrar toma' }, { status: 500 })
  }
}
