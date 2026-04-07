import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Baby from '@/models/Baby'

// GET /api/setup — verifica si ya existe un bebé registrado
export async function GET() {
  try {
    await connectDB()
    const baby = await Baby.findOne().lean()
    return NextResponse.json({ exists: !!baby, baby })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/setup — crea el perfil del bebé si no existe
// Body: { name, birthDate, birthWeight, birthHeight, bloodType? }
export async function POST(request: Request) {
  try {
    await connectDB()

    const existing = await Baby.findOne()
    if (existing) {
      return NextResponse.json({ message: 'Ya existe', baby: existing })
    }

    const body = await request.json()
    const { name, birthDate, birthWeight, birthHeight, bloodType } = body

    if (!name || !birthDate || !birthWeight || !birthHeight) {
      return NextResponse.json(
        { error: 'nombre, fecha de nacimiento, peso y talla son requeridos' },
        { status: 400 }
      )
    }

    const baby = await Baby.create({
      name,
      birthDate: new Date(birthDate),
      birthWeight: Number(birthWeight),
      birthHeight: Number(birthHeight),
      ...(bloodType ? { bloodType } : {}),
    })

    return NextResponse.json({ message: 'Bebé registrada', baby }, { status: 201 })
  } catch (error) {
    console.error('POST /api/setup error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
