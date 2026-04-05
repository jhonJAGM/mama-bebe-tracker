'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/appStore'

// ── Types ─────────────────────────────────────────────────────────────────

type CicloStep =
  | 'wake'
  | 'diaper'
  | 'burp'
  | 'feed-start'
  | 'feed-active'
  | 'feed-end'
  | 'sleep'
  | 'done'

interface CicloState {
  step: CicloStep
  startedAt: Date | null
  diaper: {
    type: 'wet' | 'dirty' | 'both' | 'none' | null
    observations: string
    obsOpen: boolean
  }
  feed: {
    type: 'breast' | 'bottle' | 'mixed' | null
    leftBreastSeconds: number
    rightBreastSeconds: number
    leftActive: boolean
    rightActive: boolean
    bottleMl: number
    complementMl: number
  }
  sleepStartedAt: Date | null
  burpDone: boolean
  cycleDurationMinutes: number | null
}

const STEP_ORDER: CicloStep[] = [
  'wake', 'diaper', 'burp', 'feed-start', 'feed-active', 'feed-end', 'sleep', 'done',
]

const INITIAL_STATE: CicloState = {
  step: 'wake',
  startedAt: null,
  diaper: { type: null, observations: '', obsOpen: false },
  feed: {
    type: null,
    leftBreastSeconds: 0,
    rightBreastSeconds: 0,
    leftActive: false,
    rightActive: false,
    bottleMl: 0,
    complementMl: 0,
  },
  sleepStartedAt: null,
  burpDone: false,
  cycleDurationMinutes: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtTime(date: Date | null): string {
  if (!date) return '--:--'
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  })
}

function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function getClosestCycle(now: Date): string {
  const h = now.getHours()
  const m = now.getMinutes()
  const totalMinutes = h * 60 + m
  const cyclePairs: [number, string][] = [
    [360, '06:00'], [540, '09:00'], [720, '12:00'], [900, '15:00'],
    [1080, '18:00'], [1260, '21:00'], [0, '00:00'], [180, '03:00'],
  ]
  let minDiff = Infinity
  let closest = '06:00'
  for (const [cm, label] of cyclePairs) {
    const diff = Math.abs(totalMinutes - cm)
    const wrapped = Math.min(diff, 1440 - diff)
    if (wrapped < minDiff) {
      minDiff = wrapped
      closest = label
    }
  }
  return closest
}

function vibrate(ms = 50) {
  try { navigator.vibrate?.(ms) } catch (_) { /* noop */ }
}

// ── Main component ────────────────────────────────────────────────────────

