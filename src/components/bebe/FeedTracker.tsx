'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Dot,
} from 'recharts'

// ── Tipos ──────────────────────────────────────────────────────────────────
const CYCLE_TIMES = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00', '03:00'] as const
type CycleTime = typeof CYCLE_TIMES[number]
type DiaperType = 'pee' | 'poop' | 'both' | 'none'
type CycleStatus = 'pending' | 'in_progress' | 'completed' | 'alert'

type CycleData = {
  _id?: string
  cycleTime: CycleTime
  status: CycleStatus
  startTime?: string
  endTime?: string
  durationMinutes?: number
  breastMilkMl: number
  complementMl: number
  totalMl: number
  maxLimitMl: number
  minLimitMl: number
  exceededLimit?: boolean
  belowMinimum?: boolean
  compensationFromPrevious?: boolean
  diaperChanges: number
  diaperType: DiaperType
  observations?: string
}

type FormState = {
  breastMilkMl: string
  complementMl: string
  maxLimitMl: string
  minLimitMl: string
  diaperChanges: string
  diaperType: DiaperType
  observations: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<CycleStatus, { label: string; dot: string; border: string; bg: string }> = {
  pending:     { label: 'Pendiente',   dot: 'bg-gray-300',   border: 'border-gray-200',  bg: 'bg-white' },
  in_progress: { label: 'En curso 🟡', dot: 'bg-yellow-400', border: 'border-yellow-300', bg: 'bg-yellow-50' },
  completed:   { label: '✅ Completo', dot: 'bg-emerald-400', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  alert:       { label: '⚠️ Alerta',  dot: 'bg-red-400',    border: 'border-red-300',   bg: 'bg-red-50' },
}

const DIAPER_OPTIONS: { value: DiaperType; label: string }[] = [
  { value: 'none', label: '✖ Ninguno' },
  { value: 'pee',  label: '💧 Chichi' },
  { value: 'poop', label: '💩 Popo' },
  { value: 'both', label: '💧💩 Ambos' },
]

function cycleToDate(cycleTime: CycleTime, baseDate: Date): Date {
  const [h, m] = cycleTime.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(h, m, 0, 0)
  // Los ciclos 00:00 y 03:00 son del día siguiente (o del mismo, depende la hora actual)
  if ((cycleTime === '00:00' || cycleTime === '03:00') && h < 6) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

function formatDuration(minutes?: number): string {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Componente principal ────────────────────────────────────────────────────
export default function FeedTracker({ babyId }: { babyId: string }) {
  const [cycles, setCycles] = useState<CycleData[]>([])
  const [todayTotalMl, setTodayTotalMl] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedCycle, setExpandedCycle] = useState<CycleTime | null>(null)
  const [formState, setFormState] = useState<FormState>({
    breastMilkMl: '0',
    complementMl: '0',
    maxLimitMl: '120',
    minLimitMl: '60',
    diaperChanges: '0',
    diaperType: 'none',
    observations: '',
  })
  const [saving, setSaving] = useState(false)
  const [alerts, setAlerts] = useState<string[]>([])
  const [timerActive, setTimerActive] = useState<CycleTime | null>(null)
  const [elapsed, setElapsed] = useState(0)

  // Carga los límites desde localStorage para persistirlos
  const loadLimits = useCallback(() => {
    if (typeof window === 'undefined') return { maxLimitMl: '120', minLimitMl: '60' }
    return {
      maxLimitMl: localStorage.getItem(`feed_max_${babyId}`) ?? '120',
      minLimitMl: localStorage.getItem(`feed_min_${babyId}`) ?? '60',
    }
  }, [babyId])

  const saveLimits = (max: string, min: string) => {
    localStorage.setItem(`feed_max_${babyId}`, max)
    localStorage.setItem(`feed_min_${babyId}`, min)
  }

  // Timer para ciclo en progreso
  useEffect(() => {
    if (!timerActive) { setElapsed(0); return }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [timerActive])

  const fetchCycles = useCallback(async () => {
    try {
      const res = await fetch(`/api/feed?babyId=${babyId}&date=${todayISO()}`)
      const data = await res.json()
      if (data.cycles) {
        setCycles(data.cycles)
        setTodayTotalMl(data.todayTotalMl ?? 0)
      }
    } catch {
      /* silencio */
    } finally {
      setLoading(false)
    }
  }, [babyId])

  useEffect(() => { fetchCycles() }, [fetchCycles])

  function openCycle(c: CycleData) {
    if (expandedCycle === c.cycleTime) { setExpandedCycle(null); return }
    const limits = loadLimits()
    setFormState({
      breastMilkMl: String(c.breastMilkMl || 0),
      complementMl: String(c.complementMl || 0),
      maxLimitMl: String(c.maxLimitMl || limits.maxLimitMl),
      minLimitMl: String(c.minLimitMl || limits.minLimitMl),
      diaperChanges: String(c.diaperChanges || 0),
      diaperType: c.diaperType || 'none',
      observations: c.observations || '',
    })
    setExpandedCycle(c.cycleTime)
    setAlerts([])
  }

  async function handleStart(c: CycleData) {
    setSaving(true)
    try {
      const limits = loadLimits()
      let feedingId = c._id

      if (!feedingId) {
        // Crear el registro primero
        const res = await fetch(`/api/feed/${babyId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cycleTime: c.cycleTime,
            date: todayISO(),
            maxLimitMl: Number(limits.maxLimitMl),
            minLimitMl: Number(limits.minLimitMl),
          }),
        })
        const data = await res.json()
        feedingId = data.feeding?._id
      } else {
        await fetch(`/api/feed/${feedingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        })
      }

      setTimerActive(c.cycleTime)
      await fetchCycles()
    } catch {/* silencio */}
    finally { setSaving(false) }
  }

  async function handleEnd(c: CycleData) {
    if (!c._id) return
    setSaving(true)
    try {
      await fetch(`/api/feed/${c._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      })
      setTimerActive(null)
      await fetchCycles()
    } catch {/* silencio */}
    finally { setSaving(false) }
  }

  async function handleSave(c: CycleData) {
    setSaving(true)
    setAlerts([])
    saveLimits(formState.maxLimitMl, formState.minLimitMl)
    try {
      const payload = {
        babyId,
        cycleTime: c.cycleTime,
        date: todayISO(),
        breastMilkMl: Number(formState.breastMilkMl) || 0,
        complementMl: Number(formState.complementMl) || 0,
        maxLimitMl: Number(formState.maxLimitMl) || 120,
        minLimitMl: Number(formState.minLimitMl) || 60,
        diaperChanges: Number(formState.diaperChanges) || 0,
        diaperType: formState.diaperType,
        observations: formState.observations,
      }

      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.alerts?.length) setAlerts(data.alerts)
      await fetchCycles()
    } catch {/* silencio */}
    finally { setSaving(false) }
  }

  // ── Datos para el gráfico ──────────────────────────────────────────────
  const chartData = cycles.map((c) => ({
    cycle: c.cycleTime,
    ml: c.totalMl || null,
    max: c.maxLimitMl || 120,
    min: c.minLimitMl || 60,
    alert: c.exceededLimit || c.belowMinimum,
  }))

  const globalMax = Math.max(...cycles.map((c) => c.maxLimitMl || 120), 0)
  const globalMin = Math.min(...cycles.map((c) => c.minLimitMl || 60), 999)

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-4xl animate-bounce">🍼</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Total del día */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-400 rounded-2xl p-4 text-white shadow-md">
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Total leche hoy</p>
        <p className="text-4xl font-bold mt-1">{todayTotalMl} <span className="text-xl font-normal">ml</span></p>
        <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${Math.min((todayTotalMl / (globalMax * 8)) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs opacity-70 mt-1">Objetivo: {globalMax * 8} ml/día ({globalMax} ml × 8 ciclos)</p>
      </div>

      {/* Gráfica de curva diaria */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Curva del día</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="cycle" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 'auto']} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}
              formatter={(val: any, name: any) => {
                const labels: Record<string, string> = { ml: 'Total ml', max: 'Límite máx.', min: 'Límite mín.' }
                return [`${val ?? 0} ml`, labels[String(name)] ?? String(name)]
              }}
            />
            {/* Límite máx global — línea roja punteada */}
            <ReferenceLine y={globalMax} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
            {/* Límite mín global — línea verde punteada */}
            <ReferenceLine y={globalMin} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
            {/* Línea de totalMl */}
            <Line
              type="monotone"
              dataKey="ml"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={(props: any) => {
                const isAlert = chartData[props.index]?.alert
                return (
                  <Dot
                    {...props}
                    r={5}
                    fill={isAlert ? '#ef4444' : '#3b82f6'}
                    stroke={isAlert ? '#ef4444' : '#3b82f6'}
                  />
                )
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-500 inline-block" /> Total ml</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 border-t-2 border-dashed border-red-400 inline-block" /> Máx.</span>
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-400 inline-block" /> Mín.</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Alerta</span>
        </div>
      </div>

      {/* Grid de 8 ciclos */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ciclos del día</p>
        {cycles.map((c) => {
          const cfg = STATUS_CONFIG[c.status as CycleStatus] ?? STATUS_CONFIG.pending
          const isExpanded = expandedCycle === c.cycleTime
          const isActive = timerActive === c.cycleTime
          const totalCalc = (Number(formState.breastMilkMl) || 0) + (Number(formState.complementMl) || 0)

          return (
            <div
              key={c.cycleTime}
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${cfg.border} ${cfg.bg}`}
            >
              {/* Cabecera de la tarjeta */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => openCycle(c)}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-base">{c.cycleTime}</span>
                    <span className="text-[10px] font-medium text-gray-400">{cfg.label}</span>
                    {isActive && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-mono">
                        {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  {c.status !== 'pending' && (
                    <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                      {c.totalMl > 0 && <span>🍼 {c.totalMl} ml</span>}
                      {c.durationMinutes != null && c.durationMinutes > 0 && (
                        <span>⏱ {formatDuration(c.durationMinutes)}</span>
                      )}
                      {c.diaperChanges > 0 && (
                        <span>
                          {c.diaperType === 'pee' ? '💧' : c.diaperType === 'poop' ? '💩' : c.diaperType === 'both' ? '💧💩' : ''}{' '}
                          ×{c.diaperChanges}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-gray-300 text-lg shrink-0">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {/* Formulario expandible */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                  {/* Alertas */}
                  {alerts.map((a, i) => (
                    <div key={i} className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                      {a}
                    </div>
                  ))}
                  {c.belowMinimum && c.compensationFromPrevious && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                      ↩️ El ciclo anterior también estuvo por debajo del mínimo — considera compensar aquí.
                    </div>
                  )}

                  {/* Botones inicio / fin */}
                  <div className="flex gap-2 pt-2">
                    {!c.startTime ? (
                      <button
                        onClick={() => handleStart(c)}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                      >
                        ▶ INICIAR
                      </button>
                    ) : !c.endTime ? (
                      <button
                        onClick={() => handleEnd(c)}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                      >
                        ⏹ FINALIZAR
                      </button>
                    ) : (
                      <div className="flex-1 text-center text-xs text-emerald-600 font-medium py-2">
                        ✅ {formatDuration(c.durationMinutes)}
                      </div>
                    )}
                  </div>

                  {/* Leche materna + Complemento + Total */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-blue-500 font-semibold block mb-1">LM (ml)</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.breastMilkMl}
                        onChange={(e) => setFormState((s) => ({ ...s, breastMilkMl: e.target.value }))}
                        className="w-full border-2 border-blue-100 focus:border-blue-300 rounded-xl px-3 py-2 text-sm text-center font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-purple-500 font-semibold block mb-1">C (ml)</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.complementMl}
                        onChange={(e) => setFormState((s) => ({ ...s, complementMl: e.target.value }))}
                        className="w-full border-2 border-purple-100 focus:border-purple-300 rounded-xl px-3 py-2 text-sm text-center font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Total</label>
                      <div className={`w-full rounded-xl px-3 py-2 text-sm text-center font-bold border-2 ${
                        totalCalc > (Number(formState.maxLimitMl) || 120)
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : totalCalc > 0 && totalCalc < (Number(formState.minLimitMl) || 60)
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : 'border-gray-100 bg-gray-50 text-gray-700'
                      }`}>
                        {totalCalc} ml
                      </div>
                    </div>
                  </div>

                  {/* Límites */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-red-400 font-semibold block mb-1">Máx. (ml)</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.maxLimitMl}
                        onChange={(e) => setFormState((s) => ({ ...s, maxLimitMl: e.target.value }))}
                        className="w-full border-2 border-red-100 focus:border-red-300 rounded-xl px-3 py-2 text-sm text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-emerald-500 font-semibold block mb-1">Mín. (ml)</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.minLimitMl}
                        onChange={(e) => setFormState((s) => ({ ...s, minLimitMl: e.target.value }))}
                        className="w-full border-2 border-emerald-100 focus:border-emerald-300 rounded-xl px-3 py-2 text-sm text-center focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Pañal */}
                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-2">Pañal</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {DIAPER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormState((s) => ({ ...s, diaperType: opt.value }))}
                          className={`py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                            formState.diaperType === opt.value
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {formState.diaperType !== 'none' && (
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-xs text-gray-500">Cambios:</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formState.diaperChanges}
                          onChange={(e) => setFormState((s) => ({ ...s, diaperChanges: e.target.value }))}
                          className="w-16 border-2 border-gray-100 rounded-xl px-2 py-1 text-sm text-center focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Observaciones</label>
                    <textarea
                      value={formState.observations}
                      onChange={(e) => setFormState((s) => ({ ...s, observations: e.target.value }))}
                      rows={2}
                      placeholder="Ej: Lloraba mucho, tomó despacio..."
                      className="w-full border-2 border-gray-100 focus:border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
                    />
                  </div>

                  {/* Guardar */}
                  <button
                    onClick={() => handleSave(c)}
                    disabled={saving}
                    className="w-full py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {saving ? 'Guardando...' : '💾 Guardar ciclo'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
