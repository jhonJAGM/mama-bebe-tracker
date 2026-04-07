import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Feeding, { CYCLE_TIMES, type CycleTime } from '@/models/Feeding'
import Baby from '@/models/Baby'
import { sendWhatsAppMessage } from '@/lib/evolution-api'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
const COL_OFFSET_MS = -5 * 60 * 60 * 1000

// ── Helpers ───────────────────────────────────────────────────────────────

function dayMidnightCOL(ref?: Date): Date {
  const now = ref ? new Date(ref.getTime() + COL_OFFSET_MS) : new Date(Date.now() + COL_OFFSET_MS)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 5, 0, 0, 0))
}

// Convierte "HH:MM" a Date de hoy en hora Colombia
function timeStrToDate(timeStr: string): Date | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const h = parseInt(match[1])
  const m = parseInt(match[2])
  if (h > 23 || m > 59) return null
  const midnight = dayMidnightCOL()
  return new Date(midnight.getTime() + (h * 60 + m) * 60 * 1000)
}

// Detecta el ciclo más cercano a una hora dada (en minutos Colombia)
function detectCycle(colMinutes: number): CycleTime {
  const cycleMins = CYCLE_TIMES.map((ct) => {
    const [h, m] = ct.split(':').map(Number)
    return { ct, min: h * 60 + m }
  })

  // Encuentra el ciclo más cercano (diferencia mínima, considerando wrap del día)
  let closest = cycleMins[0]
  let minDiff = Infinity
  for (const { ct, min } of cycleMins) {
    const diff = Math.min(
      Math.abs(colMinutes - min),
      Math.abs(colMinutes - min + 24 * 60),
      Math.abs(colMinutes - min - 24 * 60)
    )
    if (diff < minDiff) {
      minDiff = diff
      closest = { ct, min }
    }
  }
  return closest.ct as CycleTime
}

// Parsea mensaje de ciclo: #ciclo HD:06:00 HI:06:15 HF:06:45 LM:80 C:20
function parseCicloMessage(text: string): {
  hd?: string; hi?: string; hf?: string; lm?: number; c?: number
} | null {
  const lower = text.toLowerCase()
  if (!lower.startsWith('#ciclo') && !lower.startsWith('ciclo')) return null

  const hd = text.match(/HD:(\d{1,2}:\d{2})/i)?.[1]
  const hi = text.match(/HI:(\d{1,2}:\d{2})/i)?.[1]
  const hf = text.match(/HF:(\d{1,2}:\d{2})/i)?.[1]
  const lm = text.match(/LM:(\d+)/i)?.[1]
  const c  = text.match(/\bC:(\d+)/i)?.[1]

  if (!hd && !hi && !hf && lm === undefined && c === undefined) return null

  return {
    hd,
    hi,
    hf,
    lm: lm !== undefined ? parseInt(lm) : undefined,
    c:  c  !== undefined ? parseInt(c)  : undefined,
  }
}

const HELP_MSG = [
  `📋 *Formato para registrar un ciclo:*`,
  ``,
  `\`#ciclo HD:06:00 HI:06:10 HF:06:45 LM:80 C:20\``,
  ``,
  `• *HD* — Hora de despertar`,
  `• *HI* — Inicio de lactancia`,
  `• *HF* — Fin de lactancia`,
  `• *LM* — Leche materna (ml)`,
  `• *C*  — Complemento/fórmula (ml)`,
  ``,
  `Puedes omitir campos que no tengas aún:`,
  `\`#ciclo LM:80 C:20\``,
  ``,
  `Escribe *#ayuda* para ver esto de nuevo.`,
].join('\n')

// Extrae el texto del mensaje de un payload de Evolution API
function extractText(data: any): string | null {
  const msg = data?.message
  if (!msg) return null
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    null
  )
}

// Extrae el JID del remitente (para responder)
function extractReplyJid(data: any): string | null {
  const key = data?.key
  if (!key) return null
  // En grupos, respondemos al grupo; en individual, al sender
  return key.remoteJid || null
}

