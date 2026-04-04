'use client'

const ACTIONS = [
  { label: 'Nueva toma',   icon: '🍼', href: '/bebe/tomas',   color: 'text-rose-400',   bg: 'hover:bg-rose-500/10 hover:border-rose-500/30'   },
  { label: 'Pañal',        icon: '💧', href: '/bebe/panales', color: 'text-sky-400',    bg: 'hover:bg-sky-500/10 hover:border-sky-500/30'     },
  { label: 'Sueño',        icon: '😴', href: '/bebe/sueno',   color: 'text-violet-400', bg: 'hover:bg-violet-500/10 hover:border-violet-500/30' },
  { label: 'Nota',         icon: '📝', href: '/bitacora',     color: 'text-amber-400',  bg: 'hover:bg-amber-500/10 hover:border-amber-500/30'  },
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ACTIONS.map(({ label, icon, href, color, bg }) => (
        <a
          key={href}
          href={href}
          className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 ${bg} transition-all duration-200 hover:scale-105 active:scale-95`}
        >
          <span className="text-2xl leading-none">{icon}</span>
          <span className={`text-[11px] font-semibold ${color}`}>{label}</span>
        </a>
      ))}
    </div>
  )
}
