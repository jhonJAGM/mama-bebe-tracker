import { getDashboardData } from '@/lib/dashboard-data'
import HeroCountdown from '@/components/dashboard/HeroCountdown'
import MetricCard from '@/components/dashboard/MetricCard'
import CyclePill from '@/components/dashboard/CyclePill'
import MlAreaChart from '@/components/dashboard/MlAreaChart'
import MomCard from '@/components/dashboard/MomCard'
import QuickActions from '@/components/dashboard/QuickActions'

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

  return (
    <div className="space-y-4 pb-4">
      {data.dbError && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          ⚠️ Sin conexión a la base de datos.
        </div>
      )}

      <div className="flex items-center justify-between py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌸</span>
          <span className="text-base font-bold text-white tracking-tight">
            mama<span className="text-rose-400">·</span>bebe
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

      <HeroCountdown
        nextCycleISO={data.nextCycleISO}
        lastFeedingCycle={data.lastFeeding?.cycleTime ?? null}
        lastFeedingMl={data.lastFeeding?.totalMl ?? null}
      />

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
          icon="👶"
          iconBg="bg-violet-500/20"
          title="Pañales hoy"
          value={data.diaperSummary?.total ?? 0}
          subtitle="cambios registrados"
          trendDir="neutral"
          extra={
            <div className="flex gap-3 text-xs text-white/40 -mt-1">
              <span>💧 {data.diaperSummary?.pee ?? 0}</span>
              <span>💩 {data.diaperSummary?.poop ?? 0}</span>
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

      <div className="rounded-2xl p-4 bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Ciclos del día</p>
          <a href="/bebe/tomas" className="text-xs text-rose-400 font-semibold hover:text-rose-300 transition-colors">
            Ver todos →
          </a>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.todayCycles.map((c) => (
            <CyclePill
              key={c.cycleTime}
              cycleTime={c.cycleTime}
              status={c.status}
              totalMl={c.totalMl}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-3 text-[10px] text-white/25 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500/30 inline-block" />Completado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-rose-500/30 inline-block" />En curso
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-500/30 inline-block" />Alerta
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-white/10 inline-block" />Pendiente
          </span>
        </div>
      </div>

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

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Acciones rápidas</p>
        <QuickActions />
      </div>
    </div>
  )
}