// ── Handler principal ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Verificar webhook secret si está configurado
    if (WEBHOOK_SECRET) {
      const secret = request.headers.get('x-webhook-secret') || request.headers.get('authorization')
      if (secret !== WEBHOOK_SECRET && secret !== `Bearer ${WEBHOOK_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()

    // Ignorar mensajes propios del bot
    const data = body?.data
    if (!data || data?.key?.fromMe === true) {
      return NextResponse.json({ ok: true, skipped: 'own message' })
    }

    const text = extractText(data)
    const replyJid = extractReplyJid(data)

    if (!text || !replyJid) {
      return NextResponse.json({ ok: true, skipped: 'no text' })
    }

    const trimmed = text.trim()

    // Comando de ayuda
    if (trimmed.toLowerCase() === '#ayuda' || trimmed.toLowerCase() === 'ayuda') {
      await sendWhatsAppMessage(replyJid, HELP_MSG)
      return NextResponse.json({ ok: true, action: 'help' })
    }

    // Comando de ciclo
    const parsed = parseCicloMessage(trimmed)
    if (!parsed) {
      return NextResponse.json({ ok: true, skipped: 'not a ciclo command' })
    }

    await connectDB()

    // Buscar el bebé (app single-baby)
    const baby = await Baby.findOne().lean()
    if (!baby) {
      await sendWhatsAppMessage(replyJid, '⚠️ No hay bebé registrada en el sistema. Regístrala primero en la app.')
      return NextResponse.json({ ok: true, action: 'no_baby' })
    }

    // Determinar cycleTime desde HD (o HI, o ahora)
    const hdDate = parsed.hd ? timeStrToDate(parsed.hd) : null
    const hiDate = parsed.hi ? timeStrToDate(parsed.hi) : null
    const hfDate = parsed.hf ? timeStrToDate(parsed.hf) : null

    const referenceDate = hdDate || hiDate || new Date()
    const nowLocal = new Date(referenceDate.getTime() + COL_OFFSET_MS)
    const colMin = nowLocal.getUTCHours() * 60 + nowLocal.getUTCMinutes()
    const cycleTime = detectCycle(colMin)

    const dayDate = dayMidnightCOL(referenceDate)

    // Calcular valores
    const breastMilkMl = parsed.lm ?? 0
    const complementMl = parsed.c ?? 0
    const totalMl = breastMilkMl + complementMl

    let durationMinutes: number | undefined
    if (hiDate && hfDate) {
      durationMinutes = Math.round((hfDate.getTime() - hiDate.getTime()) / 60000)
    }

    const maxLimitMl = 120
    const minLimitMl = 60
    const exceededLimit = totalMl > maxLimitMl
    const belowMinimum = totalMl > 0 && totalMl < minLimitMl

    // Upsert del ciclo
    const feeding = await Feeding.findOneAndUpdate(
      { babyId: baby._id, date: dayDate, cycleTime },
      {
        $set: {
          ...(hdDate ? { wakeTime: hdDate } : {}),
          ...(hiDate ? { startTime: hiDate } : {}),
          ...(hfDate ? { endTime: hfDate } : {}),
          ...(durationMinutes != null ? { durationMinutes } : {}),
          ...(parsed.lm != null ? { breastMilkMl, totalMl: breastMilkMl + (parsed.c ?? 0) } : {}),
          ...(parsed.c  != null ? { complementMl, totalMl: (parsed.lm ?? 0) + complementMl } : {}),
          exceededLimit,
          belowMinimum,
          maxLimitMl,
          minLimitMl,
        },
        $setOnInsert: {
          babyId: baby._id,
          date: dayDate,
          cycleTime,
          breastMilkMl: parsed.lm ?? 0,
          complementMl: parsed.c ?? 0,
          totalMl,
          maxLimitMl,
          minLimitMl,
          diaperChanges: 0,
          diaperType: 'none',
          exceededLimit,
          belowMinimum,
          compensationFromPrevious: false,
        },
      },
      { upsert: true, new: true }
    )

    // Respuesta de confirmación
    const fmtTime = (d: Date | null) =>
      d ? d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Bogota' }) : '--'

    const lines = [
      `✅ *Ciclo ${cycleTime} registrado!*`,
      ``,
      `⏰ HD: ${fmtTime(hdDate)}  HI: ${fmtTime(hiDate)}  HF: ${fmtTime(hfDate)}`,
      `🍼 LM: ${breastMilkMl}ml  C: ${complementMl}ml  Total: ${totalMl}ml`,
      durationMinutes != null ? `⏱️ Duración lactancia: ${durationMinutes} min` : null,
      exceededLimit ? `⚠️ Supera el límite máximo (${maxLimitMl}ml)` : null,
      belowMinimum  ? `⚠️ Por debajo del mínimo (${minLimitMl}ml)` : null,
    ].filter(Boolean).join('\n')

    await sendWhatsAppMessage(replyJid, lines)

    return NextResponse.json({ ok: true, action: 'ciclo_saved', feedingId: feeding._id })
  } catch (err: any) {
    console.error('[api/whatsapp]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET para verificar que el webhook está activo
export async function GET() {
  return NextResponse.json({ ok: true, service: 'noecare-whatsapp-webhook' })
}
