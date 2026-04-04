'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

function toLocalDateValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

interface GrowthFormProps {
  babyId: string
  onSaved?: () => void  // callback para refrescar datos tras guardar
}

// Formulario para registrar una medición de crecimiento.
// Al menos uno de los tres campos numéricos es requerido (validado también en API).
export default function GrowthForm({ babyId, onSaved }: GrowthFormProps) {
  const [date, setDate] = useState(toLocalDateValue(new Date()))
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const hasAtLeastOne = weightKg || heightCm || headCircumferenceCm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasAtLeastOne) {
      setErrorMsg('Ingresa al menos una medición (peso, talla o cefálico)')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          date: new Date(date).toISOString(),
          weightKg: weightKg ? Number(weightKg) : undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
          headCircumferenceCm: headCircumferenceCm ? Number(headCircumferenceCm) : undefined,
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
      setWeightKg('')
      setHeightCm('')
      setHeadCircumferenceCm('')
      setNotes('')
      setTimeout(() => {
        setStatus('idle')
        onSaved?.()
      }, 2000)
    } catch {
      setErrorMsg('Error de conexión')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fecha */}
      <div className="space-y-1.5">
        <Label htmlFor="growth-date">Fecha de la medición</Label>
        <Input
          id="growth-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 text-base"
          required
        />
      </div>

      {/* Tres métricas en grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="weight" className="text-xs">
            Peso (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.001"
            min={0.5}
            max={30}
            placeholder="3.250"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="h-11 text-center text-base font-medium"
          />
          <p className="text-[10px] text-center text-muted-foreground">ej: 3.250</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="height" className="text-xs">
            Talla (cm)
          </Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            min={30}
            max={120}
            placeholder="50.5"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="h-11 text-center text-base font-medium"
          />
          <p className="text-[10px] text-center text-muted-foreground">ej: 50.5</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="head" className="text-xs leading-tight text-center block">
            Cefálico (cm)
          </Label>
          <Input
            id="head"
            type="number"
            step="0.1"
            min={20}
            max={60}
            placeholder="34.0"
            value={headCircumferenceCm}
            onChange={(e) => setHeadCircumferenceCm(e.target.value)}
            className="h-11 text-center text-base font-medium"
          />
          <p className="text-[10px] text-center text-muted-foreground">ej: 34.0</p>
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label htmlFor="growth-notes">
          Notas <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="growth-notes"
          placeholder="Control del pediatra, observaciones..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none text-base"
          rows={2}
        />
      </div>

      {status === 'ok' && (
        <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-200">
          ✅ Medición registrada
        </div>
      )}
      {status === 'error' && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 px-4 py-3 text-sm text-red-700">
          ❌ {errorMsg}
        </div>
      )}

      <Button
        type="submit"
        disabled={status === 'loading' || !hasAtLeastOne}
        className="h-12 w-full text-base font-semibold"
      >
        {status === 'loading' ? 'Guardando...' : '📏 Registrar medición'}
      </Button>
    </form>
  )
}
