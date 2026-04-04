// Cliente Evolution API para alertas WhatsApp
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE!
const WHATSAPP_ALERT_GROUP = process.env.WHATSAPP_ALERT_GROUP! // 120363408715206134@g.us — grupo "Alertas Noe"

export async function sendWhatsAppMessage(phone: string, message: string) {
  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  })

  if (!response.ok) {
    throw new Error(`Evolution API error: ${response.statusText}`)
  }

  return response.json()
}

// Alerta: próxima toma de leche
export async function sendFeedingAlert(lastFeedISO: string) {
  const last = new Date(lastFeedISO)
  const next = new Date(last.getTime() + 3 * 60 * 60 * 1000)
  const hora = next.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })
  return sendWhatsAppMessage(WHATSAPP_ALERT_GROUP, `👶 *Próxima toma:* ${hora}\nHan pasado 3 horas desde la última alimentación.`)
}

// Alerta: medicamento pendiente
export async function sendMedAlert(medName: string, dosage: string) {
  return sendWhatsAppMessage(WHATSAPP_ALERT_GROUP, `💊 *Medicamento pendiente:* ${medName}\nDosis: ${dosage}\n¡Es hora de tomarlo!`)
}

// Resumen diario (8am)
export async function sendDailySummary(
  summary: { feedingsCount: number; diapersCount: number; sleepMinutes: number; momPain: number | null }
) {
  const sleepH = Math.floor(summary.sleepMinutes / 60)
  const sleepM = summary.sleepMinutes % 60
  const painText = summary.momPain != null ? `${summary.momPain}/10` : 'sin registro'
  const msg = [
    `📊 *Resumen de ayer*`,
    `🍼 Tomas: ${summary.feedingsCount}`,
    `🚼 Pañales: ${summary.diapersCount}`,
    `😴 Sueño bebé: ${sleepH}h ${sleepM}m`,
    `💛 Dolor mamá: ${painText}`,
  ].join('\n')
  return sendWhatsAppMessage(WHATSAPP_ALERT_GROUP, msg)
}
