import { getMomPageData } from '@/lib/mom-data'
import MomForm from '@/components/mama/MomForm'
import { Card, CardContent } from '@/components/ui/card'

export default async function RecuperacionPage() {
  // Carga los medicamentos activos para el checklist del formulario
  const data = await getMomPageData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">❤️ Registro de recuperación</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cómo te sientes hoy
        </p>
      </div>

      {data.dbError && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800">
          ⚠️ Sin conexión a MongoDB. Los datos no se guardarán.
        </div>
      )}

      <Card>
        <CardContent className="pt-5">
          <MomForm activeMeds={data.activeMeds} />
        </CardContent>
      </Card>
    </div>
  )
}
