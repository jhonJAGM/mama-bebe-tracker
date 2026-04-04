// app/page.tsx — raíz de la app
// app/(dashboard)/page.tsx no puede servir '/' porque este archivo tiene precedencia
// en el resolver de rutas de Next.js. Aquí componemos el layout + página del dashboard
// directamente para que '/' muestre el dashboard real con TabletNav.
import DashboardLayout from './(dashboard)/layout'
import DashboardPage from './(dashboard)/page'

export default function RootPage() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  )
}
