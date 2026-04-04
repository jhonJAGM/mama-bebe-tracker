import TabletNav from '@/components/shared/TabletNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Contenido principal */}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">
        {children}
      </main>

      {/* Navegación inferior fija */}
      <TabletNav />
    </div>
  )
}
