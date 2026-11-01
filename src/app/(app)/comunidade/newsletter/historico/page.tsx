'use client'

// Histórico do beOn Radar: as 10 notícias que mais impactaram em cada mês, pelo Índice de Impacto beOn Radar
// (repercussão entre veículos, conversa no fórum, permanência na edição e força do tema). Cada linha mostra a nota e
// de onde ela veio.

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CalendarDays, History, MessageCircle, RefreshCw } from 'lucide-react'
import type { HistoricoDoMes, NoticiaDoHistorico, PartesDoIndice } from '@/lib/newsletter/historico'
import { api, errorMessage } from '@/components/comunidade/api'
import { ImagemDaNoticia, SeloDaSecao } from '@/components/newsletter/identidade'
import { Button, Skeleton, cx, focusRing } from '@/components/ui'

const PARTES: { id: keyof PartesDoIndice; nome: string; peso: number; cor: string; explica: string }[] = [
  { id: 'repercussao', nome: 'Repercussão', peso: 40, cor: '#D31809', explica: 'Quantos veículos diferentes deram a mesma história. 6 ou mais valem a nota máxima.' },
  { id: 'conversa', nome: 'Conversa', peso: 30, cor: '#2F6FB3', explica: 'Comentários (valem 2) e marcações de “Útil” na discussão do fórum. 10 pontos de conversa valem a máxima.' },
  { id: 'permanencia', nome: 'Permanência', peso: 20, cor: '#0f766e', explica: 'Em quantos dias a notícia ficou na edição. 3 dias valem a máxima.' },
  { id: 'tema', nome: 'Força do tema', peso: 10, cor: '#b45309', explica: 'Quantos termos de tecnologia emergente, Vale, mercado, bolha ou impacto a matéria traz. 6 valem a máxima.' },
]

