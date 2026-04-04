import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Baby from '@/models/Baby'

// GET /api/baby
// Devuelve el perfil de la bebe (se asume una sola bebe por instancia)
export async function GET() {
  try {
    await connectDB()

    const baby = await Baby.findOne().sort({ createdAt: 1 })

    if (!baby) {
      return NextResponse.json({ baby: null }, { status: 200 })
    }

    return NextResponse.json({ baby })
  } catch (error) {
    console.error('GET /api/baby error:', error)
    return NextResponse.json({ error: 'Error al obtener perfil de la bebe' }, { status: 500 })
  }
}

// POST /api/baby
// Body: { name, birthDate, birthWeight, birthHeight, bloodType?, allergies? }
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, birthDate, birthWeight, birthHeight, bloodType, allergies } = body

    // Validacion
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name es requerido' }, { status: 400 })
    }
    if (!birthDate || isNaN(new Date(birthDate).getTime())) {
      return NextResponse.json({ error: 'birthDate es requerido y debe ser una fecha valida' }, { status: 400 })
    }
    if (!birthWeight || birthWeight <= 0) {
      return NextResponse.json({ error: 'birthWeight es requerido y debe ser mayor a 0 (en gramos)' }, { status: 400 })
    }
    if (!birthHeight || birthHeight <= 0) {
      return NextResponse.json({ error: 'birthHeight es requerido y debe ser mayor a 0 (en cm)' }, { status: 400 })
    }

    const baby = await Baby.create({
      name: name.trim(),
      birthDate: new Date(birthDate),
      birthWeight,
      birthHeight,
      bloodType,
      allergies: allergies ?? [],
    })

    return NextResponse.json({ baby }, { status: 201 })
  } catch (error) {
    console.error('POST /api/baby error:', error)
    return NextResponse.json({ error: 'Error al crear perfil de la bebe' }, { status: 500 })
  }
}
