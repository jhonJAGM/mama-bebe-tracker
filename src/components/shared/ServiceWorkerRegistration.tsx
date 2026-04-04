'use client'

import { useEffect, useState } from 'react'

// Registra el SW al montar el componente (solo en producción o si NEXT_PUBLIC_SW_DEV=true).
// Muestra un banner no intrusivo cuando hay una actualización disponible.
export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // No registrar en development para no interferir con HMR,
    // a menos que la variable esté explícitamente activada
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NEXT_PUBLIC_SW_DEV !== 'true'
    ) return

    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        setRegistration(reg)

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        })
      })
      .catch((err) => {
        console.error('[SW] Error al registrar:', err)
      })

    // Escucha el evento custom del sw-register.js si se usa directamente
    const handleUpdate = (e: Event) => {
      const reg = (e as CustomEvent).detail?.registration
      if (reg) setRegistration(reg)
      setUpdateAvailable(true)
    }
    window.addEventListener('sw-update-available', handleUpdate)
    return () => window.removeEventListener('sw-update-available', handleUpdate)
  }, [])

  function applyUpdate() {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  if (!updateAvailable) return null

  // Banner de actualización — aparece al tope, no bloquea la UI
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 bg-rose-600 px-4 py-2.5 text-white shadow-lg">
      <p className="text-sm font-medium">
        🔄 Nueva versión disponible
      </p>
      <div className="flex gap-2">
        <button
          onClick={applyUpdate}
          className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
        >
          Actualizar
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="rounded-lg px-2 py-1 text-xs opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
