'use client'

// Cartões que o Cientista envia no meio da conversa (síntese, casos parecidos, amostra, abordagens,
// protocolo, arquitetura, técnica, skills, ficha, encaminhamento e recurso), no visual da Comunidade.

import type { ReactNode } from 'react'
import { ArrowRight, Check, Code2, Download, FileText, FlaskConical, Info, KeyRound, Layers, Map as MapIcon, Search, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'
import { STATUS_CIENTISTA, type Abordagem, type CardItem, type MetricaTecnica, type StatusCientista } from '@/lib/community/cientista'
import { Button, cx } from '../ui'

export interface AcoesCard { responder: (t: string) => void; ocupado: boolean; sid: string; sinteseConfirmada?: boolean }

type Tom = 'ok' | 'warn' | 'info' | 'accent' | ''
const TOM: Record<Tom, string> = {
  ok: 'bg-emerald-50 text-emerald-800', warn: 'bg-amber-50 text-amber-800', info: 'bg-sky-50 text-sky-800',
  accent: 'bg-comm-tint text-comm-redhi', '': 'bg-stone-100 text-stone-700',
}
const STATUS_TOM: Record<StatusCientista, Tom> = {
  conversa: '', em_revisao: 'warn', devolvido: 'accent', aprovado: 'ok', em_execucao: 'info', parecer: 'ok', decidido: '', encerrado: '',
}
const VEREDITO: Record<string, [string, Tom]> = {
  validada: ['Validada', 'ok'], parcialmente_comprovada: ['Parcial', 'warn'], invalidada: ['Invalidada', 'accent'], inconclusiva: ['Inconclusiva', ''],
}

export function Badge({ tom = '', children }: { tom?: Tom; children: ReactNode }) {
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', TOM[tom])}>{children}</span>
}
export function StatusBadge({ status }: { status: StatusCientista }) {
  return <Badge tom={STATUS_TOM[status]}>{STATUS_CIENTISTA[status]}</Badge>
}

function Shell({ icon: Icon, titulo, extra, largo, destaque, children }: {
  icon: LucideIcon; titulo: string; extra?: ReactNode; largo?: boolean; destaque?: boolean; children: ReactNode
}) {
  return (
    <div className={cx('mt-3 rounded-2xl border bg-white p-4', destaque ? 'border-comm-red/30 bg-comm-tint/30' : 'border-comm-line', largo ? 'w-full' : 'max-w-xl')}>
      <div className="mb-2.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-comm-ink">
        <Icon className="h-4 w-4 text-comm-red" aria-hidden /> <span>{titulo}</span>
        {extra && <span className="ml-auto flex items-center gap-2">{extra}</span>}
      </div>
      {children}
    </div>
  )
}

const Nota = ({ icon: Icon = Info, children }: { icon?: LucideIcon; children: ReactNode }) => (
  <p className="mt-3 flex gap-1.5 text-xs leading-relaxed text-comm-muted"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{children}</p>
)

function Sintese({ data, acoes }: { data: { texto: string }; acoes: AcoesCard }) {
  return (
    <Shell icon={MapIcon} titulo="Meu entendimento do problema" destaque>
      <p className="text-[15px] leading-relaxed text-comm-ink">{data.texto}</p>
      {acoes.sinteseConfirmada ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" aria-hidden /> Entendimento confirmado</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="primary" icon={Check} disabled={acoes.ocupado} onClick={() => acoes.responder('Isso mesmo')}>Isso mesmo</Button>
          <Button size="sm" disabled={acoes.ocupado} onClick={() => acoes.responder('Quase: vou ajustar um ponto')}>Quero corrigir</Button>
        </div>
      )}
    </Shell>
  )
}

