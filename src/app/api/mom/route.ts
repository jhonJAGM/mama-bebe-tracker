import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import MomLog from '@/models/MomLog'

// GET /api/mom?date=2024-01-15&limit=7
// Sin date: devuelve el registro mas reciente.
// Con date: devuelve el registro de ese dia.
// Con limit: devuelve los ultimos N registros (util para graficas de tendencia).
export async function GET(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const limitParam = searchParams.get('limit')

    if (limitParam) {
      const limit = Math.min(parseInt(limitParam), 30) // max 30 registros
      const logs = await MomLog.find().sort({ date: -1 }).limit(limit)
      return NextResponse.json({ logs })
    }

    if (dateParam) {
      const targetDate = new Date(dateParam)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const log = await MomLog.findOne({
        date: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ date: -1 })

      return NextResponse.json({ log: log ?? null })
    }

    // Sin parametros: registro mas reciente
    const log = await MomLog.findOne().sort({ date: -1 })
    return NextResponse.json({ log: log ?? null })
  } catch (error) {
    console.error('GET /api/mom error:', error)
    return NextResponse.json({ error: 'Error al obtener registros de mama' }, { status: 500 })
  }
}

// POST /api/mom
// Body: { date, painLevel?, painZone?, temperature?, woundStatus?, lochiaColor?, lochiaAmount?, activityLevel?, mood?, notes? }
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const {
      date,
      painLevel,
      painZone,
      temperature,
      woundStatus,
      woundPhoto,
      lochiaColor,
      lochiaAmount,
      activityLevel,
      mood,
      notes,
    } = body

    if (!date || isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date es requerido y debe ser una fecha valida' }, { status: 400 })
    }
    if (painLevel !== undefined && (painLevel < 1 || painLevel > 10)) {
      return NextResponse.json({ error: 'painLevel debe ser entre 1 y 10' }, { status: 400 })
    }
    if (temperature !== undefined && (temperature < 30 || temperature > 45)) {
      return NextResponse.json({ error: 'temperature debe estar entre 30 y 45 grados Celsius' }, { status: 400 })
    }
    if (mood !== undefined && (mood < 1 || mood > 5)) {
      return NextResponse.json({ error: 'mood debe ser entre 1 y 5' }, { status: 400 })
    }
    if (woundStatus && !['clean', 'red', 'secretion', 'open'].includes(woundStatus)) {
      return NextResponse.json({ error: 'woundStatus invalido' }, { status: 400 })
    }

    const log = await MomLog.create({
      date: new Date(date),
      painLevel,
      painZone,
      temperature,
      woundStatus,
      woundPhoto,
      lochiaColor,
      lochiaAmount,
      activityLevel,
      mood,
      notes,
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('POST /api/mom error:', error)
    return NextResponse.json({ error: 'Error al guardar registro de mama' }, { status: 500 })
  }
}
