'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

type CyclePoint = {
  cycleTime: string
  totalMl: number
  status: string
}

type Props = {
  cycles: CyclePoint[]
  maxLimitMl?: number
  minLimitMl?: number
}

export default function MiniMlChart({ cycles, maxLimitMl = 150, minLimitMl = 60 }: Props) {
  const data = cycles.map((c) => ({
    hora: c.cycleTime,
    ml: c.totalMl > 0 ? c.totalMl : null,
  }))

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <XAxis
          dataKey="hora"
          tick={{ fontSize: 9, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          domain={[0, maxLimitMl + 20]}
        />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}
          formatter={(v) => [`${v} ml`, 'Total']}
        />
        <ReferenceLine y={maxLimitMl} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1.5} />
        <ReferenceLine y={minLimitMl} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1.5} />
        <Line
          type="monotone"
          dataKey="ml"
          stroke="#f43f5e"
          strokeWidth={2}
          dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
