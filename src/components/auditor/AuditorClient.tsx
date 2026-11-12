'use client'

// Auditor de Analytics (só admins): o relatório completo, escrito para ser lido. De cima para baixo: a leitura do dia
// escrita pela IA, o parecer (dá para
// confiar?), em qual tela confiar, cada divergência explicada (o que acontece, por quê, o impacto e o que fazer), o
// que mudou no Jira desde a leitura anterior, o cadastro que distorce números, as conferências que batem e o método.

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, ArrowRightLeft, CheckCircle2, ExternalLink, RefreshCw, ShieldAlert, ShieldCheck, Wrench } from 'lucide-react'
import { Button, cx, focusRing } from '@/components/ui'
import type { Acao, Alerta, ConfiancaDaTela, Gravidade, ItemRef, Natureza, RelatorioConsistencia, Verificacao } from '@/lib/analytics/consistencia'
import type { Mudanca } from '@/lib/analytics/movimento'
import { LeituraDaIA } from './LeituraDaIA'

const reais = (n: number) => (Math.abs(n) >= 1_000_000
  ? `R$ ${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  : `R$ ${Math.round(n).toLocaleString('pt-BR')}`)
const numero = (n: number, formato: Verificacao['formato']) => (formato === 'moeda' ? reais(n) : n.toLocaleString('pt-BR'))
const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const sinal = (n: number, texto: string) => `${n > 0 ? '+' : '−'}${texto}`

const NATUREZA: Record<Natureza, { rotulo: string; explica: string }> = {
  telas: { rotulo: 'Entre telas', explica: 'Duas telas do app mostram números diferentes para a mesma coisa.' },
  jira: { rotulo: 'App × Jira', explica: 'As telas concordam entre si, mas a regra do app discorda da coluna do board no Jira.' },
  soma: { rotulo: 'Conta que não fecha', explica: 'Uma soma que deveria fechar dentro da mesma tela não fecha.' },
}
const GRAVIDADE: Record<Gravidade, { titulo: string; explica: string; cor: string }> = {
  corrigir: { titulo: 'Para corrigir', explica: 'Distorcem algum número dos painéis.', cor: 'text-red-700 bg-red-50 ring-red-200' },
  conferir: { titulo: 'Para conferir', explica: 'Podem estar certos, mas vale olhar.', cor: 'text-amber-800 bg-amber-50 ring-amber-200' },
  informativo: { titulo: 'Para saber', explica: 'Explicam um número; não pedem ação.', cor: 'text-beon-body bg-stone-100 ring-stone-200' },
}
const SITUACAO: Record<ConfiancaDaTela['situacao'], { rotulo: string; cor: string }> = {
  bate: { rotulo: 'Bate com as outras', cor: 'text-emerald-800 bg-emerald-50 ring-emerald-200' },
  'difere do Jira': { rotulo: 'Difere do board do Jira', cor: 'text-amber-800 bg-amber-50 ring-amber-200' },
  'em disputa': { rotulo: 'Em disputa', cor: 'text-amber-800 bg-amber-50 ring-amber-200' },
  destoa: { rotulo: 'É a que destoa', cor: 'text-red-700 bg-red-50 ring-red-200' },
}
const VERBO: Record<Mudanca['tipo'], string> = { entrou: 'entrou', saiu: 'saiu', status: 'mudou de status', beneficio: 'teve o benefício alterado' }

// ── Peças ─────────────────────────────────────────────────────────────────────────────────────

const Selo = ({ children, cor }: { children: ReactNode; cor: string }) => (
  <span className={cx('inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', cor)}>{children}</span>
)

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-beon-ink">{titulo}</h2>
        {descricao && <p className="mt-0.5 max-w-3xl text-sm text-beon-muted">{descricao}</p>}
      </div>
      {children}
    </section>
  )
}

/** Título de um bloco dentro de um caso ("O que está acontecendo", "O que fazer"…). */
const Bloco = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <div>
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-muted">{titulo}</p>
    {children}
  </div>
)

function Chave({ k, jiraUrl }: { k: string; jiraUrl?: string | null }) {
  if (!jiraUrl || !/^[A-Z]+-\d+$/.test(k)) return <span className="font-medium text-beon-ink">{k}</span>
  return (
    <a href={`${jiraUrl}/browse/${k}`} target="_blank" rel="noreferrer" className={cx('inline-flex items-center gap-0.5 font-medium text-beon-ink underline decoration-stone-300 underline-offset-2 hover:decoration-beon-ink', focusRing)}>
      {k}<ExternalLink className="h-3 w-3 text-beon-muted" aria-hidden />
    </a>
  )
}

function TabelaDeItens({ itens, total, jiraUrl }: { itens: ItemRef[]; total: number; jiraUrl?: string | null }) {
  const comMae = itens.some(i => i.mae), comBeneficio = itens.some(i => i.beneficio), comDetalhe = itens.some(i => i.detalhe)
  return (
    <div className="overflow-x-auto rounded-xl border border-beon-line">
      <table className="w-full text-[13px]">
        <thead className="bg-beon-soft text-left text-[11px] uppercase tracking-[0.06em] text-beon-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">Item</th>
            <th scope="col" className="px-3 py-2 font-semibold">Nome</th>
            <th scope="col" className="px-3 py-2 font-semibold">Status</th>
            {comMae && <th scope="col" className="px-3 py-2 font-semibold">Iniciativa-mãe</th>}
            {comBeneficio && <th scope="col" className="px-3 py-2 text-right font-semibold">Benefício</th>}
            {comDetalhe && <th scope="col" className="px-3 py-2 font-semibold">Observação</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-beon-line">
          {itens.map(i => (
            <tr key={i.key}>
              <td className="whitespace-nowrap px-3 py-1.5"><Chave k={i.key} jiraUrl={jiraUrl} /></td>
              <td className="max-w-[280px] truncate px-3 py-1.5 text-beon-body" title={i.nome}>{i.nome || '—'}</td>
              <td className="whitespace-nowrap px-3 py-1.5 text-beon-body">{i.status}</td>
              {comMae && <td className="whitespace-nowrap px-3 py-1.5 text-beon-body">{i.mae ?? '—'}</td>}
              {comBeneficio && <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-beon-ink">{i.beneficio ? reais(i.beneficio) : '—'}</td>}
              {comDetalhe && <td className="px-3 py-1.5 text-beon-body">{i.detalhe ?? '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {total > itens.length && <p className="border-t border-beon-line px-3 py-1.5 text-xs text-beon-muted">e mais {total - itens.length} (a lista mostra os primeiros {itens.length})</p>}
    </div>
  )
}

function Acoes({ acoes }: { acoes: Acao[] }) {
  return (
    <ul className="space-y-1.5">
      {acoes.map(a => (
        <li key={`${a.onde}${a.texto}`} className="flex items-start gap-2 text-sm leading-relaxed text-beon-body">
          <Selo cor={a.onde === 'Jira' ? 'text-sky-800 bg-sky-50 ring-sky-200' : 'text-beon-ink bg-stone-100 ring-stone-200'}>{a.onde === 'Jira' ? 'No Jira' : 'No app'}</Selo>
          <span>{a.texto}</span>
        </li>
      ))}
    </ul>
  )
}

/** Os números de cada visão, com a explicação de como cada uma chega ao número. */
function ComoCadaTelaConta({ v, destaque = false }: { v: Verificacao; destaque?: boolean }) {
  return (
    <dl className={cx('grid gap-2', Object.keys(v.valores).length > 2 ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2')}>
      {Object.entries(v.valores).map(([visao, n]) => {
        const fora = v.destoam?.includes(visao)
        return (
          <div key={visao} className={cx('rounded-xl border px-3 py-2', fora ? 'border-red-200 bg-red-50/50' : 'border-beon-line bg-white')}>
            <dt className="flex items-center justify-between gap-2 text-xs font-medium text-beon-muted">
              <span>{visao}</span>{fora && <span className="text-[11px] font-semibold text-red-700">{visao.includes('Jira') ? 'difere das telas' : 'destoa'}</span>}
            </dt>
            <dd className={cx('tabular-nums tracking-tight text-beon-ink', destaque ? 'text-2xl font-semibold' : 'text-lg font-semibold')}>{numero(n ?? 0, v.formato)}</dd>
            {v.comoConta?.[visao] && <dd className="mt-0.5 text-xs leading-relaxed text-beon-muted">{v.comoConta[visao]}</dd>}
          </div>
        )
      })}
    </dl>
  )
}

/** Uma divergência contada como um caso: a pergunta, o veredito, o que acontece, o impacto e o que fazer. */
function Caso({ v, n, jiraUrl }: { v: Verificacao; n: number; jiraUrl?: string | null }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
      <div className="border-b border-amber-200 bg-amber-50/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-800">Divergência {n} · {v.titulo}</p>
          <span title={NATUREZA[v.natureza].explica}><Selo cor="text-amber-900 bg-white ring-amber-300">{NATUREZA[v.natureza].rotulo}</Selo></span>
        </div>
        <h3 className="mt-1 text-base font-semibold text-beon-ink">{v.pergunta}</h3>
        <p className="mt-1.5 flex items-start gap-2 text-sm font-medium text-beon-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />{v.veredito}
        </p>
      </div>
      <div className="space-y-5 px-5 py-4">
        <Bloco titulo="O que cada visão mostra e como ela conta"><ComoCadaTelaConta v={v} destaque /></Bloco>
        {v.explicacao && v.explicacao.length > 0 && (
          <Bloco titulo="O que está acontecendo">
            <div className="space-y-2">{v.explicacao.map(p => <p key={p} className="text-sm leading-relaxed text-beon-body">{p}</p>)}</div>
          </Bloco>
        )}
        {v.diagnostico?.diferencas.map(d => (
          <Bloco key={`${d.conta}>${d.naoConta}`} titulo={`${d.conta} conta, ${d.naoConta} não (${d.total})`}>
            <TabelaDeItens itens={d.itens} total={d.total} jiraUrl={jiraUrl} />
          </Bloco>
        ))}
        {v.impacto && <Bloco titulo="O que isso muda nos painéis"><p className="text-sm leading-relaxed text-beon-body">{v.impacto}</p></Bloco>}
        {v.acoes && v.acoes.length > 0 && <Bloco titulo="O que fazer"><Acoes acoes={v.acoes} /></Bloco>}
        {v.porQueImporta && <p className="border-t border-beon-line pt-3 text-xs leading-relaxed text-beon-muted"><b className="font-semibold text-beon-body">Por que esta conferência existe:</b> {v.porQueImporta}</p>}
      </div>
    </article>
  )
}

function CartaoDeAlerta({ a, jiraUrl }: { a: Alerta; jiraUrl?: string | null }) {
  return (
    <details className="group rounded-2xl border border-beon-line bg-white">
      <summary className={cx('flex cursor-pointer items-start gap-3 px-4 py-3', focusRing)}>
        <span className="mt-0.5 min-w-[2.25rem] text-right text-lg font-semibold tabular-nums leading-none text-beon-ink">{a.quantidade}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-beon-ink">{a.titulo}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-beon-muted">{a.porQueImporta}</span>
        </span>
        <span className="mt-0.5 shrink-0 text-xs text-beon-muted group-open:hidden">ver itens</span>
      </summary>
      <div className="space-y-3 border-t border-beon-line px-4 py-3">
        {a.impacto && <Bloco titulo="Peso"><p className="text-sm text-beon-body">{a.impacto}</p></Bloco>}
        <Bloco titulo="O que fazer"><Acoes acoes={[a.oQueFazer]} /></Bloco>
        {a.itens.length > 0 && <Bloco titulo="Itens"><TabelaDeItens itens={a.itens} total={a.quantidade} jiraUrl={jiraUrl} /></Bloco>}
      </div>
    </details>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────────────────────

export default function AuditorClient() {
  const [rel, setRel] = useState<RelatorioConsistencia | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [auditando, setAuditando] = useState(false)

  const auditar = useCallback((agora: boolean) => {
    setAuditando(true)
    fetch(`/jira/api/analytics/consistencia${agora ? '?agora=1' : ''}`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status === 403 ? 'Só administradores abrem o Auditor.' : 'O Auditor não conseguiu rodar agora. Tente de novo em instantes.'))))
      .then((x: RelatorioConsistencia) => { setRel(x); setErro(null) })
      .catch((e: Error) => setErro(e.message))
      .finally(() => setAuditando(false))
  }, [])
  useEffect(() => auditar(false), [auditar])

  if (erro && !rel) return <p className="m-6 rounded-2xl border border-beon-line bg-white p-5 text-sm text-beon-body">{erro}</p>
  if (!rel) return <p className="m-6 text-sm text-beon-muted">Auditando as telas…</p>

  const falhas = rel.verificacoes.filter(v => !v.ok)
  const certas = rel.verificacoes.filter(v => v.ok)
  const mov = rel.movimento
  const nivel = rel.parecer?.nivel ?? (falhas.length ? 'critico' : 'ok')
  const tom = nivel === 'ok' ? { borda: 'border-emerald-200', fundo: 'bg-emerald-50/60', icone: 'text-emerald-600' }
    : nivel === 'atencao' ? { borda: 'border-amber-200', fundo: 'bg-amber-50/60', icone: 'text-amber-600' }
      : { borda: 'border-red-200', fundo: 'bg-red-50/60', icone: 'text-red-600' }
  const Escudo = nivel === 'ok' ? ShieldCheck : ShieldAlert

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-9 px-4 py-6 sm:px-6">
      {/* 0. A leitura do dia, escrita pela IA a partir desta auditoria */}
      <LeituraDaIA ia={rel.ia} jiraUrl={rel.jiraUrl} />

      {/* 1. Parecer */}
      <section className={cx('rounded-2xl border p-5', tom.borda, tom.fundo)}>
        <div className="flex flex-wrap items-start gap-4">
          <Escudo className={cx('h-9 w-9 shrink-0', tom.icone)} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-beon-muted">Parecer do Auditor</p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-beon-ink">{rel.parecer?.titulo ?? rel.resumo?.[0]}</h2>
            <ul className="mt-2 space-y-1">
              {(rel.parecer?.frases ?? rel.resumo ?? []).map(f => <li key={f} className="text-sm leading-relaxed text-beon-body">{f}</li>)}
            </ul>
            <p className="mt-3 text-xs text-beon-muted">Auditado em {quando(rel.geradoEm)}. O Auditor roda sozinho a cada leitura do Jira.</p>
          </div>
          <Button variant="secondary" icon={RefreshCw} loading={auditando} onClick={() => auditar(true)}>Auditar agora</Button>
        </div>
      </section>

      {/* 2. Em qual tela confiar */}
      {rel.telas && rel.telas.length > 0 && (
        <Secao titulo="Em qual tela posso confiar?" descricao='Cada tela entra em várias conferências. "Bate" é quando ela concorda com as outras em todas. "Difere do board do Jira" é quando as telas concordam entre si, mas a coluna do board diz outra coisa. "Em disputa" é quando duas visões discordam sem maioria para dizer quem está fora. "Destoa" é quando a maioria concorda e ela não.'>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rel.telas.map(t => (
              <div key={t.tela} className="rounded-2xl border border-beon-line bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-beon-ink">{t.tela}</p>
                  <Selo cor={SITUACAO[t.situacao].cor}>{SITUACAO[t.situacao].rotulo}</Selo>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-beon-muted">
                  {t.conferencias} {t.conferencias === 1 ? 'conferência' : 'conferências'}
                  {t.divergencias ? <>, <b className="font-semibold text-beon-ink">{t.divergencias}</b> com divergência{t.destoa ? ` (em ${t.destoa}, é ela que destoa)` : ''}</> : ', todas batem'}.
                </p>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* 3. Divergências */}
      <Secao titulo={falhas.length ? `Divergências (${falhas.length})` : 'Divergências'}
        descricao="Cada divergência é contada como um caso: a pergunta que a conferência faz, o que cada visão mostra, quais itens fazem a diferença, o que eles têm em comum, o que isso muda nos painéis e o que fazer.">
        {falhas.length === 0
          ? <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900"><CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />Nenhuma divergência: todas as conferências batem.</p>
          : <div className="space-y-5">{falhas.map((v, i) => <Caso key={v.id} v={v} n={i + 1} jiraUrl={rel.jiraUrl} />)}</div>}
      </Secao>

      {/* 4. Movimento */}
      {mov && (
        <Secao titulo="O que mudou no Jira desde a leitura anterior" descricao="Explica um número que mudou de um dia para o outro sem ninguém mexer no app: quem entrou, quem saiu e quem mudou de status ou de benefício.">
          <div className="rounded-2xl border border-beon-line bg-white p-4">
            <p className="flex items-start gap-2 text-sm text-beon-body">
              <ArrowRightLeft className="mt-0.5 h-4 w-4 shrink-0 text-beon-muted" aria-hidden />
              <span>
                Da leitura de {quando(mov.de)} para a de {quando(mov.ate)}:{' '}
                {mov.mudancas.length === 0 ? 'nada mudou no Jira.' : (
                  <>
                    <b className="text-beon-ink">{mov.mudancas.length}</b> {mov.mudancas.length === 1 ? 'mudança' : 'mudanças'}.
                    {mov.saldo.experimentos !== 0 && <> O total de experimentos variou <b className="tabular-nums text-beon-ink">{sinal(mov.saldo.experimentos, String(Math.abs(mov.saldo.experimentos)))}</b>.</>}
                    {mov.saldo.iniciativas !== 0 && <> O de iniciativas, <b className="tabular-nums text-beon-ink">{sinal(mov.saldo.iniciativas, String(Math.abs(mov.saldo.iniciativas)))}</b>.</>}
                    {Math.abs(mov.saldo.beneficio) >= 1 && <> O benefício potencial variou <b className="tabular-nums text-beon-ink">{sinal(mov.saldo.beneficio, reais(Math.abs(mov.saldo.beneficio)))}</b>.</>}
                  </>
                )}
              </span>
            </p>
            {mov.mudancas.length > 0 && (
              <ul className="mt-3 divide-y divide-beon-line border-t border-beon-line">
                {mov.mudancas.slice(0, 60).map(m => (
                  <li key={`${m.tipo}-${m.key}`} className="flex flex-wrap items-baseline gap-x-2 py-1.5 text-[13px] text-beon-body">
                    <Chave k={m.key} jiraUrl={rel.jiraUrl} />
                    <span className="max-w-[320px] truncate" title={m.nome}>{m.nome}</span>
                    <span className="text-beon-muted">
                      {m.entidade === 'iniciativa' ? 'iniciativa · ' : ''}{VERBO[m.tipo]}
                      {m.tipo === 'entrou' && m.para ? ` (${m.para})` : m.tipo === 'saiu' && m.de ? ` (estava em ${m.de})` : m.de || m.para ? `: ${m.de} → ${m.para}` : ''}
                    </span>
                  </li>
                ))}
                {mov.mudancas.length > 60 && <li className="py-1.5 text-xs text-beon-muted">e mais {mov.mudancas.length - 60}</li>}
              </ul>
            )}
          </div>
        </Secao>
      )}

      {/* 5. Cadastro no Jira */}
      {rel.alertas.length > 0 && (
        <Secao titulo="Cadastro no Jira" descricao="Mesmo quando as telas batem, um cadastro incompleto ou fora do padrão distorce os números. Cada ponto diz por que importa; abra para ver o que fazer e os itens.">
          <div className="space-y-5">
            {(['corrigir', 'conferir', 'informativo'] as const).map(g => {
              const doGrupo = rel.alertas.filter(a => (a.gravidade ?? 'conferir') === g)
              if (!doGrupo.length) return null
              return (
                <div key={g}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-beon-ink">
                    <Selo cor={GRAVIDADE[g].cor}>{GRAVIDADE[g].titulo}</Selo><span className="text-xs font-normal text-beon-muted">{GRAVIDADE[g].explica}</span>
                  </p>
                  <div className="space-y-2">{doGrupo.map(a => <CartaoDeAlerta key={a.id} a={a} jiraUrl={rel.jiraUrl} />)}</div>
                </div>
              )
            })}
          </div>
        </Secao>
      )}

      {/* 6. Conferências que batem */}
      <Secao titulo={`Conferências que batem (${certas.length})`} descricao="O que o Auditor conferiu e confirmou. Abra uma conferência para ver como cada tela chega ao número.">
        <div className="space-y-2">
          {certas.map(v => (
            <details key={v.id} className="group rounded-2xl border border-beon-line bg-white">
              <summary className={cx('flex cursor-pointer items-start gap-3 px-4 py-3', focusRing)}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-beon-ink">{v.pergunta || v.titulo}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-beon-muted">{v.veredito}</span>
                </span>
                <span className="mt-0.5 shrink-0 text-xs text-beon-muted group-open:hidden">como conta</span>
              </summary>
              <div className="space-y-3 border-t border-beon-line px-4 py-3">
                <ComoCadaTelaConta v={v} />
                {v.porQueImporta && <p className="text-xs leading-relaxed text-beon-muted"><b className="font-semibold text-beon-body">Por que importa:</b> {v.porQueImporta}</p>}
              </div>
            </details>
          ))}
        </div>
      </Secao>

      {/* 7. Método */}
      <Secao titulo="Como o Auditor trabalha">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-beon-line bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-beon-ink"><Wrench className="h-4 w-4 text-beon-muted" aria-hidden />O que ele faz</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-beon-body">
              <li>Recalcula cada número com a mesma função que a tela usa. Não tem uma regra própria que possa divergir da tela.</li>
              <li>Compara item por item. Duas telas com o mesmo total, mas com experimentos diferentes, também são divergência.</li>
              <li>Confere a regra do app contra uma fonte independente: a coluna em que cada item está nos boards do Jira.</li>
              <li>Quando diverge, procura o que os itens divergentes têm em comum e os outros não têm (status, coluna, iniciativa-mãe). Só vira causa provável o que separa os dois grupos.</li>
              <li>Quando a maioria das visões concorda, aponta a que destoa. Com duas visões em desacordo, não aponta culpado.</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-beon-line bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-beon-ink"><ShieldAlert className="h-4 w-4 text-beon-muted" aria-hidden />O que ele não faz</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-beon-body">
              <li>Não diz qual tela está certa. Ele mostra a diferença e a causa provável; a regra de negócio é decisão do time.</li>
              <li>Não confere se o valor cadastrado no Jira é verdadeiro. Um benefício digitado errado passa; por isso ele avisa quando um experimento concentra o total.</li>
              <li>Não enxerga o que o Jira não devolve: issues arquivadas e itens fora dos dois boards ficam de fora.</li>
              <li>A causa é provável, não comprovada: é o padrão que melhor separa os itens divergentes do resto.</li>
            </ul>
          </div>
        </div>
      </Secao>
    </div>
  )
}
