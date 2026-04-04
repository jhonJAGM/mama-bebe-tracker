'use client'

import { useState, useEffect } from 'react'

type Props = {
  nextCycleISO: string
  lastFeedingCycle?: string | null
  lastFeedingMl?: number | null
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function HeroCountdown({ nextCycleISO, lastFeedingCycle, lastFeedingMl }: Props) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    function update() {
      setDiff(Math.max(0, new Date(nextCycleISO).getTime() - Date.now()))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [nextCycleISO])

  const totalSec = Math.floor(diff / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const isOverdue = diff === 0
  const cycleSeconds = 3 * 3600
  const elapsed = cycleSeconds - totalSec
  const progress = Math.min(100, Math.round((elapsed / cycleSeconds) * 100))

  const nextTime = new Date(nextCycleISO).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 border transition-all duration-500 ${
      isOverdue
        ? 'bg-gradient-to-br from-red-500/25 to-rose-600/15 border-red-500/30'
        : 'bg-gradient-to-br from-rose-500/20 to-pink-600/10 border-rose-500/20'
    }`}>
      <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${isOverdue ? 'bg-red-500' : 'bg-rose-500'}`} />

      <div className="relative flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
          {isOverdue ? '⚠️ Toma retrasada' : 'Próxima toma en'}
        </span>
        <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      <div className="relative text-center my-2">
        <div className={`font-black tabular-nums tracking-tight leading-none ${isOverdue ? 'text-red-300 text-6xl' : 'text-white text-7xl'}`}>
          {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
        </div>
        <p className="text-sm text-white/40 mt-2 font-medium">Ciclo 3:00h · siguiente a las {nextTime}</p>
      </div>

      <div className="relative mt-5">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isOverdue ? 'bg-red-400' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
          <span>0 min</span>
          <span>{progress}% del ciclo</span>
          <span>3h</span>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3">
        {lastFeedingCycle ? (
          <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/10 rounded-full px-3 py-1.5 text-[11px] text-white/60">
            <span>🍼</span>
            <span>Última: {lastFeedingCycle}{lastFeedingMl != null && lastFeedingMl > 0 ? ` · ${lastFeedingMl} ml` : ''}</span>
          </div>
        ) : (
          <span />
        )}
        <a
          href="/bebe/tomas"
          className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg ${isOverdue ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25 text-white' : 'bg-gradient-to-r from-rose-500 to-pink-600 shadow-rose-500/25 text-white hover:from-rose-400 hover:to-pink-500'}`}
        >
          Registrar toma →
        </a>
      </div>
    </div>
  )
}
