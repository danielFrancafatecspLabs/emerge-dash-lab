'use client'

// Login e pedido de cadastro. Layout dividido (padrão consagrado para telas de acesso): a foto e a mensagem
// à esquerda, o formulário num painel limpo à direita — nunca sobre a foto, para manter contraste e foco.
// "Entrar" é o padrão (quem volta é a maioria); criar conta fica a um clique, com o processo explicado.

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowRight, Check, CheckCircle2, Circle, Clock3, Eye, EyeOff, Info } from 'lucide-react'
import { Button, cx, focusRing, inputClass } from '@/components/ui'
import { MIN_PASSWORD_LENGTH, passwordProblem } from '@/lib/auth/password-rules'

type Modo = 'entrar' | 'cadastro'

/** Foto do login (pode ser trocada por NEXT_PUBLIC_LOGIN_PHOTO_URL). */
const FOTO = process.env.NEXT_PUBLIC_LOGIN_PHOTO_URL || '/jira/login-fundo.jpg'

/** Foco automático só em telas grandes: no celular, o teclado cobriria a página. */
function useFocoInicial<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) ref.current?.focus()
  }, [])
  return ref
}

function Campo({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-beon-ink">
        {label}
        {hint && <span className="text-xs font-normal text-beon-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

function CampoSenha({ value, onChange, autoComplete, describedBy }: {
  value: string; onChange: (v: string) => void; autoComplete: string; describedBy?: string
}) {
  const [visivel, setVisivel] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const verificarCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState('CapsLock'))
  return (
    <>
      <div className="relative">
        <input
          type={visivel ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyUp={verificarCaps}
          onKeyDown={verificarCaps}
          onBlur={() => setCapsLock(false)}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          required
          className={cx(inputClass, 'pr-11')}
        />
        <button
          type="button"
          onClick={() => setVisivel(v => !v)}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visivel}
          className={cx('absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-beon-muted hover:text-beon-ink', focusRing)}
        >
          {visivel ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      {capsLock && <p className="mt-1.5 text-xs font-medium text-amber-700" role="status">Caps Lock está ativado</p>}
    </>
  )
}

function Entrar({ onCadastro }: { onCadastro: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [pendente, setPendente] = useState(false)
  const [loading, setLoading] = useState(false)
  const foco = useFocoInicial<HTMLInputElement>()

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setPendente(false)
    setLoading(true)
    try {
      const res = await fetch('/jira/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        window.location.replace('/jira/comunidade')
        return
      }
      if (data.pendente) setPendente(true)
      else setErro(data.error ?? 'Não foi possível entrar')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <Campo label="E-mail ou usuário">
        <input
          ref={foco}
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          className={inputClass}
          placeholder="nome.sobrenome@claro.com.br"
        />
      </Campo>
      <Campo label="Senha">
        <CampoSenha value={password} onChange={setPassword} autoComplete="current-password" />
      </Campo>

      {pendente && (
        <div role="status" className="flex gap-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>Seu cadastro ainda está em análise. Você poderá entrar assim que um administrador aprovar o acesso.</p>
        </div>
      )}
      {erro && <p role="alert" className="text-sm font-medium text-beon-red">{erro}</p>}

      <Button type="submit" variant="primary" loading={loading} className="h-12 w-full text-[15px]">
        Entrar
      </Button>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-beon-muted">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
        Esqueceu a senha? Peça a um administrador do beOn Labs para redefini-la.
      </p>

      <div className="border-t border-beon-line pt-5 text-center text-sm text-beon-body">
        Ainda não faz parte?{' '}
        <button type="button" onClick={onCadastro} className={cx('rounded font-semibold text-beon-red hover:text-beon-redhi', focusRing)}>
          Pedir acesso à comunidade
        </button>
      </div>
    </form>
  )
}

/** As três etapas do cadastro, para a pessoa saber o que esperar antes de preencher. */
function EtapasCadastro() {
  const etapas = ['Você envia seus dados', 'Um admin aprova o acesso', 'Você entra com seu e-mail']
  return (
    <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Como funciona">
      {etapas.map((etapa, i) => (
        <li key={etapa} className="rounded-xl bg-beon-soft px-2.5 py-2 text-[11px] leading-snug text-beon-body">
          <span className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-beon-red ring-1 ring-beon-line">{i + 1}</span>
          {etapa}
        </li>
      ))}
    </ol>
  )
}

function Requisito({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={cx('flex items-center gap-1.5', ok ? 'text-emerald-700' : 'text-beon-muted')}>
      {ok ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
      {children}
      <span className="sr-only">{ok ? '(atendido)' : '(pendente)'}</span>
    </li>
  )
}

function Cadastro({ onEntrar }: { onEntrar: () => void }) {
  const [form, setForm] = useState({ nome: '', email: '', area: '', motivo: '', password: '', confirmacao: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const foco = useFocoInicial<HTMLInputElement>()
  const set = (campo: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [campo]: v }))

  const tamanhoOk = form.password.length >= MIN_PASSWORD_LENGTH
  const iguais = form.password.length > 0 && form.password === form.confirmacao

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const problema = passwordProblem(form.password, form.email)
    if (problema || !iguais) {
      setErro(problema ?? 'As senhas não conferem')
      return
    }
    setLoading(true)
    try {
      const { confirmacao: _, ...body } = form
      const res = await fetch('/jira/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setEnviado(true)
      else setErro(data.error ?? 'Não foi possível enviar o cadastro')
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="py-2 text-center" role="status">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-beon-ink">Pedido enviado!</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-beon-muted">
          A equipe beOn Labs vai revisar seu cadastro. Depois da aprovação, entre com <strong className="font-medium text-beon-body">{form.email}</strong> e a senha que você escolheu.
        </p>
        <Button variant="secondary" className="mt-6" onClick={onEntrar}>Voltar para entrar</Button>
      </div>
    )
  }

  return (
    <form onSubmit={cadastrar} className="space-y-3.5">
      <EtapasCadastro />
      <Campo label="Nome completo">
        <input ref={foco} value={form.nome} onChange={e => set('nome')(e.target.value)} autoComplete="name" required className={inputClass} />
      </Campo>
      <Campo label="E-mail corporativo">
        <input type="email" value={form.email} onChange={e => set('email')(e.target.value)} autoComplete="email" autoCapitalize="none" spellCheck={false} required className={inputClass} placeholder="nome.sobrenome@claro.com.br" />
      </Campo>
      <Campo label="Área ou diretoria">
        <input value={form.area} onChange={e => set('area')(e.target.value)} autoComplete="organization-title" required className={inputClass} placeholder="Ex.: Tecnologia, Marketing, Rede" />
      </Campo>
      <Campo label="O que te traz à comunidade?" hint="opcional">
        <textarea value={form.motivo} onChange={e => set('motivo')(e.target.value)} rows={2} maxLength={500} className={cx(inputClass, 'resize-none')} />
      </Campo>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Campo label="Senha">
          <CampoSenha value={form.password} onChange={set('password')} autoComplete="new-password" describedBy="requisitos-senha" />
        </Campo>
        <Campo label="Confirme a senha">
          <CampoSenha value={form.confirmacao} onChange={set('confirmacao')} autoComplete="new-password" describedBy="requisitos-senha" />
        </Campo>
      </div>
      <ul id="requisitos-senha" className="space-y-1 text-xs">
        <Requisito ok={tamanhoOk}>Pelo menos {MIN_PASSWORD_LENGTH} caracteres, sem partes do seu e-mail</Requisito>
        <Requisito ok={iguais}>As duas senhas são iguais</Requisito>
      </ul>

      {erro && <p role="alert" className="text-sm font-medium text-beon-red">{erro}</p>}

      <Button type="submit" variant="primary" loading={loading} className="h-12 w-full text-[15px]">
        Pedir acesso <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
      <div className="border-t border-beon-line pt-5 text-center text-sm text-beon-body">
        Já tem conta?{' '}
        <button type="button" onClick={onEntrar} className={cx('rounded font-semibold text-beon-red hover:text-beon-redhi', focusRing)}>
          Entrar
        </button>
      </div>
    </form>
  )
}

/** Mensagem de boas-vindas sobre a foto. */
function Mensagem({ compacta }: { compacta?: boolean }) {
  return (
    <div className={compacta ? '' : 'max-w-xl'}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80 sm:text-sm">Bem-vindo ao</p>
      <h1 className={cx('font-bold leading-[1.02] tracking-tight', compacta ? 'mt-1 text-4xl' : 'mt-2 text-6xl xl:text-7xl')}>beOn Labs</h1>
      <p className={cx('font-semibold leading-snug text-white', compacta ? 'mt-1.5 text-lg' : 'mt-3 text-2xl xl:text-[28px]')}>
        Comunidade de Experimentação da Claro
      </p>
      {!compacta && (
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
          Compartilhe o que está testando, aprenda com outros times e transforme ideias em experimentos — com
          o Cientista, pesquisas e sinais do futuro ao seu lado.
        </p>
      )}
    </div>
  )
}

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>('entrar')

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('modo') === 'cadastro') setModo('cadastro')
  }, [])

  return (
    <div className="min-h-dvh bg-white font-sans text-beon-ink antialiased lg:flex">
      {/* Foto e mensagem */}
      <section className="relative h-[34dvh] min-h-[240px] overflow-hidden bg-[#2A1A12] text-white lg:sticky lg:top-0 lg:h-dvh lg:flex-1" aria-label="beOn Labs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FOTO} alt="Pessoas abraçadas lado a lado ao ar livre, sorrindo" className="absolute inset-0 h-full w-full object-cover object-[50%_30%] lg:object-[38%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" aria-hidden />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-black/35 to-transparent lg:block" aria-hidden />

        <div className="relative flex h-full flex-col justify-between p-5 sm:p-8 lg:p-12">
          <span className="inline-flex w-fit items-center rounded-2xl bg-white/95 px-3.5 py-2 shadow-lg shadow-black/20 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-7 w-auto" />
          </span>
          <span className="hidden lg:block" />
          <div className="lg:hidden"><Mensagem compacta /></div>
          <div className="hidden lg:block"><Mensagem /></div>
        </div>
      </section>

      {/* Acesso */}
      <main className="relative -mt-5 rounded-t-3xl bg-white px-5 pb-8 pt-7 sm:px-8 lg:mt-0 lg:flex lg:min-h-dvh lg:w-[min(520px,42vw)] lg:shrink-0 lg:flex-col lg:rounded-none lg:px-14 lg:py-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="hidden h-10 w-auto self-start lg:block" />

        <div className="mx-auto w-full max-w-[400px] lg:my-auto lg:py-8">
          <h2 className="text-2xl font-semibold tracking-tight">{modo === 'entrar' ? 'Entre na comunidade' : 'Peça seu acesso'}</h2>
          <p className="mb-6 mt-1.5 text-sm text-beon-muted">
            {modo === 'entrar' ? 'Use o e-mail ou usuário da sua conta beOn Labs.' : 'Todo cadastro é revisado pela equipe beOn Labs.'}
          </p>

          <div role="tablist" aria-label="Acesso" className="mb-6 grid grid-cols-2 rounded-full bg-beon-soft p-1">
            {([['entrar', 'Entrar'], ['cadastro', 'Criar conta']] as const).map(([valor, label]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={modo === valor}
                onClick={() => setModo(valor)}
                className={cx(
                  'h-9 rounded-full text-sm font-semibold transition-colors',
                  modo === valor ? 'bg-white text-beon-ink shadow-sm' : 'text-beon-muted hover:text-beon-ink',
                  focusRing,
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {modo === 'entrar' ? <Entrar onCadastro={() => setModo('cadastro')} /> : <Cadastro onEntrar={() => setModo('entrar')} />}
        </div>

        <p className="mt-8 text-center text-xs text-beon-muted lg:mt-0 lg:text-left">beOn Labs · Inovação e experimentação · Claro Brasil</p>
      </main>
    </div>
  )
}
