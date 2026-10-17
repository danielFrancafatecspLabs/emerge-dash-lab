import { NextRequest, NextResponse } from 'next/server'
import { PAPEIS_CONVERSA, rotaCientista, type PapelConversa } from '@/lib/cientista'
import { getProfile, isDonoSessaoCientista, registrarSessaoCientista, saveProfile } from '@/lib/community-profile'
import { badRequest, getMember, unauthorized } from '@/lib/community-server'

// Ponte entre a Comunidade e o backend do Cientista (cientista-lab / METAEXP), configurado em CIENTISTA_API_URL.
// O backend não tem login: aqui a sessão da Comunidade é exigida e cada pessoa só acessa as próprias conversas.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function json(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

function backend(): string | null {
  return process.env.CIENTISTA_API_URL?.trim().replace(/\/+$/, '') || null
}

async function handle(request: NextRequest, { params }: { params: { path: string[] } }) {
  const member = await getMember(request)
  if (!member) return unauthorized()
  const base = backend()
  if (!base) return json('O Cientista ainda não está conectado neste ambiente.', 503)

  const rota = rotaCientista(request.method, params.path)
  if (!rota) return json('Recurso do Cientista indisponível na Comunidade.', 404)
  if (rota.tipo === 'sessao' && member.role !== 'admin' && !isDonoSessaoCientista(getProfile(member.username), rota.sid)) {
    return json('Conversa não encontrada.', 404)
  }

  let body: string | undefined
  let papel: PapelConversa | undefined
  if (request.method === 'POST') {
    body = await request.text()
    if (rota.tipo === 'criar_sessao') {
      let pedido: { papel?: unknown; preferencias?: unknown }
      try { pedido = JSON.parse(body || '{}') } catch { return badRequest('Requisição inválida') }
      if (!PAPEIS_CONVERSA.includes(pedido.papel as PapelConversa)) return badRequest('Escolha a jornada: Solicitante ou Desenvolvedor')
      papel = pedido.papel as PapelConversa
      const preferencias = Object.fromEntries(Object.entries(pedido.preferencias && typeof pedido.preferencias === 'object' ? pedido.preferencias : {})
        .filter(([, v]) => typeof v === 'string'))
      body = JSON.stringify({ nome: member.user?.nome || member.username, papel, preferencias })
    }
  }

  let upstream: Response
  try {
    upstream = await fetch(`${base}/api/${params.path.map(encodeURIComponent).join('/')}`, {
      method: request.method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body,
      cache: 'no-store',
      signal: request.signal,
    })
  } catch {
    return json('O Cientista não respondeu. Tente novamente em instantes.', 502)
  }

  if (!upstream.ok) {
    const detalhe = await upstream.json().then(b => (typeof b?.detail === 'string' ? b.detail : null)).catch(() => null)
    return json(detalhe ?? 'O Cientista não conseguiu concluir a ação.', upstream.status)
  }

  if (rota.tipo === 'criar_sessao' && papel) {
    const sessao = await upstream.json()
    saveProfile(registrarSessaoCientista(getProfile(member.username), { id: sessao.id, papel, criadaEm: new Date().toISOString() }))
    return NextResponse.json(sessao, { status: upstream.status })
  }

  // Repassa o corpo como fluxo: as respostas da conversa chegam por SSE, pedaço a pedaço.
  const headers = new Headers({ 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' })
  for (const h of ['content-type', 'content-disposition']) {
    const v = upstream.headers.get(h)
    if (v) headers.set(h, v)
  }
  return new Response(upstream.body, { status: upstream.status, headers })
}

export { handle as GET, handle as POST }
