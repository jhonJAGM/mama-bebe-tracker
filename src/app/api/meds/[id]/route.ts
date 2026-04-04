import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Medication from '@/models/Medication'

// PATCH /api/meds/:id — marcar medicamento como tomado ahora
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const { id } = params
    const med = await Medication.findById(id)
    if (!med) {
      return NextResponse.json({ error: 'Medicamento no encontrado' }, { status: 404 })
    }

    const now = new Date()
    med.lastTaken = now
    med.nextDue = new Date(now.getTime() + med.frequencyHours * 60 * 60 * 1000)
    await med.save()

    return NextResponse.json({ medication: med })
  } catch (err: any) {
    console.error('PATCH /api/meds/[id] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/meds/:id — desactivar medicamento (soft delete)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const med = await Medication.findByIdAndUpdate(
      params.id,
      { active: false },
      { new: true }
    )
    if (!med) {
      return NextResponse.json({ error: 'Medicamento no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
