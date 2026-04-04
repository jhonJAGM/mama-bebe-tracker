'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NextFeedAlertProps {
  // ISO string o null — compatible con Server Components
  lastFeedTimeISO: string | null
  feedIntervalHours?: number // intervalo configurado, por defecto 3h
}

function getMinutesUntilNextFeed(
  lastFeedTimeISO: string | null,
  intervalHours: number
): number | null {
  if (!lastFeedTimeISO) return null
  const lastFeed = new Date(lastFeedTimeISO)
  const nextFeed = new Date(lastFeed.getTime() + intervalHours * 60 * 60 * 1000)
  return Math.round((nextFeed.getTime() - Date.now()) / 60000)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default function NextFeedAlert({
  lastFeedTimeISO,
  feedIntervalHours = 3,
}: NextFeedAlertProps) {
  const lastFeedTime = lastFeedTimeISO ? new Date(lastFeedTimeISO) : null
  const minutesUntil = getMinutesUntilNextFeed(lastFeedTimeISO, feedIntervalHours)

  if (lastFeedTime === null) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <span className="text-3xl">🍼</span>
          <div>
            <p className="font-semibold">Sin registros de tomas hoy</p>
            <p className="text-sm text-muted-foreground">Registra la primera toma del dia</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const nextFeedTime = new Date(lastFeedTime.getTime() + feedIntervalHours * 60 * 60 * 1000)
  const isOverdue = minutesUntil !== null && minutesUntil < 0
  const isDueSoon = minutesUntil !== null && minutesUntil >= 0 && minutesUntil <= 30

  let bgClass = 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
  let textClass = 'text-green-800 dark:text-green-200'
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
  let statusText = ''
  let icon = '✅'

  if (isOverdue) {
    bgClass = 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700 animate-pulse'
    textClass = 'text-red-800 dark:text-red-200'
    badgeVariant = 'destructive'
    statusText = `Toma retrasada ${Math.abs(minutesUntil!)} min`
    icon = '🚨'
  } else if (isDueSoon) {
    bgClass = 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
    textClass = 'text-amber-800 dark:text-amber-200'
    badgeVariant = 'default'
    statusText = `Faltan ${minutesUntil} min`
    icon = '⏰'
  } else {
    statusText = `Faltan ${Math.floor(minutesUntil! / 60)}h ${minutesUntil! % 60}min`
    icon = '🍼'
  }

  return (
    <Card className={`border ${bgClass}`}>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className={`font-semibold ${textClass}`}>
              Proxima toma: {formatTime(nextFeedTime)}
            </p>
            <p className="text-sm text-muted-foreground">
              Ultima toma: {formatTime(lastFeedTime)}
            </p>
          </div>
        </div>
        <Badge variant={badgeVariant} className="text-xs whitespace-nowrap">
          {statusText}
        </Badge>
      </CardContent>
    </Card>
  )
}
