import cron from 'node-cron'
import connectDB from '@/lib/mongodb'
import Feeding from '@/models/Feeding'
import Medication from '@/models/Medication'
import Diaper from '@/models/Diaper'
import Sleep from '@/models/Sleep'
import MomLog from '@/models/MomLog'
import { sendWhatsAppMessage, sendMedAlert, sendDailySummary } from '@/lib/evolution-api'

// Evita registrar cron jobs múltiples veces en hot-reload de desarrollo
let initialized = false

export function initCronJobs() {
  if (initialized) return
  initialized = true

  const alertPhone = process.env.WHATSAPP_ALERT_PHONE
  const groupJid = process.env.WHATSAPP_GROUP_JID

  // Destinatario principal: grupo si está configurado, si no el teléfono individual
  const mainRecipient = groupJid || alertPhone

  if (!mainRecipient) {
    console.warn('[cron] WHATSAPP_GROUP_JID ni WHATSAPP_ALERT_PHONE configurados — alertas deshabilitadas')
  }

  // ──────────────────────────────────────────────
  // Cron 1: Alerta de toma de leche
  // Cada 15 minutos revisa si han pasado más de 3h desde la última toma
  // ──────────────────────────────────────────────
  cron.schedule('*/15 * * * *', async () => {
    if (!alertPhone) return
    try {
      await connectDB()
      const lastFeeding = await Feeding.findOne({ startTime: { $exists: true } }).sort({ startTime: -1 }).lean()
      if (!lastFeeding || !lastFeeding.startTime) return
      const diff = Date.now() - new Date(lastFeeding.startTime).getTime()
      const threeHours = 3 * 60 * 60 * 1000
      if (diff >= threeHours && diff < threeHours + 15 * 60 * 1000) {
        const last = new Date(lastFeeding.startTime)
        const next = new Date(last.getTime() + threeHours)
        const hora = next.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })
        await sendWhatsAppMessage(mainRecipient!, `👶 *Toma pendiente* — ${hora}\nHan pasado 3 horas desde la última alimentación de Noelia.`)
        console.log('[cron] Alerta de toma enviada')
      }
    } catch (err) {
      console.error('[cron] Error en alerta de toma:', err)
    }
  })

  // ──────────────────────────────────────────────
  // Cron 2: Alertas de medicamentos
  // Cada 10 minutos revisa medicamentos con nextDue próximos (+/- 5 min)
  // ──────────────────────────────────────────────
  cron.schedule('*/10 * * * *', async () => {
    if (!mainRecipient) return
    try {
      await connectDB()
      const now = new Date()
      const windowStart = new Date(now.getTime() - 5 * 60 * 1000)
      const windowEnd = new Date(now.getTime() + 5 * 60 * 1000)
      const dueMeds = await Medication.find({
        active: true,
        alertWapp: true,
        nextDue: { $gte: windowStart, $lte: windowEnd },
      }).lean()

      for (const med of dueMeds) {
        await sendMedAlert(mainRecipient, med.name, med.dosage)
        console.log(`[cron] Alerta medicamento: ${med.name}`)
      }
    } catch (err) {
      console.error('[cron] Error en alertas de medicamentos:', err)
    }
  })

  // ──────────────────────────────────────────────
  // Cron 3: Recordatorio 8am Colombia (13:00 UTC)
  // Baño de Noelia + Probióticos 5 gotas
  // ──────────────────────────────────────────────
  cron.schedule('0 13 * * *', async () => {
    if (!mainRecipient) return
    try {
      const msg = [
        `🌅 *Buenos días, familia GM!*`,
        ``,
        `📋 Recordatorios de esta mañana:`,
        `🛁 Baño de Noelia`,
        `💊 Probióticos — 5 gotas`,
        ``,
        `Que tengan un hermoso día con Noelia 🌸`,
      ].join('\n')
      await sendWhatsAppMessage(mainRecipient, msg)
      console.log('[cron] Recordatorio 8am enviado')
    } catch (err) {
      console.error('[cron] Error en recordatorio 8am:', err)
    }
  })

  // ──────────────────────────────────────────────
  // Cron 4: Recordatorio 9am Colombia (14:00 UTC)
  // Baño de sol + limpiar nariz
  // ──────────────────────────────────────────────
  cron.schedule('0 14 * * *', async () => {
    if (!mainRecipient) return
    try {
      const msg = [
        `☀️ *¡Hora del sol!*`,
        ``,
        `🌞 Baño de sol — 15 a 20 minutos`,
        `👃 Limpiar nariz de Noelia si es necesario`,
        ``,
        `El sol es vitamina D natural 💛`,
      ].join('\n')
      await sendWhatsAppMessage(mainRecipient, msg)
      console.log('[cron] Recordatorio 9am enviado')
    } catch (err) {
      console.error('[cron] Error en recordatorio 9am:', err)
    }
  })

  // ──────────────────────────────────────────────
  // Cron 5: Resumen diario — 7:30am Colombia (12:30 UTC)
  // Resumen del día anterior
  // ──────────────────────────────────────────────
  cron.schedule('30 12 * * *', async () => {
    if (!mainRecipient) return
    try {
      await connectDB()
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)

      const [feedingsResult, diapersResult, sleepsResult, momResult] = await Promise.allSettled([
        Feeding.countDocuments({ startTime: { $gte: yesterday, $lt: today } }),
        Diaper.countDocuments({ time: { $gte: yesterday, $lt: today } }),
        Sleep.find({ startTime: { $gte: yesterday, $lt: today }, endTime: { $exists: true } }).lean(),
        MomLog.findOne({ date: { $gte: yesterday, $lt: today } }).sort({ date: -1 }).lean(),
      ])

      const feedingsCount = feedingsResult.status === 'fulfilled' ? feedingsResult.value : 0
      const diapersCount = diapersResult.status === 'fulfilled' ? diapersResult.value : 0
      const sleepMinutes =
        sleepsResult.status === 'fulfilled'
          ? sleepsResult.value.reduce((acc: number, s: any) => acc + (s.durationMinutes ?? 0), 0)
          : 0
      const momPain =
        momResult.status === 'fulfilled' && momResult.value ? (momResult.value as any).painLevel : null

      await sendDailySummary(mainRecipient, { feedingsCount, diapersCount, sleepMinutes, momPain })
      console.log('[cron] Resumen diario enviado')
    } catch (err) {
      console.error('[cron] Error en resumen diario:', err)
    }
  })

  console.log('[cron] Jobs inicializados ✓')
}
