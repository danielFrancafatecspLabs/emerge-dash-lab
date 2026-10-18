'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Check, Code2, FlaskConical, MessagesSquare, PlugZap, Quote, Search, ShieldCheck } from 'lucide-react'
import { type EstadoCientista, type Jornada, type PapelConversa, type Papeis } from '@/lib/community/cientista'
import { ApiError, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageHeader } from '@/components/comunidade/Page'
import { tempoRelativo } from '@/components/comunidade/format'
import { Button, EmptyState, ErrorState, SectionTitle, Skeleton, cx, focusRing } from '@/components/ui'
import { StatusBadge } from '@/components/comunidade/cientista/Cards'
import { cientista } from '@/components/comunidade/cientista/client'

const ICONE: Record<PapelConversa, typeof MessagesSquare> = { solicitante: MessagesSquare, desenvolvedor: Code2 }
const RECEBE: Record<PapelConversa, string[]> = {
  solicitante: ['Perguntas que vão ao fundo do problema', 'Ficha no padrão do Lab, sem jargão', 'Encaminhamento para a revisão do Lab'],
  desenvolvedor: ['Baseline, abordagens e protocolo de avaliação', 'Desenho técnico e arquitetura', 'Kit executável com avaliador e CI'],
}

function Inicio({ jornada, onVoltar }: { jornada: Jornada; onVoltar: () => void }) {
  const router = useRouter()
  const { reloadMe, toast } = useCommunity()
  const [prefs, setPrefs] = useState<Record<string, string>>(() => Object.fromEntries(jornada.preferencias.map(p => [p.id, p.padrao])))
  const [criando, setCriando] = useState(false)

  async function comecar() {
    setCriando(true)
    try {
      const s = await cientista.criarSessao(jornada.papel as PapelConversa, prefs)
      reloadMe()
      router.push(`/comunidade/cientista/${s.id}`)
    } catch (err) {
      toast(errorMessage(err), 'error')
      setCriando(false)
    }
  }

  return (
    <section aria-label={`Começar como ${jornada.nome}`} className="rounded-2xl border border-beon-line p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-beon-red">{jornada.nome}</span>
        <Button size="sm" variant="ghost" onClick={onVoltar}>Trocar jornada</Button>
      </div>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">Antes de começar</h2>
      <p className="mt-1 text-sm text-beon-muted">Escolhas rápidas para o Cientista conversar do seu jeito.</p>
      <div className="mt-5 space-y-5">
        {jornada.preferencias.map(p => (
          <fieldset key={p.id}>
            <legend className="mb-2 text-sm font-medium text-beon-ink">{p.pergunta.replace(/:$/, '')}</legend>
            <div className="inline-flex flex-wrap gap-1 rounded-full bg-beon-soft p-1">
              {p.opcoes.map(([id, rotulo]) => (
                <button key={id} type="button" aria-pressed={prefs[p.id] === id} onClick={() => setPrefs(x => ({ ...x, [p.id]: id }))}
                  className={cx('rounded-full px-3.5 py-1.5 text-sm transition-colors', prefs[p.id] === id ? 'bg-white font-semibold text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink', focusRing)}>
                  {rotulo}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <Button variant="primary" className="mt-6" loading={criando} onClick={comecar}>
        Começar com o Cientista <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </section>
  )
}

function MinhasConversas() {
  const { me } = useCommunity()
  const sessoes = me?.profile.cientistaSessoes ?? []
  const [estados, setEstados] = useState<Record<string, EstadoCientista | null>>({})
  useEffect(() => {
    for (const s of sessoes.slice(0, 8)) {
      if (s.id in estados) continue
      cientista.sessao(s.id).then(e => setEstados(x => ({ ...x, [s.id]: e }))).catch(() => setEstados(x => ({ ...x, [s.id]: null })))
    }
  }, [sessoes]) // eslint-disable-line react-hooks/exhaustive-deps
  if (sessoes.length === 0) return null
  return (
    <section className="px-4 pb-10 sm:px-6">
      <SectionTitle>Minhas conversas</SectionTitle>
      <ul className="divide-y divide-beon-line rounded-2xl border border-beon-line">
        {sessoes.slice(0, 8).map(s => {
          const e = estados[s.id]
          return (
            <li key={s.id}>
              <Link href={`/comunidade/cientista/${s.id}`} className={cx('flex items-center gap-4 px-4 py-3.5 hover:bg-beon-soft/60', focusRing)}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-beon-tint text-beon-red"><FlaskConical className="h-4 w-4" aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  {e === undefined ? <Skeleton className="h-4 w-48" /> : (
                    <span className="block truncate text-sm font-semibold text-beon-ink">{e?.ficha.titulo || 'Experimento em conversa'}</span>
                  )}
                  <span className="block text-xs text-beon-muted">{s.papel === 'desenvolvedor' ? 'Desenvolvedor' : 'Solicitante'} · iniciada {tempoRelativo(s.criadaEm)}</span>
                </span>
                {e ? <StatusBadge status={e.status} /> : e === null ? <span className="text-xs text-beon-muted">indisponível</span> : null}
                <ArrowRight className="h-4 w-4 text-beon-muted" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-beon-muted">A revisão das fichas e as decisões seguem com o Lab e o Sponsor no Cientista.</p>
    </section>
  )
}

export default function CientistaPage() {
  const [papeis, setPapeis] = useState<Papeis | null>(null)
  const [erro, setErro] = useState<{ msg: string; status: number } | null>(null)
  const [sel, setSel] = useState<PapelConversa | null>(null)

  async function carregar() {
    setErro(null)
    try { setPapeis(await cientista.papeis()) } catch (err) { setErro({ msg: errorMessage(err), status: err instanceof ApiError ? err.status : 0 }) }
  }
  useEffect(() => { carregar() }, [])

  const jornadas = (papeis?.jornadas ?? []).filter((j): j is Jornada & { papel: PapelConversa } => j.papel === 'solicitante' || j.papel === 'desenvolvedor')
  const escolhida = jornadas.find(j => j.papel === sel)

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader eyebrow="Cientista" title="Toda boa ideia merece um experimento honesto"
        description="O Cientista entende o seu problema a fundo, transforma em uma hipótese que dá para testar e prepara a ficha para o Lab. As decisões são sempre de pessoas." />

      <div className="px-4 pb-10 sm:px-6">
        {erro ? (
          erro.status === 503 ? (
            <EmptyState icon={PlugZap} title="O Cientista ainda não está conectado">
              A conversa com o Cientista depende do serviço do beOn Labs, que não está configurado neste ambiente.
              Enquanto isso, a Trilha de Experimentação ajuda a estruturar o seu problema.
            </EmptyState>
          ) : <ErrorState message={erro.msg} onRetry={carregar} />
        ) : !papeis ? (
          <div className="grid gap-4 md:grid-cols-2" aria-busy>{[0, 1].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
        ) : escolhida ? (
          <div className="max-w-xl"><Inicio jornada={escolhida} onVoltar={() => setSel(null)} /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jornadas.map(j => {
              const Icon = ICONE[j.papel]
              return (
                <button key={j.papel} type="button" onClick={() => setSel(j.papel)}
                  className={cx('group flex flex-col rounded-2xl border border-beon-line p-6 text-left transition-colors hover:border-beon-red/40 hover:bg-beon-tint/20', focusRing)}>
                  <span className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-beon-tint text-beon-red"><Icon className="h-5 w-5" aria-hidden /></span>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-beon-muted">{j.nome}</span>
                  </span>
                  <span className="mt-4 text-xl font-semibold leading-snug tracking-tight text-beon-ink">{j.chamada}</span>
                  <span className="mt-1.5 text-sm text-beon-muted">{j.promessa}</span>
                  <ul className="mt-4 space-y-1.5">
                    {RECEBE[j.papel].map(r => <li key={r} className="flex gap-2 text-sm text-beon-body"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{r}</li>)}
                  </ul>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-beon-red">Conversar com o Cientista <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-10 grid gap-6 border-t border-beon-line pt-8 md:grid-cols-3">
          {[
            [Search, 'Pergunta antes de propor', 'Mapeia o problema em dez dimensões e mostra por que cada pergunta importa.'],
            [Quote, 'Mostra de onde vem cada sugestão', 'Critérios e amostras citam casos do histórico do Lab, cálculos ou dizem que são estimativas.'],
            [ShieldCheck, 'Pessoas decidem nos portões', 'Nenhuma execução começa sem a revisão do Lab, e nada escala sem o Sponsor.'],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Search
            return (
              <div key={t as string} className="flex gap-3">
                <I className="mt-0.5 h-5 w-5 shrink-0 text-beon-red" aria-hidden />
                <span><b className="block text-sm font-semibold text-beon-ink">{t as string}</b><span className="text-sm text-beon-muted">{d as string}</span></span>
              </div>
            )
          })}
        </div>
      </div>

      {papeis && <MinhasConversas />}
    </div>
  )
}
