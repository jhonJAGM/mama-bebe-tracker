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
    activeColor: 'text-rose-400',
    activeBg: 'bg-rose-500/15',
    match: (p) => p === '/',
  },
  {
    label: 'Bebé',
    href: '/bebe',
    icon: '🍼',
    activeColor: 'text-sky-400',
    activeBg: 'bg-sky-500/15',
    match: (p) => p.startsWith('/bebe'),
  },
  {
    label: 'Mamá',
    href: '/mama',
    icon: '❤️',
    activeColor: 'text-violet-400',
    activeBg: 'bg-violet-500/15',
    match: (p) => p.startsWith('/mama'),
  },
  {
    label: 'Calendario',
    href: '/calendario',
    icon: '📅',
    activeColor: 'text-cyan-400',
    activeBg: 'bg-cyan-500/15',
    match: (p) => p.startsWith('/calendario'),
  },
  {
    label: 'Bitácora',
    href: '/bitacora',
    icon: '📔',
    activeColor: 'text-amber-400',
    activeBg: 'bg-amber-500/15',
    match: (p) => p.startsWith('/bitacora'),
  },
]

export default function TabletNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/8 shadow-[0_-4px_24px_rgba(0,0,0,.4)]">
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
                ${isActive ? `${activeBg} ${activeColor}` : 'text-white/30 hover:text-white/60 hover:bg-white/5'}
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
