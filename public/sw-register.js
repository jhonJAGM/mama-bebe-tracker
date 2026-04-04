// Script de registro del Service Worker.
// Importado como módulo desde ServiceWorkerRegistration (Client Component).
// No usar directamente en <script> — Next.js lo maneja via el componente.

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    // SW instalado por primera vez
    registration.addEventListener('install', () => {
      console.log('[SW] Instalado')
    })

    // Detecta cuando hay una nueva versión disponible
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Hay una actualización disponible — dispatch evento para que la UI lo notifique
          window.dispatchEvent(new CustomEvent('sw-update-available', {
            detail: { registration },
          }))
        }
      })
    })

    return registration
  } catch (error) {
    console.error('[SW] Error al registrar:', error)
  }
}

// Fuerza la activación del SW esperando en waiting
export function applySwUpdate(registration) {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    // Recarga la página para usar el nuevo SW
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }
}
