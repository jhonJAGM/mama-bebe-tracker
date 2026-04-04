'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const FEED_TYPES = [
  { value: 'breast_left', label: '🤱 Pecho izquierdo' },
  { value: 'breast_right', label: '🤱 Pecho derecho' },
  { value: 'formula', label: '🍼 Biberón / fórmula' },
  { value: 'mixed', label: '🔀 Mixto' },
]

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function FeedForm({ babyId }: { babyId: string }) {
  const [type, setType] = useState('breast_left')
  const [startTime, setStartTime] = useState(toLocalDatetimeValue(new Date()))
  const [endTime, setEndTime] = useState('')
  const [amountMl, setAmountMl] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          type,
          startTime: new Date(startTime).toISOString(),
          endTime: endTime ? new Date(endTime).toISOString() : undefined,
          amountMl: amountMl ? Number(amountMl) : undefined,
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
      setAmountMl('')
      setNotes('')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setErrorMsg('Error de conexión')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo de toma — selector visual */}
      <div className="space-y-2">
        <Label>Tipo de toma</Label>
        <div className="grid grid-cols-2 gap-2">
          {FEED_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-xl border-2 py-3 px-3 text-sm font-medium transition-all active:scale-95 ${
                type === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hora inicio */}
      <div className="space-y-2">
        <Label htmlFor="start-time">Hora de inicio</Label>
        <div className="flex gap-2">
          <Input
            id="start-time"
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

      {/* Hora fin (opcional) */}
      <div className="space-y-2">
        <Label htmlFor="end-time">
          Hora de fin <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="end-time"
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="h-11 text-base"
        />
      </div>

      {/* Cantidad ml — solo para fórmula o mixto */}
      {(type === 'formula' || type === 'mixed') && (
        <div className="space-y-2">
          <Label htmlFor="amount-ml">
            Cantidad (ml){type === 'formula' && ' *'}
          </Label>
          <Input
            id="amount-ml"
            type="number"
            min={0}
            max={500}
            step={5}
            placeholder="ej. 90"
            value={amountMl}
            onChange={(e) => setAmountMl(e.target.value)}
            className="h-11 text-base"
            required={type === 'formula'}
          />
        </div>
      )}

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="feed-notes">
          Notas <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="feed-notes"
          placeholder="Observaciones..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none text-base"
          rows={2}
        />
      </div>

      {status === 'ok' && (
        <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-200">
          ✅ Toma registrada correctamente
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
        {status === 'loading' ? 'Guardando...' : '🍼 Registrar toma'}
      </Button>
    </form>
  )
}
