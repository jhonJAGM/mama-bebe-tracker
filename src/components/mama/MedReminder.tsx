'use client'

import { Badge } from '@/components/ui/badge'
import type { MedEntry } from '@/lib/mom-data'

interface MedReminderProps {
  meds: MedEntry[]
  // IDs de los meds marcados como tomados en este registro
  checkedIds: string[]
  onToggle: (id: string) => void
}

function formatHour(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// Checklist de medicamentos activos de mamá.
// Permite marcar cuáles fueron tomados en este registro.
export default function MedReminder({ meds, checkedIds, onToggle }: MedReminderProps) {
  if (meds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin medicamentos activos.{' '}
        <a href="/mama/medicamentos" className="underline">
          Agregar
        </a>
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {meds.map((med) => {
        const checked = checkedIds.includes(med.id)
        const minutesUntil = med.nextDue
          ? Math.round((new Date(med.nextDue).getTime() - Date.now()) / 60000)
          : null
        const isDue = minutesUntil !== null && minutesUntil <= 30 && minutesUntil >= -30

        return (
          <button
            key={med.id}
            type="button"
            onClick={() => onToggle(med.id)}
            className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all active:scale-[0.98] ${
              checked
                ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                : isDue
                ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
                : 'border-border bg-background'
            }`}
          >
            {/* Checkbox visual */}
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-all ${
                checked
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-border'
              }`}
            >
              {checked ? '✓' : ''}
            </span>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${checked ? 'line-through text-muted-foreground' : ''}`}>
                {med.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {med.dosage} · cada {med.frequencyHours}h
              </p>
            </div>

            <div className="text-right">
              {med.nextDue && (
                <Badge
                  variant={isDue && !checked ? 'default' : 'outline'}
                  className="text-[10px]"
                >
                  {formatHour(med.nextDue)}
                </Badge>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
