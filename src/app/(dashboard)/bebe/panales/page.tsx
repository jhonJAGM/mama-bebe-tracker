import DiaperForm from '@/components/bebe/DiaperForm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import connectDB from '@/lib/mongodb'
import Baby from '@/models/Baby'
import Diaper from '@/models/Diaper'

async function getBabyAndDiapers() {
  try {
    await connectDB()
    const baby = await Baby.findOne().sort({ createdAt: 1 }).lean()
    if (!baby) return { baby: null, diapers: [] }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diapers = await Diaper.find({
      babyId: (baby as any)._id,
      time: { $gte: today },
    })
      .sort({ time: -1 })
      .lean()

    return { baby, diapers }
  } catch {
    return { baby: null, diapers: [] }
  }
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  pee: { label: '💧 Pipi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  poop: { label: '💩 Caca', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' },
  both: { label: '💧💩 Ambos', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200' },
  dry: { label: '✅ Seco', color: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200' },
}

export default async function PanalesPage() {
  const { baby, diapers } = await getBabyAndDiapers()

  if (!baby) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Registro de pañales</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ No hay perfil de bebé registrado.
        </div>
      </div>
    )
  }

  const peeCount = diapers.filter((d: any) => d.type === 'pee' || d.type === 'both').length
  const poopCount = diapers.filter((d: any) => d.type === 'poop' || d.type === 'both').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">👶 Registro de pañal</h1>
        {diapers.length > 0 && (
          <div className="flex gap-2 text-sm">
            <span className="text-blue-600">💧 {peeCount}</span>
            <span className="text-amber-700">💩 {poopCount}</span>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-5">
          <DiaperForm babyId={String((baby as any)._id)} />
        </CardContent>
      </Card>

      {diapers.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pañales de hoy ({diapers.length})
          </h2>
          <Card>
            <CardContent className="divide-y pt-2">
              {diapers.map((d: any) => {
                const cfg = TYPE_CONFIG[d.type] ?? { label: d.type, color: '' }
                return (
                  <div key={String(d._id)} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs border-0 ${cfg.color}`}>{cfg.label}</Badge>
                      {d.color && <span className="text-xs text-muted-foreground">{d.color}</span>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(d.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
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