const nomeDoMes = (mes: string) => {
  const [a, m] = mes.split('-').map(Number)
  const t = new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function BarraDoIndice({ n }: { n: NoticiaDoHistorico }) {
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-beon-soft" role="img"
        aria-label={PARTES.map(p => `${p.nome} ${n.partes[p.id]} de ${p.peso}`).join(', ')}>
        {PARTES.map(p => <span key={p.id} style={{ width: `${n.partes[p.id]}%`, background: p.cor }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-beon-muted">
        {PARTES.map(p => (
          <li key={p.id} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: p.cor }} aria-hidden />
            {p.nome} <b className="tabular-nums text-beon-ink">{n.partes[p.id].toLocaleString('pt-BR')}</b>/{p.peso}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Linha({ n, posicao }: { n: NoticiaDoHistorico; posicao: number }) {
  const outras = n.fontes.filter(f => f !== n.fonte)
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-b border-beon-line py-6 last:border-0 sm:grid-cols-[auto_120px_minmax(0,1fr)_auto] sm:items-start sm:gap-5">
      <span className={cx('w-10 text-right text-[34px] font-extrabold leading-none tabular-nums tracking-tight', posicao <= 3 ? 'text-beon-red' : 'text-beon-ink/25')}>
        {String(posicao).padStart(2, '0')}
      </span>
      <a href={n.link} target="_blank" rel="noopener noreferrer" aria-hidden tabIndex={-1}
        className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl bg-beon-soft sm:block">
        <ImagemDaNoticia n={{ ...n, outrasFontes: outras }} />
      </a>
      <div className="col-start-2 min-w-0 sm:col-start-auto">
        <div className="flex flex-wrap items-center gap-2">
          <SeloDaSecao secao={n.secao} />
          {n.possivelSinal && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">Possível sinal</span>}
        </div>
        <a href={n.link} target="_blank" rel="noopener noreferrer" className={cx('mt-2 block text-[17px] font-bold leading-snug text-beon-ink hover:text-beon-red', focusRing)}>
          {n.titulo} <ArrowUpRight className="inline h-4 w-4 align-[-2px]" aria-hidden />
        </a>
        <p className="mt-1 text-[13px] text-beon-muted">
          {n.fonte}{outras.length > 0 && <> · também em {outras.slice(0, 4).join(', ')}{outras.length > 4 ? ` e +${outras.length - 4}` : ''}</>}
          {' '}· {n.dias.length} {n.dias.length === 1 ? 'dia' : 'dias'} na edição
        </p>
        <div className="mt-3"><BarraDoIndice n={n} /></div>
        {n.discussaoId && (
          <Link href={`/comunidade/post/${n.discussaoId}`} className={cx('mt-3 inline-flex items-center gap-1 rounded-full text-[13px] font-semibold text-beon-red hover:underline', focusRing)}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {n.comentarios ? `Discussão · ${n.comentarios} ${n.comentarios === 1 ? 'comentário' : 'comentários'}` : 'Abrir a discussão'}
            {n.uteis > 0 && ` · ${n.uteis} útil`}
          </Link>
        )}
      </div>
      <div className="col-start-2 flex items-baseline gap-1 sm:col-start-auto sm:flex-col sm:items-end">
        <span className="text-[30px] font-extrabold leading-none tabular-nums text-beon-ink">{n.indice}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">índice</span>
      </div>
    </li>
  )
}

export default function HistoricoPage() {
  const [mes, setMes] = useState<string | null>(null)
  const [dados, setDados] = useState<HistoricoDoMes | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback((m: string | null) => {
    setErro(null)
    api<HistoricoDoMes>(`/community/newsletter/historico${m ? `?mes=${m}` : ''}`).then(setDados).catch(e => setErro(errorMessage(e)))
  }, [])
  useEffect(() => { carregar(mes) }, [mes, carregar])

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 sm:px-6">
      <Link href="/comunidade/newsletter" className={cx('inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-beon-body hover:text-beon-ink', focusRing)}>
        <ArrowLeft className="h-4 w-4" aria-hidden />Voltar para a edição de hoje
      </Link>

      <header className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-beon-red"><History className="h-4 w-4" aria-hidden />beOn Radar · Histórico</p>
          <h1 className="mt-2 text-[34px] font-extrabold leading-[1.05] tracking-tight text-beon-ink sm:text-[46px]">
            As 10 notícias que mais impactaram {dados ? <span className="text-beon-red">em {nomeDoMes(dados.mes).toLowerCase()}</span> : 'no mês'}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-beon-body">
            Toda notícia que passa pelo Radar fica guardada no mês em que apareceu. As 10 do mês saem pelo <strong>Índice de Impacto beOn Radar</strong>,
            de 0 a 100, sempre pela mesma conta:
          </p>
        </div>
        <section aria-label="Como o índice é calculado" className="rounded-3xl border border-beon-line bg-white p-5">
          <ul className="space-y-3">
            {PARTES.map(p => (
              <li key={p.id} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums text-white" style={{ background: p.cor }}>{p.peso}</span>
                <span className="text-[13px] leading-snug text-beon-body"><b className="text-beon-ink">{p.nome}.</b> {p.explica}</span>
              </li>
            ))}
          </ul>
        </section>
      </header>

      {dados && dados.meses.length > 0 && (
        <nav aria-label="Meses" className="mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {dados.meses.map(m => (
            <button key={m.mes} type="button" onClick={() => setMes(m.mes)} aria-current={m.mes === dados.mes ? 'true' : undefined}
              className={cx('inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors', focusRing,
                m.mes === dados.mes ? 'border-beon-ink bg-beon-ink text-white' : 'border-beon-line bg-white text-beon-body hover:bg-beon-soft')}>
              <CalendarDays className="h-4 w-4" aria-hidden />{nomeDoMes(m.mes)}
              <span className={cx('tabular-nums', m.mes === dados.mes ? 'text-white/70' : 'text-beon-muted')}>{m.total}</span>
            </button>
          ))}
        </nav>
      )}

      <section className="mt-6 rounded-[28px] border border-beon-line bg-white px-4 sm:px-8" aria-live="polite">
        {erro ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-beon-body">{erro}</p>
            <Button className="mt-4" icon={RefreshCw} onClick={() => carregar(mes)}>Tentar novamente</Button>
          </div>
        ) : !dados ? (
          <div className="space-y-4 py-6">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        ) : !dados.top.length ? (
          <p className="py-16 text-center text-beon-body">O histórico começa a ser montado com a primeira edição do Radar. Volte depois que ela sair.</p>
        ) : (
          <>
            {dados.total < 10 && (
              <p className="border-b border-beon-line py-4 text-sm text-beon-muted">
                Este mês ainda tem {dados.total} {dados.total === 1 ? 'notícia guardada' : 'notícias guardadas'}; a lista chega a 10 conforme as edições saem.
              </p>
            )}
            <ol>{dados.top.map((n, i) => <Linha key={n.id} n={n} posicao={i + 1} />)}</ol>
          </>
        )}
      </section>
      {dados?.inicio && (
        <p className="mt-4 text-xs text-beon-muted">
          O histórico existe desde {new Date(dados.inicio).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}. As notas de
          conversa mudam enquanto as discussões seguem ativas.
        </p>
      )}
    </div>
  )
}

