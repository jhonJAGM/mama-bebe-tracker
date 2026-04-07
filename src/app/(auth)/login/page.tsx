'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Usuario o contraseña incorrectos')
    } else {
      router.push('/ciclo')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2">🌸</div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Noe<span className="text-rose-400">·</span>Care
          </h1>
          <p className="text-sm text-white/40">Seguimiento familiar de Noelia</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="familiaGM"
                autoComplete="username"
                required
                className="w-full rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3.5 text-white placeholder-white/20 text-base focus:outline-none focus:border-rose-500/50 focus:bg-white/10 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-xl bg-white/[0.08] border border-white/10 px-4 py-3.5 text-white placeholder-white/20 text-base focus:outline-none focus:border-rose-500/50 focus:bg-white/10 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-base shadow-lg shadow-rose-500/25 hover:from-rose-400 hover:to-pink-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar →'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-white/20">Solo para uso familiar · Datos privados</p>
      </div>
    </div>
  )
}
