'use client'

// Selector visual de escala de dolor 1-10 con gradiente de color.
// Usado dentro de MomForm, pero también exportable de forma independiente.

interface PainScaleProps {
  value: number
  onChange: (v: number) => void
}

function getPainColor(level: number): string {
  if (level <= 2) return 'bg-green-400 text-white'
  if (level <= 4) return 'bg-yellow-400 text-white'
  if (level <= 6) return 'bg-orange-400 text-white'
  if (level <= 8) return 'bg-red-400 text-white'
  return 'bg-red-700 text-white'
}

function getPainLabel(level: number): string {
  if (level === 0) return 'Sin dolor'
  if (level <= 2) return 'Muy leve'
  if (level <= 4) return 'Leve a moderado'
  if (level <= 6) return 'Moderado'
  if (level <= 8) return 'Intenso'
  return 'Muy intenso / insoportable'
}

export default function PainScale({ value, onChange }: PainScaleProps) {
  return (
    <div className="space-y-3">
      {/* Valor actual */}
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold transition-colors ${
            value === 0 ? 'bg-muted text-muted-foreground' : getPainColor(value)
          }`}
        >
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{getPainLabel(value)}</span>
      </div>

      {/* Botones 0–10 */}
      <div className="flex gap-1">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 rounded-lg py-3 text-xs font-semibold transition-all active:scale-95 ${
              value === n
                ? n === 0
                  ? 'bg-muted text-foreground ring-2 ring-foreground/20'
                  : `${getPainColor(n)} ring-2 ring-offset-1 ring-current`
                : 'border border-border bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
