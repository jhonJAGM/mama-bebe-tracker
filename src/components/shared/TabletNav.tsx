'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    label: 'Inicio',
    href: '/',
    icon: '🏠',
    match: (p: string) => p === '/',
  },
  {
    label: 'Bebé',
    href: '/bebe',
    icon: '🍼',
    match: (p: string) => p.startsWith('/bebe'),
  },
  {
    label: 'Mamá',
    href: '/mama',
    icon: '❤️',
    match: (p: string) => p.startsWith('/mama'),
  },
  {
    label: 'Calendario',
    href: '/calendario',
    icon: '📅',
    match: (p: string) => p.startsWith('/calendario'),
  },
  {
    label: 'Bitácora',
    href: '/bitacora',
    icon: '📔',
    match: (p: string) => p.startsWith('/bitacora'),
  },
]

// Barra de navegación inferior fija, optimizada para tablet Android.
// Íconos grandes (text-3xl), área táctil mínima de 64px, etiqueta visible.
export default function TabletNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-stretch">
        {NAV_ITEMS.map(({ label, href, icon, match }) => {
          const isActive = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors
                min-h-[64px] active:bg-muted
                ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {/* Indicador superior activo */}
              <span
                className={`mb-0.5 h-0.5 w-8 rounded-full transition-all ${
                  isActive ? 'bg-primary' : 'bg-transparent'
                }`}
              />
              <span className="text-2xl leading-none">{icon}</span>
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isActive ? 'text-primary' : ''
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
