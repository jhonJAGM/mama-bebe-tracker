'use client'

type CycleStatus = 'pending' | 'in_progress' | 'completed' | 'alert'

type Props = {
  cycleTime: string
  status: CycleStatus | string
  totalMl?: number
  href?: string
}

const STYLES: Record<CycleStatus, string> = {
  completed:   'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  in_progress: 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse',
  alert:       'bg-red-500/20 border-red-500/40 text-red-400',
  pending:     'bg-white/5 border-white/10 text-white/30',
}

const ICONS: Record<CycleStatus, string> = {
  completed:   '✓',
  in_progress: '●',
  alert:       '⚠',
  pending:     '○',
}

export default function CyclePill({ cycleTime, status, totalMl, href = '/bebe/tomas' }: Props) {
  const s = (status as CycleStatus) in STYLES ? (status as CycleStatus) : 'pending'
  const style = STYLES[s]
  const icon = ICONS[s]

  return (
    <a
      href={href}
      className={`shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl border text-[10px] font-bold transition-all duration-150 active:scale-90 hover:scale-105 ${style}`}
    >
      <span className="text-[11px] leading-none">{icon} {cycleTime}</span>
      {totalMl != null && totalMl > 0 && (
        <span className="text-[9px] mt-0.5 opacity-70">{totalMl}ml</span>
      )}
    </a>
  )
}
