import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Note from '@/models/Note'

// GET /api/notes?type=milestone&limit=50
export async function GET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

    const query = type ? { type } : {}
    const notes = await Note.find(query).sort({ date: -1 }).limit(limit).lean()
    return NextResponse.json({ notes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/notes
export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const { title, content, type, date, photoUrl, milestone } = body as {
      title?: string
      content?: string
      type?: string
      date?: string
      photoUrl?: string
      milestone?: string
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'title y content son requeridos' }, { status: 400 })
    }

    const note = await Note.create({
      title,
      content,
      type: type ?? 'note',
      date: date ? new Date(date) : new Date(),
      photoUrl,
      milestone,
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
