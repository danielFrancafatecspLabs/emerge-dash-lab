'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, FlaskConical, Info, Map as MapIcon, Paperclip, Send, X } from 'lucide-react'
import { etapasFeitas, type EstadoCientista, type ItemConversa, type Papeis, type Porque } from '@/lib/community/cientista'
import { RichText } from '@/components/comunidade/PostItem'
import { Button, EmptyState, IconButton, cx, focusRing } from '@/components/ui'
import { Card, StatusBadge, type AcoesCard } from '@/components/comunidade/cientista/Cards'
import { Painel } from '@/components/comunidade/cientista/Painel'
import { useConversa } from '@/components/comunidade/cientista/useConversa'
import { cientista } from '@/components/comunidade/cientista/client'

const ETAPAS: Record<EstadoCientista['papel'], string[]> = {
  solicitante: ['Problema', 'Entendimento', 'Hipótese', 'Métricas', 'Amostra', 'BO e Sponsor', 'Ficha', 'Revisão do Lab', 'Execução'],
  desenvolvedor: ['Problema', 'Stack', 'Baseline', 'Hipótese', 'Abordagens', 'Avaliação', 'Amostra', 'Ficha', 'Encaminhamento'],
}

function Jornada({ estado, etapas }: { estado: EstadoCientista; etapas?: string[] }) {
  const feitas = etapasFeitas(estado)
  const agora = feitas.findIndex(x => !x)
  return (
    <ol aria-label="Etapas da jornada" className="flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-6">
      {(etapas?.length ? etapas : ETAPAS[estado.papel]).map((t, i) => (
        <li key={t} aria-current={i === agora ? 'step' : undefined}
          className={cx('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
            feitas[i] ? 'bg-emerald-50 text-emerald-800' : i === agora ? 'bg-beon-ink font-semibold text-white' : 'bg-beon-soft text-beon-muted')}>
          {feitas[i] && <Check className="h-3 w-3" aria-hidden />}{t}
        </li>
      ))}
    </ol>
  )
}

function PorQue({ p }: { p: Porque }) {
  const [aberto, setAberto] = useState(false)
  const dim = p.dimensao_nome ?? p.dimensao
  const tec = p.tecnica_nome ?? p.tecnica
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setAberto(a => !a)} aria-expanded={aberto}
        className={cx('inline-flex flex-wrap items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-beon-muted hover:bg-beon-soft hover:text-beon-ink', focusRing)}>
        <Info className="h-3.5 w-3.5" aria-hidden /> Por que pergunto isso
        <span className="rounded-full bg-beon-soft px-1.5 py-0.5 text-[10px]">{dim}</span>
        {tec !== dim && <span className="rounded-full bg-beon-soft px-1.5 py-0.5 text-[10px]">{tec}</span>}
      </button>
      {aberto && <p className="mt-1 max-w-xl rounded-xl bg-beon-soft px-3 py-2 text-sm text-beon-body">{p.por_que}</p>}
    </div>
  )
}

function Mensagem({ it, acoes }: { it: ItemConversa; acoes: AcoesCard }) {
  if (it.de === 'pessoa') {
    return <div className="flex justify-end"><div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-beon-ink px-4 py-2.5 text-[15px] text-white">{it.texto}</div></div>
  }
  if (it.de === 'sistema') {
    return <p role={it.erro ? 'alert' : undefined} className={cx('mx-auto flex max-w-xl items-start gap-2 rounded-xl px-3 py-2 text-sm', it.erro ? 'bg-red-50 text-red-800' : 'bg-beon-soft text-beon-body')}><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{it.texto}</p>
  }
  const digitando = it.aberto && !it.texto && !it.cards.length
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beon-red text-white" aria-hidden><FlaskConical className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">Cientista:</span>
        {digitando && <Digitando />}
        {it.texto && <RichText>{it.texto}</RichText>}
        {it.porque && !it.aberto && <PorQue p={it.porque} />}
        {it.cards.map((c, i) => <Card key={i} c={c} acoes={acoes} />)}
      </div>
    </div>
  )
}

