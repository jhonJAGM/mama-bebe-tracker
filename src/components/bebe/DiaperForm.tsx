'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const DIAPER_TYPES = [
  { value: 'pee', label: '💧 Pipi', active: 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' },
  { value: 'poop', label: '💩 Caca', active: 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200' },
  { value: 'both', label: '💧💩 Ambos', active: 'border-purple-400 bg-purple-50 text-purple-800 dark:bg-purple-950/30 dark:text-purple-200' },
  { value: 'dry', label: '✅ Seco', active: 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200' },
]

const COLORS = ['Amarillo', 'Verde', 'Negro (meconio)', 'Naranja', 'Marrón', 'Otro']
const CONSISTENCIES = ['Líquida', 'Pastosa', 'Sólida']

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function DiaperForm({ babyId }: { babyId: string }) {
  const [type, setType] = useState('pee')
  const [time, setTime] = useState(toLocalDatetimeValue(new Date()))
  const [color, setColor] = useState('')
  const [consistency, setConsistency] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/diaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          type,
          time: new Date(time).toISOString(),
          color: color || undefined,
          consistency: consistency || undefined,
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
      setTime(toLocalDatetimeValue(new Date()))
      setColor('')
      setConsistency('')
      setNotes('')
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setErrorMsg('Error de conexión')
      setStatus('error')
    }
  }

  const showDetails = type === 'poop' || type === 'both'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo de pañal — botones grandes táctiles */}
      <div className="space-y-2">
        <Label>Tipo de pañal</Label>
        <div className="grid grid-cols-2 gap-3">
          {DIAPER_TYPES.map(({ value, label, active }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-xl border-2 py-4 px-3 text-sm font-semibold transition-all active:scale-95 ${
                type === value ? active : 'border-border bg-background text-foreground opacity-70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hora */}
      <div className="space-y-2">
        <Label htmlFor="diaper-time">Hora del cambio</Label>
        <div className="flex gap-2">
          <Input
            id="diaper-time"
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-11 flex-1 text-base"
            required
          />
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setTime(toLocalDatetimeValue(new Date()))}
            className="h-11 px-4 shrink-0"
          >
            Ahora
          </Button>
        </div>
      </div>

      {/* Color y consistencia — solo si hay caca */}
      {showDetails && (
        <>
          <div className="space-y-2">
            <Label>
              Color <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(color === c ? '' : c)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    color === c
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Consistencia <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <div className="flex gap-2">
              {CONSISTENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConsistency(consistency === c ? '' : c)}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                    consistency === c
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="diaper-notes">
          Notas <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="diaper-notes"
          placeholder="Observaciones..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none text-base"
          rows={2}
        />
      </div>

      {status === 'ok' && (
        <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 px-4 py-3 text-sm font-medium text-green-800 dark:text-green-200">
          ✅ Pañal registrado correctamente
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
        {status === 'loading' ? 'Guardando...' : '👶 Registrar pañal'}
      </Button>
    </form>
  )
}
