'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { CYCLE_TIMES, type CycleTime } from '@/lib/cycle-constants'

// ── Types ─────────────────────────────────────────────────────────────────

type CycleStatus = 'pending' | 'awake' | 'in_progress' | 'completed' | 'alert'

interface CycleData {
  cycleTime: CycleTime
  status: CycleStatus
  wakeTime: string | null
  startTime: string | null
  endTime: string | null
  durationMinutes: number | null
  breastMilkMl: number
  complementMl: number
  totalMl: number
  exceededLimit: boolean
  belowMinimum: boolean
  _id?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────

const COL_OFFSET_MS = -5 * 60 * 60 * 1000

function nowCOL(): Date {
  return new Date(Date.now() + COL_OFFSET_MS)
}

function fmtTimeCOL(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
}

function nowISOCol(): string {
  // Devuelve ISO de ahora en UTC (se guarda en UTC, se muestra en COL)
  return new Date().toISOString()
}

function currentColDayStr(): string {
  const n = nowCOL()
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}-${String(n.getUTCDate()).padStart(2, '0')}`
}

// Detecta el ciclo activo o más próximo en hora Colombia
function detectActiveCycle(): CycleTime {
  const n = nowCOL()
  const colMin = n.getUTCHours() * 60 + n.getUTCMinutes()
  const cycleMins = CYCLE_TIMES.map((ct) => {
    const [h, m] = ct.split(':').map(Number)
    return { ct, min: h * 60 + m }
  })
  // Busca el último ciclo que ya pasó (más reciente antes de ahora)
  const passed = cycleMins.filter(({ min }) => min <= colMin)
  if (passed.length > 0) return passed[passed.length - 1].ct as CycleTime
  // Si ninguno pasó aún (ej: 5am antes del primer ciclo de las 6am), tomar el del día anterior: 03:00
  return '03:00'
}

function calcDuration(hi: string | null, hf: string | null): number | null {
  if (!hi || !hf) return null
  const diff = Math.round((new Date(hf).getTime() - new Date(hi).getTime()) / 60000)
  return diff > 0 ? diff : null
}

// ── Estado local del ciclo en edición ─────────────────────────────────────

interface EditState {
  hd: string | null   // ISO
  hi: string | null   // ISO
  hf: string | null   // ISO
  lm: number          // ml leche materna
  c: number           // ml complemento
}

const EMPTY_EDIT: EditState = { hd: null, hi: null, hf: null, lm: 0, c: 0 }

// ── Componente principal ───────────────────────────────────────────────────

export default function CicloFlow() {
  const { baby, babyId } = useAppStore()
  const [cycles, setCycles] = useState<CycleData[]>([])
  const [selected, setSelected] = useState<CycleTime>(detectActiveCycle)
  const [edit, setEdit] = useState<EditState>(EMPTY_EDIT)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [alerts, setAlerts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const currentCycle = cycles.find((c) => c.cycleTime === selected)

  // ── Cargar ciclos del día ─────────────────────────────────────────────

  const loadCycles = useCallback(async () => {
    if (!babyId) return
    setLoading(true)
    try {
      const date = currentColDayStr()
      const res = await fetch(`/api/feed?babyId=${babyId}&date=${date}`)
      const data = await res.json()
      if (data.cycles) setCycles(data.cycles)
    } catch (e) {
      console.error('Error cargando ciclos:', e)
    } finally {
      setLoading(false)
    }
  }, [babyId])

  useEffect(() => { loadCycles() }, [loadCycles])

  // Cuando cambia el ciclo seleccionado, cargar sus valores en el formulario
  useEffect(() => {
    if (!currentCycle) {
      setEdit(EMPTY_EDIT)
      return
    }
    setEdit({
      hd: currentCycle.wakeTime,
      hi: currentCycle.startTime,
      hf: currentCycle.endTime,
      lm: currentCycle.breastMilkMl,
      c:  currentCycle.complementMl,
    })
    setSaved(false)
    setAlerts([])
  }, [selected, cycles])

  // ── Guardar ciclo ─────────────────────────────────────────────────────

  async function handleSave() {
    if (!babyId) return
    setSaving(true)
    setAlerts([])

    try {
      const date = currentColDayStr()
      const totalMl = edit.lm + edit.c
      const durationMinutes = calcDuration(edit.hi, edit.hf)

      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babyId,
          cycleTime: selected,
          date,
          wakeTime:      edit.hd,
          startTime:     edit.hi,
          endTime:       edit.hf,
          breastMilkMl:  edit.lm,
          complementMl:  edit.c,
          totalMl,
          durationMinutes,
        }),
      })

      const data = await res.json()
      if (data.alerts?.length) setAlerts(data.alerts)
      setSaved(true)
      await loadCycles()

      // Auto-avanzar al siguiente ciclo pendiente tras 1.5s
      setTimeout(() => {
        const next = cycles.find(
          (c) => c.status === 'pending' && CYCLE_TIMES.indexOf(c.cycleTime) > CYCLE_TIMES.indexOf(selected)
        )
        if (next) setSelected(next.cycleTime)
      }, 1500)
    } catch (e) {
      console.error('Error guardando ciclo:', e)
    } finally {
      setSaving(false)
    }
  }

  const totalMl = edit.lm + edit.c
  const durationMinutes = calcDuration(edit.hi, edit.hf)
  const maxLimitMl = 120
  const minLimitMl = 60
  const overLimit = totalMl > maxLimitMl
  const underMin = totalMl > 0 && totalMl < minLimitMl
  const progressPct = Math.min(100, Math.round((totalMl / maxLimitMl) * 100))

  if (!baby && !babyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-white/40">
        <span className="text-4xl">👶</span>
        <p className="text-sm">Registrando bebé...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <span className="text-base font-bold text-white tracking-tight">
            Noe<span className="text-rose-400">·</span>Care
          </span>
        </div>
        <span className="text-xs text-white/30 font-medium">
          {baby?.name ?? 'Bebé'} · Ciclos
        </span>
      </div>

      {/* Selector de ciclos */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {CYCLE_TIMES.map((ct) => {
          const cyc = cycles.find((c) => c.cycleTime === ct)
          const isSelected = ct === selected
          const statusColors: Record<string, string> = {
            completed:   'bg-emerald-500/30 border-emerald-500/50 text-emerald-300',
            in_progress: 'bg-rose-500/30 border-rose-500/50 text-rose-300',
            awake:       'bg-amber-500/30 border-amber-500/50 text-amber-300',
            alert:       'bg-red-500/30 border-red-500/50 text-red-300',
            pending:     'bg-white/5 border-white/10 text-white/30',
          }
          const dotColors: Record<string, string> = {
            completed: 'bg-emerald-400',
            in_progress: 'bg-rose-400 animate-pulse',
            awake: 'bg-amber-400',
            alert: 'bg-red-400 animate-pulse',
            pending: '',
          }
          const status = cyc?.status ?? 'pending'
          const colorClass = isSelected
            ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30'
            : statusColors[status]
          return (
            <button
              key={ct}
              onClick={() => setSelected(ct as CycleTime)}
              className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-200 active:scale-90 ${colorClass}`}
            >
              <span className="text-[11px] font-bold whitespace-nowrap">{ct}</span>
              {dotColors[status] && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Panel del ciclo seleccionado */}
      {loading ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 flex items-center justify-center">
          <div className="text-white/30 text-sm">Cargando...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Título del ciclo */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-white">Ciclo {selected}</h2>
            {currentCycle?.status === 'completed' && (
              <span className="text-xs text-emerald-400 font-semibold">✓ Completado</span>
            )}
          </div>

          {/* Botones de timestamp: HD · HI · HF */}
          <div className="grid grid-cols-3 gap-3">
            {/* HD — Hora Despertar */}
            <TimestampButton
              label="HD"
              sublabel="Despertar"
              emoji="🌅"
              color="violet"
              value={edit.hd}
              onTap={() => setEdit((e) => ({ ...e, hd: nowISOCol() }))}
              onClear={() => setEdit((e) => ({ ...e, hd: null }))}
            />
            {/* HI — Inicio lactancia */}
            <TimestampButton
              label="HI"
              sublabel="Inicio"
              emoji="🍼"
              color="sky"
              value={edit.hi}
              onTap={() => setEdit((e) => ({ ...e, hi: nowISOCol() }))}
              onClear={() => setEdit((e) => ({ ...e, hi: null }))}
            />
            {/* HF — Fin lactancia */}
            <TimestampButton
              label="HF"
              sublabel="Fin"
              emoji="✅"
              color="emerald"
              value={edit.hf}
              onTap={() => setEdit((e) => ({ ...e, hf: nowISOCol() }))}
              onClear={() => setEdit((e) => ({ ...e, hf: null }))}
            />
          </div>

          {/* Duración calculada */}
          {durationMinutes != null && (
            <div className="text-center text-sm text-white/50 font-medium">
              ⏱️ Duración lactancia: <span className="text-white font-bold">{durationMinutes} min</span>
            </div>
          )}

          {/* LM y C */}
          <div className="grid grid-cols-2 gap-3">
            <MlInput
              label="LM"
              sublabel="Leche materna"
              color="rose"
              value={edit.lm}
              onChange={(v) => setEdit((e) => ({ ...e, lm: v }))}
            />
            <MlInput
              label="C"
              sublabel="Complemento"
              color="amber"
              value={edit.c}
              onChange={(v) => setEdit((e) => ({ ...e, c: v }))}
            />
          </div>

          {/* Total + barra de progreso */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Total</span>
              <span className={`text-xl font-black ${overLimit ? 'text-red-400' : underMin ? 'text-amber-400' : 'text-white'}`}>
                {totalMl} ml
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overLimit ? 'bg-red-500' : underMin ? 'bg-amber-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'
                }`}
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/25">
              <span>0 ml</span>
              <span>{minLimitMl}ml mínimo · {maxLimitMl}ml máximo</span>
              <span>{maxLimitMl} ml</span>
            </div>
          </div>

          {/* Alertas */}
          {alerts.map((a, i) => (
            <div key={i} className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-xs text-amber-300">
              {a}
            </div>
          ))}

          {/* Éxito */}
          {saved && !alerts.length && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-300 text-center font-semibold">
              ✓ Ciclo guardado correctamente
            </div>
          )}

          {/* Botón guardar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-base shadow-xl shadow-rose-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : '💾 Guardar ciclo'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────

type Color = 'violet' | 'sky' | 'emerald' | 'rose' | 'amber'

const colorMap: Record<Color, { bg: string; border: string; text: string; btnBg: string }> = {
  violet:  { bg: 'bg-violet-500/15',  border: 'border-violet-500/30',  text: 'text-violet-300',  btnBg: 'bg-violet-500/20' },
  sky:     { bg: 'bg-sky-500/15',     border: 'border-sky-500/30',     text: 'text-sky-300',     btnBg: 'bg-sky-500/20' },
  emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-300', btnBg: 'bg-emerald-500/20' },
  rose:    { bg: 'bg-rose-500/15',    border: 'border-rose-500/30',    text: 'text-rose-300',    btnBg: 'bg-rose-500/20' },
  amber:   { bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   text: 'text-amber-300',   btnBg: 'bg-amber-500/20' },
}

function TimestampButton({
  label, sublabel, emoji, color, value, onTap, onClear,
}: {
  label: string
  sublabel: string
  emoji: string
  color: Color
  value: string | null
  onTap: () => void
  onClear: () => void
}) {
  const { bg, border, text, btnBg } = colorMap[color]
  const recorded = !!value

  return (
    <div className={`rounded-2xl border p-3 flex flex-col items-center gap-2 transition-all ${recorded ? `${bg} ${border}` : 'bg-white/[0.04] border-white/10 border-dashed'}`}>
      <span className="text-lg">{emoji}</span>
      <span className={`text-lg font-black ${recorded ? text : 'text-white/40'}`}>{label}</span>
      <span className="text-[10px] text-white/30">{sublabel}</span>

      {recorded ? (
        <>
          <span className={`text-sm font-bold ${text}`}>{fmtTimeCOL(value)}</span>
          <button
            onClick={onClear}
            className="text-[10px] text-white/20 hover:text-white/50 transition-colors underline"
          >
            limpiar
          </button>
        </>
      ) : (
        <button
          onClick={onTap}
          className={`w-full py-2 rounded-xl ${btnBg} ${text} text-xs font-bold active:scale-95 transition-all`}
        >
          Ahora
        </button>
      )}
    </div>
  )
}

function MlInput({
  label, sublabel, color, value, onChange,
}: {
  label: string
  sublabel: string
  color: Color
  value: number
  onChange: (v: number) => void
}) {
  const { bg, border, text } = colorMap[color]

  function adjust(delta: number) {
    onChange(Math.max(0, Math.min(999, value + delta)))
  }

  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${bg} ${border}`}>
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-black ${text}`}>{label}</span>
        <span className="text-[10px] text-white/30">{sublabel}</span>
      </div>

      {/* Número grande */}
      <div className="text-center">
        <input
          type="number"
          min={0}
          max={999}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full text-center text-3xl font-black text-white bg-transparent focus:outline-none"
        />
        <span className="text-xs text-white/30">ml</span>
      </div>

      {/* Botones +/- */}
      <div className="grid grid-cols-4 gap-1.5">
        {[-10, -5, +5, +10].map((delta) => (
          <button
            key={delta}
            onClick={() => adjust(delta)}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all active:scale-90 ${
              delta > 0
                ? `${bg} ${text} hover:opacity-80`
                : 'bg-white/5 text-white/40 hover:text-white/70'
            }`}
          >
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </div>
    </div>
  )
}
