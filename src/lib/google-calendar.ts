// Cliente Google Calendar API v3 (REST directo con fetch)
// Usa el access_token del usuario autenticado con NextAuth + scope calendar

export type CalendarEvent = {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  colorId?: string
}

type ListEventsParams = {
  accessToken: string
  calendarId?: string
  timeMin: string   // ISO string
  timeMax: string   // ISO string
}

// Lista eventos de un mes
export async function listCalendarEvents({
  accessToken,
  calendarId = 'primary',
  timeMin,
  timeMax,
}: ListEventsParams): Promise<CalendarEvent[]> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
  url.searchParams.set('timeMin', timeMin)
  url.searchParams.set('timeMax', timeMax)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '50')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Calendar API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return (data.items ?? []) as CalendarEvent[]
}

// Crea un nuevo evento
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string
    description?: string
    start: string  // ISO datetime
    end: string    // ISO datetime
    calendarId?: string
  }
): Promise<CalendarEvent> {
  const calendarId = event.calendarId ?? 'primary'
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start, timeZone: 'America/Bogota' },
      end: { dateTime: event.end, timeZone: 'America/Bogota' },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Calendar API error ${res.status}: ${err}`)
  }

  return res.json() as Promise<CalendarEvent>
}
