'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Briefcase } from 'lucide-react'

function BemVindoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fadeOut, setFadeOut] = useState(false)

  const role = searchParams.get('role') || 'admin'
  const username = searchParams.get('username') || 'Usuário'
  const roleLabel = role === 'admin' ? 'Administrador' : 'Executivo'
  const RoleIcon = role === 'admin' ? Shield : Briefcase

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2000)
    const redirect = setTimeout(() => router.replace('/estrategia'), 2800)
    return () => {
      clearTimeout(timer)
      clearTimeout(redirect)
    }
  }, [router])

  return (
    <>
      <div
        className={`bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-6 text-center transition-all duration-700 ease-in-out ${fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={{ maxWidth: 420 }}
      >
        {/* Logo beOn Labs */}
        <img
          src="/jira/logobeonlabs.png"
          alt="beOn Labs"
          style={{ width: 100, height: 100, objectFit: 'contain' }}
        />

        {/* Saudação */}
        <div className="flex flex-col gap-1">
          <h1
            className="font-extrabold tracking-tight"
            style={{ fontSize: 26, color: '#8B0000' }}
          >
            Bem-vindo ao beOn Labs!
          </h1>
          <p className="text-gray-400" style={{ fontSize: 13 }}>
            Dashboard Executivo de Experimentos · Claro Brasil
          </p>
        </div>

        {/* Card de acesso */}
        <div
          className="rounded-xl px-6 py-4 flex items-center gap-4 w-full"
          style={{ background: role === 'admin' ? '#FFF5F5' : '#F5F7FF' }}
        >
          <div
            className="rounded-full p-2.5"
            style={{ background: role === 'admin' ? '#8B0000' : '#1a56db' }}
          >
            <RoleIcon size={22} color="white" />
          </div>
          <div className="text-left">
            <p className="text-gray-400" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Tipo de Acesso
            </p>
            <p
              className="font-bold"
              style={{ fontSize: 18, color: role === 'admin' ? '#8B0000' : '#1a56db' }}
            >
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Username */}
        <p className="text-gray-400" style={{ fontSize: 12 }}>
          Logado como <span className="font-semibold text-gray-600">{username}</span>
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
          <div
            className="h-full rounded-full animate-loading-bar"
            style={{ background: role === 'admin' ? '#8B0000' : '#1a56db', width: '0%' }}
          />
        </div>

        <p className="text-gray-300" style={{ fontSize: 11 }}>
          Redirecionando para o dashboard...
        </p>
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loadingBar 2.5s ease-in-out forwards;
        }
      `}</style>
    </>
  )
}

export default function BemVindoPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#f0f0f0' }}
    >
      <Suspense fallback={
        <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-6" style={{ maxWidth: 420 }}>
          <img src="/jira/logobeonlabs.png" alt="beOn Labs" style={{ width: 100, height: 100, objectFit: 'contain' }} />
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 26, color: '#8B0000' }}>
            Bem-vindo ao beOn Labs!
          </h1>
          <p className="text-gray-400" style={{ fontSize: 13 }}>Carregando...</p>
        </div>
      }>
        <BemVindoContent />
      </Suspense>
    </div>
  )
}