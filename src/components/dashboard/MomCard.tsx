'use client'

type Props = {
  painLevel: number
  temperature: number
  mood: number
  nextMed?: {
    name: string
    dosage: string
    nextDue: string
    patientType: string
  } | null
}

function PainDot({ level, active }: { level: number; active: boolean }) {
  const color =
    level <= 3 ? 'bg-emerald-400' :
    level <= 6 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className={`w-3 h-3 rounded-full transition-all ${active ? color : 'bg-white/10'}`} />
  )
}

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  })
}

const MOOD_EMOJI = ['', '😔', '😕', '😐', '🙂', '😊']

export default function MomCard({ painLevel, temperature, mood, nextMed }: Props) {
  const painColor =
    !painLevel ? 'text-white/30' :
    painLevel <= 3 ? 'text-emerald-400' :
    painLevel <= 6 ? 'text-amber-400' : 'text-red-400'

  const tempColor =
    !temperature ? 'text-white/30' :
    temperature < 37.5 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="rounded-2xl p-4 bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-base">❤️</div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Estado mamá</span>
        </div>
        <a href="/mama/recuperacion" className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
          Registrar →
        </a>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Dolor */}
        <div className="flex flex-col items-center gap-2">
          <span className={`text-3xl font-black leading-none tabular-nums ${painColor}`}>
            {painLevel > 0 ? painLevel : '—'}
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-wide">dolor /10</span>
          {painLevel > 0 && (
            <div className="flex gap-0.5 flex-wrap justify-center w-full max-w-[56px]">
              {Array.from({ length: 10 }, (_, i) => (
                <PainDot key={i} level={i + 1} active={i + 1 <= painLevel} />
              ))}
            </div>
          )}
        </div>

        {/* Temperatura */}
        <div className="flex flex-col items-center gap-2">
          <span className={`text-3xl font-black leading-none tabular-nums ${tempColor}`}>
            {temperature > 0 ? temperature : '—'}
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-wide">°C temp.</span>
          {temperature > 0 && (
            <div className={`h-1 w-10 rounded-full ${temperature < 37.5 ? 'bg-emerald-400' : 'bg-red-400'}`} />
          )}
        </div>

        {/* Mood */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl leading-none">
            {mood > 0 ? MOOD_EMOJI[Math.min(mood, 5)] ?? '😊' : '—'}
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-wide">ánimo</span>
          {mood > 0 && (
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < mood ? 'bg-violet-400' : 'bg-white/10'}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Next med */}
      {nextMed && (
        <div className="pt-3 border-t border-white/8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span>💊</span>
                <span className="text-sm font-semibold text-white">{nextMed.name}</span>
                <span className="text-[10px] text-white/30">{nextMed.patientType === 'baby' ? '· Bebé' : '· Mamá'}</span>
              </div>
              <p className="text-xs text-white/30 mt-0.5">{nextMed.dosage}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-violet-400">{formatHour(nextMed.nextDue)}</p>
            </div>
          </div>
        </div>
      )}

      <a href="/mama" className="text-xs text-white/30 hover:text-white/60 transition-colors text-center -mt-1">
        Ver historial completo →
      </a>
    </div>
  )
}
