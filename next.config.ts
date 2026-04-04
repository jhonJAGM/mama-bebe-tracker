import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // output: 'standalone' genera un bundle autosuficiente para Docker / Railway
  // Incluye solo las dependencias necesarias en .next/standalone/
  output: 'standalone',

  async headers() {
    return [
      // Manifest y íconos PWA — caché larga, revalida en background
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, immutable' },
        ],
      },
      // Service Worker — nunca cachear para que siempre esté actualizado
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // Assets estáticos de Next.js — ya tienen hash en nombre, se pueden cachear eternamente
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
