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
  const nextTime = new Date(nextCycleISO).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })

  return (
    <div className={`rounded-2xl p-5 shadow-md ${isOverdue
      ? 'bg-gradient-to-br from-red-500 to-rose-600'
      : 'bg-gradient-to-br from-rose-500 to-pink-500'
    } text-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
            {isOverdue ? '⚠️ Toma retrasada' : '⏰ Próxima toma'}
          </p>
          <p className="text-2xl font-bold mt-1">{nextTime}</p>
          {lastFeedingCycle && (
            <p className="text-xs opacity-70 mt-0.5">
              Último ciclo: {lastFeedingCycle}
              {lastFeedingMl != null && lastFeedingMl > 0 ? ` · ${lastFeedingMl} ml` : ''}
            </p>
          )}
        </div>
        {/* Countdown */}
        <div className={`rounded-2xl px-4 py-3 text-center ${isOverdue ? 'bg-white/20' : 'bg-white/15'}`}>
          <div className="font-mono text-3xl font-bold tracking-tight leading-none">
            {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
          </div>
          <p className="text-[10px] opacity-70 mt-1 uppercase tracking-wide">
            {isOverdue ? 'Ahora!' : 'restante'}
          </p>
        </div>
      </div>

      {/* Barra de progreso (invierte: llena = falta mucho, vacía = ya!) */}
      {!isOverdue && (
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, 100 - (totalSec / (3 * 3600)) * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
