'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/jira/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('user_role', data.role)
        localStorage.setItem('username', data.username)
        router.replace(`/bem-vindo?role=${data.role}&username=${encodeURIComponent(data.username)}`)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Erro ao fazer login')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#f0f0f0' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div
          className="rounded-t-xl px-8 py-6 flex flex-col items-center gap-3"
          style={{ background: '#8B0000' }}
        >
          <img
              src="/jira/logobeonlabs.png"
              alt="beOn Labs"
              style={{ width: 80, height: 80, objectFit: 'contain', display: 'block' }}
            />
          <Radio size={24} color="white" />
          <p className="text-white font-bold tracking-widest uppercase text-center" style={{ fontSize: 13, letterSpacing: '0.1em' }}>
            Dashboard Executivo
          </p>
          <p className="text-white/60 text-center" style={{ fontSize: 11 }}>
            beOn Labs · Claro Brasil
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-b-xl px-8 py-7 shadow-lg flex flex-col gap-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-gray-800 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-center font-medium" style={{ color: '#CC0000' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: '#CC0000' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
