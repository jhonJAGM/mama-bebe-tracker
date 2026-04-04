'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  icon: string
  activeColor: string
  activeBg: string
  match: (p: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Inicio',
    href: '/',
    icon: '🏠',
    activeColor: 'text-rose-600',
    activeBg: 'bg-rose-50',
    match: (p) => p === '/',
  },
  {
    label: 'Bebé',
    href: '/bebe',
    icon: '🍼',
    activeColor: 'text-sky-600',
    activeBg: 'bg-sky-50',
    match: (p) => p.startsWith('/bebe'),
  },
  {
    label: 'Mamá',
    href: '/mama',
    icon: '❤️',
    activeColor: 'text-violet-600',
    activeBg: 'bg-violet-50',
    match: (p) => p.startsWith('/mama'),
  },
  {
    label: 'Calendario',
    href: '/calendario',
    icon: '📅',
    activeColor: 'text-cyan-600',
    activeBg: 'bg-cyan-50',
    match: (p) => p.startsWith('/calendario'),
  },
  {
    label: 'Bitácora',
    href: '/bitacora',
    icon: '📔',
    activeColor: 'text-amber-600',
    activeBg: 'bg-amber-50',
    match: (p) => p.startsWith('/bitacora'),
  },
  {
    label: 'Ciclo',
    href: '/ciclo',
    icon: '🔄',
    activeColor: 'text-emerald-600',
    activeBg: 'bg-emerald-50',
    match: (p) => p.startsWith('/ciclo'),
  },
]

export default function TabletNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,.06)]">
      <div className="mx-auto flex max-w-2xl items-stretch px-2">
        {NAV_ITEMS.map(({ label, href, icon, activeColor, activeBg, match }) => {
          const isActive = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-1 flex-col items-center justify-center gap-1 py-2 px-1
                min-h-[64px] rounded-2xl mx-0.5 my-1
                transition-all duration-200 active:scale-90
                ${isActive ? `${activeBg} ${activeColor}` : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
              `}
            >
              <span className={`text-2xl leading-none transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span className={`text-[10px] font-semibold leading-tight ${isActive ? activeColor : ''}`}>
                {label}
              </span>
              {isActive && (
                <span className={`w-1 h-1 rounded-full ${activeColor.replace('text-', 'bg-')}`} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
