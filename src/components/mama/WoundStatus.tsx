'use client'

// Selector visual para el estado de la herida post-cesárea.
// Usado dentro de MomForm.

const OPTIONS = [
  { value: 'clean', label: '✅ Limpia', desc: 'Sin signos de infección', color: 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-200' },
  { value: 'red', label: '🔴 Enrojecida', desc: 'Hay enrojecimiento alrededor', color: 'border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-950/20 dark:text-orange-200' },
  { value: 'secretion', label: '⚠️ Con secreción', desc: 'Hay líquido o pus', color: 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200' },
  { value: 'open', label: '🚨 Dehiscencia', desc: 'Herida abierta — consultar médico', color: 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-200' },
]

interface WoundStatusProps {
  value: string
  onChange: (v: string) => void
}

export default function WoundStatus({ value, onChange }: WoundStatusProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value === value ? '' : opt.value)}
          className={`rounded-xl border-2 px-3 py-3 text-left transition-all active:scale-95 ${
            value === opt.value ? opt.color : 'border-border bg-background text-foreground opacity-70'
          }`}
        >
          <p className="text-sm font-semibold">{opt.label}</p>
          <p className="text-[10px] text-current opacity-80 mt-0.5">{opt.desc}</p>
        </button>
      ))}
    </div>
  )
}
