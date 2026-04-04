'use client'

type TrendDir = 'up' | 'down' | 'neutral'

type Props = {
  icon: string
  iconBg: string
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  progress?: number        // 0-100
  progressColor?: string
  trend?: string
  trendDir?: TrendDir
  extra?: React.ReactNode
}

export default function MetricCard({
  icon,
  iconBg,
  title,
  value,
  unit,
  subtitle,
  progress,
  progressColor = 'bg-rose-500',
  trend,
  trendDir = 'neutral',
  extra,
}: Props) {
  const trendColor =
    trendDir === 'up' ? 'text-emerald-400' : trendDir === 'down' ? 'text-red-400' : 'text-white/40'
  const trendArrow = trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '•'

  return (
    <div className="rounded-2xl p-4 bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col gap-3 hover:bg-white/8 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold ${trendColor}`}>
            {trendArrow} {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <div className="flex items-end gap-1.5 leading-none">
          <span className="text-4xl font-black text-white tabular-nums tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-base font-normal text-white/40 mb-0.5">{unit}</span>
          )}
        </div>
        <p className="text-[11px] text-white/40 font-medium uppercase tracking-wide mt-1.5">
          {title}
        </p>
      </div>

      {/* Progress bar */}
      {progress != null && (
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[11px] text-white/30 leading-relaxed -mt-1">{subtitle}</p>
      )}

      {/* Extra slot */}
      {extra}
    </div>
  )
}
