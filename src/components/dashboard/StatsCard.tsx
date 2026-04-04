'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: string
  badge?: {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  highlight?: boolean
}

// Tarjeta de estadistica para el dashboard.
// Muestra un dato clave (ultima toma, panales del dia, horas de sueno, etc.)
// con un icono emoji, valor principal, subtitulo opcional y badge de estado.
export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  highlight = false,
}: StatsCardProps) {
  return (
    <Card
      className={
        highlight
          ? 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/20'
          : undefined
      }
    >
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <span className="text-2xl" role="img" aria-label={title}>
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold leading-tight">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
        {badge && (
          <Badge variant={badge.variant ?? 'secondary'} className="mt-2 text-xs">
            {badge.label}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
