import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export async function GET() {
  await connectDB()
  return NextResponse.json({ message: 'notes GET - TODO' })
}

export async function POST(request: Request) {
  await connectDB()
  return NextResponse.json({ message: 'notes POST - TODO' })
}
