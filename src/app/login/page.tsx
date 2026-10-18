'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Eye, EyeOff, FlaskConical, MessagesSquare } from 'lucide-react'
import { Button, cx, focusRing, inputClass } from '@/components/ui'
import { MIN_PASSWORD_LENGTH, passwordProblem } from '@/lib/auth/password-rules'

type Modo = 'entrar' | 'cadastro'

const DESTAQUES = [
  { icon: MessagesSquare, titulo: 'Comunidade', texto: 'Discussões, perguntas e experimentos compartilhados por quem está construindo.' },
  { icon: FlaskConical, titulo: 'Cientista', texto: 'Um chat inteligente para desenhar hipóteses e planejar experimentos.' },
  { icon: BookOpen, titulo: 'Pesquisas e futuro', texto: 'Acervo de pesquisas, sinais de mudança e a trilha de experimentação.' },
]

function Campo({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
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

function CampoSenha({ value, onChange, autoComplete, id }: { value: string; onChange: (v: string) => void; autoComplete: string; id?: string }) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visivel ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className={cx(inputClass, 'pr-11')}
      />
      <button
        type="button"
        onClick={() => setVisivel(v => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        className={cx('absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-beon-muted hover:text-beon-ink', focusRing)}
      >
        {visivel ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  )
}

function Entrar({ onCadastro }: { onCadastro: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [pendente, setPendente] = useState(false)
  const [loading, setLoading] = useState(false)

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
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoComplete="username"
          required
          autoFocus
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

      <Button type="submit" variant="primary" loading={loading} className="h-11 w-full text-[15px]">
        Entrar
      </Button>
      <p className="text-center text-sm text-beon-muted">
        Ainda não faz parte?{' '}
        <button type="button" onClick={onCadastro} className={cx('rounded font-semibold text-beon-red hover:text-beon-redhi', focusRing)}>
          Crie sua conta
        </button>
      </p>
    </form>
  )
}

function Cadastro({ onEntrar }: { onEntrar: () => void }) {
  const [form, setForm] = useState({ nome: '', email: '', area: '', motivo: '', password: '', confirmacao: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const set = (campo: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [campo]: v }))

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const problema = passwordProblem(form.password, form.email)
    if (problema || form.password !== form.confirmacao) {
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
      <div className="py-4 text-center" role="status">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-beon-ink">Pedido enviado!</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-beon-muted">
          A equipe beOn Labs vai revisar seu cadastro. Assim que for aprovado, você entra com o e-mail <strong className="font-medium text-beon-body">{form.email}</strong> e a senha que escolheu.
        </p>
        <Button variant="secondary" className="mt-6" onClick={onEntrar}>Voltar para entrar</Button>
      </div>
    )
  }

  return (
    <form onSubmit={cadastrar} className="space-y-3.5">
      <Campo label="Nome completo">
        <input value={form.nome} onChange={e => set('nome')(e.target.value)} autoComplete="name" required autoFocus className={inputClass} />
      </Campo>
      <Campo label="E-mail corporativo">
        <input type="email" value={form.email} onChange={e => set('email')(e.target.value)} autoComplete="email" required className={inputClass} placeholder="nome.sobrenome@claro.com.br" />
      </Campo>
      <Campo label="Área ou diretoria">
        <input value={form.area} onChange={e => set('area')(e.target.value)} autoComplete="organization-title" required className={inputClass} placeholder="Ex.: Tecnologia, Marketing, Rede" />
      </Campo>
      <Campo label="O que te traz à comunidade?" hint="opcional">
        <textarea value={form.motivo} onChange={e => set('motivo')(e.target.value)} rows={2} maxLength={500} className={cx(inputClass, 'resize-none')} />
      </Campo>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Campo label="Senha" hint={`mín. ${MIN_PASSWORD_LENGTH}`}>
          <CampoSenha value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Campo>
        <Campo label="Confirme a senha">
          <CampoSenha value={form.confirmacao} onChange={set('confirmacao')} autoComplete="new-password" />
        </Campo>
      </div>

      {erro && <p role="alert" className="text-sm font-medium text-beon-red">{erro}</p>}

      <Button type="submit" variant="primary" loading={loading} className="h-11 w-full text-[15px]">
        Pedir acesso <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
      <p className="text-center text-xs leading-relaxed text-beon-muted">
        Todo cadastro é revisado pela equipe beOn Labs. Você recebe acesso depois da aprovação.
      </p>
    </form>
  )
}

/**
 * Foto de fundo: uma imagem pública de pessoas colaborando (Unsplash License, uso livre). Pode ser trocada
 * por NEXT_PUBLIC_LOGIN_PHOTO_URL — por exemplo, uma foto do próprio time salva em public/.
 * Se a foto não carregar (rede corporativa, link fora do ar), fica só o fundo da marca.
 */
const FOTO_PADRAO = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80'
const FOTO = process.env.NEXT_PUBLIC_LOGIN_PHOTO_URL || FOTO_PADRAO

/** Fundo da marca: tons de vermelho e vinho, luz suave e trama de pontos. A foto entra por cima em duotone. */
function Fundo() {
  const [foto, setFoto] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const img = useRef<HTMLImageElement>(null)
  // A foto pode terminar de carregar antes da hidratação, quando onLoad ainda não está ligado.
  useEffect(() => {
    const el = img.current
    if (el?.complete) setFoto(el.naturalWidth > 0 ? 'ok' : 'erro')
  }, [])
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1F0503]" aria-hidden>
      <div className="absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-[#D31809] opacity-50 blur-[120px]" />
      <div className="absolute -bottom-56 right-[-10rem] h-[46rem] w-[46rem] rounded-full bg-[#F05A1A] opacity-35 blur-[140px]" />
      <div className="absolute left-1/3 top-1/2 h-[30rem] w-[30rem] rounded-full bg-[#7A0E06] opacity-60 blur-[110px]" />
      {foto !== 'erro' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={FOTO}
          alt=""
          referrerPolicy="no-referrer"
          onLoad={() => setFoto('ok')}
          onError={() => setFoto('erro')}
          className={cx(
            'absolute inset-0 h-full w-full object-cover grayscale transition-opacity duration-1000 mix-blend-luminosity',
            foto === 'ok' ? 'opacity-70' : 'opacity-0',
          )}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D31809]/45 via-[#8E1207]/35 to-[#2A0704]/60 mix-blend-multiply" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,5,3,.88)_0%,rgba(31,5,3,.7)_55%,rgba(31,5,3,.92)_100%)] lg:bg-[linear-gradient(90deg,rgba(31,5,3,.96)_0%,rgba(31,5,3,.9)_32%,rgba(31,5,3,.5)_58%,rgba(31,5,3,.12)_100%)]" />
      {foto === 'ok' && FOTO === FOTO_PADRAO && (
        <p className="absolute bottom-3 right-4 text-[10px] text-white/50">Foto: Unsplash</p>
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
    <div className="relative min-h-dvh overflow-hidden bg-[#1F0503] font-sans text-white antialiased">
      <Fundo />

      <div className="relative mx-auto flex min-h-dvh max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:flex-row lg:items-stretch lg:gap-10 lg:py-6">
        {/* Boas-vindas */}
        <section className="flex flex-1 flex-col lg:py-2">
          <div className="inline-flex w-fit items-center rounded-2xl bg-white px-4 py-2.5 shadow-lg shadow-black/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jira/logobeonlabs.png" alt="beOn Labs" className="h-9 w-auto sm:h-10" />
          </div>

          <div className="my-10 max-w-xl lg:my-auto">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#FFC9BB]">Comunidade beOn Labs · Claro</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Bem-vindo ao<br />beOn Labs
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
              A rede de quem experimenta tecnologias emergentes na Claro. Compartilhe o que está testando, aprenda com
              outros times e transforme ideias em experimentos.
            </p>
            <ul className="mt-8 hidden gap-4 sm:grid">
              {DESTAQUES.map(({ icon: Icon, titulo, texto }) => (
                <li key={titulo} className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{titulo}</span>
                    <span className="block text-sm text-white/75">{texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="hidden text-xs text-white/60 lg:block">beOn Labs · Inovação e experimentação · Claro Brasil</p>
        </section>

        {/* Entrar / criar conta */}
        <section aria-label="Acesso" className="w-full lg:w-[420px] lg:shrink-0">
          <div className="rounded-3xl bg-white p-6 text-beon-ink shadow-2xl shadow-black/30 sm:p-8">
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
            <h2 className="text-xl font-semibold tracking-tight">{modo === 'entrar' ? 'Que bom te ver por aqui' : 'Faça parte da comunidade'}</h2>
            <p className="mb-6 mt-1 text-sm text-beon-muted">
              {modo === 'entrar' ? 'Entre com sua conta beOn Labs.' : 'Conte quem você é. Um administrador aprova o seu acesso.'}
            </p>
            {modo === 'entrar' ? <Entrar onCadastro={() => setModo('cadastro')} /> : <Cadastro onEntrar={() => setModo('entrar')} />}
          </div>
          <p className="mt-4 text-center text-xs text-white/60 lg:hidden">beOn Labs · Claro Brasil</p>
        </section>
      </div>
    </div>
  )
}
