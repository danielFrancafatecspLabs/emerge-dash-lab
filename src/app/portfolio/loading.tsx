export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f0f0f0' }}>
      <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center gap-4 text-center" style={{ maxWidth: 380 }}>

        {/* Logo beOn Labs */}
        <img
          src="/jira/logobeonlabs.png"
          alt="beOn Labs"
          style={{ width: 72, height: 72, objectFit: 'contain' }}
        />

        {/* Spinner */}
        <div
          className="rounded-full border-4 border-gray-200"
          style={{
            width: 40, height: 40,
            borderTopColor: '#CC0000',
            animation: 'spin 0.9s linear infinite',
          }}
        />

        <div>
          <p className="font-bold text-gray-800" style={{ fontSize: 15 }}>Carregando portfólio…</p>
          <p className="text-gray-400 mt-1" style={{ fontSize: 12 }}>
            Buscando dados do Jira e classificando experimentos via IA.
            <br />Isso pode levar alguns segundos.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          {[
            '📡  Conectando ao Jira (boards 2706 e 2707)',
            '🤖  Classificando segmentos via LLM',
            '📋  Montando lista completa',
          ].map(step => (
            <div
              key={step}
              className="flex items-center gap-2 rounded px-3 py-1.5 text-left"
              style={{ background: '#FFF8F8', fontSize: 11, color: '#6B7280' }}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
