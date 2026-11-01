// Sobre: o que é o beOn Labs, o que a Comunidade reúne, desde quando ela existe e quem a criou.

import Link from 'next/link'
import {
  ArrowRight, Beaker, BookOpen, FlaskConical, GitFork, Lightbulb, Mail, MessagesSquare, Newspaper, Radar, Route, Sparkles, type LucideIcon,
} from 'lucide-react'
import { CONTATOS_DO_JIRA } from '@/lib/jira-contatos'

export const metadata = { title: 'Sobre · beOn Labs' }

const AREAS: { titulo: string; texto: string; href: string; icone: LucideIcon }[] = [
  { titulo: 'Trilha de Experimentação', texto: 'O método e as boas práticas para tirar uma ideia do papel e testar do jeito certo.', href: '/comunidade/trilha', icone: Route },
  { titulo: 'Experimentos ativos', texto: 'O que está em teste agora, com fase, sponsor, ficha e relatório.', href: '/comunidade/experimentos-ativos', icone: Beaker },
  { titulo: 'Future Thinking', texto: 'Sinais de futuro e tendências: proponha um sinal e explore o catálogo.', href: '/comunidade/future-thinking', icone: Lightbulb },
  { titulo: 'Radar OSINT', texto: 'Os sinais que a varredura de fontes abertas encontra pelo mundo.', href: '/osint', icone: Radar },
  { titulo: 'beOn Radar', texto: 'A newsletter diária de tecnologias emergentes, mercado e Vale do Silício.', href: '/comunidade/newsletter', icone: Newspaper },
  { titulo: 'Acervo de Pesquisas', texto: 'As pesquisas do Lab, com os conceitos e papers por trás de cada uma.', href: '/comunidade/pesquisas', icone: BookOpen },
  { titulo: 'Cientista', texto: 'Um assistente para tirar dúvidas sobre experimentação e o portfólio do Lab.', href: '/comunidade/cientista', icone: FlaskConical },
  { titulo: 'World Open Source', texto: 'Ferramentas e repositórios abertos que a comunidade recomenda.', href: '/comunidade/open-source', icone: GitFork },
  { titulo: 'Fórum da Comunidade', texto: 'Perguntas, descobertas e discussões com quem experimenta na Claro.', href: '/comunidade', icone: MessagesSquare },
]

const CRIADORES: { nome: string; papel: string; texto: string; temas: string[]; cor: string }[] = [
  {
    nome: 'Daniel França Leite',
    papel: 'Experimentação, trilhas e indicadores',
    texto: 'Responsável pelo processo de experimentação, pelas trilhas e pelos indicadores do beOn Labs. Também é desenvolvedor full stack da plataforma.',
    temas: ['Experimentação', 'Trilhas', 'Indicadores', 'Full stack'],
    cor: 'from-[#F0321F] to-[#9E1006]',
  },
  {
    nome: 'Matheus Moura',
    papel: 'IA e desenvolvimento full stack',
    texto: 'Especialista em IA e desenvolvedor full stack da plataforma.',
    temas: ['Inteligência artificial', 'Full stack'],
    cor: 'from-stone-700 to-stone-950',
  },
  {
    nome: 'Pedro Porfírio Vieira',
    papel: 'Front-end e desenvolvimento full stack',
    texto: 'Desenvolvedor full stack e responsável pelo front-end da plataforma.',
    temas: ['Front-end', 'Full stack'],
    cor: 'from-sky-600 to-sky-900',
  },
  {
    nome: 'Anton Vlasov',
    papel: 'Future Thinking',
    texto: 'Responsável pelo Future Thinking: sinais, tendências e reportes.',
    temas: ['Future Thinking', 'Sinais', 'Tendências', 'Reportes'],
    cor: 'from-teal-600 to-teal-900',
  },
]

