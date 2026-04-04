import TabletNav from '@/components/shared/TabletNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header con título de la app */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <span className="font-bold text-lg tracking-tight">mama-bebé tracker</span>
          <span className="text-lg">🌸</span>
        </div>
      </header>

      {/* Contenido principal — padding-bottom para que no quede tapado por TabletNav (64px) */}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-5">
        {children}
      </main>

      {/* Navegación inferior fija */}
      <TabletNav />
    </div>
  )
}
