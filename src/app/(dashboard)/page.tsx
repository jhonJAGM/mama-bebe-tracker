import { getDashboardData } from '@/lib/dashboard-data'
import StatsCard from '@/components/dashboard/StatsCard'
import NextFeedAlert from '@/components/dashboard/NextFeedAlert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const FEED_TYPE_LABELS: Record<string, string> = {
  breast_left: 'Pecho izq.',
  breast_right: 'Pecho der.',
  formula: 'Biberón',
  mixed: 'Mixto',
}

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const diff = Math.round((Date.now() - new Date(isoString).getTime()) / 60000)
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff} min`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m > 0 ? `Hace ${h}h ${m}min` : `Hace ${h}h`
}

function formatHour(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function computeNextFeedTime(lastFeedISO: string | null, intervalHours = 3): string {
  if (!lastFeedISO) return '—'
  const next = new Date(new Date(lastFeedISO).getTime() + intervalHours * 3600000)
  return next.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// Server Component — lee directamente de MongoDB en cada request
export default async function DashboardPage() {
  const data = await getDashboardData()

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const lastFeedISO = data.lastFeeding
    ? new Date((data.lastFeeding as any).startTime).toISOString()
    : null

  const momLog = data.momLog as any
  const painLevel: number = momLog?.painLevel ?? 0
  const temperature: number = momLog?.temperature ?? 0

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">
            Hola 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {(data.baby as any)?.name ?? 'Sin perfil'}
        </Badge>
      </div>

      {/* Alerta si MongoDB no está disponible */}
      {data.dbError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ Sin conexión a la base de datos. Configura <code className="font-mono text-xs">MONGODB_URI</code> en <code className="font-mono text-xs">.env.local</code>
        </div>
      )}

      {/* Alerta próxima toma */}
      <NextFeedAlert
        lastFeedTimeISO={lastFeedISO}
        feedIntervalHours={3}
      />

      {/* Stats bebe */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Bebé hoy
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatsCard
            title="Última toma"
            value={formatRelativeTime(lastFeedISO)}
            subtitle={
              lastFeedISO
                ? `${FEED_TYPE_LABELS[(data.lastFeeding as any)?.type] ?? ''} · ${formatHour(lastFeedISO)}`
                : 'Sin registros hoy'
            }
            icon="🍼"
            badge={{ label: lastFeedISO ? 'Registrado' : 'Sin datos', variant: 'secondary' }}
          />
          <StatsCard
            title="Pañales"
            value={String(data.diaperSummary?.total ?? 0)}
            subtitle={
              data.diaperSummary
                ? `${data.diaperSummary.pee} pipi · ${data.diaperSummary.poop} caca`
                : 'Sin registros'
            }
            icon="👶"
            badge={{ label: 'Hoy', variant: 'secondary' }}
          />
          <StatsCard
            title="Sueño"
            value={`${data.sleepSummary?.totalHours ?? 0}h`}
            subtitle={
              data.sleepSummary?.lastSleepStart
                ? `Última siesta: ${formatHour(data.sleepSummary.lastSleepStart)}`
                : 'Sin registros hoy'
            }
            icon="😴"
            badge={{ label: 'Acumulado', variant: 'secondary' }}
          />
          <StatsCard
            title="Próxima toma"
            value={computeNextFeedTime(lastFeedISO)}
            subtitle="Intervalo de 3h"
            icon="⏰"
            highlight={!!lastFeedISO}
          />
        </div>
      </section>

      {/* Stats mamá */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Mamá hoy
        </h2>
        {!momLog && !data.dbError && (
          <p className="text-sm text-muted-foreground">
            Sin registro de hoy.{' '}
            <a href="/mama/recuperacion" className="underline">
              Agregar
            </a>
          </p>
        )}
        {momLog && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatsCard
              title="Dolor"
              value={painLevel ? `${painLevel}/10` : '—'}
              subtitle={momLog.painZone ?? 'Sin zona'}
              icon="💊"
              badge={{
                label: !painLevel ? 'Sin dato' : painLevel <= 3 ? 'Leve' : painLevel <= 6 ? 'Moderado' : 'Intenso',
                variant: !painLevel ? 'outline' : painLevel <= 3 ? 'secondary' : painLevel <= 6 ? 'default' : 'destructive',
              }}
            />
            <StatsCard
              title="Temperatura"
              value={temperature ? `${temperature}°C` : '—'}
              subtitle="Normal < 37.5°C"
              icon="🌡️"
              badge={{
                label: !temperature ? 'Sin dato' : temperature < 37.5 ? 'Normal' : 'Fiebre',
                variant: !temperature ? 'outline' : temperature < 37.5 ? 'secondary' : 'destructive',
              }}
            />
            <StatsCard
              title="Estado ánimo"
              value={momLog.mood ? '⭐'.repeat(momLog.mood) : '—'}
              subtitle={formatHour(momLog.date?.toISOString?.() ?? momLog.date)}
              icon="❤️"
              badge={{ label: 'Último registro', variant: 'outline' }}
            />
          </div>
        )}
      </section>

      {/* Acciones rápidas */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Registrar toma', icon: '🍼', href: '/bebe/tomas' },
            { label: 'Cambio pañal', icon: '👶', href: '/bebe/panales' },
            { label: 'Inicio sueño', icon: '😴', href: '/bebe/sueno' },
            { label: 'Estado mamá', icon: '❤️', href: '/mama/recuperacion' },
          ].map(({ label, icon, href }) => (
            <a key={href} href={href}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md active:scale-95">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-5">
                  <span className="text-3xl">{icon}</span>
                  <span className="text-center text-xs font-medium">{label}</span>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </section>

      {/* Próximos medicamentos */}
      {data.upcomingMeds.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Próximos medicamentos
          </h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hoy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.upcomingMeds.map((med) => {
                const minutesUntil = Math.round(
                  (new Date(med.nextDue).getTime() - Date.now()) / 60000
                )
                const soon = minutesUntil <= 60
                return (
                  <div
                    key={`${med.name}-${med.nextDue}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      soon ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-muted/50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {med.name} · {med.dosage}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {med.patientType === 'baby' ? 'Bebé' : 'Mamá'}
                      </p>
                    </div>
                    <Badge variant={soon ? 'default' : 'outline'} className="text-xs">
                      {formatHour(med.nextDue)}
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
