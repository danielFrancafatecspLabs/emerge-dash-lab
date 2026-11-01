import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { getSessionUser } from '@/lib/auth/request'
import { idDaDiscussao } from '@/lib/community/noticias-radar'
import { chavesVapid, conteudoDoPush, inscricoesDe } from '@/lib/community/push'
import { loadNormalizedPosts, unauthorized } from '@/lib/community/server'
import { edicaoDoDia } from '@/lib/newsletter/cache'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** "Ver como fica": manda para os navegadores da própria pessoa o push da manchete de hoje, fora da regra e sem registrar. */
export async function POST(request: NextRequest) {
  const member = await getSessionUser(request)
  if (!member) return unauthorized()
  const inscricoes = inscricoesDe(member.username)
  if (!inscricoes.length) return NextResponse.json({ error: 'Ative o push neste navegador primeiro.' }, { status: 400 })
  let edicao
  try { edicao = await edicaoDoDia() } catch { return NextResponse.json({ error: 'A edição de hoje ainda não saiu.' }, { status: 503 }) }
  const n = edicao.noticias.find(x => x.imagem?.startsWith('https://')) ?? edicao.noticias[0]
  if (!n) return NextResponse.json({ error: 'A edição de hoje ainda não tem notícias.' }, { status: 503 })
  const discussao = loadNormalizedPosts().find(p => p.id === idDaDiscussao(n.id)) ?? null
  const carga = JSON.stringify(conteudoDoPush(n, discussao))
  const chaves = chavesVapid()
  const resultados = await Promise.allSettled(inscricoes.map(i => webpush.sendNotification({ endpoint: i.endpoint, keys: i.keys }, carga, {
    vapidDetails: { subject: process.env.VAPID_SUBJECT || 'mailto:beonlabs@localhost', publicKey: chaves.publicKey, privateKey: chaves.privateKey }, TTL: 600,
  })))
  const ok = resultados.filter(r => r.status === 'fulfilled').length
  return ok ? NextResponse.json({ enviados: ok }) : NextResponse.json({ error: 'O serviço de push do navegador recusou o envio.' }, { status: 502 })
}
