export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b p-4">
        <span className="font-bold text-lg">mama-bebe-tracker</span>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  )
}
