'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import PainScale from '@/components/mama/PainScale'
import MedReminder from '@/components/mama/MedReminder'
import WoundStatus from '@/components/mama/WoundStatus'
import type { MedEntry } from '@/lib/mom-data'

// ─── Constantes de selección ────────────────────────────────────────────────

const LOCHIA_COLORS = [
  { value: 'red', label: '🔴 Rojo (normal primeros días)' },
  { value: 'pink', label: '🩷 Rosado' },
  { value: 'brown', label: '🟤 Marrón / parduzco' },
  { value: 'yellow', label: '🟡 Amarillento' },
  { value: 'white', label: '⚪ Blanco / claro' },
]

const LOCHIA_AMOUNTS = [
  { value: 'heavy', label: '🩸🩸🩸 Abundante' },
  { value: 'moderate', label: '🩸🩸 Moderado' },
  { value: 'light', label: '🩸 Escaso' },
]

const ACTIVITY_LEVELS = [
  { value: 'bed_rest', label: '🛏️ Reposo absoluto', desc: 'Solo levantarse al baño' },
  { value: 'walking', label: '🚶 Caminar poco', desc: 'Pasos cortos en casa' },
  { value: 'light', label: '🏠 Actividad ligera', desc: 'Tareas básicas sin esfuerzo' },
  { value: 'normal', label: '✅ Actividad normal', desc: 'Sin restricciones' },
]

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: 'Muy mal' },
  { value: 2, emoji: '😔', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😄', label: 'Excelente' },
]

const PAIN_ZONES = ['Herida', 'Cabeza', 'Espalda', 'Pecho', 'Piernas', 'Abdomen', 'Otro']

// ─── Componente principal ────────────────────────────────────────────────────

interface MomFormProps {
  activeMeds: MedEntry[]
}

export default function MomForm({ activeMeds }: MomFormProps) {
  const [painLevel, setPainLevel] = useState(0)
  const [painZone, setPainZone] = useState('')
  const [temperature, setTemperature] = useState('')
  const [woundStatus, setWoundStatus] = useState('')
  const [lochiaColor, setLochiaColor] = useState('')
  const [lochiaAmount, setLochiaAmount] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [mood, setMood] = useState(0)
  const [checkedMedIds, setCheckedMedIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Sección expandida para navegar el formulario en mobile
  const [section, setSection] = useState<'bienestar' | 'herida' | 'meds' | 'notas'>('bienestar')

  function toggleMed(id: string) {
    setCheckedMedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/mom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          painLevel: painLevel || undefined,
          painZone: painZone || undefined,
          temperature: temperature ? Number(temperature) : undefined,
          woundStatus: woundStatus || undefined,
          lochiaColor: lochiaColor || undefined,
          lochiaAmount: lochiaAmount || undefined,
          activityLevel: activityLevel || undefined,
          mood: mood || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error al guardar')
        setStatus('error')
        return
      }

      setStatus('ok')
      // Reset
      setPainLevel(0)
      setPainZone('')
      setTemperature('')
      setWoundStatus('')
      setLochiaColor('')
      setLochiaAmount('')
      setActivityLevel('')
      setMood(0)
      setCheckedMedIds([])
      setNotes('')
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setErrorMsg('Error de conexión')
      setStatus('error')
    }
  }

  const TABS = [
    { key: 'bienestar', label: '💊 Bienestar' },
    { key: 'herida', label: '🩹 Herida' },
    { key: 'meds', label: `💉 Medicamentos${checkedMedIds.length > 0 ? ` (${checkedMedIds.length})` : ''}` },
    { key: 'notas', label: '📝 Notas' },
  ] as const

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tabs de sección */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              section === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Sección: Bienestar ── */}
      {section === 'bienestar' && (
        <div className="space-y-5">
          {/* Dolor */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Nivel de dolor</Label>
            <PainScale value={painLevel} onChange={setPainLevel} />
          </div>

          {/* Zona de dolor */}
          {painLevel > 0 && (
            <div className="space-y-2">
              <Label>Zona de dolor</Label>
              <div className="flex flex-wrap gap-2">
                {PAIN_ZONES.map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setPainZone(painZone === zone ? '' : zone)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      painZone === zone
                        ? 'border-rose-400 bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
                        : 'border-border bg-background text-foreground'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Temperatura */}
          <div className="space-y-2">
            <Label htmlFor="mom-temp">
              Temperatura (°C){' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="mom-temp"
                type="number"
                step="0.1"
                min={35}
                max={42}
                placeholder="36.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="h-11 max-w-[140px] text-xl font-bold text-center"
              />
              {temperature && (
                <span
                  className={`text-sm font-medium ${
                    Number(temperature) >= 37.5 ? 'text-red-500' : 'text-green-600'
                  }`}
                >
                  {Number(temperature) >= 37.5 ? '🌡️ Fiebre' : '✅ Normal'}
                </span>
              )}
            </div>
          </div>

          {/* Humor */}
          <div className="space-y-2">
            <Label>Estado de ánimo</Label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMood(mood === value ? 0 : value)}
                  title={label}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all active:scale-95 ${
                    mood === value
                      ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20'
                      : 'border-border bg-background opacity-60'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nivel de actividad */}
          <div className="space-y-2">
            <Label>
              Nivel de actividad{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActivityLevel(activityLevel === value ? '' : value)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all active:scale-95 ${
                    activityLevel === value
                      ? 'border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-200'
                      : 'border-border bg-background opacity-70'
                  }`}
                >
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sección: Herida ── */}
      {section === 'herida' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Estado de la herida</Label>
            <WoundStatus value={woundStatus} onChange={setWoundStatus} />
          </div>

          <div className="space-y-2">
            <Label>Color de loquios</Label>
            <div className="space-y-2">
              {LOCHIA_COLORS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLochiaColor(lochiaColor === value ? '' : value)}
                  className={`flex w-full items-center rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                    lochiaColor === value
                      ? 'border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-200'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {lochiaColor && (
            <div className="space-y-2">
              <Label>Cantidad de loquios</Label>
              <div className="flex gap-2">
                {LOCHIA_AMOUNTS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLochiaAmount(lochiaAmount === value ? '' : value)}
                    className={`flex-1 rounded-xl border-2 py-3 text-xs font-medium transition-all active:scale-95 ${
                      lochiaAmount === value
                        ? 'border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-200'
                        : 'border-border bg-background'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Sección: Medicamentos ── */}
      {section === 'meds' && (
        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">Medicamentos tomados</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Marca los que tomaste en este registro
            </p>
          </div>
          <MedReminder
            meds={activeMeds}
            checkedIds={checkedMedIds}
            onToggle={toggleMed}
          />
        </div>
      )}

      {/* ── Sección: Notas ── */}
      {section === 'notas' && (
        <div className="space-y-2">
          <Label htmlFor="mom-notes" className="text-base font-semibold">
            Notas del día
          </Label>
          <Textarea
            id="mom-notes"
            placeholder="¿Cómo te sentiste hoy? ¿Algo a reportar al médico?..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none text-base min-h-[160px]"
          />
        </div>
      )}

      {/* Feedback */}
      {status === 'ok' && (
        <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-200">
          ✅ Registro guardado correctamente
        </div>
      )}
      {status === 'error' && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          ❌ {errorMsg}
        </div>
      )}

      <Button
        type="submit"
        disabled={status === 'loading'}
        className="h-12 w-full text-base font-semibold bg-rose-500 hover:bg-rose-600 text-white"
      >
        {status === 'loading' ? 'Guardando...' : '❤️ Guardar registro'}
      </Button>
    </form>
  )
}