function Similares({ data }: { data: { id: string; titulo?: string; veredito?: string; nota?: string }[] }) {
  return (
    <Shell icon={Search} titulo="Casos parecidos no histórico do Lab">
      <ul className="divide-y divide-comm-line">
        {data.map(c => {
          const v = c.veredito ? VEREDITO[c.veredito] : null
          return (
            <li key={c.id} className="flex items-start gap-3 py-2">
              <span className="mt-0.5 font-mono text-xs text-comm-muted">{c.id}</span>
              <span className="min-w-0 flex-1 text-sm"><b className="block font-medium text-comm-ink">{c.titulo ?? 'Experimento'}</b>{c.nota && <span className="text-xs text-comm-muted">{c.nota}</span>}</span>
              {v && <Badge tom={v[1]}>{v[0]}</Badge>}
            </li>
          )
        })}
      </ul>
      <Nota>O Cientista usa esses casos para sugerir critérios e amostras, e cita o id quando faz isso.</Nota>
    </Shell>
  )
}

function Numeros({ itens }: { itens: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-6">
      {itens.map(([v, r]) => <div key={r}><b className="block text-xl font-semibold tabular-nums text-comm-ink">{v}</b><small className="text-xs text-comm-muted">{r}</small></div>)}
    </div>
  )
}

function Amostra({ data }: { data: any }) {
  const total: number = data.total_registros ?? data.registros_validos ?? data.registros ?? 0
  const minimo: number = data.minimo ?? data.tamanho_minimo ?? 385
  const ok = total >= minimo
  const nums: [string, string][] = [[total.toLocaleString('pt-BR'), 'registros válidos'], [minimo.toLocaleString('pt-BR'), 'mínimo do método']]
  if (data.completude != null) nums.push([`${Math.round(data.completude * 100)}%`, 'completude'])
  return (
    <Shell icon={FileText} titulo={data.nome ? `Amostra · ${data.nome}` : 'Análise da amostra (G1)'} extra={<Badge tom={ok ? 'ok' : 'warn'}>{ok ? 'Suficiente' : 'Resultado indicativo'}</Badge>}>
      <Numeros itens={nums} />
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-comm-soft"><div className={cx('h-full rounded-full', ok ? 'bg-emerald-600' : 'bg-comm-red')} style={{ width: `${Math.min(100, (total / minimo) * 100)}%` }} /></div>
      {data.resumo && <p className="mt-3 text-sm text-comm-body">{data.resumo}</p>}
      {(data.achados?.length || data.alertas?.length) ? (
        <ul className="mt-2 space-y-1 text-sm">
          {(data.achados ?? []).map((a: string) => <li key={a} className="flex gap-1.5 text-comm-body"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />{a}</li>)}
          {(data.alertas ?? []).map((a: string) => <li key={a} className="flex gap-1.5 text-amber-800"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{a}</li>)}
        </ul>
      ) : null}
    </Shell>
  )
}

function Abordagens({ data, acoes }: { data: { abordagens: Abordagem[]; justificativa_recomendacao?: string }; acoes: AcoesCard }) {
  return (
    <Shell icon={Layers} titulo="Abordagens comparadas" largo extra={<small className="text-xs font-normal text-comm-muted">custos e latências são estimativas</small>}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.abordagens.map(a => (
          <div key={a.nome} className={cx('flex flex-col rounded-xl border p-3', a.recomendada ? 'border-comm-red/40 bg-comm-tint/30' : 'border-comm-line')}>
            {a.recomendada && <span className="mb-1 self-start rounded-full bg-comm-red px-2 py-0.5 text-[10px] font-bold uppercase text-white">Recomendada</span>}
            <b className="text-sm text-comm-ink">{a.nome}</b>
            <p className="mt-1 text-sm text-comm-body">{a.descricao}</p>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
              {([['Custo', a.custo], ['Latência', a.latencia], ['Complexidade', a.complexidade === 'media' ? 'média' : a.complexidade]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-comm-muted">{k}</dt><dd className="font-medium text-comm-ink">{v}</dd></div>
              ))}
            </dl>
            <ul className="mt-2 space-y-0.5 text-xs">
              {a.pros.map(p => <li key={p} className="text-emerald-800">+ {p}</li>)}
              {a.contras.map(c => <li key={c} className="text-comm-redhi">− {c}</li>)}
            </ul>
            <Button size="sm" className="mt-3 self-start" disabled={acoes.ocupado} onClick={() => acoes.responder(`Vamos de ${a.nome}`)}>Escolher</Button>
          </div>
        ))}
      </div>
      {data.justificativa_recomendacao && <Nota icon={Sparkles}>{data.justificativa_recomendacao}</Nota>}
    </Shell>
  )
}

