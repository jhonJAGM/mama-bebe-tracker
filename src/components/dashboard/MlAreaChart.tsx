'use client'

import {
  AreaChart, Area, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type DataPoint = {
  hour: string
  ml: number
}

type Props = {
  data: DataPoint[]
  maxLimitMl?: number
  minLimitMl?: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[11px] text-white/50 font-medium">{label}</p>
      <p className="text-base font-black text-white">{payload[0].value} ml</p>
    </div>
  )
}

export default function MlAreaChart({ data, maxLimitMl = 150, minLimitMl = 60 }: Props) {
  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="mlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine
            y={maxLimitMl}
            stroke="#f43f5e"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{ value: `máx ${maxLimitMl}`, fill: '#f43f5e', fontSize: 9 }}
          />
          <ReferenceLine
            y={minLimitMl}
            stroke="#34d399"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{ value: `mín ${minLimitMl}`, fill: '#34d399', fontSize: 9 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="ml"
            stroke="#fb7185"
            strokeWidth={2}
            fill="url(#mlGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#f43f5e', stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