const iniciais = (nome: string) => nome.split(' ').filter(Boolean).map(p => p[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase()
const foco = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beon-red/60 focus-visible:ring-offset-2'

export default function SobrePage() {
  const contato = CONTATOS_DO_JIRA[0]
  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6">
      {/* Abertura */}
      <section className="relative overflow-hidden rounded-[32px] border border-beon-line bg-white px-6 py-10 sm:px-12 sm:py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-beon-tint blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -right-6 top-10 hidden h-48 w-48 rounded-full border-[16px] border-beon-tint lg:block" aria-hidden />
        <p className="relative inline-flex items-center gap-2 rounded-full bg-beon-tint px-3 py-1 text-[12px] font-bold uppercase tracking-[0.14em] text-beon-red">
          <Sparkles className="h-4 w-4" aria-hidden />Sobre
        </p>
        <h1 className="relative mt-4 text-[40px] font-extrabold leading-[1.02] tracking-tight text-beon-ink sm:text-[60px]">
          beOn Labs<span className="text-beon-red">.</span>
        </h1>
        <p className="relative mt-5 max-w-3xl text-[18px] leading-relaxed text-beon-body sm:text-[21px]">
          Esta é uma comunidade <strong className="font-bold text-beon-ink">aberta a todos os interessados da corporação Claro Brasil</strong>. Aqui você tem
          acesso a tudo o que o beOn Labs, a área e a comunidade de experimentação da Claro, está desenvolvendo: experimentação, boas práticas,
          indicadores, futuros, sinais, newsletter e muito mais.
        </p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Link href="/comunidade" className={`inline-flex h-12 items-center gap-2 rounded-full bg-beon-ink px-6 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 ${foco}`}>
            Ir para a Comunidade<ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/comunidade/trilha" className={`inline-flex h-12 items-center gap-2 rounded-full border border-beon-line bg-white px-6 text-sm font-bold text-beon-ink hover:bg-beon-soft ${foco}`}>
            Começar pela Trilha de Experimentação
          </Link>
        </div>
      </section>

      {/* Desde quando */}
      <section aria-labelledby="t-historia" className="mt-6 grid gap-6 rounded-[28px] border border-beon-line bg-white p-6 sm:p-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-beon-muted">No ar desde</p>
          <p className="mt-1 text-[44px] font-extrabold leading-none tracking-tight text-beon-red sm:text-[56px]">junho<span className="text-beon-ink"> de 2025</span></p>
        </div>
        <div>
          <h2 id="t-historia" className="text-xl font-extrabold tracking-tight text-beon-ink sm:text-2xl">Uma iniciativa viva, que melhora a cada versão</h2>
          <p className="mt-2 text-[16px] leading-relaxed text-beon-body">
            A comunidade se tornou ativa em junho de 2025 e, desde então, vem sendo melhorada em várias versões pelos criadores citados abaixo, sempre
            a partir do que a comunidade usa e pede.
          </p>
          <ol className="mt-5 flex items-center gap-2 text-[12px] font-semibold text-beon-body">
            <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-beon-red" aria-hidden />Junho de 2025: no ar</li>
            <li aria-hidden className="h-[2px] flex-1 rounded-full bg-gradient-to-r from-beon-red to-beon-line" />
            <li className="flex items-center gap-2"><span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" aria-hidden />Hoje: em evolução</li>
          </ol>
        </div>
      </section>

      {/* O que tem aqui */}
      <section aria-labelledby="t-areas" className="mt-12">
        <h2 id="t-areas" className="text-[26px] font-extrabold tracking-tight text-beon-ink sm:text-[32px]">O que você encontra aqui</h2>
        <p className="mt-1 text-[15px] text-beon-muted">Tudo aberto para quem é da Claro Brasil. Escolha por onde começar.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map(({ titulo, texto, href, icone: Icone }) => (
            <li key={href}>
              <Link href={href}
                className={`group flex h-full flex-col rounded-3xl border border-beon-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-beon-red/30 hover:shadow-lg ${foco}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-beon-tint text-beon-red"><Icone className="h-5 w-5" aria-hidden /></span>
                <span className="mt-4 text-[17px] font-bold text-beon-ink group-hover:text-beon-red">{titulo}</span>
                <span className="mt-1 flex-1 text-sm leading-relaxed text-beon-body">{texto}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-beon-red">Abrir<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Criadores */}
      <section aria-labelledby="t-criadores" className="mt-14">
        <h2 id="t-criadores" className="text-[26px] font-extrabold tracking-tight text-beon-ink sm:text-[32px]">Quem criou</h2>
        <p className="mt-1 text-[15px] text-beon-muted">As pessoas por trás da plataforma e da comunidade.</p>
        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {CRIADORES.map(c => (
            <li key={c.nome} className="flex gap-5 rounded-[28px] border border-beon-line bg-white p-6 sm:p-7">
              <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-extrabold text-white shadow-md ${c.cor}`} aria-hidden>
                {iniciais(c.nome)}
              </span>
              <div className="min-w-0">
                <p className="text-xl font-extrabold tracking-tight text-beon-ink">{c.nome}</p>
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-beon-red">{c.papel}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-beon-body">{c.texto}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {c.temas.map(t => <li key={t} className="rounded-full bg-beon-soft px-2.5 py-1 text-xs font-semibold text-beon-body">{t}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Contato */}
      <section className="mt-12 flex flex-col items-start justify-between gap-5 rounded-[28px] bg-beon-ink px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10">
        <div>
          <p className="text-xl font-extrabold tracking-tight sm:text-2xl">Quer sugerir algo ou levar um experimento para o Lab?</p>
          <p className="mt-1 text-sm text-white/75">Fale com {contato.nome}.</p>
        </div>
        <a href={`mailto:${contato.email}?subject=${encodeURIComponent('Comunidade beOn Labs')}`}
          className={`inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-beon-ink hover:bg-white/90 ${foco}`}>
          <Mail className="h-4 w-4 text-beon-red" aria-hidden />{contato.email}
        </a>
      </section>
    </div>
  )
}
