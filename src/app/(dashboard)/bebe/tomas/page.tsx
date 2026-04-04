import connectDB from '@/lib/mongodb'
import Baby from '@/models/Baby'
import FeedTracker from '@/components/bebe/FeedTracker'

async function getBaby() {
  try {
    await connectDB()
    return await Baby.findOne().sort({ createdAt: 1 }).lean()
  } catch {
    return null
  }
}

export default async function TomasPage() {
  const baby = await getBaby()

  if (!baby) {
    return (
      <div className="space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-rose-700">🍼 Registro de tomas</h1>
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          ⚠️ No hay perfil de bebé registrado. Crea uno primero.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-rose-700">🍼 Bitácora de lactancia</h1>
        <p className="text-sm text-gray-400 mt-0.5">8 ciclos · cada 3 horas</p>
      </div>
      <FeedTracker babyId={String((baby as any)._id)} />
    </div>
  )
}
