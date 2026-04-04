import SleepForm from '@/components/bebe/SleepForm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import connectDB from '@/lib/mongodb'
import Baby from '@/models/Baby'
import Sleep from '@/models/Sleep'

async function getBabyAndSleeps() {
  try {
    await connectDB()
    const baby = await Baby.findOne().sort({ createdAt: 1 }).lean()
    if (!baby) return { baby: null, sleeps: [], totalHours: 0 }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sleeps = await Sleep.find({
      babyId: (baby as any)._id,
      startTime: { $gte: today },
    })
      .sort({ startTime: -1 })
      .lean()

    const totalMin = sleeps.reduce((acc, s: any) => acc + (s.durationMinutes ?? 0), 0)

    return { baby, sleeps, totalHours: +(totalMin / 60).toFixed(1) }
  } catch {
    return { baby: null, sleeps: [], totalHours: 0 }
  }
}

const QUALITY_LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

export default async function SuenoPage() {
  const { baby, sleeps, totalHours } = await getBabyAndSleeps()

  if (!baby) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Registro de sueño</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ No hay perfil de bebé registrado.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">😴 Registro de sueño</h1>
        {totalHours > 0 && (
          <Badge variant="secondary">{totalHours}h hoy</Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-5">
          <SleepForm babyId={String((baby as any)._id)} />
        </CardContent>
      </Card>

      {sleeps.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sueños de hoy
          </h2>
          <Card>
            <CardContent className="divide-y pt-2">
              {sleeps.map((s: any) => {
                const start = new Date(s.startTime)
                const end = s.endTime ? new Date(s.endTime) : null
                const dur = s.durationMinutes
                  ? s.durationMinutes >= 60
                    ? `${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}min`
                    : `${s.durationMinutes} min`
                  : 'En curso'
                return (
                  <div key={String(s._id)} className="flex items-center justify-between py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {s.type === 'night' ? '🌙' : '☀️'}{' '}
                          {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {end && ` → ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{dur}</span>
                        {s.location && <span className="text-xs text-muted-foreground">· {s.location}</span>}
                        {s.quality && (
                          <span className="text-xs text-muted-foreground">
                            · {'⭐'.repeat(s.quality)} {QUALITY_LABELS[s.quality]}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={end ? 'secondary' : 'default'} className="text-xs">
                      {end ? 'Completado' : 'En curso'}
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
