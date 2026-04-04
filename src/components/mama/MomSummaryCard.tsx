import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MomLogEntry, MedEntry } from '@/lib/mom-data'

interface MomSummaryCardProps {
  recentLogs: MomLogEntry[]
  activeMeds: MedEntry[]
}

function formatHour(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff} min`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m > 0 ? `Hace ${h}h ${m}min` : `Hace ${h}h`
}

const MOOD_LABELS = ['', '😢 Muy mal', '😔 Mal', '😐 Regular', '🙂 Bien', '😄 Excelente']
const WOUND_LABELS: Record<string, string> = {
  clean: '✅ Limpia',
  red: '🔴 Enrojecida',
  secretion: '⚠️ Con secreción',
  open: '🚨 Abierta',
}
const LOCHIA_COLORS: Record<string, string> = {
  red: '🔴 Rojo',
  pink: '🩷 Rosado',
  brown: '🟤 Marrón',
  yellow: '🟡 Amarillo',
  white: '⚪ Blanco/claro',
}

// Tarjeta resumen del estado actual de mamá.
// Muestra tendencia de dolor (↑↓→), temperatura, próximo medicamento.
export default function MomSummaryCard({ recentLogs, activeMeds }: MomSummaryCardProps) {
  const latest = recentLogs[0] ?? null
  const previous = recentLogs[1] ?? null

  // Tendencia de dolor
  let painTrend: '↑' | '↓' | '→' | null = null
  let painTrendColor = 'text-muted-foreground'
  if (latest?.painLevel != null && previous?.painLevel != null) {
    if (latest.painLevel > previous.painLevel) {
      painTrend = '↑'
      painTrendColor = 'text-red-500'
    } else if (latest.painLevel < previous.painLevel) {
      painTrend = '↓'
      painTrendColor = 'text-green-500'
    } else {
      painTrend = '→'
    }
  }

  // Próximo medicamento
  const nextMed = activeMeds
    .filter((m) => m.nextDue)
    .sort((a, b) => new Date(a.nextDue!).getTime() - new Date(b.nextDue!).getTime())[0] ?? null

  const nextMedMinutes = nextMed?.nextDue
    ? Math.round((new Date(nextMed.nextDue).getTime() - Date.now()) / 60000)
    : null

  if (!latest) {
    return (
      <Card className="border-rose-200 dark:border-rose-800">
        <CardContent className="py-5 text-center text-sm text-muted-foreground">
          Sin registros aún.{' '}
          <a href="/mama/recuperacion" className="text-rose-600 underline">
            Agregar primero
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-rose-800 dark:text-rose-200">
          Estado de mamá
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Último registro: {formatRelative(latest.date)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Fila: Dolor + Temperatura */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-background px-3 py-3">
            <p className="text-xs text-muted-foreground mb-1">Dolor</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold">
                {latest.painLevel != null ? `${latest.painLevel}` : '—'}
              </span>
              {latest.painLevel != null && (
                <span className="text-sm text-muted-foreground">/10</span>
              )}
              {painTrend && (
                <span className={`text-lg font-bold ${painTrendColor}`}>{painTrend}</span>
              )}
            </div>
            {latest.painZone && (
              <p className="text-xs text-muted-foreground mt-0.5">{latest.painZone}</p>
            )}
          </div>

          <div className="rounded-xl bg-background px-3 py-3">
            <p className="text-xs text-muted-foreground mb-1">Temperatura</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {latest.temperature != null ? latest.temperature : '—'}
              </span>
              {latest.temperature != null && (
                <span className="text-sm text-muted-foreground">°C</span>
              )}
            </div>
            {latest.temperature != null && (
              <Badge
                variant={latest.temperature >= 37.5 ? 'destructive' : 'secondary'}
                className="mt-1 text-[10px]"
              >
                {latest.temperature >= 37.5 ? '🌡️ Fiebre' : '✅ Normal'}
              </Badge>
            )}
          </div>
        </div>

        {/* Estado herida + loquios */}
        {(latest.woundStatus || latest.lochiaColor) && (
          <div className="flex flex-wrap gap-2">
            {latest.woundStatus && (
              <Badge variant="outline" className="text-xs">
                🩹 {WOUND_LABELS[latest.woundStatus] ?? latest.woundStatus}
              </Badge>
            )}
            {latest.lochiaColor && (
              <Badge variant="outline" className="text-xs">
                {LOCHIA_COLORS[latest.lochiaColor] ?? latest.lochiaColor}
                {latest.lochiaAmount && ` · ${latest.lochiaAmount}`}
              </Badge>
            )}
          </div>
        )}

        {/* Humor */}
        {latest.mood != null && (
          <p className="text-sm">{MOOD_LABELS[latest.mood]}</p>
        )}

        {/* Próximo medicamento */}
        {nextMed && (
          <div
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
              nextMedMinutes != null && nextMedMinutes <= 60
                ? 'bg-amber-100 dark:bg-amber-950/30'
                : 'bg-background'
            }`}
          >
            <div>
              <p className="text-xs text-muted-foreground">Próximo medicamento</p>
              <p className="text-sm font-medium">
                {nextMed.name} · {nextMed.dosage}
              </p>
            </div>
            <Badge
              variant={nextMedMinutes != null && nextMedMinutes <= 60 ? 'default' : 'outline'}
              className="text-xs shrink-0"
            >
              {formatHour(nextMed.nextDue)}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