function Digitando({ texto }: { texto?: string }) {
  return (
    <span className="inline-flex items-center gap-2 py-2 text-sm text-beon-muted" role="status" aria-label="O Cientista está pensando">
      <span className="flex gap-1">{[0, 1, 2].map(i => <i key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-beon-muted" style={{ animationDelay: `${i * 120}ms` }} />)}</span>
      {texto}
    </span>
  )
}

function Composer({ chips, upload, ocupado, onEnviar, onAnexar }: {
  chips: string[]; upload: { descricao: string; formatos: string[] } | null; ocupado: boolean
  onEnviar: (t: string) => void; onAnexar: (f: File) => void
}) {
  const [texto, setTexto] = useState('')
  const ta = useRef<HTMLTextAreaElement>(null)
  const arq = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = ta.current
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(200, el.scrollHeight)}px` }
  }, [texto])
  useEffect(() => { if (!ocupado) ta.current?.focus({ preventScroll: true }) }, [ocupado])
  const enviar = (t = texto) => {
    const v = t.trim()
    if (!v || ocupado) return
    onEnviar(v)
    setTexto('')
  }
  return (
    <div className="border-t border-beon-line bg-white px-4 py-3 sm:px-6">
      {chips.length > 0 && !ocupado && (
        <div className="mb-2 flex flex-wrap gap-2" aria-label="Respostas sugeridas">
          {chips.map(c => (
            <button key={c} type="button" onClick={() => enviar(c)}
              className={cx('rounded-full border border-beon-line px-3 py-1.5 text-sm text-beon-body hover:border-beon-red/40 hover:bg-beon-tint/40 hover:text-beon-ink', focusRing)}>{c}</button>
          ))}
        </div>
      )}
      {upload && !ocupado && (
        <button type="button" onClick={() => arq.current?.click()}
          className={cx('mb-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-beon-red/40 bg-beon-tint/30 px-4 py-2.5 text-left', focusRing)}>
          <Paperclip className="h-4 w-4 text-beon-red" aria-hidden />
          <span className="flex-1 text-sm"><b className="block text-beon-ink">Anexar {upload.descricao}</b><small className="text-xs text-beon-muted">{upload.formatos.join(', ')} · até 15 MB</small></span>
        </button>
      )}
      <div className="flex items-end gap-2">
        <IconButton icon={Paperclip} label="Anexar arquivo de dados" disabled={ocupado} onClick={() => arq.current?.click()} className="mb-1 disabled:opacity-40" />
        <label htmlFor="cientista-msg" className="sr-only">Mensagem para o Cientista</label>
        <textarea id="cientista-msg" ref={ta} rows={1} value={texto} disabled={ocupado} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
          placeholder={ocupado ? 'O Cientista está respondendo…' : 'Responda ou cole um documento'}
          className="min-h-[44px] flex-1 resize-none rounded-3xl border border-beon-line bg-white px-4 py-2.5 text-[15px] text-beon-ink placeholder:text-beon-muted/80 focus:border-beon-ink/40 focus:outline-none focus:ring-2 focus:ring-beon-red/20 disabled:bg-beon-soft" />
        <button type="button" onClick={() => enviar()} disabled={ocupado || !texto.trim()} aria-label="Enviar"
          className={cx('mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-beon-red text-white disabled:bg-beon-line disabled:text-beon-muted', focusRing)}>
          <Send className="h-4 w-4" aria-hidden />
        </button>
        <input ref={arq} type="file" hidden accept=".csv,.xlsx,.xls,.json,.jsonl,.txt"
          onChange={e => { const f = e.target.files?.[0]; if (f) onAnexar(f); e.target.value = '' }} />
      </div>
    </div>
  )
}

const TEXTO_STATUS: Partial<Record<EstadoCientista['status'], string>> = {
  em_revisao: 'Sua ficha está com o Lab para a revisão G0. O resultado aparece aqui.',
  aprovado: 'Ficha aprovada pelo Lab.',
  em_execucao: 'A bancada do Lab está executando o experimento.',
  parecer: 'O parecer está pronto. O Sponsor decide os próximos passos.',
  decidido: 'Experimento decidido pelo Sponsor.',
  encerrado: 'Experimento encerrado. O aprendizado ficou registrado no histórico do Lab.',
}

function Encerramento({ estado, onRetomar, ocupado }: { estado: EstadoCientista; onRetomar: () => void; ocupado: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-beon-line bg-beon-soft/60 px-4 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <StatusBadge status={estado.status} />
        {estado.status === 'devolvido' && estado.feedback_lab ? (
          <p className="mt-1 text-sm text-beon-ink"><b>O Lab pediu ajustes:</b> “{estado.feedback_lab.comentario}” <span className="text-beon-muted">— {estado.feedback_lab.revisor}</span></p>
        ) : <p className="mt-1 text-sm text-beon-body">{TEXTO_STATUS[estado.status]}</p>}
      </div>
      {estado.status === 'devolvido' && <Button variant="primary" loading={ocupado} onClick={onRetomar}>Ajustar com o Cientista</Button>}
    </div>
  )
}

export default function ConversaCientistaPage({ params }: { params: { sid: string } }) {
  const c = useConversa(params.sid)
  const lista = useRef<HTMLDivElement>(null)
  const grudado = useRef(true)
  const [painelAberto, setPainelAberto] = useState(false)
  const [papeis, setPapeis] = useState<Papeis | null>(null)
  useEffect(() => { cientista.papeis().then(setPapeis).catch(() => {}) }, [])
  const sinteseConfirmada = !!c.estado?.mapa.sintese_confirmada
  const acoes = useMemo<AcoesCard>(() => ({ responder: t => c.enviar(t), ocupado: c.ocupado, sid: params.sid, sinteseConfirmada }), [c.enviar, c.ocupado, params.sid, sinteseConfirmada])

  useEffect(() => {
    const el = lista.current
    if (el && grudado.current) el.scrollTop = el.scrollHeight
  }, [c.itens, c.chips, c.ocupado])

  if (c.erroCarga) {
    return (
      <EmptyState icon={FlaskConical} title="Não foi possível abrir esta conversa"
        action={<Link href="/comunidade/cientista" className="text-sm font-medium text-beon-red hover:underline">Voltar ao Cientista</Link>}>
        {c.erroCarga}
      </EmptyState>
    )
  }

  const e = c.estado
  const ultimoPessoa = c.itens[c.itens.length - 1]?.de === 'pessoa'

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] md:h-dvh">
      <section className="flex min-w-0 flex-1 flex-col" aria-label="Conversa com o Cientista">
        <header className="flex items-center gap-3 px-4 pb-3 pt-4 sm:px-6">
          <Link href="/comunidade/cientista" aria-label="Voltar ao Cientista" className={cx('rounded-full p-1.5 text-beon-body hover:bg-beon-soft', focusRing)}>
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-beon-red">
              Cientista · {e?.papel === 'desenvolvedor' ? 'Desenvolvedor' : 'Solicitante'}{e?.ficha.id ? ` · ${e.ficha.id}` : ''}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">{e?.ficha.titulo || 'Novo experimento'}</h1>
          </div>
          {e && <Button size="sm" icon={MapIcon} className="xl:hidden" onClick={() => setPainelAberto(true)}>Mapa e ficha</Button>}
        </header>
        {e && <Jornada estado={e} etapas={papeis?.jornadas.find(j => j.papel === e.papel)?.etapas} />}

        <div ref={lista} className="flex-1 space-y-5 overflow-y-auto border-t border-beon-line px-4 py-6 sm:px-6" aria-live="polite"
          onScroll={ev => { const el = ev.currentTarget; grudado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 160 }}>
          {c.carregando && <Digitando texto="Abrindo a conversa…" />}
          {c.itens.map(it => <Mensagem key={it.id} it={it} acoes={acoes} />)}
          {c.ocupado && ultimoPessoa && (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beon-red text-white" aria-hidden><FlaskConical className="h-4 w-4" /></span>
              <Digitando texto={c.lendoDocumento ? 'Lendo seu documento e extraindo tudo de uma vez…' : undefined} />
            </div>
          )}
        </div>

        {e && (e.status === 'conversa'
          ? <Composer chips={c.chips} upload={c.upload} ocupado={c.ocupado} onEnviar={c.enviar} onAnexar={c.anexar} />
          : <Encerramento estado={e} onRetomar={c.retomar} ocupado={c.ocupado} />)}
      </section>

      {e && (
        <aside aria-label="Mapa do problema e ficha"
          className={cx('w-[400px] shrink-0 flex-col border-l border-beon-line bg-white', painelAberto ? 'fixed inset-0 z-40 flex w-full xl:static xl:w-[400px]' : 'hidden xl:flex')}>
          {painelAberto && (
            <div className="flex items-center justify-between border-b border-beon-line px-5 py-3 xl:hidden">
              <b className="text-sm">Mapa e ficha</b>
              <IconButton icon={X} label="Fechar painel" onClick={() => setPainelAberto(false)} />
            </div>
          )}
          <div className="min-h-0 flex-1"><Painel estado={e} mudou={c.mudou} /></div>
        </aside>
      )}
    </div>
  )
}
