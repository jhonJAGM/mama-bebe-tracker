import connectDB from '@/lib/mongodb'
import Baby from '@/models/Baby'
import Growth from '@/models/Growth'
import GrowthDashboard from '@/components/bebe/GrowthDashboard'

async function getBabyAndGrowth() {
  try {
    await connectDB()
    const baby = await Baby.findOne().sort({ createdAt: 1 }).lean()
    if (!baby) return { baby: null, measurements: [] }

    const measurements = await Growth.find({ babyId: (baby as any)._id })
      .sort({ date: 1 })
      .lean()

    return {
      baby,
      measurements: measurements.map((m: any) => ({
        date: new Date(m.date).toISOString(),
        weightKg: m.weightKg ?? null,
        heightCm: m.heightCm ?? null,
        headCircumferenceCm: m.headCircumferenceCm ?? null,
      })),
    }
  } catch {
    return { baby: null, measurements: [] }
  }
}

export default async function CrecimientoPage() {
  const { baby, measurements } = await getBabyAndGrowth()

  if (!baby) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">📈 Crecimiento</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ No hay perfil de bebé registrado.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">📈 Crecimiento</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {(baby as any).name} · Curvas de peso, talla y perímetro cefálico
        </p>
      </div>
      <GrowthDashboard
        initialData={measurements}
        babyId={String((baby as any)._id)}
        babyName={(baby as any).name}
      />
    </div>
  )
}
