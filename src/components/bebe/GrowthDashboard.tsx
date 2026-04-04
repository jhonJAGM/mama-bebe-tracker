'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import GrowthChart, { type GrowthPoint } from '@/components/bebe/GrowthChart'
import GrowthForm from '@/components/bebe/GrowthForm'

interface GrowthDashboardProps {
  initialData: GrowthPoint[]
  babyId: string
  babyName: string
}

// Wrapper client-side que combina gráficas + formulario.
// Tras guardar una medición, refresca los datos desde la API sin recargar la página.
export default function GrowthDashboard({ initialData, babyId, babyName }: GrowthDashboardProps) {
  const [data, setData] = useState<GrowthPoint[]>(initialData)
  const [showForm, setShowForm] = useState(false)

  async function refreshData() {
    try {
      const res = await fetch(`/api/growth?babyId=${babyId}&limit=100`)
      const json = await res.json()
      if (res.ok) {
        setData(
          json.measurements.map((m: any) => ({
            date: new Date(m.date).toISOString(),
            weightKg: m.weightKg,
            heightCm: m.heightCm,
            headCircumferenceCm: m.headCircumferenceCm,
          }))
        )
      }
    } catch { /* silencioso — mantiene datos anteriores */ }
    setShowForm(false)
  }

  // Última medición para mostrar valores actuales
  const latest = data.length > 0 ? data[data.length - 1] : null

  const CHARTS: { metric: 'weightKg' | 'heightCm' | 'headCircumferenceCm'; label: string; unit: string; icon: string }[] = [
    { metric: 'weightKg', label: 'Peso', unit: 'kg', icon: '⚖️' },
    { metric: 'heightCm', label: 'Talla', unit: 'cm', icon: '📏' },
    { metric: 'headCircumferenceCm', label: 'Perímetro cefálico', unit: 'cm', icon: '🔵' },
  ]

  return (
    <div className="space-y-5">
      {/* Header con stats actuales */}
      <div className="grid grid-cols-3 gap-2">
        {CHARTS.map(({ metric, label, unit, icon }) => (
          <div key={metric} className="rounded-xl bg-muted/50 px-3 py-3 text-center">
            <p className="text-lg">{icon}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
            <p className="text-base font-bold mt-0.5">
              {latest?.[metric] != null
                ? `${latest[metric]!.toFixed(metric === 'weightKg' ? 3 : 1)} ${unit}`
                : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Botón agregar medición */}
      <button
        onClick={() => setShowForm((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
      >
        {showForm ? '✕ Cancelar' : '+ Agregar medición'}
      </button>

      {/* Formulario colapsable */}
      {showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nueva medición — {babyName}</CardTitle>
          </CardHeader>
          <CardContent>
            <GrowthForm babyId={babyId} onSaved={refreshData} />
          </CardContent>
        </Card>
      )}

      {/* Gráficas — una por métrica */}
      {CHARTS.map(({ metric, label, unit, icon }) => (
        <Card key={metric}>
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {icon} {label} ({unit})
              </CardTitle>
              {latest?.[metric] != null && (
                <Badge variant="secondary" className="text-xs">
                  Último: {latest[metric]!.toFixed(metric === 'weightKg' ? 3 : 1)} {unit}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <GrowthChart data={data} metric={metric} />
          </CardContent>
        </Card>
      ))}

      {data.length === 0 && !showForm && (
        <div className="rounded-xl border-2 border-dashed border-border px-6 py-10 text-center">
          <p className="text-4xl mb-3">📏</p>
          <p className="text-sm font-medium">Sin mediciones registradas</p>
          <p className="text-xs text-muted-foreground mt-1">
            Registra peso, talla y perímetro cefálico para ver las curvas de crecimiento
          </p>
        </div>
      )}

      {data.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {data.length} medición{data.length !== 1 ? 'es' : ''} registrada{data.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
