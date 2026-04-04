'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const LOCATIONS = ['Cuna', 'Brazos', 'Coche', 'Colecho', 'Silla', 'Otro']

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition-transform active:scale-90 ${
            star <= value ? 'opacity-100' : 'opacity-30'
          }`}
        >
          ⭐
        </button>
      ))}
    </div>
  )
}

export default function SleepForm({ babyId }: { babyId: string }) {
  const [sleepType, setSleepType] = useState<'day' | 'night'>('day')
  const [startTime, setStartTime] = useState(toLocalDatetimeValue(new Date()))
  const [endTime, setEndTime] = useState('')
  const [quality, setQuality] = useState(3)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          type: sleepType,
          startTime: new Date(startTime).toISOString(),
          endTime: endTime ? new Date(endTime).toISOString() : undefined,
          quality,
          location: location || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error al registrar')
        setStatus('error')
        return
      }

      setStatus('ok')
      setStartTime(toLocalDatetimeValue(new Date()))
      setEndTime('')
      setQuality(3)
      setLocation('')
      setNotes('')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setErrorMsg('Error de conexión')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo: día / noche */}
      <div className="space-y-2">
        <Label>Tipo de sueño</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSleepType('day')}
            className={`rounded-xl border-2 py-4 text-sm font-semibold transition-all active:scale-95 ${
              sleepType === 'day'
                ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                : 'border-border bg-background text-foreground opacity-70'
            }`}
          >
            ☀️ Siesta diurna
          </button>
          <button
            type="button"
            onClick={() => setSleepType('night')}
            className={`rounded-xl border-2 py-4 text-sm font-semibold transition-all active:scale-95 ${
              sleepType === 'night'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200'
                : 'border-border bg-background text-foreground opacity-70'
            }`}
          >
            🌙 Sueño nocturno
          </button>
        </div>
      </div>

      {/* Hora inicio */}
      <div className="space-y-2">
        <Label htmlFor="sleep-start">Hora de inicio</Label>
        <div className="flex gap-2">
          <Input
            id="sleep-start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-11 flex-1 text-base"
            required
          />
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setStartTime(toLocalDatetimeValue(new Date()))}
            className="h-11 px-4 shrink-0"
          >
            Ahora
          </Button>
        </div>
      </div>

      {/* Hora fin */}
      <div className="space-y-2">
        <Label htmlFor="sleep-end">
          Hora de fin <span className="text-muted-foreground">(opcional — si ya despertó)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="sleep-end"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="h-11 flex-1 text-base"
          />
          {endTime && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setEndTime('')}
              className="h-11 px-3 shrink-0 text-muted-foreground"
            >
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Calidad */}
      <div className="space-y-2">
        <Label>
          Calidad del sueño{' '}
          <span className="text-muted-foreground text-xs">
            ({['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][quality]})
          </span>
        </Label>
        <StarRating value={quality} onChange={setQuality} />
      </div>

      {/* Lugar */}
      <div className="space-y-2">
        <Label>
          Lugar <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(location === loc ? '' : loc)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                location === loc
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="sleep-notes">
          Notas <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="sleep-notes"
          placeholder="¿Cuántas veces despertó? ¿Se calmó solo?..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none text-base"
          rows={2}
        />
      </div>

      {/* Feedback */}
      {status === 'ok' && (
        <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-200">
          ✅ Sueño registrado correctamente
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
        className="h-12 w-full text-base font-semibold"
      >
        {status === 'loading' ? 'Guardando...' : '😴 Registrar sueño'}
      </Button>
    </form>
  )
}
