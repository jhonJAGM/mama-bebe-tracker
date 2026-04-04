'use client'

import { useState, useEffect } from 'react'

type CalendarEvent = {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function getEventDate(ev: CalendarEvent): Date {
  const str = ev.start.dateTime ?? ev.start.date ?? ''
  return new Date(str)
}

export default function CalendarioPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Modal agregar evento
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setEvents(data.events ?? [])
      })
      .catch(() => setError('No se pudo cargar el calendario'))
      .finally(() => setLoading(false))
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  // Construir grid del mes
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )

  function eventsForDay(day: number) {
    return events.filter((ev) => {
      const d = getEventDate(ev)
      return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day
    })
  }

  async function saveEvent() {
    if (!newTitle || !newDate) return
    setSaving(true)
    try {
      const start = `${newDate}T${newTime}:00`
      const endDate = new Date(`${newDate}T${newTime}:00`)
      endDate.setHours(endDate.getHours() + 1)
      const end = endDate.toISOString().slice(0, 16) + ':00'
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: newTitle, start, end }),
      })
      const data = await res.json()
      if (res.ok) {
        setEvents((prev) => [...prev, data.event])
        setShowForm(false)
        setNewTitle('')
      }
    } catch {
      /* silencio */
    } finally {
      setSaving(false)
    }
  }

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-rose-700">Calendario</h1>
        <button
          onClick={() => { setShowForm(true); setNewDate(`${year}-${String(month).padStart(2,'0')}-${String(selectedDay ?? now.getDate()).padStart(2,'0')}`) }}
          className="bg-rose-500 text-white rounded-2xl px-4 py-2 text-sm font-medium active:scale-95 transition-all"
        >
          + Agregar
        </button>
      </div>

      {/* Navegación mes */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <button onClick={prevMonth} className="text-rose-500 text-xl font-bold px-2">‹</button>
        <span className="font-semibold text-gray-800">{MONTHS[month - 1]} {year}</span>
        <button onClick={nextMonth} className="text-rose-500 text-xl font-bold px-2">›</button>
      </div>

      {/* Error / No configurado */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <p className="font-semibold">⚠️ No se pudo cargar el calendario</p>
          <p className="text-xs mt-1">{error.includes('No autenticado') ? 'Inicia sesión con Google para ver tu calendario.' : error}</p>
        </div>
      )}

      {/* Grid del calendario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 bg-rose-50">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-rose-400 py-2">{d}</div>
          ))}
        </div>
        {/* Celdas */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="h-12" />
            const dayEvents = eventsForDay(day)
            const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
            const isSelected = day === selectedDay
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-12 flex flex-col items-center justify-start pt-1 gap-0.5 rounded-lg transition-all
                  ${isSelected ? 'bg-rose-100' : ''}
                  ${isToday ? 'font-bold' : ''}
                  hover:bg-rose-50 active:scale-95`}
              >
                <span className={`text-xs leading-none ${isToday ? 'bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-700'}`}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((_, j) => (
                      <span key={j} className="w-1 h-1 rounded-full bg-rose-400" />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Eventos del día seleccionado */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700">
            {selectedDay} de {MONTHS[month - 1]}
          </p>
          {loading && <p className="text-xs text-gray-400">Cargando...</p>}
          {!loading && selectedEvents.length === 0 && (
            <p className="text-xs text-gray-400">Sin eventos</p>
          )}
          {selectedEvents.map((ev) => {
            const t = ev.start.dateTime
              ? new Date(ev.start.dateTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              : 'Todo el día'
            return (
              <div key={ev.id} className="flex gap-3 items-start p-2 bg-rose-50 rounded-xl">
                <span className="text-xs text-rose-400 shrink-0 mt-0.5">{t}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{ev.summary}</p>
                  {ev.description && <p className="text-xs text-gray-500">{ev.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal agregar evento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">Nuevo evento</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Título del evento"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hora</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-medium text-gray-600 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={saveEvent}
                disabled={saving || !newTitle || !newDate}
                className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-sm font-medium disabled:opacity-50 active:scale-95 transition-all"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
