'use client'

// Design system do beOn Radar: a identidade de cada seção (cor, fundo suave, ícone e por que acompanhar) e as peças que
// a repetem em todo lugar (selo, imagem da notícia, metadados), para a página inteira falar a mesma língua visual.

import { useState } from 'react'
import { Flame, Globe2, LineChart, Atom, type LucideIcon } from 'lucide-react'
import { SECOES, idiomaDe, type Noticia, type Secao } from '@/lib/newsletter/edicao'
import { tempoRelativo } from '@/components/comunidade/format'
import { CoverArt, type CoverPattern } from '@/components/comunidade/visuals'
import { cx } from '@/components/ui'

export interface IdentidadeDaSecao {
  nome: string
  cor: string
  suave: string
  icone: LucideIcon
  porQue: string
  tone: 'red' | 'sky' | 'amber' | 'teal'
  pattern: CoverPattern
}

const BASE: Record<Secao, Omit<IdentidadeDaSecao, 'nome'>> = {
  emergentes: { cor: '#D31809', suave: '#FDF1F0', icone: Atom, tone: 'red', pattern: 'constelacao', porQue: 'O que pode virar produto, serviço ou ameaça nos próximos anos.' },
  mercado: { cor: '#2F6FB3', suave: '#EEF4FB', icone: LineChart, tone: 'sky', pattern: 'dados', porQue: 'Para onde o dinheiro está indo: quem cresce, quem capta, quem vale mais.' },
  bolhas: { cor: '#b45309', suave: '#FEF6E7', icone: Flame, tone: 'amber', pattern: 'orbita', porQue: 'Sinais de euforia ou de excesso que pedem cautela antes de apostar.' },
  impactos: { cor: '#0f766e', suave: '#EAF6F4', icone: Globe2, tone: 'teal', pattern: 'ondas', porQue: 'O efeito da tecnologia no trabalho, nas regras, na energia e na sociedade.' },
}

export const IDENTIDADE = Object.fromEntries(SECOES.map(s => [s.id, { ...BASE[s.id], nome: s.nome }])) as Record<Secao, IdentidadeDaSecao>

/** Ícone da seção num quadrado com a cor dela. */
export function IconeDaSecao({ secao, tamanho = 'md', claro }: { secao: Secao; tamanho?: 'sm' | 'md' | 'lg'; claro?: boolean }) {
  const id = IDENTIDADE[secao]
  const I = id.icone
  const caixa = tamanho === 'sm' ? 'h-7 w-7 rounded-lg' : tamanho === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-9 w-9 rounded-xl'
  const icone = tamanho === 'sm' ? 'h-3.5 w-3.5' : tamanho === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <span className={cx('flex shrink-0 items-center justify-center', caixa)} style={{ background: claro ? 'rgba(255,255,255,0.16)' : id.cor, color: '#fff' }} aria-hidden>
      <I className={icone} />
    </span>
  )
}

/** Selo da seção (sobre imagem: versão clara, com vidro). */
export function SeloDaSecao({ secao, sobreImagem }: { secao: Secao; sobreImagem?: boolean }) {
  const id = IDENTIDADE[secao]
  const I = id.icone
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]',
      sobreImagem ? 'bg-black/45 text-white backdrop-blur-md' : '')}
      style={sobreImagem ? undefined : { background: id.suave, color: id.cor }}>
      <I className="h-3 w-3" aria-hidden />{id.nome}
    </span>
  )
}

/** Foto da notícia; sem foto (ou se ela falhar), a capa ilustrada da seção. */
export function ImagemDaNoticia({ n, className }: { n: Noticia; className?: string }) {
  const [falhou, setFalhou] = useState(false)
  const id = IDENTIDADE[n.secao]
  if (!n.imagem || falhou) return <CoverArt seed={n.id} pattern={id.pattern} tone={id.tone} className={cx('h-full w-full', className)} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={n.imagem} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)} className={cx('h-full w-full object-cover', className)} />
}

export const idiomaDaNoticia = (n: Noticia) => idiomaDe(`${n.titulo} ${n.resumo}`)

/** Fonte · há quanto tempo · idioma (EN aparece em destaque, para não pegar ninguém de surpresa). */
export function MetaDaNoticia({ n, claro }: { n: Noticia; claro?: boolean }) {
  const en = idiomaDaNoticia(n) === 'en'
  return (
    <p className={cx('flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs', claro ? 'text-white/75' : 'text-beon-muted')}>
      <span className={cx('truncate font-semibold', claro ? 'text-white' : 'text-beon-body')}>{n.fonte}</span>
      {n.publicadoEm && <><span aria-hidden>·</span><span className="whitespace-nowrap">{tempoRelativo(n.publicadoEm)}</span></>}
      {en && <span className={cx('rounded px-1 py-px text-[10px] font-bold', claro ? 'bg-white/20 text-white' : 'bg-beon-soft text-beon-body')} title="Notícia em inglês">EN</span>}
    </p>
  )
}
