'use client'

// Painel lateral da conversa: o mapa do problema (o que o Cientista já entendeu), a ficha em construção
// e, na jornada Desenvolvedor, o desenho técnico e o kit executável.

import { useEffect, useMemo, useState } from 'react'
import { Download, FileCode2, FileText, Info, ShieldCheck } from 'lucide-react'
import type { EstadoCientista, Kit } from '@/lib/community/cientista'
import { cx, EmptyState, Skeleton } from '@/components/ui'
import { Badge } from './Cards'
import { cientista } from './client'

type Aba = 'mapa' | 'ficha' | 'desenho' | 'kit'

function Profundidade({ valor, atual }: { valor: number; atual: boolean }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`Profundidade ${valor} de 3`}>
      {[1, 2, 3].map(n => <span key={n} className={cx('h-1.5 w-4 rounded-full', n <= valor ? (atual ? 'bg-beon-red' : 'bg-beon-ink') : 'bg-beon-line')} />)}
    </span>
  )
}

function Mapa({ estado }: { estado: EstadoCientista }) {
  const m = estado.mapa
  const atual = m.pergunta_atual?.dimensao
  const lacunas = m.dimensoes.filter(d => d.profundidade < d.minimo)
  const pct = Math.round(m.cobertura * 100)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E7E5E4" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#D31809" strokeWidth="3" strokeDasharray={`${pct * 0.974} 100`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{pct}</span>
        </div>
        <div>
          <b className="block text-sm text-beon-ink">{m.pronto ? 'Problema claro: pronto para a hipótese' : m.cobertura === 0 ? 'O Cientista ainda está ouvindo' : 'Entendendo o problema'}</b>
          <small className="text-xs text-beon-muted">
            {m.pronto ? 'As dimensões essenciais estão claras e com evidência.' : lacunas.length ? `Falta aprofundar: ${lacunas.slice(0, 3).map(d => d.nome.toLowerCase()).join(', ')}` : 'Quase lá.'}
          </small>
        </div>
      </div>
      {m.sintese && (
        <div className={cx('rounded-xl p-3', m.sintese_confirmada ? 'bg-emerald-50' : 'bg-beon-tint/60')}>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">{m.sintese_confirmada ? 'Entendimento confirmado' : 'Entendimento para confirmar'}</span>
          <p className="mt-1 text-sm text-beon-ink">{m.sintese}</p>
        </div>
      )}
      <ul className="space-y-3">
        {m.dimensoes.map(d => (
          <li key={d.id} className={cx('rounded-xl border p-3', d.id === atual ? 'border-beon-red/40 bg-beon-tint/30' : 'border-beon-line', d.profundidade === 0 && d.id !== atual && 'opacity-70')}>
            <div className="flex items-center gap-2">
              <b className="flex-1 text-sm text-beon-ink">{d.nome}</b>
              {d.id === atual && <Badge tom="accent">perguntando agora</Badge>}
              {d.id !== atual && d.profundidade > 0 && d.profundidade < d.minimo && <Badge tom="warn">raso</Badge>}
              <Profundidade valor={d.profundidade} atual={d.id === atual} />
            </div>
            <p className={cx('mt-1 text-[13px]', d.entendimento ? 'text-beon-body' : 'text-beon-muted')}>{d.entendimento ?? d.busca}</p>
            {d.evidencia && <q className="mt-1 block text-xs italic text-beon-muted">{d.evidencia}</q>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Campo({ rotulo, valor, mudou }: { rotulo: string; valor?: string | null; mudou?: boolean }) {
  return (
    <div className={cx('rounded-lg px-2 py-1.5 transition-colors', mudou && 'bg-amber-50')}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">{rotulo}</span>
      <p className={cx('text-sm', valor ? 'text-beon-ink' : 'text-beon-muted')}>{valor || '—'}</p>
    </div>
  )
}

function Ficha({ estado, mudou }: { estado: EstadoCientista; mudou: string[] }) {
  const f = estado.ficha
  const ausentes = estado.pendencias.filter(p => p.endsWith('ausente')).length
  const feitos = Math.max(0, 10 - ausentes)
  const regras = estado.pendencias.filter(p => !p.endsWith('ausente'))
  const m = (k: string) => mudou.includes(k)
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-beon-soft p-3">
        <div className="flex items-center justify-between text-sm">
          <b>{estado.ficha_gerada ? 'Ficha gerada' : `${feitos} de 10 itens do checklist`}</b>
          {estado.ficha_gerada ? <Badge tom="ok">versão {estado.ficha_versao}</Badge> : <span className="font-mono text-xs text-beon-muted">{f.id}</span>}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${feitos * 10}%` }} /></div>
        {regras.length > 0 && <ul className="mt-2 space-y-1">{regras.map(r => <li key={r} className="flex gap-1.5 text-xs text-amber-800"><Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />{r}</li>)}</ul>}
        {estado.ficha_gerada && (
          <a href={cientista.fichaUrl(estado.id)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-beon-red hover:underline" download>
            <Download className="h-3.5 w-3.5" aria-hidden /> Baixar ficha (.md)
          </a>
        )}
      </div>
      <h3 className={cx('px-2 text-lg font-semibold', m('titulo') && 'bg-amber-50')}>{f.titulo || <span className="text-beon-muted">Nome do experimento (até 3 palavras)</span>}</h3>
      <div className={cx('rounded-xl border-l-4 border-beon-red bg-beon-tint/40 px-3 py-2', m('hipotese') && 'bg-amber-50')}>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Hipótese</span>
        <p className="text-sm text-beon-ink">{f.hipotese || <span className="text-beon-muted">Acreditamos que [ação] irá gerar [resultado mensurável] para [contexto].</span>}</p>
      </div>
      <Campo rotulo="Problema" valor={f.problema} mudou={m('problema')} />
      <Campo rotulo="Impacto" valor={f.publico_afetado} mudou={m('publico_afetado')} />
      <Campo rotulo="Objetivo" valor={f.objetivo} mudou={m('objetivo')} />
      <Campo rotulo="Metodologia" valor={f.metodologia} mudou={m('metodologia')} />
      <div className={cx('rounded-lg px-2 py-1.5', m('metricas') && 'bg-amber-50')}>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Métricas e critérios de aceite</span>
        {f.metricas?.length ? (
          <ul className="mt-1 space-y-1">{f.metricas.map(x => (
            <li key={x.nome} className="flex flex-wrap items-baseline gap-2 text-sm"><span className="flex-1 text-beon-body">{x.descricao}</span><b className="font-mono text-xs">{x.criterio_aceite}</b></li>
          ))}</ul>
        ) : <p className="text-sm text-beon-muted">—</p>}
      </div>
      <Campo rotulo="Dados e amostra" valor={[f.dados, f.amostra].filter(Boolean).join(' · ')} mudou={m('amostra') || m('dados')} />
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="BO" valor={f.bo} mudou={m('bo')} />
        <Campo rotulo="Sponsor" valor={f.sponsor} mudou={m('sponsor')} />
      </div>
      {f.tecnica && estado.papel === 'desenvolvedor' && <Campo rotulo="Técnica" valor={`${f.tecnica}${f.golden_path ? ` · ${f.golden_path}` : ''}`} />}
    </div>
  )
}

function Desenho({ estado }: { estado: EstadoCientista }) {
  const d = estado.ficha.detalhes_tecnicos
  const pend = estado.desenho_pendencias ?? []
  if (!d) return <EmptyState icon={FileCode2} title="O desenho técnico aparece aqui">Stack, baseline, abordagens e protocolo de avaliação, conforme a conversa avança.</EmptyState>
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-beon-soft p-3 text-sm">
        <b>{pend.length ? `Faltam ${pend.length} itens para o kit` : 'Desenho completo: kit pronto'}</b>
        {pend.length > 0 && <p className="mt-1 text-xs text-beon-muted">{pend.join(' · ')}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2"><Campo rotulo="Stack" valor={d.stack} /><Campo rotulo="Fontes de dados" valor={d.fontes_dados} /></div>
      <Campo rotulo="Baseline" valor={d.baseline} />
      <Campo rotulo="Abordagem escolhida" valor={d.abordagem_escolhida} />
      {d.restricoes?.length ? <Campo rotulo="Restrições" valor={d.restricoes.join(' · ')} /> : null}
      {d.avaliacao && (
        <div className="rounded-lg px-2 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-beon-muted">Protocolo de avaliação</span>
          <p className="text-sm">{d.avaliacao.conjunto}{d.avaliacao.tamanho ? ` · ${d.avaliacao.tamanho} casos` : ''}</p>
          <ul className="mt-1 space-y-0.5">{d.avaliacao.metricas.map(x => (
            <li key={x.nome} className="flex justify-between gap-2 font-mono text-xs"><span>{x.nome}</span><b>{x.baseline ? `${x.baseline} → ` : ''}{x.alvo}</b></li>
          ))}</ul>
          {d.avaliacao.gate_regressao && <p className="mt-1 flex gap-1.5 text-xs text-beon-muted"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />{d.avaliacao.gate_regressao}</p>}
        </div>
      )}
      {d.arquitetura?.length ? <Campo rotulo="Arquitetura" valor={d.arquitetura.join(' → ')} /> : null}
    </div>
  )
}

function KitAba({ estado }: { estado: EstadoCientista }) {
  const [kit, setKit] = useState<Kit | null>(null)
  const [erro, setErro] = useState(false)
  const [sel, setSel] = useState('README.md')
  const versao = `${estado.ficha_versao}-${JSON.stringify(estado.ficha.detalhes_tecnicos ?? {}).length}`
  const temProtocolo = !!estado.ficha.detalhes_tecnicos?.avaliacao
  useEffect(() => {
    if (!temProtocolo) return
    setErro(false)
    cientista.kit(estado.id).then(setKit).catch(() => setErro(true))
  }, [estado.id, versao, temProtocolo])
  const arquivos = useMemo(() => Object.keys(kit?.arquivos ?? {}).sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b)), [kit])
  if (!temProtocolo) return <EmptyState icon={FileCode2} title="O kit nasce do protocolo de avaliação">Quando o protocolo estiver definido, aparece aqui o repositório inicial com avaliador, metas e CI.</EmptyState>
  if (erro) return <p className="text-sm text-beon-muted">Não foi possível carregar o kit agora.</p>
  if (!kit) return <Skeleton className="h-40 w-full" />
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div><b className="font-mono text-sm">{kit.pasta}/</b><small className="block text-xs text-beon-muted">{arquivos.length} arquivos · CI bloqueia metas não atendidas e regressões</small></div>
        <a href={cientista.kitUrl(estado.id)} download className="inline-flex h-8 items-center gap-1.5 rounded-full bg-beon-red px-3 text-[13px] font-medium text-white hover:bg-beon-redhi">
          <Download className="h-3.5 w-3.5" aria-hidden /> .zip
        </a>
      </div>
      <ul className="space-y-0.5">
        {arquivos.map(a => (
          <li key={a}>
            <button type="button" onClick={() => setSel(a)} className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left font-mono text-xs', a === sel ? 'bg-beon-soft text-beon-ink' : 'text-beon-body hover:bg-beon-soft/60')}>
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />{a}
            </button>
          </li>
        ))}
      </ul>
      <pre className="max-h-80 overflow-auto rounded-xl bg-stone-900 p-3 text-xs leading-relaxed text-stone-100"><code>{kit.arquivos[sel] ?? ''}</code></pre>
    </div>
  )
}

export function Painel({ estado, mudou }: { estado: EstadoCientista; mudou: string[] }) {
  const dev = estado.papel === 'desenvolvedor'
  const [aba, setAba] = useState<Aba>('mapa')
  useEffect(() => { if (estado.ficha_gerada) setAba(a => (a === 'mapa' ? 'ficha' : a)) }, [estado.ficha_gerada])
  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'mapa', rotulo: 'Entendimento' }, { id: 'ficha', rotulo: 'Ficha' },
    ...(dev ? [{ id: 'desenho' as Aba, rotulo: 'Desenho' }, { id: 'kit' as Aba, rotulo: 'Kit' }] : []),
  ]
  return (
    <div className="flex h-full flex-col">
      <div role="tablist" aria-label="Painel do experimento" className="flex gap-4 border-b border-beon-line px-5">
        {abas.map(a => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
            className={cx('border-b-2 py-3 text-sm', aba === a.id ? 'border-beon-red font-semibold text-beon-ink' : 'border-transparent text-beon-muted hover:text-beon-ink')}>
            {a.rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex-1 overflow-y-auto p-5">
        {aba === 'mapa' && <Mapa estado={estado} />}
        {aba === 'ficha' && <Ficha estado={estado} mudou={mudou} />}
        {aba === 'desenho' && <Desenho estado={estado} />}
        {aba === 'kit' && <KitAba estado={estado} />}
      </div>
    </div>
  )
}
