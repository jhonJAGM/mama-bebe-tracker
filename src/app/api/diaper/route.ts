import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Diaper from '@/models/Diaper'

// GET /api/diaper?babyId=xxx&date=2024-01-15
// Devuelve todos los panales del dia especificado (o hoy)
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

    const diapers = await Diaper.find({
      babyId,
      time: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ time: -1 })

    // Resumen del dia util para el dashboard
    const summary = {
      total: diapers.length,
      pee: diapers.filter((d) => d.type === 'pee' || d.type === 'both').length,
      poop: diapers.filter((d) => d.type === 'poop' || d.type === 'both').length,
    }

    return NextResponse.json({ diapers, summary })
  } catch (error) {
    console.error('GET /api/diaper error:', error)
    return NextResponse.json({ error: 'Error al obtener panales' }, { status: 500 })
  }
}

// POST /api/diaper
// Body: { babyId, time, type, color?, consistency?, notes? }
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const { babyId, time, type, color, consistency, notes } = body

    // Validacion
    if (!babyId) {
      return NextResponse.json({ error: 'babyId es requerido' }, { status: 400 })
    }
    if (!type || !['pee', 'poop', 'both', 'dry'].includes(type)) {
      return NextResponse.json(
        { error: 'type debe ser: pee, poop, both o dry' },
        { status: 400 }
      )
    }
    if (!time || isNaN(new Date(time).getTime())) {
      return NextResponse.json({ error: 'time es requerido y debe ser una fecha valida' }, { status: 400 })
    }

    const diaper = await Diaper.create({
      babyId,
      time: new Date(time),
      type,
      color,
      consistency,
      notes,
    })

    return NextResponse.json({ diaper }, { status: 201 })
  } catch (error) {
    console.error('POST /api/diaper error:', error)
    return NextResponse.json({ error: 'Error al registrar panal' }, { status: 500 })
  }
}
