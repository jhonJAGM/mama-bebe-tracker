// Página servida por el SW cuando no hay conexión y la página solicitada
// no está en caché. También se precarga en el install del SW.
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-rose-50 px-6 text-center dark:bg-rose-950/10">
      <span className="text-6xl mb-4">👶</span>
      <h1 className="text-2xl font-bold text-rose-800 dark:text-rose-200">Sin conexión</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        No hay internet en este momento. Las páginas que visitaste antes siguen disponibles.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-600 transition-colors active:scale-95"
      >
        Reintentar
      </button>
      <p className="mt-4 text-xs text-muted-foreground">
        Los datos se sincronizarán cuando vuelva la conexión
      </p>
    </div>
  )
}
