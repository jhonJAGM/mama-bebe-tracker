import { getDashboardData } from '@/lib/dashboard-data'
import HeroCountdown from '@/components/dashboard/HeroCountdown'
import MetricCard from '@/components/dashboard/MetricCard'
import MlAreaChart from '@/components/dashboard/MlAreaChart'
import MomCard from '@/components/dashboard/MomCard'

// ── Helpers ───────────────────────────────────────────────────────────────

function babyAgeInDays(birthDateISO?: string | null): number | null {
  if (!birthDateISO) return null
  const diff = Date.now() - new Date(birthDateISO).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatElapsed(isoStart?: string | null): string {
  if (!isoStart) return ''
  const mins = Math.round((Date.now() - new Date(isoStart).getTime()) / 60000)
  if (mins < 60) return `hace ${mins}min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `hace ${h}h${m > 0 ? ` ${m}min` : ''}`
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  })
}

// ── Componente ciclo-status badge ─────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    completed:   { label: 'Listo',    cls: 'bg-emerald-500/20 text-emerald-400' },
    in_progress: { label: 'En curso', cls: 'bg-rose-500/20 text-rose-400' },
    awake:       { label: 'Despierta',cls: 'bg-amber-500/20 text-amber-400' },
    alert:       { label: '⚠️ Alerta', cls: 'bg-red-500/20 text-red-400' },
    pending:     { label: 'Pendiente',cls: 'bg-white/5 text-white/25' },
  }
  const { label, cls } = map[status] ?? map.pending
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const data = await getDashboardData()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baby = data.baby as any
  const ageInDays = babyAgeInDays(baby?.birthDate)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const momLog = data.momLog as any
  const painLevel: number = momLog?.painLevel ?? 0
  const temperature: number = momLog?.temperature ?? 0
  const mood: number = momLog?.mood ?? 0
  const dailyMlGoal = 960
  const mlProgress = Math.min(100, Math.round((data.todayMlTotal / dailyMlGoal) * 100))

  const chartData = data.todayCycles
    .filter((c) => c.totalMl > 0)
    .map((c) => ({ hour: c.cycleTime, ml: c.totalMl }))

  const lastFeedingElapsed = data.lastFeeding?.startTime
    ? formatElapsed(data.lastFeeding.startTime)
    : null

  const sleepH = data.sleepSummary?.totalHours ?? 0
  const sleepDisplay = sleepH > 0
    ? `${Math.floor(sleepH)}h ${Math.round((sleepH % 1) * 60)}min`
    : '0h'

  const nextMed = data.upcomingMeds.length > 0 ? data.upcomingMeds[0] : null
  const babyName = baby?.name ?? 'Bebé'
  const initial = babyName.charAt(0).toUpperCase()

  // Totales LM y C del día
  const todayLM = data.todayCycles.reduce((acc, c) => acc + c.breastMilkMl, 0)
  const todayC  = data.todayCycles.reduce((acc, c) => acc + c.complementMl, 0)

  return (
    <div className="space-y-4 pb-4">
      {data.dbError && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          ⚠️ Sin conexión a la base de datos.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <span className="text-base font-bold text-white tracking-tight">
            Noe<span className="text-rose-400">·</span>Care
          </span>
        </div>
        <div className="flex items-center gap-2">
          {ageInDays != null && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <span className="text-xs font-semibold text-white/70">{babyName}</span>
              <span className="text-white/20">·</span>
              <span className="text-xs font-bold text-rose-400">Día {ageInDays}</span>
            </div>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-rose-500/25">
            {initial}
          </div>
        </div>
      </div>

      {/* Countdown */}
      <HeroCountdown
        nextCycleISO={data.nextCycleISO}
        lastFeedingCycle={data.lastFeeding?.cycleTime ?? null}
        lastFeedingMl={data.lastFeeding?.totalMl ?? null}
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon="🍼"
          iconBg="bg-rose-500/20"
          title="Total ml hoy"
          value={data.todayMlTotal}
          unit="ml"
          subtitle={`de ${dailyMlGoal}ml objetivo`}
          progress={mlProgress}
          progressColor="bg-gradient-to-r from-rose-500 to-pink-500"
          trend={lastFeedingElapsed ? `última ${lastFeedingElapsed}` : undefined}
          trendDir="neutral"
        />
        <MetricCard
          icon="💧"
          iconBg="bg-sky-500/20"
          title="LM / C hoy"
          value={`${todayLM}`}
          unit="ml LM"
          subtitle={`${todayC} ml complemento`}
          trendDir="neutral"
          extra={
            <div className="flex gap-2 text-xs text-white/40 -mt-1">
              <span className="text-sky-400">{Math.round((todayLM / (data.todayMlTotal || 1)) * 100)}% materna</span>
            </div>
          }
        />
        <MetricCard
          icon="🌙"
          iconBg="bg-blue-500/20"
          title="Sueño"
          value={sleepDisplay}
          subtitle={sleepH >= 14 ? '🌙 Durmiendo bien' : '☀️ Acumulado hoy'}
          trendDir={sleepH >= 14 ? 'up' : 'neutral'}
          trend={sleepH >= 14 ? 'meta' : undefined}
        />
        <MetricCard
          icon="✅"
          iconBg="bg-emerald-500/20"
          title="Tomas hoy"
          value={data.feedingsToday}
          unit="/ 8"
          subtitle="ciclos completados"
          progress={(data.feedingsToday / 8) * 100}
          progressColor="bg-gradient-to-r from-emerald-500 to-teal-500"
          trendDir={data.feedingsToday >= 6 ? 'up' : 'neutral'}
          trend={data.feedingsToday >= 6 ? 'buen ritmo' : undefined}
        />
      </div>

      {/* Tabla de ciclos */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Ciclos del día</p>
          <a href="/ciclo" className="text-xs text-rose-400 font-semibold hover:text-rose-300 transition-colors">
            Registrar →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                {['Ciclo','HD','HI','HF','Min','LM','C','Total',''].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-white/30 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.todayCycles.map((c) => {
                const isActive = c.status === 'in_progress' || c.status === 'awake'
                return (
                  <tr
                    key={c.cycleTime}
                    className={`border-b border-white/[0.04] transition-colors ${isActive ? 'bg-rose-500/5' : ''}`}
                  >
                    <td className="px-3 py-2.5 font-bold text-white whitespace-nowrap">{c.cycleTime}</td>
                    <td className="px-3 py-2.5 text-violet-300 whitespace-nowrap">{fmtTime(c.wakeTime)}</td>
                    <td className="px-3 py-2.5 text-sky-300 whitespace-nowrap">{fmtTime(c.startTime)}</td>
                    <td className="px-3 py-2.5 text-emerald-300 whitespace-nowrap">{fmtTime(c.endTime)}</td>
                    <td className="px-3 py-2.5 text-white/50 whitespace-nowrap">
                      {c.durationMinutes != null ? `${c.durationMinutes}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-rose-300 whitespace-nowrap">
                      {c.breastMilkMl > 0 ? `${c.breastMilkMl}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-amber-300 whitespace-nowrap">
                      {c.complementMl > 0 ? `${c.complementMl}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">
                      {c.totalMl > 0 ? `${c.totalMl} ml` : '—'}
                    </td>
                    <td className="px-3 py-2.5">{statusBadge(c.status)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-white/[0.03]">
                <td colSpan={5} className="px-3 py-2 text-xs font-semibold text-white/30">Totales del día</td>
                <td className="px-3 py-2 font-bold text-rose-300">{todayLM}</td>
                <td className="px-3 py-2 font-bold text-amber-300">{todayC}</td>
                <td className="px-3 py-2 font-bold text-white">{data.todayMlTotal} ml</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Gráfico ml + MomCard */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 rounded-2xl p-4 bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">ml por ciclo</p>
            <span className="text-xs font-bold text-rose-400">{data.todayMlTotal} ml total</span>
          </div>
          {chartData.length > 0 ? (
            <MlAreaChart data={chartData} />
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-xs text-white/20">Sin tomas registradas aún</p>
            </div>
          )}
        </div>
        <div className="col-span-2">
          <MomCard
            painLevel={painLevel}
            temperature={temperature}
            mood={mood}
            nextMed={nextMed}
          />
        </div>
      </div>
    </div>
  )
}