export default function CicloFlow() {
  const router = useRouter()
  const babyId = useAppStore((s) => s.babyId)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // BabyProvider already fetches — wait 1.5s for it to settle
    const t = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(t)
  }, [])

  const [state, setState] = useState<CicloState>(INITIAL_STATE)

  const leftIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Timer effects ───────────────────────────────────────────────────────

  useEffect(() => {
    if (state.feed.leftActive) {
      leftIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          feed: { ...prev.feed, leftBreastSeconds: prev.feed.leftBreastSeconds + 1 },
        }))
      }, 1000)
    } else {
      if (leftIntervalRef.current) {
        clearInterval(leftIntervalRef.current)
        leftIntervalRef.current = null
      }
    }
    return () => {
      if (leftIntervalRef.current) {
        clearInterval(leftIntervalRef.current)
        leftIntervalRef.current = null
      }
    }
  }, [state.feed.leftActive])

  useEffect(() => {
    if (state.feed.rightActive) {
      rightIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          feed: { ...prev.feed, rightBreastSeconds: prev.feed.rightBreastSeconds + 1 },
        }))
      }, 1000)
    } else {
      if (rightIntervalRef.current) {
        clearInterval(rightIntervalRef.current)
        rightIntervalRef.current = null
      }
    }
    return () => {
      if (rightIntervalRef.current) {
        clearInterval(rightIntervalRef.current)
        rightIntervalRef.current = null
      }
    }
  }, [state.feed.rightActive])

  // ── Navigation ──────────────────────────────────────────────────────────

  const goTo = useCallback((step: CicloStep) => {
    vibrate(50)
    setState((prev) => ({ ...prev, step }))
  }, [])

  const goBack = useCallback(() => {
    setState((prev) => {
      const idx = STEP_ORDER.indexOf(prev.step)
      if (idx > 0) return { ...prev, step: STEP_ORDER[idx - 1] }
      return prev
    })
  }, [])

  // ── API calls ───────────────────────────────────────────────────────────

  async function postDiaper(startedAt: Date) {
    if (!babyId || !state.diaper.type || state.diaper.type === 'none') return
    const typeMap = { wet: 'pee', dirty: 'poop', both: 'both', none: 'dry' } as const
    await fetch('/api/diaper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        babyId,
        time: startedAt.toISOString(),
        type: typeMap[state.diaper.type],
        notes: state.diaper.observations || undefined,
      }),
    }).catch(console.error)
  }

  async function postFeed(startedAt: Date) {
    if (!babyId) return
    const now = new Date()
    const cycleTime = getClosestCycle(startedAt)
    const { feed } = state

    let breastMilkMl = 0
    let complementMl = 0
    let observations: string | undefined

    if (feed.type === 'bottle') {
      complementMl = feed.bottleMl
    } else if (feed.type === 'breast') {
      const totalSec = feed.leftBreastSeconds + feed.rightBreastSeconds
      observations = `Seno: izq ${fmtSeconds(feed.leftBreastSeconds)}, der ${fmtSeconds(feed.rightBreastSeconds)}, total ${fmtSeconds(totalSec)}`
    } else if (feed.type === 'mixed') {
      complementMl = feed.complementMl
      const totalSec = feed.leftBreastSeconds + feed.rightBreastSeconds
      observations = `Seno: izq ${fmtSeconds(feed.leftBreastSeconds)}, der ${fmtSeconds(feed.rightBreastSeconds)}, total ${fmtSeconds(totalSec)}`
    }

    await fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        babyId,
        cycleTime,
        startTime: startedAt.toISOString(),
        endTime: now.toISOString(),
        breastMilkMl,
        complementMl,
        observations,
      }),
    }).catch(console.error)
  }

  async function postSleep(sleepStart: Date) {
    if (!babyId) return
    const hour = sleepStart.getHours()
    const type = hour >= 21 || hour < 7 ? 'night' : 'day'
    await fetch('/api/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ babyId, startTime: sleepStart.toISOString(), type }),
    }).catch(console.error)
  }

  // ── Step handlers ───────────────────────────────────────────────────────

  function handleWake() {
    vibrate(60)
    setState((prev) => ({ ...prev, startedAt: new Date(), step: 'diaper' }))
  }

  async function handleDiaperContinue() {
    if (state.diaper.type === null) return
    vibrate(50)
    if (state.startedAt) await postDiaper(state.startedAt)
    goTo('burp')
  }

  async function handleFeedEndContinue() {
    vibrate(50)
    if (state.startedAt) await postFeed(state.startedAt)
    goTo('sleep')
  }

  async function handleSleepDone() {
    const now = new Date()
    vibrate(100)
    await postSleep(now)
    const duration = state.startedAt
      ? Math.round((now.getTime() - state.startedAt.getTime()) / 60000)
      : null
    setState((prev) => ({ ...prev, step: 'done', sleepStartedAt: now, cycleDurationMinutes: duration }))
  }

  function handleFinishFeedActive() {
    setState((prev) => ({
      ...prev,
      step: 'feed-end',
      feed: { ...prev.feed, leftActive: false, rightActive: false },
    }))
    vibrate(80)
  }

  // ── Loading / onboarding gates ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40 text-lg">Cargando...</div>
      </div>
    )
  }

  if (!babyId) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-6 px-8">
        <div className="text-5xl">🌸</div>
        <h1 className="text-2xl font-bold text-center">Configura el perfil de Noe</h1>
        <p className="text-white/50 text-center">No se encontró un perfil de bebé. Contacta al administrador o verifica la conexión.</p>
        <button
          onClick={() => {
            setLoading(true)
            fetch('/api/baby')
              .then(r => r.json())
              .then(d => { if (d.baby) useAppStore.getState().setBaby(d.baby) })
              .catch(console.error)
              .finally(() => setTimeout(() => setLoading(false), 500))
          }}
          className="min-h-[64px] w-full rounded-3xl bg-rose-500 text-xl font-bold"
        >
          🔄 Reintentar
        </button>
      </div>
    )
  }

  // ── Progress ────────────────────────────────────────────────────────────

  const progressSteps = STEP_ORDER.filter((s) => s !== 'done')
  const stepIndex = STEP_ORDER.indexOf(state.step)

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f] text-white flex flex-col overflow-hidden">
      {/* Progress bar + back */}
      {state.step !== 'done' && (
        <div className="flex items-center gap-2 px-4 pt-safe pt-4 pb-2 shrink-0">
          <button
            onClick={goBack}
            className="text-white/40 text-2xl w-8 h-8 flex items-center justify-center active:scale-90 transition-transform shrink-0"
            aria-label="Volver"
          >
            ←
          </button>
          <div className="flex gap-1.5 flex-1">
            {progressSteps.map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i < stepIndex
                    ? 'bg-emerald-500'
                    : i === stepIndex
                    ? 'bg-rose-500 animate-pulse'
                    : 'bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 flex flex-col px-4 pb-6 pt-2 overflow-y-auto">
        {state.step === 'wake' && (
          <StepWake onWake={handleWake} />
        )}
        {state.step === 'diaper' && (
          <StepDiaper
            diaper={state.diaper}
            setDiaper={(d) => setState((prev) => ({ ...prev, diaper: d }))}
            onContinue={handleDiaperContinue}
          />
        )}
        {state.step === 'burp' && (
          <StepBurp
            onDone={() => {
              vibrate(60)
              setState((prev) => ({ ...prev, burpDone: true, step: 'feed-start' }))
            }}
            onSkip={() => goTo('feed-start')}
          />
        )}
        {state.step === 'feed-start' && (
          <StepFeedStart
            onSelect={(type) => {
              vibrate(50)
              setState((prev) => ({ ...prev, feed: { ...prev.feed, type }, step: 'feed-active' }))
            }}
          />
        )}
        {state.step === 'feed-active' && (
          <StepFeedActive
            feed={state.feed}
            setFeed={(f) => setState((prev) => ({ ...prev, feed: f }))}
            onFinish={handleFinishFeedActive}
          />
        )}
        {state.step === 'feed-end' && (
          <StepFeedEnd feed={state.feed} onContinue={handleFeedEndContinue} />
        )}
        {state.step === 'sleep' && (
          <StepSleep onSleep={handleSleepDone} />
        )}
        {state.step === 'done' && (
          <StepDone
            cycleDurationMinutes={state.cycleDurationMinutes}
            onNew={() => { setState(INITIAL_STATE); vibrate(100) }}
            onDash={() => router.push('/')}
          />
        )}
      </div>
    </div>
  )
}

// ── Step components ────────────────────────────────────────────────────────

function StepWake({ onWake }: { onWake: () => void }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex-1 flex flex-col justify-between min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 pt-8">
        <div className="text-5xl">🌅</div>
        <h1 className="text-3xl font-bold text-center">Nuevo ciclo</h1>
        <p className="text-6xl font-black tabular-nums text-white/90">{fmtTime(now)}</p>
        <p className="text-xl text-white/50 text-center">¿Despertaste al bebé?</p>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onWake}
          className="min-h-[88px] w-full rounded-3xl bg-rose-500 border border-rose-400 text-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-rose-500/30"
        >
          ✓ SÍ, DESPERTÓ
        </button>
        <button
          onClick={onWake}
          className="min-h-[64px] w-full rounded-3xl bg-white/10 border border-white/15 text-lg font-medium active:scale-95 transition-transform"
        >
          Ya estaba despierto
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

type DiaperState = CicloState['diaper']

function StepDiaper({
  diaper,
  setDiaper,
  onContinue,
}: {
  diaper: DiaperState
  setDiaper: (d: DiaperState) => void
  onContinue: () => void
}) {
  const sel = diaper.type
  const needsAlert = sel === 'dirty' || sel === 'both'

  const options: { type: 'wet' | 'dirty' | 'both' | 'none'; icon: string; label: string }[] = [
    { type: 'wet',   icon: '💧',   label: 'MOJADO' },
    { type: 'dirty', icon: '💩',   label: 'SUCIO' },
    { type: 'both',  icon: '💧💩', label: 'AMBOS' },
    { type: 'none',  icon: '✓',    label: 'LIMPIO' },
  ]

  return (
    <div className="flex-1 flex flex-col justify-between min-h-full">
      <div className="flex-1 flex flex-col gap-4 pt-2">
        <h2 className="text-2xl font-bold text-center">Cambio de pañal</h2>

        <div className="grid grid-cols-2 gap-3">
          {options.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => {
                vibrate(30)
                setDiaper({ ...diaper, type })
              }}
              className={`h-24 w-full rounded-3xl text-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-95 border-2 ${
                sel === type
                  ? 'bg-emerald-600/80 border-emerald-500 scale-[1.02]'
                  : 'bg-white/10 border-white/15'
              }`}
            >
              <span className="text-3xl leading-none">{icon}</span>
              <span className="text-sm font-bold">{label}</span>
            </button>
          ))}
        </div>

        {/* Observation accordion */}
        <div>
          <button
            onClick={() => setDiaper({ ...diaper, obsOpen: !diaper.obsOpen })}
            className="text-white/50 text-sm font-medium flex items-center gap-1 active:scale-95 transition-transform"
          >
            {diaper.obsOpen ? '▼' : '▶'} Agregar observación
          </button>
          {diaper.obsOpen && (
            <textarea
              className="mt-2 w-full bg-white/5 border border-white/20 rounded-2xl p-3 text-base text-white placeholder-white/30 resize-none"
              rows={3}
              placeholder="color, textura, sangre..."
              value={diaper.observations}
              onChange={(e) => setDiaper({ ...diaper, observations: e.target.value })}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        {needsAlert && (
          <div className="flex items-center justify-center gap-2 bg-red-500/20 border border-red-500/50 rounded-2xl py-2 px-4 animate-pulse">
            <span className="text-red-400 font-bold text-sm">⚠ Registrar pañal sucio</span>
          </div>
        )}
        <button
          onClick={onContinue}
          disabled={sel === null}
          className={`min-h-[64px] w-full rounded-2xl text-xl font-bold transition-all active:scale-95 border ${
            sel !== null
              ? 'bg-violet-600 border-violet-500 shadow-lg shadow-violet-500/30'
              : 'bg-white/10 border-white/10 text-white/30'
          }`}
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function StepBurp({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-6xl">💨</div>
        <h2 className="text-2xl font-bold text-center">Sacar gases</h2>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onDone}
          className="min-h-[88px] w-full rounded-3xl bg-emerald-600 border border-emerald-500 text-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-emerald-500/30"
        >
          ✓ GASES SACADOS
        </button>
        <button
          onClick={onSkip}
          className="text-center text-white/40 text-base py-3 active:scale-95 transition-transform"
        >
          Omitir →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function StepFeedStart({
  onSelect,
}: {
  onSelect: (type: 'breast' | 'bottle' | 'mixed') => void
}) {
  const options = [
    { type: 'breast' as const, icon: '🤱', label: 'SENO DIRECTO',    bg: 'bg-rose-500 border-rose-400 shadow-rose-500/30' },
    { type: 'bottle' as const, icon: '🍼', label: 'BIBERÓN / LECHE', bg: 'bg-blue-500 border-blue-400 shadow-blue-500/30' },
    { type: 'mixed'  as const, icon: '🔀', label: 'MIXTO',           bg: 'bg-violet-500 border-violet-400 shadow-violet-500/30' },
  ]

  return (
    <div className="flex-1 flex flex-col justify-between min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-4">
        <div className="text-5xl">🍼</div>
        <h2 className="text-2xl font-bold text-center">¿Qué tipo de toma?</h2>
      </div>
      <div className="flex flex-col gap-3">
        {options.map(({ type, icon, label, bg }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`min-h-[80px] w-full rounded-3xl text-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform border shadow-lg ${bg}`}
          >
            <span className="text-3xl">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

type FeedState = CicloState['feed']

function StepFeedActive({
  feed,
  setFeed,
  onFinish,
}: {
  feed: FeedState
  setFeed: (f: FeedState) => void
  onFinish: () => void
}) {
  const feedType = feed.type
  const totalBreastSec = feed.leftBreastSeconds + feed.rightBreastSeconds

  function adjust(field: 'bottleMl' | 'complementMl', delta: number) {
    vibrate(20)
    setFeed({ ...feed, [field]: Math.max(0, (feed[field] as number) + delta) })
  }

  return (
    <div className="flex-1 flex flex-col justify-between min-h-full">
      <h2 className="text-xl font-bold text-center mb-3">
        {feedType === 'breast' ? '🤱 Lactancia activa' :
         feedType === 'bottle' ? '🍼 Biberón' : '🔀 Mixto'}
      </h2>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* Breast timers */}
        {(feedType === 'breast' || feedType === 'mixed') && (
          <>
            {/* Left */}
            <div className={`rounded-3xl p-4 border-2 transition-all ${
              feed.leftActive
                ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/20'
                : 'bg-white/5 border-white/15'
            }`}>
              <p className="text-sm font-semibold text-white/60 mb-1">SENO IZQUIERDO 🫀</p>
              <p className="text-6xl font-black tabular-nums text-center py-2 leading-none">
                {fmtSeconds(feed.leftBreastSeconds)}
              </p>
              <button
                onClick={() => {
                  vibrate(40)
                  setFeed({ ...feed, leftActive: !feed.leftActive })
                }}
                className={`w-full min-h-[56px] rounded-2xl font-bold text-lg mt-2 transition-all active:scale-95 border ${
                  feed.leftActive
                    ? 'bg-red-500 border-red-400 animate-pulse'
                    : 'bg-emerald-600 border-emerald-500'
                }`}
              >
                {feed.leftActive ? '⏹ PAUSAR IZQ' : '▶ INICIAR IZQ'}
              </button>
            </div>

            {/* Right */}
            <div className={`rounded-3xl p-4 border-2 transition-all ${
              feed.rightActive
                ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/20'
                : 'bg-white/5 border-white/15'
            }`}>
              <p className="text-sm font-semibold text-white/60 mb-1">SENO DERECHO 🫀</p>
              <p className="text-6xl font-black tabular-nums text-center py-2 leading-none">
                {fmtSeconds(feed.rightBreastSeconds)}
              </p>
              <button
                onClick={() => {
                  vibrate(40)
                  setFeed({ ...feed, rightActive: !feed.rightActive })
                }}
                className={`w-full min-h-[56px] rounded-2xl font-bold text-lg mt-2 transition-all active:scale-95 border ${
                  feed.rightActive
                    ? 'bg-red-500 border-red-400 animate-pulse'
                    : 'bg-emerald-600 border-emerald-500'
                }`}
              >
                {feed.rightActive ? '⏹ PAUSAR DER' : '▶ INICIAR DER'}
              </button>
            </div>

            {totalBreastSec > 0 && (
              <p className="text-center text-white/50 text-sm">
                Total: {fmtSeconds(totalBreastSec)}
              </p>
            )}
          </>
        )}

        {/* Bottle / Complement */}
        {(feedType === 'bottle' || feedType === 'mixed') && (
          <div className="bg-white/5 border-2 border-white/15 rounded-3xl p-4">
            <p className="text-sm font-semibold text-white/60 mb-2">
              {feedType === 'mixed' ? '🍼 Complemento ml' : '¿Cuántos ml/cc?'}
            </p>
            <p className="text-7xl font-black tabular-nums text-center leading-none py-2">
              {feedType === 'bottle' ? feed.bottleMl : feed.complementMl}
            </p>
            <p className="text-center text-white/50 text-sm mb-3">ml / cc</p>
            <div className="flex gap-2">
              {[-10, -5, +5, +10].map((delta) => (
                <button
                  key={delta}
                  onClick={() => adjust(feedType === 'bottle' ? 'bottleMl' : 'complementMl', delta)}
                  className="flex-1 min-h-[48px] rounded-2xl bg-white/10 border border-white/20 font-bold text-sm active:scale-95 transition-transform"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onFinish}
        className="min-h-[80px] w-full rounded-3xl bg-rose-500 border border-rose-400 text-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-rose-500/30 mt-4 shrink-0"
      >
        ✓ TERMINAR TOMA
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function StepFeedEnd({
  feed,
  onContinue,
}: {
  feed: FeedState
  onContinue: () => void
}) {
  const totalBreastSec = feed.leftBreastSeconds + feed.rightBreastSeconds

  return (
    <div className="flex-1 flex flex-col justify-between min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-center">Toma registrada</h2>

        <div className="w-full bg-white/5 border border-white/15 rounded-3xl p-5 space-y-3">
          {(feed.type === 'breast' || feed.type === 'mixed') && (
            <>
              <div className="flex justify-between text-base">
                <span className="text-white/60">Seno Izq</span>
                <span className="font-bold">{fmtSeconds(feed.leftBreastSeconds)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-white/60">Seno Der</span>
                <span className="font-bold">{fmtSeconds(feed.rightBreastSeconds)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
                <span className="text-white/80">Total seno</span>
                <span className="text-rose-400">{fmtSeconds(totalBreastSec)}</span>
              </div>
            </>
          )}
          {(feed.type === 'bottle' || feed.type === 'mixed') && (
            <div className="flex justify-between text-base">
              <span className="text-white/60">
                {feed.type === 'mixed' ? 'Complemento' : 'Biberón'}
              </span>
              <span className="font-bold">
                {feed.type === 'bottle' ? feed.bottleMl : feed.complementMl} ml
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="min-h-[80px] w-full rounded-3xl bg-violet-600 border border-violet-500 text-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-violet-500/30"
      >
        ✓ CONTINUAR →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function StepSleep({ onSleep }: { onSleep: () => void }) {
  const [notYet, setNotYet] = useState(false)
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex-1 flex flex-col justify-between min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-6xl">😴</div>
        <h2 className="text-2xl font-bold text-center">Hora de dormir</h2>
        <p className="text-6xl font-black tabular-nums text-white/90">{fmtTime(now)}</p>
        {notYet && (
          <p className="text-white/40 text-sm text-center">
            Toca cuando el bebé se duerma
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onSleep}
          className="min-h-[88px] w-full rounded-3xl bg-indigo-600 border border-indigo-500 text-2xl font-bold active:scale-95 transition-transform shadow-lg shadow-indigo-500/30"
        >
          😴 BEBÉ DORMIDO
        </button>
        {!notYet && (
          <button
            onClick={() => setNotYet(true)}
            className="text-center text-white/40 text-base py-3 active:scale-95 transition-transform"
          >
            Aún no duerme
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────

function StepDone({
  cycleDurationMinutes,
  onNew,
  onDash,
}: {
  cycleDurationMinutes: number | null
  onNew: () => void
  onDash: () => void
}) {
  return (
    <div className="flex-1 flex flex-col justify-between min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-6xl">🌟</div>
        <h2 className="text-3xl font-bold text-center">¡Ciclo completo!</h2>
        {cycleDurationMinutes != null && (
          <p className="text-white/60 text-xl text-center">
            Duración total: {cycleDurationMinutes} minutos
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onNew}
          className="min-h-[80px] w-full rounded-3xl bg-rose-500 border border-rose-400 text-xl font-bold active:scale-95 transition-transform shadow-lg shadow-rose-500/30"
        >
          Nuevo ciclo →
        </button>
        <button
          onClick={onDash}
          className="min-h-[64px] w-full rounded-3xl bg-white/10 border border-white/15 text-lg font-medium active:scale-95 transition-transform"
        >
          Ver dashboard
        </button>
      </div>
    </div>
  )
}
