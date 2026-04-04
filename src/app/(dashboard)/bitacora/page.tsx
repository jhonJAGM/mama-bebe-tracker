'use client'

import { useState, useEffect } from 'react'

type Note = {
  _id: string
  date: string
  title: string
  content: string
  type: 'note' | 'milestone' | 'photo'
  photoUrl?: string
  milestone?: string
}

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  note: { label: 'Nota', emoji: '📝', color: 'bg-blue-50 border-blue-100' },
  milestone: { label: 'Hito', emoji: '🌟', color: 'bg-yellow-50 border-yellow-100' },
  photo: { label: 'Foto', emoji: '📷', color: 'bg-purple-50 border-purple-100' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
}

export default function BitacoraPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'note' | 'milestone' | 'photo'>('note')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [milestone, setMilestone] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [filter])

  async function loadNotes() {
    setLoading(true)
    try {
      const url = filter === 'all' ? '/api/notes' : `/api/notes?type=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      setNotes(data.notes ?? [])
    } catch {
      /* silencio */
    } finally {
      setLoading(false)
    }
  }

  async function saveNote() {
    if (!title || !content) return
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type, date, milestone: milestone || undefined, photoUrl: photoUrl || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotes((prev) => [data.note, ...prev])
        setShowForm(false)
        setTitle('')
        setContent('')
        setMilestone('')
        setPhotoUrl('')
        setType('note')
      }
    } catch {
      /* silencio */
    } finally {
      setSaving(false)
    }
  }

  function exportPDF() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const rows = notes
      .map(
        (n) => `
        <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #eee">
          <div style="font-size:11px;color:#888;margin-bottom:4px">${formatDate(n.date)} · ${TYPE_LABELS[n.type]?.emoji} ${TYPE_LABELS[n.type]?.label}</div>
          <div style="font-size:16px;font-weight:bold;margin-bottom:6px">${n.title}</div>
          ${n.milestone ? `<div style="font-size:12px;color:#b45309;margin-bottom:4px">Hito: ${n.milestone}</div>` : ''}
          <div style="font-size:13px;color:#444;white-space:pre-wrap">${n.content}</div>
        </div>`
      )
      .join('')
    printWindow.document.write(`
      <html><head><title>Bitácora NoeCare</title>
      <style>body{font-family:sans-serif;padding:32px;max-width:700px;margin:0 auto}</style>
      </head><body>
      <h1 style="font-size:24px;color:#e11d48;margin-bottom:8px">Bitácora NoeCare 🌸</h1>
      <p style="color:#888;font-size:13px;margin-bottom:32px">Exportado el ${new Date().toLocaleDateString('es-CO')}</p>
      ${rows}
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-rose-700">Bitácora</h1>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="border border-gray-200 text-gray-600 rounded-2xl px-3 py-2 text-sm font-medium active:scale-95 transition-all"
          >
            PDF
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-rose-500 text-white rounded-2xl px-4 py-2 text-sm font-medium active:scale-95 transition-all"
          >
            + Nueva
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'note', label: '📝 Notas' },
          { key: 'milestone', label: '🌟 Hitos' },
          { key: 'photo', label: '📷 Fotos' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
              filter === f.key ? 'bg-rose-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading && <p className="text-center text-sm text-gray-400 py-8">Cargando...</p>}
      {!loading && notes.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-4xl">📖</p>
          <p className="text-gray-500 text-sm">Aún no hay entradas en la bitácora</p>
          <button onClick={() => setShowForm(true)} className="text-rose-500 text-sm underline">
            Agregar la primera
          </button>
        </div>
      )}
      <div className="space-y-3">
        {notes.map((note) => {
          const meta = TYPE_LABELS[note.type] ?? TYPE_LABELS.note
          return (
            <div key={note._id} className={`rounded-2xl border p-4 space-y-2 ${meta.color}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.emoji}</span>
                    <span className="text-xs text-gray-400">{formatDate(note.date)}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{meta.label}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">{note.title}</h3>
                </div>
              </div>
              {note.milestone && (
                <p className="text-xs text-amber-700 font-medium">Hito: {note.milestone}</p>
              )}
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
              {note.photoUrl && (
                <img src={note.photoUrl} alt={note.title} className="rounded-xl w-full object-cover max-h-48" />
              )}
            </div>
          )
        })}
      </div>

      {/* Modal nueva entrada */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800">Nueva entrada</h2>

            {/* Tipo */}
            <div className="flex gap-2">
              {(['note', 'milestone', 'photo'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    type === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {TYPE_LABELS[t].emoji} {TYPE_LABELS[t].label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Título</label>
                <input
                  type="text"
                  placeholder="Ej: Primera sonrisa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              {type === 'milestone' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Descripción del hito</label>
                  <input
                    type="text"
                    placeholder="Ej: Primera vez que levantó la cabeza"
                    value={milestone}
                    onChange={(e) => setMilestone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
              )}
              {type === 'photo' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">URL de la foto</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Contenido</label>
                <textarea
                  placeholder="Escribe aquí..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
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
                onClick={saveNote}
                disabled={saving || !title || !content}
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
