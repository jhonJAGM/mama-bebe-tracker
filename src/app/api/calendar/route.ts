import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'calendar GET - TODO' })
}

export async function POST() {
  return NextResponse.json({ message: 'calendar POST - TODO' })
}
