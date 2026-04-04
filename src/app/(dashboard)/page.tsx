import StatsCard from '@/components/dashboard/StatsCard'
import NextFeedAlert from '@/components/dashboard/NextFeedAlert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Datos de ejemplo hasta que se conecte auth y se lean de MongoDB
const MOCK = {
  babyName: 'Bebe',
  lastFeed: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // hace 2.5h
  feedIntervalHours: 3,
  diapersToday: 6,
  sleepHoursToday: 14.5,
  momPainLevel: 4,
  momTemp: 36.8,
}

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">Hola 👋</h1>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {MOCK.babyName}
        </Badge>
      </div>

      {/* Alerta proxima toma — siempre al tope */}
      <NextFeedAlert
        lastFeedTime={MOCK.lastFeed}
        feedIntervalHours={MOCK.feedIntervalHours}
      />

      {/* Grid de estadisticas del bebe */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Bebe hoy
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatsCard
            title="Ultima toma"
            value="Hace 2.5h"
            subtitle="Pecho izquierdo · 15 min"
            icon="🍼"
            badge={{ label: 'Normal', variant: 'secondary' }}
          />
          <StatsCard
            title="Panales"
            value={`${MOCK.diapersToday}`}
            subtitle="4 pipi · 2 caca"
            icon="👶"
            badge={{ label: 'Bien', variant: 'secondary' }}
          />
          <StatsCard
            title="Sueno"
            value={`${MOCK.sleepHoursToday}h`}
            subtitle="Ultima siesta: 11:00"
            icon="😴"
            badge={{ label: 'Bueno', variant: 'secondary' }}
          />
          <StatsCard
            title="Proxima toma"
            value="16:30"
            subtitle={`En ${MOCK.feedIntervalHours}h de intervalo`}
            icon="⏰"
            highlight
          />
        </div>
      </section>

      {/* Grid estado mama */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Mama hoy
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatsCard
            title="Dolor"
            value={`${MOCK.momPainLevel}/10`}
            subtitle="Herida cesarea"
            icon="💊"
            badge={{
              label: MOCK.momPainLevel <= 3 ? 'Leve' : MOCK.momPainLevel <= 6 ? 'Moderado' : 'Intenso',
              variant: MOCK.momPainLevel <= 3 ? 'secondary' : MOCK.momPainLevel <= 6 ? 'default' : 'destructive',
            }}
          />
          <StatsCard
            title="Temperatura"
            value={`${MOCK.momTemp}°C`}
            subtitle="Normal < 37.5°C"
            icon="🌡️"
            badge={{
              label: MOCK.momTemp < 37.5 ? 'Normal' : 'Fiebre',
              variant: MOCK.momTemp < 37.5 ? 'secondary' : 'destructive',
            }}
          />
          <StatsCard
            title="Medicamentos"
            value="2 activos"
            subtitle="Proximo: Ibuprofeno 18:00"
            icon="💉"
            badge={{ label: 'Al dia', variant: 'secondary' }}
          />
        </div>
      </section>

      {/* Acciones rapidas */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Acciones rapidas
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Registrar toma', icon: '🍼', href: '/bebe/tomas' },
            { label: 'Cambio panal', icon: '👶', href: '/bebe/panales' },
            { label: 'Inicio sueno', icon: '😴', href: '/bebe/sueno' },
            { label: 'Estado mama', icon: '❤️', href: '/mama/recuperacion' },
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

      {/* Proximos medicamentos */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Proximos medicamentos
        </h2>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: 'Ibuprofeno 400mg', time: '18:00', patient: 'Mama', soon: true },
              { name: 'Vitamina D · 5 gotas', time: '20:00', patient: 'Bebe', soon: false },
            ].map(({ name, time, patient, soon }) => (
              <div
                key={name}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  soon ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-muted/50'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{patient}</p>
                </div>
                <Badge variant={soon ? 'default' : 'outline'} className="text-xs">
                  {time}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
