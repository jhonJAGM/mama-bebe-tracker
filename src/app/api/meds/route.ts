import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Medication from '@/models/Medication'

// GET /api/meds?patientId=xxx&patientType=baby|mom&active=true
// Lista medicamentos. Por defecto solo los activos.
export async function GET(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const patientType = searchParams.get('patientType')
    const activeParam = searchParams.get('active')

    const filter: Record<string, unknown> = {}

    if (patientId) filter.patientId = patientId
    if (patientType) {
      if (!['baby', 'mom'].includes(patientType)) {
        return NextResponse.json({ error: 'patientType debe ser baby o mom' }, { status: 400 })
      }
      filter.patientType = patientType
    }
    // Si no se especifica active, devuelve solo los activos
    filter.active = activeParam === 'false' ? false : true

    const medications = await Medication.find(filter).sort({ nextDue: 1 })

    // Marca cuales vencen pronto (proxima toma en menos de 1 hora)
    const now = new Date()
    const withStatus = medications.map((med) => {
      const obj = med.toObject()
      const minutesUntilDue = med.nextDue
        ? Math.round((med.nextDue.getTime() - now.getTime()) / 60000)
        : null
      return { ...obj, minutesUntilDue, isDueSoon: minutesUntilDue !== null && minutesUntilDue <= 60 && minutesUntilDue >= 0 }
    })

    return NextResponse.json({ medications: withStatus })
  } catch (error) {
    console.error('GET /api/meds error:', error)
    return NextResponse.json({ error: 'Error al obtener medicamentos' }, { status: 500 })
  }
}

// POST /api/meds
// Body: { patientType, patientId, name, dosage, frequencyHours, startDate, endDate?, alertWapp?, notes? }
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const {
      patientType,
      patientId,
      name,
      dosage,
      frequencyHours,
      startDate,
      endDate,
      lastTaken,
      alertWapp,
      notes,
    } = body

    // Validacion
    if (!patientType || !['baby', 'mom'].includes(patientType)) {
      return NextResponse.json({ error: 'patientType debe ser baby o mom' }, { status: 400 })
    }
    if (!patientId) {
      return NextResponse.json({ error: 'patientId es requerido' }, { status: 400 })
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name es requerido' }, { status: 400 })
    }
    if (!dosage || typeof dosage !== 'string') {
      return NextResponse.json({ error: 'dosage es requerido (ej: "400mg", "5 gotas")' }, { status: 400 })
    }
    if (!frequencyHours || frequencyHours < 0.5) {
      return NextResponse.json({ error: 'frequencyHours es requerido y debe ser >= 0.5' }, { status: 400 })
    }
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      return NextResponse.json({ error: 'startDate es requerido y debe ser una fecha valida' }, { status: 400 })
    }

    // Calcula nextDue basado en lastTaken o startDate + frequencyHours
    const base = lastTaken ? new Date(lastTaken) : new Date(startDate)
    const nextDue = new Date(base.getTime() + frequencyHours * 60 * 60 * 1000)

    const medication = await Medication.create({
      patientType,
      patientId,
      name: name.trim(),
      dosage,
      frequencyHours,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      lastTaken: lastTaken ? new Date(lastTaken) : undefined,
      nextDue,
      active: true,
      alertWapp: alertWapp ?? true,
      notes,
    })

    return NextResponse.json({ medication }, { status: 201 })
  } catch (error) {
    console.error('POST /api/meds error:', error)
    return NextResponse.json({ error: 'Error al crear medicamento' }, { status: 500 })
  }
}
