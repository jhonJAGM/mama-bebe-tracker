'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

export interface GrowthPoint {
  date: string       // ISO string — se formatea en display
  weightKg?: number
  heightCm?: number
  headCircumferenceCm?: number
}

type Metric = 'weightKg' | 'heightCm' | 'headCircumferenceCm'

interface GrowthChartProps {
  data: GrowthPoint[]
  metric: Metric
}

const METRIC_CONFIG: Record<Metric, { label: string; color: string; unit: string; decimals: number }> = {
  weightKg: { label: 'Peso', color: '#f43f5e', unit: 'kg', decimals: 3 },
  heightCm: { label: 'Talla', color: '#3b82f6', unit: 'cm', decimals: 1 },
  headCircumferenceCm: { label: 'Perímetro cefálico', color: '#8b5cf6', unit: 'cm', decimals: 1 },
}

function formatDateAxis(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const metric = p.dataKey as Metric
  const cfg = METRIC_CONFIG[metric]

  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold mb-1">{formatDateAxis(label)}</p>
      <p style={{ color: cfg.color }}>
        {cfg.label}: <span className="font-bold">{p.value?.toFixed(cfg.decimals)} {cfg.unit}</span>
      </p>
    </div>
  )
}

// LineChart de Recharts para una única métrica de crecimiento.
// Se instancia tres veces en la página (peso, talla, cefálico) para independencia de escalas.
export default function GrowthChart({ data, metric }: GrowthChartProps) {
  const cfg = METRIC_CONFIG[metric]
  const filtered = data.filter((d) => d[metric] != null)

  if (filtered.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground">
        Sin mediciones de {cfg.label.toLowerCase()} aún
      </div>
    )
  }

  // Rango del eje Y: min-5% / max+5% para no colapsar la línea
  const values = filtered.map((d) => d[metric] as number)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const pad = (maxVal - minVal) * 0.15 || 0.1
  const yDomain = [+(minVal - pad).toFixed(2), +(maxVal + pad).toFixed(2)]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={filtered} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateAxis}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => `${v}${cfg.unit}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Línea de tendencia suavizada */}
        <Line
          type="monotone"
          dataKey={metric}
          stroke={cfg.color}
          strokeWidth={2.5}
          dot={{ fill: cfg.color, r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          connectNulls
        />
        {/* Punto de nacimiento si hay suficientes datos */}
        {filtered.length >= 2 && (
          <ReferenceLine
            x={filtered[0].date}
            stroke={cfg.color}
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{ value: 'Nac.', position: 'insideTopRight', fontSize: 9, fill: cfg.color }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
