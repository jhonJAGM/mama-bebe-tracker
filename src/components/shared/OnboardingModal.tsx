'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/appStore'

export default function OnboardingModal() {
  const { setBaby } = useAppStore()
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    birthWeight: '',
    birthHeight: '',
    bloodType: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          birthDate: form.birthDate,
          birthWeight: parseFloat(form.birthWeight),
          birthHeight: parseFloat(form.birthHeight),
          bloodType: form.bloodType || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al registrar')
        return
      }

      setBaby({ _id: data.baby._id, name: data.baby.name, birthDate: data.baby.birthDate })
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0f0f1a] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl">👶</div>
          <h2 className="text-lg font-black text-white">Registrar bebé</h2>
          <p className="text-xs text-white/40">Para comenzar, ingresa los datos de la bebé</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Noelia"
              required
              className="w-full rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
            />
          </div>

          {/* Fecha de nacimiento */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Fecha de nacimiento</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => update('birthDate', e.target.value)}
              required
              className="w-full rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-all"
            />
          </div>

          {/* Peso y talla */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Peso (g)</label>
              <input
                type="number"
                value={form.birthWeight}
                onChange={(e) => update('birthWeight', e.target.value)}
                placeholder="3200"
                required
                min="500"
                max="6000"
                className="w-full rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Talla (cm)</label>
              <input
                type="number"
                value={form.birthHeight}
                onChange={(e) => update('birthHeight', e.target.value)}
                placeholder="50"
                required
                min="30"
                max="65"
                className="w-full rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-rose-500/50 transition-all"
              />
            </div>
          </div>

          {/* Tipo de sangre (opcional) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Tipo de sangre (opcional)</label>
            <select
              value={form.bloodType}
              onChange={(e) => update('bloodType', e.target.value)}
              className="w-full rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500/50 transition-all"
            >
              <option value="">No sé / No ingresado</option>
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Registrar bebé →'}
          </button>
        </form>
      </div>
    </div>
  )
}
