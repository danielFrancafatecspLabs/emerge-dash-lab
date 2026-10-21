// Blocos de conteúdo da Trilha de Experimentação (texto, cartões, passos, tabelas…).

import { Fragment, type ReactNode } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Lightbulb, XCircle } from 'lucide-react'
import { cx } from '@/components/ui'
import type { Bloco } from './conteudo'

/** Texto com **negrito**. */
export function Rico({ texto }: { texto: string }) {
  const partes = texto.split(/\*\*(.+?)\*\*/g)
  return <>{partes.map((p, i) => (i % 2 ? <strong key={i} className="font-semibold text-beon-ink">{p}</strong> : <Fragment key={i}>{p}</Fragment>))}</>
}

function Secao({ titulo, intro, children }: { titulo?: string; intro?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      {titulo && <h3 className="text-lg font-semibold tracking-tight text-beon-ink">{titulo}</h3>}
      {intro && <p className="text-[15px] leading-relaxed text-beon-body"><Rico texto={intro} /></p>}
      {children}
    </section>
  )
}

export function BlocoTrilha({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'texto':
      return (
        <Secao titulo={bloco.titulo}>
          {bloco.paragrafos.map(p => <p key={p} className="text-[15px] leading-relaxed text-beon-body"><Rico texto={p} /></p>)}
        </Secao>
      )

    case 'cartoes':
      return (
        <Secao titulo={bloco.titulo} intro={bloco.intro}>
          <ul className={cx('grid gap-3 sm:grid-cols-2', bloco.itens.length === 3 && 'lg:grid-cols-3')}>
            {bloco.itens.map(c => (
              <li key={c.titulo} className="rounded-2xl border border-beon-line bg-white p-4">
                <p className="font-semibold text-beon-ink">{c.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-beon-body"><Rico texto={c.texto} /></p>
              </li>
            ))}
          </ul>
        </Secao>
      )

    case 'passos':
      return (
        <Secao titulo={bloco.titulo} intro={bloco.intro}>
          <ol className="space-y-0">
            {bloco.itens.map((p, i) => (
              <li key={p.titulo} className="relative flex gap-4 pb-5 last:pb-0">
                {i < bloco.itens.length - 1 && <span className="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-beon-line" aria-hidden />}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-beon-tint text-sm font-bold text-beon-red">{i + 1}</span>
                <div className="min-w-0 pt-1">
                  <p className="font-semibold text-beon-ink">{p.titulo}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-beon-body"><Rico texto={p.texto} /></p>
                </div>
              </li>
            ))}
          </ol>
        </Secao>
      )

    case 'fluxo':
      return (
        <Secao titulo={bloco.titulo} intro={bloco.intro}>
          <ol className={cx('grid gap-2', bloco.itens.length <= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3')}>
            {bloco.itens.map((p, i) => (
              <li key={p.titulo} className="rounded-2xl bg-beon-soft p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-beon-red">
                  {String(i + 1).padStart(2, '0')}
                  {i < bloco.itens.length - 1 && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
                </p>
                <p className="mt-1 font-semibold text-beon-ink">{p.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-beon-body">{p.texto}</p>
              </li>
            ))}
          </ol>
        </Secao>
      )

    case 'lista':
      return (
        <Secao titulo={bloco.titulo} intro={bloco.intro}>
          <ul className="space-y-2.5">
            {bloco.itens.map(item => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-beon-body">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-beon-red" aria-hidden />
                <span><Rico texto={item} /></span>
              </li>
            ))}
          </ul>
        </Secao>
      )

    case 'comparar':
      return (
        <Secao titulo={bloco.titulo} intro={bloco.intro}>
          <div className="grid gap-3 md:grid-cols-2">
            {([['sim', bloco.sim], ['nao', bloco.nao]] as const).map(([lado, col]) => (
              <div key={lado} className={cx('rounded-2xl border p-4', lado === 'sim' ? 'border-emerald-200 bg-emerald-50/60' : 'border-beon-line bg-beon-soft')}>
                <p className={cx('flex items-center gap-2 text-sm font-semibold', lado === 'sim' ? 'text-emerald-800' : 'text-beon-ink')}>
                  {lado === 'sim' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden /> : <XCircle className="h-4 w-4 text-beon-red" aria-hidden />}
                  {col.titulo}
                </p>
                <ul className="mt-2.5 space-y-2.5">
                  {col.itens.map(item => <li key={item} className="text-sm leading-relaxed text-beon-body"><Rico texto={item} /></li>)}
                </ul>
              </div>
            ))}
          </div>
        </Secao>
      )

    case 'tabela':
      return (
        <Secao titulo={bloco.titulo} intro={bloco.intro}>
          {/* Em telas estreitas, cada linha vira um cartão. */}
          <ul className="space-y-2 sm:hidden">
            {bloco.linhas.map(linha => (
              <li key={linha[0]} className="rounded-2xl border border-beon-line bg-white p-4">
                <p className="font-semibold text-beon-ink">{linha[0]}</p>
                {linha.slice(1).map((cel, i) => (
                  <p key={i} className="mt-1.5 text-sm leading-relaxed text-beon-body">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-beon-muted">{bloco.colunas[i + 1]}</span>
                    <Rico texto={cel} />
                  </p>
                ))}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-2xl border border-beon-line sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-beon-soft">
                <tr>{bloco.colunas.map(c => <th key={c} scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-beon-muted">{c}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-beon-line bg-white">
                {bloco.linhas.map(linha => (
                  <tr key={linha[0]} className="align-top">
                    {linha.map((cel, i) => i === 0
                      ? <th key={i} scope="row" className="w-[28%] px-4 py-3 font-semibold text-beon-ink">{cel}</th>
                      : <td key={i} className="px-4 py-3 leading-relaxed text-beon-body"><Rico texto={cel} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bloco.nota && <p className="text-sm leading-relaxed text-beon-muted">{bloco.nota}</p>}
        </Secao>
      )

    case 'nota': {
      const atencao = bloco.tom === 'atencao'
      const Icon = atencao ? AlertTriangle : Lightbulb
      return (
        <aside className={cx('flex gap-3 rounded-2xl border p-4 sm:p-5', atencao ? 'border-amber-200 bg-amber-50' : 'border-beon-line bg-beon-soft')}>
          <Icon className={cx('mt-0.5 h-5 w-5 shrink-0', atencao ? 'text-amber-700' : 'text-beon-red')} aria-hidden />
          <div>
            <p className={cx('font-semibold', atencao ? 'text-amber-900' : 'text-beon-ink')}>{bloco.titulo}</p>
            <p className={cx('mt-1 text-[15px] leading-relaxed', atencao ? 'text-amber-900/90' : 'text-beon-body')}><Rico texto={bloco.texto} /></p>
          </div>
        </aside>
      )
    }

    case 'exemplo':
      return (
        <section className="rounded-2xl border border-dashed border-stone-300 p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-muted">Exemplo ilustrativo</p>
          <h3 className="mt-1 font-semibold text-beon-ink">{bloco.titulo}</h3>
          {bloco.paragrafos.map(p => <p key={p} className="mt-2 text-[15px] leading-relaxed text-beon-body"><Rico texto={p} /></p>)}
        </section>
      )

    case 'formula':
      return (
        <Secao titulo={bloco.titulo} intro={bloco.intro}>
          <ol className="overflow-hidden rounded-2xl border border-beon-line">
            {bloco.partes.map(parte => (
              <li key={parte.rotulo} className="grid gap-2 border-b border-beon-line bg-white p-4 last:border-b-0 sm:grid-cols-[96px_1fr] sm:gap-4">
                <span className="self-start rounded-lg bg-beon-ink px-2.5 py-1 text-center text-xs font-bold tracking-[0.08em] text-white sm:mt-0.5">{parte.rotulo}</span>
                <div>
                  <p className="text-sm font-medium text-beon-muted">{parte.descricao}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-beon-ink">{parte.exemplo}</p>
                </div>
              </li>
            ))}
          </ol>
        </Secao>
      )
  }
}
