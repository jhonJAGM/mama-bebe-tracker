import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Baby from '@/models/Baby'

// POST /api/setup
// Crea el perfil de Noe si no existe. Solo para inicialización.
export async function POST() {
  try {
    await connectDB()

    const existing = await Baby.findOne()
    if (existing) {
      return NextResponse.json({ message: 'Ya existe', baby: existing })
    }

    const baby = await Baby.create({
      name: 'Noe',
      birthDate: new Date('2025-03-15'),
      birthWeight: 3200,
      birthHeight: 50,
    })

    return NextResponse.json({ message: 'Noe creada', baby }, { status: 201 })
  } catch (error) {
    console.error('POST /api/setup error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
