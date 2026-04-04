import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Growth from '@/models/Growth'

// GET /api/growth?babyId=xxx&limit=50
// Devuelve mediciones ordenadas cronológicamente (para graficar)
export async function GET(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200)

    if (!babyId) {
      return NextResponse.json({ error: 'babyId es requerido' }, { status: 400 })
    }

    const measurements = await Growth.find({ babyId })
      .sort({ date: 1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ measurements })
  } catch (error) {
    console.error('GET /api/growth error:', error)
    return NextResponse.json({ error: 'Error al obtener mediciones' }, { status: 500 })
  }
}

// POST /api/growth
// Body: { babyId, date, weightKg?, heightCm?, headCircumferenceCm?, notes? }
// Al menos uno de los tres valores numéricos es requerido.
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const { babyId, date, weightKg, heightCm, headCircumferenceCm, notes } = body

    if (!babyId) {
      return NextResponse.json({ error: 'babyId es requerido' }, { status: 400 })
    }
    if (!date || isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: 'date es requerido y debe ser una fecha válida' }, { status: 400 })
    }
    if (weightKg == null && heightCm == null && headCircumferenceCm == null) {
      return NextResponse.json(
        { error: 'Debe incluir al menos una medición: weightKg, heightCm o headCircumferenceCm' },
        { status: 400 }
      )
    }
    if (weightKg != null && (weightKg <= 0 || weightKg > 30)) {
      return NextResponse.json({ error: 'weightKg debe estar entre 0 y 30 kg' }, { status: 400 })
    }
    if (heightCm != null && (heightCm <= 0 || heightCm > 120)) {
      return NextResponse.json({ error: 'heightCm debe estar entre 0 y 120 cm' }, { status: 400 })
    }

    const measurement = await Growth.create({
      babyId,
      date: new Date(date),
      weightKg: weightKg ?? undefined,
      heightCm: heightCm ?? undefined,
      headCircumferenceCm: headCircumferenceCm ?? undefined,
      notes,
    })

    return NextResponse.json({ measurement }, { status: 201 })
  } catch (error) {
    console.error('POST /api/growth error:', error)
    return NextResponse.json({ error: 'Error al registrar medición' }, { status: 500 })
  }
}
