import FeedForm from '@/components/bebe/FeedForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import connectDB from '@/lib/mongodb'
import Baby from '@/models/Baby'
import Feeding from '@/models/Feeding'

async function getBabyAndFeedings() {
  try {
    await connectDB()
    const baby = await Baby.findOne().sort({ createdAt: 1 }).lean()
    if (!baby) return { baby: null, recentFeedings: [] }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const feedings = await Feeding.find({
      babyId: (baby as any)._id,
      startTime: { $gte: today },
    })
      .sort({ startTime: -1 })
      .limit(5)
      .lean()

    return { baby, recentFeedings: feedings }
  } catch {
    return { baby: null, recentFeedings: [] }
  }
}

const TYPE_LABELS: Record<string, string> = {
  breast_left: '🤱 Pecho izq.',
  breast_right: '🤱 Pecho der.',
  formula: '🍼 Biberón',
  mixed: '🔀 Mixto',
}

export default async function TomasPage() {
  const { baby, recentFeedings } = await getBabyAndFeedings()

  if (!baby) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Registro de tomas</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ No hay perfil de bebé registrado. Crea uno primero en Configuración.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🍼 Registro de toma</h1>

      <Card>
        <CardContent className="pt-5">
          <FeedForm babyId={String((baby as any)._id)} />
        </CardContent>
      </Card>

      {/* Ultimas tomas del dia */}
      {recentFeedings.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tomas de hoy
          </h2>
          <Card>
            <CardContent className="divide-y pt-2">
              {recentFeedings.map((f: any) => {
                const start = new Date(f.startTime)
                const dur = f.durationMinutes ? `${f.durationMinutes} min` : f.endTime ? `${Math.round((new Date(f.endTime).getTime() - start.getTime()) / 60000)} min` : null
                return (
                  <div key={String(f._id)} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{TYPE_LABELS[f.type] ?? f.type}</p>
                      {dur && <p className="text-xs text-muted-foreground">{dur}</p>}
                      {f.amountMl && <p className="text-xs text-muted-foreground">{f.amountMl} ml</p>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
