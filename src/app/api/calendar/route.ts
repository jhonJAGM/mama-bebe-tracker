import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listCalendarEvents, createCalendarEvent } from '@/lib/google-calendar'

// GET /api/calendar?year=2025&month=4
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'No autenticado o sin acceso a Calendar' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

  const timeMin = new Date(year, month - 1, 1).toISOString()
  const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString()

  try {
    const events = await listCalendarEvents({
      accessToken: session.accessToken,
      timeMin,
      timeMax,
    })
    return NextResponse.json({ events })
  } catch (err: any) {
    console.error('[api/calendar GET]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/calendar — crea un nuevo evento
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'No autenticado o sin acceso a Calendar' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { summary, description, start, end } = body as {
      summary?: string
      description?: string
      start?: string
      end?: string
    }

    if (!summary || !start || !end) {
      return NextResponse.json({ error: 'summary, start y end son requeridos' }, { status: 400 })
    }

    const event = await createCalendarEvent(session.accessToken, { summary, description, start, end })
    return NextResponse.json({ event }, { status: 201 })
  } catch (err: any) {
    console.error('[api/calendar POST]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
