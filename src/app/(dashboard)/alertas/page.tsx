'use client'

import { useState, useEffect } from 'react'

type AlertConfig = {
  alertPhone: string
  evolutionConfigured: boolean
}

export default function AlertasPage() {
  const [config, setConfig] = useState<AlertConfig | null>(null)
  const [phone, setPhone] = useState('')
  const [testMessage, setTestMessage] = useState('👋 Hola! Esta es una alerta de prueba de NoeCare.')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((data: AlertConfig) => {
        setConfig(data)
        setPhone(data.alertPhone)
      })
      .catch(console.error)
  }, [])

  async function sendTest() {
    if (!phone.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), message: testMessage }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: 'Mensaje enviado correctamente ✓' })
      } else {
        setResult({ ok: false, msg: data.error ?? 'Error desconocido' })
      }
    } catch {
      setResult({ ok: false, msg: 'No se pudo conectar con la API' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-rose-700">Alertas WhatsApp</h1>

      {/* Estado de Evolution API */}
      <div className={`rounded-2xl p-4 border ${config?.evolutionConfigured ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{config?.evolutionConfigured ? '✅' : '⚠️'}</span>
          <div>
            <p className="font-semibold text-sm">
              {config?.evolutionConfigured ? 'Evolution API configurada' : 'Evolution API no configurada'}
            </p>
            <p className="text-xs text-gray-500">
              {config?.evolutionConfigured
                ? 'Las alertas automáticas están activas'
                : 'Configura EVOLUTION_API_URL, EVOLUTION_API_KEY y EVOLUTION_INSTANCE en las variables de entorno'}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas automáticas configuradas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Alertas automáticas</h2>
        <div className="space-y-3">
          {[
            { icon: '🍼', label: 'Toma de leche', desc: 'Avisa cuando pasen 3h sin registrar toma' },
            { icon: '💊', label: 'Medicamentos', desc: 'Avisa 5 minutos antes del horario indicado' },
            { icon: '📊', label: 'Resumen diario', desc: 'Envía resumen del día anterior a las 8:00 AM' },
          ].map((a) => (
            <div key={a.label} className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl">
              <span className="text-xl shrink-0">{a.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{a.label}</p>
                <p className="text-xs text-gray-500">{a.desc}</p>
              </div>
              <span className="ml-auto text-xs text-green-600 font-medium shrink-0">Activo</span>
            </div>
          ))}
        </div>
      </div>

      {/* Envío de mensaje de prueba */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Enviar mensaje de prueba</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Número de WhatsApp (con código de país, sin +)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="573001234567"
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mensaje</label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>
          <button
            onClick={sendTest}
            disabled={sending || !phone.trim() || !config?.evolutionConfigured}
            className="w-full py-3 bg-rose-500 text-white rounded-2xl font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {sending ? 'Enviando...' : 'Enviar prueba'}
          </button>
          {result && (
            <p className={`text-sm text-center font-medium ${result.ok ? 'text-green-600' : 'text-red-600'}`}>
              {result.msg}
            </p>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">Para configurar el número de alertas:</p>
        <p>Agrega <code className="bg-blue-100 px-1 rounded text-xs">WHATSAPP_ALERT_PHONE=573001234567</code> en las variables de entorno de Railway.</p>
      </div>
    </div>
  )
}
