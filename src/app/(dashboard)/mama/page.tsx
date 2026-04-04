import { getMomPageData } from '@/lib/mom-data'
import MomSummaryCard from '@/components/mama/MomSummaryCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const MOOD_LABELS = ['', '😢', '😔', '😐', '🙂', '😄']
const PAIN_LABELS = ['', 'Muy leve', 'Muy leve', 'Leve', 'Leve', 'Moderado', 'Moderado', 'Intenso', 'Intenso', 'Muy intenso', 'Insoportable']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPainColor(level: number | null): string {
  if (!level) return 'bg-muted text-muted-foreground'
  if (level <= 3) return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-200'
  if (level <= 6) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-200'
}

export default async function MamaPage() {
  const data = await getMomPageData()

  if (data.dbError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">❤️ Módulo mamá</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800">
          ⚠️ Sin conexión a la base de datos.
        </div>
      </div>
    )
  }

  const today = data.recentLogs[0] ?? null

  // Promedio de dolor de los últimos 7 días
  const painValues = data.recentLogs.filter((l) => l.painLevel != null).map((l) => l.painLevel!)
  const avgPain = painValues.length > 0
    ? +(painValues.reduce((a, b) => a + b, 0) / painValues.length).toFixed(1)
    : null

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">❤️ Mamá</h1>
        <a href="/mama/recuperacion">
          <Badge
            variant="outline"
            className="border-rose-300 text-rose-700 dark:text-rose-300 cursor-pointer hover:bg-rose-50"
          >
            + Nuevo registro
          </Badge>
        </a>
      </div>

      {/* Tarjeta resumen */}
      <MomSummaryCard
        recentLogs={data.recentLogs}
        activeMeds={data.activeMeds}
      />

      {/* Promedio dolor semana */}
      {avgPain !== null && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/50 px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground">Promedio dolor</p>
            <p className="text-xl font-bold mt-1">{avgPain}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
          </div>
          <div className="rounded-xl bg-muted/50 px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground">Registros</p>
            <p className="text-xl font-bold mt-1">{data.recentLogs.length}</p>
          </div>
          <div className="rounded-xl bg-muted/50 px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground">Medicamentos</p>
            <p className="text-xl font-bold mt-1">{data.activeMeds.length}</p>
          </div>
        </div>
      )}

      {/* Historial de registros */}
      {data.recentLogs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Historial reciente
          </h2>
          <Card>
            <CardContent className="divide-y pt-2">
              {data.recentLogs.map((log) => (
                <div key={log.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.date)}
                    </span>
                    {log.mood != null && (
                      <span className="text-lg">{MOOD_LABELS[log.mood]}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {log.painLevel != null && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPainColor(log.painLevel)}`}>
                        💊 Dolor {log.painLevel}/10 — {PAIN_LABELS[log.painLevel]}
                      </span>
                    )}
                    {log.temperature != null && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.temperature >= 37.5
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-200'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        🌡️ {log.temperature}°C
                      </span>
                    )}
                    {log.woundStatus && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        🩹 {log.woundStatus}
                      </span>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{log.notes}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {data.recentLogs.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-rose-200 px-6 py-10 text-center">
          <p className="text-4xl mb-3">❤️</p>
          <p className="text-sm font-medium">Sin registros aún</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Registra tu primer estado de recuperación
          </p>
          <a
            href="/mama/recuperacion"
            className="inline-flex h-10 items-center rounded-lg bg-rose-500 px-5 text-sm font-semibold text-white hover:bg-rose-600 transition-colors"
          >
            Agregar registro
          </a>
        </div>
      )}
    </div>
  )
}
