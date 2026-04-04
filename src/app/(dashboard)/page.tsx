import { getDashboardData } from '@/lib/dashboard-data'
import HeroCountdown from '@/components/dashboard/HeroCountdown'
import MiniMlChart from '@/components/dashboard/MiniMlChart'

// ── Helpers ────────────────────────────────────────────────────────────────
function formatHour(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

function babyAgeInDays(birthDateISO?: string | null): number | null {
  if (!birthDateISO) return null
  const diff = Date.now() - new Date(birthDateISO).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const CYCLE_STATUS_COLORS: Record<string, string> = {
  pending:     'bg-gray-200 text-gray-500',
  in_progress: 'bg-yellow-300 text-yellow-800',
  completed:   'bg-emerald-400 text-white',
  alert:       'bg-red-400 text-white',
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const data = await getDashboardData()

  const baby = data.baby as any
  const ageInDays = babyAgeInDays(baby?.birthDate)
  const momLog = data.momLog as any
  const painLevel: number = momLog?.painLevel ?? 0
  const temperature: number = momLog?.temperature ?? 0

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Bogota',
  })

  // Objetivo diario de ml (8 ciclos × 120 ml default = 960 ml)
  const dailyMlGoal = 960
  const mlProgress = Math.min(100, Math.round((data.todayMlTotal / dailyMlGoal) * 100))

  return (
    <div className="space-y-4 pb-6">

      {/* DB error banner */}
      {data.dbError && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ Sin conexión a la base de datos. Verifica <code className="text-xs">MONGODB_URI</code>.
        </div>
      )}

      {/* ── Header: bebé info ── */}
      <div className="flex items-center gap-3">
        {/* Avatar placeholder */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-2xl shadow-md shrink-0">
          👶
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 truncate">
            {baby?.name ?? 'Bebé'}
          </h1>
          <p className="text-sm text-slate-400 capitalize">{today}</p>
        </div>
        {ageInDays != null && (
          <div className="shrink-0 text-center bg-rose-50 border border-rose-200 rounded-2xl px-3 py-1.5">
            <span className="text-2xl font-bold text-rose-600 leading-none block">{ageInDays}</span>
            <span className="text-[10px] text-rose-400 font-medium uppercase tracking-wide">días</span>
          </div>
        )}
      </div>

      {/* ── Hero: countdown próxima toma ── */}
      <HeroCountdown
        nextCycleISO={data.nextCycleISO}
        lastFeedingCycle={data.lastFeeding?.cycleTime ?? null}
        lastFeedingMl={data.lastFeeding?.totalMl ?? null}
      />

      {/* ── Grid métricas 2×2 ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Leche total hoy */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Leche hoy</p>
          <p className="text-4xl font-bold text-slate-800 mt-1 leading-none">
            {data.todayMlTotal}
            <span className="text-base font-normal text-slate-400 ml-1">ml</span>
          </p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${mlProgress >= 100 ? 'bg-emerald-400' : 'bg-rose-400'}`}
              style={{ width: `${mlProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{mlProgress}% del objetivo ({dailyMlGoal} ml)</p>
        </div>

        {/* Pañales */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Pañales hoy</p>
          <p className="text-4xl font-bold text-slate-800 mt-1 leading-none">
            {data.diaperSummary?.total ?? 0}
          </p>
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span>💧 {data.diaperSummary?.pee ?? 0}</span>
            <span>💩 {data.diaperSummary?.poop ?? 0}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">cambios registrados</p>
        </div>

        {/* Sueño */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Sueño</p>
          <p className="text-4xl font-bold text-slate-800 mt-1 leading-none">
            {data.sleepSummary?.totalHours ?? 0}
            <span className="text-base font-normal text-slate-400 ml-1">h</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {data.sleepSummary?.lastSleepStart
              ? `Última siesta: ${formatHour(data.sleepSummary.lastSleepStart)}`
              : 'Sin siestas registradas'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {data.sleepSummary?.totalHours! >= 14 ? '🌙 Durmiendo bien' : '☀️ Acumulado hoy'}
          </p>
        </div>

        {/* Tomas completadas */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tomas hoy</p>
          <p className="text-4xl font-bold text-slate-800 mt-1 leading-none">
            {data.feedingsToday}
            <span className="text-base font-normal text-slate-400 ml-1">/ 8</span>
          </p>
          <div className="flex gap-0.5 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full ${i < data.feedingsToday ? 'bg-rose-400' : 'bg-slate-100'}`}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">ciclos completados</p>
        </div>
      </div>

      {/* ── Timeline de 8 ciclos ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Ciclos del día</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {data.todayCycles.map((c) => (
            <a key={c.cycleTime} href="/bebe/tomas" className="shrink-0 text-center group">
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-transform group-active:scale-90 ${
                CYCLE_STATUS_COLORS[c.status] ?? CYCLE_STATUS_COLORS.pending
              }`}>
                <span className="text-xs leading-none">{c.cycleTime}</span>
                {c.totalMl > 0 && <span className="text-[9px] mt-0.5 opacity-80">{c.totalMl}ml</span>}
              </div>
            </a>
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-200 inline-block"/>Pendiente</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-300 inline-block"/>En curso</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400 inline-block"/>Completo</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400 inline-block"/>Alerta</span>
        </div>
      </div>

      {/* ── Mini curva de ml ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Curva de leche</p>
          <div className="flex gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-4 border-t-2 border-rose-400 border-dashed inline-block"/>máx
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 border-t-2 border-emerald-500 border-dashed inline-block"/>mín
            </span>
          </div>
        </div>
        <MiniMlChart cycles={data.todayCycles} />
      </div>

      {/* ── Card mamá ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Estado mamá</p>
          <a href="/mama/recuperacion" className="text-xs text-violet-500 font-medium">Registrar →</a>
        </div>
        {!momLog && !data.dbError ? (
          <p className="text-sm text-slate-400">Sin registro de hoy.</p>
        ) : momLog ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-violet-600 leading-none">
                {painLevel > 0 ? painLevel : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">dolor /10</p>
              <div className={`mt-1 h-1 rounded-full mx-auto w-8 ${
                !painLevel ? 'bg-slate-100' :
                painLevel <= 3 ? 'bg-emerald-300' :
                painLevel <= 6 ? 'bg-amber-300' : 'bg-red-400'
              }`} />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-cyan-600 leading-none">
                {temperature > 0 ? temperature : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">°C temp.</p>
              <div className={`mt-1 h-1 rounded-full mx-auto w-8 ${
                !temperature ? 'bg-slate-100' :
                temperature < 37.5 ? 'bg-emerald-300' : 'bg-red-400'
              }`} />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-rose-500 leading-none">
                {momLog.mood ? '⭐'.repeat(momLog.mood) : '—'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">ánimo</p>
            </div>
          </div>
        ) : null}

        {/* Próximo medicamento */}
        {data.upcomingMeds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  💊 {data.upcomingMeds[0].name}
                </p>
                <p className="text-xs text-slate-400">{data.upcomingMeds[0].dosage}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-violet-600">{formatHour(data.upcomingMeds[0].nextDue)}</p>
                <p className="text-[10px] text-slate-400">{data.upcomingMeds[0].patientType === 'baby' ? 'Bebé' : 'Mamá'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Acciones rápidas ── */}
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Acciones rápidas</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Toma',   icon: '🍼', href: '/bebe/tomas',         bg: 'bg-rose-50 border-rose-100',     text: 'text-rose-600' },
            { label: 'Pañal',  icon: '👶', href: '/bebe/panales',        bg: 'bg-sky-50 border-sky-100',       text: 'text-sky-600' },
            { label: 'Sueño',  icon: '😴', href: '/bebe/sueno',          bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-600' },
            { label: 'Nota',   icon: '📝', href: '/bitacora',            bg: 'bg-amber-50 border-amber-100',   text: 'text-amber-600' },
          ].map(({ label, icon, href, bg, text }) => (
            <a
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 ${bg} transition-all duration-150 active:scale-95 shadow-sm`}
            >
              <span className="text-3xl leading-none">{icon}</span>
              <span className={`text-[11px] font-semibold ${text}`}>{label}</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  )
}
