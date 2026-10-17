'use client'

// Boas-vindas no primeiro acesso: propósito, interesses (opcionais) e um convite simples para começar.
// Pode ser pulado a qualquer momento; os interesses podem ser ajustados depois no perfil.

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, FlaskConical, MessagesSquare, Route, Sparkles } from 'lucide-react'
import { COMMUNITY_TOPICS } from '@/lib/community/topics'
import { useCommunity } from './CommunityProvider'
import { primeiroNome } from './format'
import { Avatar, Button, Chip, Dialog, cx, focusRing } from './ui'
import { topicIcon } from './visuals'

export function Onboarding() {
  const { me, members, patchProfile, openComposer } = useCommunity()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [interesses, setInteresses] = useState<string[]>([])

  useEffect(() => {
    if (me && !me.profile.onboardedAt) { setOpen(true); setInteresses(me.profile.interesses) }
  }, [me])

  const sugestoes = useMemo(() => {
    if (!me || interesses.length === 0) return []
    return (members.data ?? [])
      .filter(m => m.username !== me.username && m.interesses.some(i => interesses.includes(i)))
      .slice(0, 4)
  }, [members.data, interesses, me])

  if (!me) return null

  async function concluir(depois?: () => void) {
    setOpen(false)
    await patchProfile({ concluirOnboarding: true, interesses }, p => ({ ...p, onboardedAt: new Date().toISOString(), interesses }))
    depois?.()
  }

  const toggle = (id: string) => setInteresses(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
  const nome = primeiroNome(me.nome)

  return (
    <Dialog open={open} onClose={() => concluir()} title={step === 0 ? `Boas-vindas, ${nome}!` : step === 1 ? 'O que te interessa?' : 'Por onde começar'} size="lg"
      description={`Passo ${step + 1} de 3`}>
      {step === 0 && (
        <div className="space-y-5">
          <p className="text-[15px] leading-relaxed text-comm-body">
            A Comunidade beOn Labs é onde laboratórios, especialistas e áreas de negócio da Claro trocam descobertas,
            discutem tecnologias emergentes e aprendem a experimentar com método.
          </p>
          <ul className="space-y-3">
            {[
              [MessagesSquare, 'Converse e pergunte', 'Discussões, perguntas e mensagens diretas com quem entende do assunto.'],
              [Sparkles, 'Descubra o que vem por aí', 'Pesquisas, sinais de futuro e experimentos compartilhados pela comunidade.'],
              [FlaskConical, 'Experimente com método', 'Uma trilha prática, do problema ao aprendizado registrado.'],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof MessagesSquare
              return (
                <li key={t as string} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-comm-tint text-comm-red"><I className="h-4 w-4" aria-hidden /></span>
                  <span><strong className="block text-sm font-semibold text-comm-ink">{t as string}</strong><span className="text-sm text-comm-muted">{d as string}</span></span>
                </li>
              )
            })}
          </ul>
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={() => concluir()}>Explorar agora</Button>
            <Button variant="primary" onClick={() => setStep(1)}>Personalizar <ArrowRight className="h-4 w-4" aria-hidden /></Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-comm-muted">Escolha alguns temas para o feed “Para você”. Você pode mudar quando quiser.</p>
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_TOPICS.map(t => {
              const Icon = topicIcon(t.id)
              return <Chip key={t.id} selected={interesses.includes(t.id)} onClick={() => toggle(t.id)}><Icon className="h-3.5 w-3.5" aria-hidden /> {t.label}</Chip>
            })}
          </div>
          {sugestoes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-comm-ink">Pessoas com interesses parecidos</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {sugestoes.map(m => (
                  <li key={m.username} className="flex items-center gap-2.5 rounded-xl border border-comm-line px-3 py-2">
                    <Avatar nome={m.nome} src={m.avatar} size={32} />
                    <span className="min-w-0"><span className="block truncate text-sm font-medium">{m.nome}</span><span className="block truncate text-xs text-comm-muted">{m.especialidade || m.laboratorio}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(0)}>Voltar</Button>
            <Button variant="primary" onClick={() => setStep(2)}>Continuar <ArrowRight className="h-4 w-4" aria-hidden /></Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <button type="button" onClick={() => concluir(() => openComposer({
            kind: 'discussao', title: 'Olá, comunidade!', tags: interesses.slice(0, 3),
            content: `Oi, pessoal! Sou ${me.nome}${me.laboratorio ? `, do ${me.laboratorio}` : ''}. Tenho interesse em … e gostaria de trocar ideias sobre …`,
          }))}
            className={cx('flex w-full items-center gap-4 rounded-2xl border border-comm-line p-4 text-left hover:border-comm-red/40 hover:bg-comm-tint/40', focusRing)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-comm-red text-white"><MessagesSquare className="h-5 w-5" aria-hidden /></span>
            <span className="flex-1"><strong className="block text-[15px] font-semibold">Apresente-se em uma frase</strong><span className="text-sm text-comm-muted">A forma mais simples de fazer a primeira contribuição.</span></span>
            <ArrowRight className="h-4 w-4 text-comm-muted" aria-hidden />
          </button>
          <Link href="/comunidade/trilha" onClick={() => concluir()}
            className={cx('flex w-full items-center gap-4 rounded-2xl border border-comm-line p-4 hover:border-comm-red/40 hover:bg-comm-tint/40', focusRing)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-comm-tint text-comm-red"><Route className="h-5 w-5" aria-hidden /></span>
            <span className="flex-1"><strong className="block text-[15px] font-semibold">Conheça a Trilha de Experimentação</strong><span className="text-sm text-comm-muted">Oito etapas, do problema ao aprendizado compartilhado.</span></span>
            <ArrowRight className="h-4 w-4 text-comm-muted" aria-hidden />
          </Link>
          <div className="flex justify-between gap-2 pt-3">
            <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
            <Button variant="primary" onClick={() => concluir()}>Explorar a comunidade</Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
