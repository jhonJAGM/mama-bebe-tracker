// next.config.ts debe tener: experimental: { instrumentationHook: true }
// Este archivo se ejecuta una vez al iniciar el servidor Next.js
export async function register() {
  // Solo correr cron jobs en el servidor (no en edge runtime ni en cliente)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initCronJobs } = await import('@/lib/cron-jobs')
    initCronJobs()
  }
}
