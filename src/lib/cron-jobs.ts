import cron from 'node-cron'
import connectDB from '@/lib/mongodb'
import Feeding from '@/models/Feeding'
import Medication from '@/models/Medication'
import Diaper from '@/models/Diaper'
import Sleep from '@/models/Sleep'
import MomLog from '@/models/MomLog'
import { sendFeedingAlert, sendMedAlert, sendDailySummary } from '@/lib/evolution-api'

// Evita registrar cron jobs múltiples veces en hot-reload de desarrollo
let initialized = false

export function initCronJobs() {
  if (initialized) return
  initialized = true

  const alertPhone = process.env.WHATSAPP_ALERT_PHONE
  if (!alertPhone) {
    console.warn('[cron] WHATSAPP_ALERT_PHONE no configurado — alertas WhatsApp deshabilitadas')
  }

  // ──────────────────────────────────────────────
  // Cron 1: Alerta de toma de leche
  // Cada 15 minutos revisa si han pasado más de 3h desde la última toma
  // ──────────────────────────────────────────────
  cron.schedule('*/15 * * * *', async () => {
    if (!alertPhone) return
    try {
      await connectDB()
      const lastFeeding = await Feeding.findOne().sort({ startTime: -1 }).lean()
      if (!lastFeeding) return
      const diff = Date.now() - new Date(lastFeeding.startTime).getTime()
      const threeHours = 3 * 60 * 60 * 1000
      // Solo alerta si están exactamente en la ventana 3h–3h15m (para no repetir)
      if (diff >= threeHours && diff < threeHours + 15 * 60 * 1000) {
        await sendFeedingAlert(alertPhone, new Date(lastFeeding.startTime).toISOString())
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
    if (!alertPhone) return
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
        await sendMedAlert(alertPhone, med.name, med.dosage)
        console.log(`[cron] Alerta medicamento: ${med.name}`)
      }
    } catch (err) {
      console.error('[cron] Error en alertas de medicamentos:', err)
    }
  })

  // ──────────────────────────────────────────────
  // Cron 3: Resumen diario — todos los días a las 8:00 AM (hora Bogotá = UTC-5)
  // En UTC eso es las 13:00
  // ──────────────────────────────────────────────
  cron.schedule('0 13 * * *', async () => {
    if (!alertPhone) return
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

      await sendDailySummary(alertPhone, { feedingsCount, diapersCount, sleepMinutes, momPain })
      console.log('[cron] Resumen diario enviado')
    } catch (err) {
      console.error('[cron] Error en resumen diario:', err)
    }
  })

  console.log('[cron] Jobs inicializados ✓')
}
