export const CYCLE_TIMES = [
  '06:00', '09:00', '12:00', '15:00',
  '18:00', '21:00', '00:00', '03:00',
] as const

export type CycleTime = typeof CYCLE_TIMES[number]