function Avaliacao({ data }: { data: { conjunto: string; tamanho?: number; divisao?: string; metricas: MetricaTecnica[]; gate_regressao?: string } }) {
  return (
    <Shell icon={FlaskConical} titulo="Protocolo de avaliação" largo extra={<Badge tom="info">vira o CI do kit</Badge>}>
      <p className="text-sm text-comm-body"><b className="text-comm-ink">Conjunto:</b> {data.conjunto}{data.tamanho ? ` · ${data.tamanho.toLocaleString('pt-BR')} casos` : ''}{data.divisao ? ` · ${data.divisao}` : ''}</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-comm-muted"><th className="py-1.5 pr-3 font-medium">Métrica técnica</th><th className="pr-3 font-medium">Hoje</th><th className="pr-3 font-medium">Meta</th><th className="font-medium">Sustenta</th></tr></thead>
          <tbody>
            {data.metricas.map(m => (
              <tr key={m.nome} className="border-t border-comm-line">
                <td className="py-1.5 pr-3 font-mono text-xs">{m.nome}</td><td className="pr-3 font-mono text-xs text-comm-muted">{m.baseline || '—'}</td>
                <td className="pr-3 font-mono text-xs font-semibold">{m.alvo}</td><td className="text-xs text-comm-muted">{m.liga_a || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.gate_regressao && <Nota icon={ShieldCheck}>Gate de regressão: <b className="ml-1 text-comm-ink">{data.gate_regressao}</b></Nota>}
    </Shell>
  )
}

function Desenho({ data }: { data: { arquitetura?: string[]; stack?: string; riscos_tecnicos?: string[] } }) {
  return (
    <Shell icon={Layers} titulo="Arquitetura" largo extra={data.stack && <small className="text-xs font-normal text-comm-muted">{data.stack}</small>}>
      <ol className="space-y-1.5">{(data.arquitetura ?? []).map((c, i) => <li key={c} className="flex gap-2.5 text-sm text-comm-body"><span className="font-mono text-xs text-comm-red">{i + 1}</span>{c}</li>)}</ol>
      {data.riscos_tecnicos?.length ? <ul className="mt-2 space-y-1">{data.riscos_tecnicos.map(r => <li key={r} className="flex gap-1.5 text-sm text-amber-800"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{r}</li>)}</ul> : null}
    </Shell>
  )
}

function Tecnologia({ data }: { data: { tecnica: string; justificativa: string; golden_path_nome?: string } }) {
  return (
    <Shell icon={Code2} titulo={data.tecnica} extra={data.golden_path_nome && <Badge>golden path · {data.golden_path_nome}</Badge>}>
      <p className="text-sm text-comm-body">{data.justificativa}</p>
    </Shell>
  )
}

function Skills({ data }: { data: { skills: { nome: string; para_que: string; nivel: number }[]; estimativa_solicitante: string; estimativa_laboratorio: string } }) {
  return (
    <Shell icon={Sparkles} titulo="Skills para executar">
      <ul className="divide-y divide-comm-line">
        {data.skills.map(s => (
          <li key={s.nome} className="flex items-center gap-3 py-2 text-sm">
            <span className="min-w-0 flex-1"><b className="block font-medium text-comm-ink">{s.nome}</b><small className="text-xs text-comm-muted">{s.para_que}</small></span>
            <span className="tracking-widest text-comm-red" aria-label={`nível ${s.nivel} de 3`}>{'●'.repeat(s.nivel)}{'○'.repeat(Math.max(0, 3 - s.nivel))}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3"><Numeros itens={[[data.estimativa_solicitante, 'construindo você'], [data.estimativa_laboratorio, 'na bancada do Lab']]} /></div>
    </Shell>
  )
}

function FichaGerada({ data }: { data: { ficha: { titulo?: string; hipotese?: string }; versao: number; markdown: string } }) {
  const baixar = () => {
    const url = URL.createObjectURL(new Blob([data.markdown], { type: 'text/markdown' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `${(data.ficha.titulo ?? 'ficha').toLowerCase().replace(/\s+/g, '-')}.md` })
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Shell icon={FileText} titulo={`Ficha gerada · versão ${data.versao}`} destaque extra={<Badge tom="ok">Checklist completo</Badge>}>
      <h4 className="text-base font-semibold text-comm-ink">{data.ficha.titulo}</h4>
      <p className="mt-1 text-sm italic text-comm-body">{data.ficha.hipotese}</p>
      <Button size="sm" className="mt-3" icon={Download} onClick={baixar}>Baixar .md</Button>
    </Shell>
  )
}

function Handoff({ data }: { data: { destino: string; status: StatusCientista; kit?: string[] } }) {
  const passos = ['Ficha', 'Revisão do Lab (G0)', data.destino === 'workflow' ? 'Bancada' : 'Construção com o kit', 'Parecer']
  return (
    <Shell icon={ShieldCheck} titulo="Encaminhado ao Lab" extra={<StatusBadge status={data.status} />}>
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {passos.map((p, i) => (
          <li key={p} className="flex items-center gap-2">
            <span className={cx('rounded-full px-2.5 py-1 font-medium', i === 0 || (i === 1 && data.status !== 'em_revisao') ? 'bg-emerald-50 text-emerald-800' : i === 1 ? 'bg-amber-50 text-amber-800' : 'bg-comm-soft text-comm-muted')}>{p}</span>
            {i < passos.length - 1 && <ArrowRight className="h-3 w-3 text-comm-muted" aria-hidden />}
          </li>
        ))}
      </ol>
      {data.kit && <p className="mt-3 text-sm text-comm-body"><b className="text-comm-ink">Kit pronto:</b> {data.kit.length} arquivos, incluindo <span className="font-mono text-xs">eval/avaliar.py</span> e o CI.</p>}
    </Shell>
  )
}

function Recurso({ data }: { data: { tipo: string; nome: string; motivo: string; sla: string } }) {
  return (
    <Shell icon={KeyRound} titulo={data.nome} extra={<small className="text-xs font-normal text-comm-muted">{data.sla}</small>}>
      <p className="text-sm text-comm-body">{data.motivo}</p>
      <Nota>O pedido é feito na caixa de ferramentas do Cientista e aprovado por uma pessoa do Lab.</Nota>
    </Shell>
  )
}

export function Card({ c, acoes }: { c: CardItem; acoes: AcoesCard }) {
  switch (c.kind) {
    case 'sintese': return <Sintese data={c.data} acoes={acoes} />
    case 'similares': return <Similares data={c.data} />
    case 'amostra': return <Amostra data={c.data} />
    case 'abordagens': return <Abordagens data={c.data} acoes={acoes} />
    case 'avaliacao': return <Avaliacao data={c.data} />
    case 'desenho': return <Desenho data={c.data} />
    case 'tecnologia': return <Tecnologia data={c.data} />
    case 'skills': return <Skills data={c.data} />
    case 'ficha_gerada': return <FichaGerada data={c.data} />
    case 'handoff': return <Handoff data={c.data} />
    case 'recurso': return <Recurso data={c.data} />
    default: return null
  }
}
