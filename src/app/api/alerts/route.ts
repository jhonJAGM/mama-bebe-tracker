import { NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/evolution-api'

// GET /api/alerts — devuelve configuración actual de alertas
export async function GET() {
  return NextResponse.json({
    alertPhone: process.env.WHATSAPP_ALERT_PHONE ?? '',
    evolutionConfigured: !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE),
  })
}

// POST /api/alerts — envío manual de alerta WhatsApp
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, message } = body as { phone?: string; message?: string }

    if (!phone || !message) {
      return NextResponse.json({ error: 'phone y message son requeridos' }, { status: 400 })
    }

    await sendWhatsAppMessage(phone, message)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[api/alerts]', err)
    return NextResponse.json({ error: err.message ?? 'Error al enviar alerta' }, { status: 500 })
  }
}
