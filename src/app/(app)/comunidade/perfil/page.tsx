'use client'

// Meu perfil: foto, dados da conta (nome, e-mail, área, laboratório), o que aparece para a comunidade (especialidade,
// cargo, bio) e a troca de senha.

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Camera, Check, ExternalLink, KeyRound, PenLine, Trash2, UserRound } from 'lucide-react'
import { ROLE_LABEL } from '@/lib/auth/client'
import { LABORATORIOS } from '@/lib/auth/laboratorios'
import { COMMUNITY_TOPICS } from '@/lib/community/topics'
import { MIN_PASSWORD_LENGTH, passwordProblem } from '@/lib/auth/password-rules'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { EditorDeFoto } from '@/components/comunidade/EditorDeFoto'
import { PageHeader } from '@/components/comunidade/Page'
import { api, errorMessage } from '@/components/comunidade/api'
import { topicIcon } from '@/components/comunidade/visuals'
import { Avatar, Button, Skeleton, cx, focusRing, inputClass } from '@/components/ui'

const BIO_MAX = 400

function Campo({ label, dica, children, htmlFor }: { label: string; dica?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-beon-ink">{label}</label>
      {children}
      {dica && <p className="mt-1 text-xs text-beon-muted">{dica}</p>}
    </div>
  )
}

function Cartao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-beon-line bg-white">
      <header className="border-b border-beon-line px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold tracking-tight text-beon-ink">{titulo}</h2>
        {descricao && <p className="mt-0.5 text-sm text-beon-muted">{descricao}</p>}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  )
}

function TrocarSenha({ username }: { username: string }) {
  const { toast } = useCommunity()
  const [f, setF] = useState({ atual: '', nova: '', confirma: '' })
  const [enviando, setEnviando] = useState(false)
  const problema = f.nova ? passwordProblem(f.nova, username) : null
  const diferente = f.confirma && f.confirma !== f.nova
  const pode = f.atual && f.nova && !problema && !diferente

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!pode) return
    setEnviando(true)
    try {
      await api('/community/me/conta', { method: 'PATCH', json: { senha: { atual: f.atual, nova: f.nova } } })
      setF({ atual: '', nova: '', confirma: '' })
      toast('Senha alterada.')
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Cartao titulo="Segurança" descricao="Troque sua senha de acesso. Você continua conectado neste dispositivo.">
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-3">
        <Campo label="Senha atual" htmlFor="senha-atual">
          <input id="senha-atual" type="password" autoComplete="current-password" className={inputClass} value={f.atual} onChange={e => setF({ ...f, atual: e.target.value })} />
        </Campo>
        <Campo label="Nova senha" htmlFor="senha-nova" dica={problema ?? `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres, nada óbvio.`}>
          <input id="senha-nova" type="password" autoComplete="new-password" aria-invalid={!!problema} className={cx(inputClass, problema && 'border-red-300')} value={f.nova} onChange={e => setF({ ...f, nova: e.target.value })} />
        </Campo>
        <Campo label="Confirme a nova senha" htmlFor="senha-confirma" dica={diferente ? 'As senhas não conferem.' : undefined}>
          <input id="senha-confirma" type="password" autoComplete="new-password" aria-invalid={!!diferente} className={cx(inputClass, diferente && 'border-red-300')} value={f.confirma} onChange={e => setF({ ...f, confirma: e.target.value })} />
        </Campo>
        <div className="sm:col-span-3">
          <Button type="submit" variant="primary" icon={KeyRound} disabled={!pode} loading={enviando}>Trocar senha</Button>
        </div>
      </form>
    </Cartao>
  )
}

export default function MeuPerfilPage() {
  const { me, patchProfile, reloadMe, reloadMembers, toast } = useCommunity()
  const [form, setForm] = useState({ nome: '', email: '', area: '', laboratorio: '', especialidade: '', cargo: '', bio: '', interesses: [] as string[] })
  const [salvando, setSalvando] = useState(false)
  const [editor, setEditor] = useState<'nova' | 'editar' | null>(null)

  const inicial = useMemo(() => me && {
    nome: me.nome, email: me.email, area: me.area, laboratorio: me.laboratorio,
    especialidade: me.profile.especialidade, cargo: me.profile.cargo, bio: me.profile.bio, interesses: me.profile.interesses,
  }, [me])
  // Preenche o formulário uma vez: atualizações posteriores de `me` não apagam o que a pessoa está editando.
  const [pronto, setPronto] = useState(false)
  useEffect(() => { if (inicial && !pronto) { setForm(inicial); setPronto(true) } }, [inicial, pronto])

  if (!me || !inicial) {
    return <div className="mx-auto max-w-[960px] space-y-4 px-4 py-8 sm:px-6"><Skeleton className="h-10 w-60" /><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
  }

  const mudou = (Object.keys(form) as (keyof typeof form)[]).some(k => String(form[k]) !== String(inicial[k]))
  const labValido = (LABORATORIOS as readonly string[]).includes(form.laboratorio)
  const set = (k: Exclude<keyof typeof form, 'interesses'>) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [k]: e.target.value }))
  const alternarInteresse = (id: string) => setForm(f => ({ ...f, interesses: f.interesses.includes(id) ? f.interesses.filter(x => x !== id) : [...f.interesses, id] }))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!mudou || !inicial) return
    setSalvando(true)
    try {
      const conta: Record<string, string> = {}
      for (const k of ['nome', 'email', 'area', 'laboratorio'] as const) if (form[k] !== inicial[k]) conta[k] = form[k]
      if (Object.keys(conta).length) await api('/community/me/conta', { method: 'PATCH', json: conta })
      const social = { especialidade: form.especialidade, cargo: form.cargo, bio: form.bio, interesses: form.interesses }
      if (social.especialidade !== inicial.especialidade || social.cargo !== inicial.cargo || social.bio !== inicial.bio || String(social.interesses) !== String(inicial.interesses)) {
        if (!await patchProfile(social)) return
      }
      reloadMe()
      reloadMembers()
      toast('Perfil atualizado.')
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setSalvando(false)
    }
  }

  async function enviarFoto(imagem: string) {
    try {
      await api('/community/me/foto', { method: 'POST', json: { imagem } })
      setEditor(null)
      reloadMe()
      reloadMembers()
      toast('Foto atualizada.')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  async function removerFoto() {
    try {
      await api('/community/me/foto', { method: 'DELETE' })
      reloadMe()
      reloadMembers()
      toast('Foto removida.')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-[1040px] pb-10">
      <PageHeader eyebrow="Comunidade" title="Meu perfil"
        description="Seus dados de acesso e o que a comunidade vê sobre você."
        action={<Link href={`/comunidade/pessoas/${encodeURIComponent(me.username)}`} className={cx('inline-flex h-10 items-center gap-2 rounded-full border border-beon-line bg-white px-4 text-sm font-medium text-beon-ink hover:bg-beon-soft', focusRing)}>
          <ExternalLink className="h-4 w-4" aria-hidden /> Ver como a comunidade me vê
        </Link>} />

      <div className="grid gap-6 px-4 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Cartão de identidade */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-beon-line bg-white">
            <div className="h-20 bg-gradient-to-br from-beon-red via-[#e04a3c] to-[#f2a196]" aria-hidden />
            <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
              <div className="relative">
                <div className="rounded-full bg-white p-1"><Avatar nome={me.nome} src={me.avatar} size={96} /></div>
                <button type="button" onClick={() => setEditor('nova')} aria-label="Trocar foto" title="Trocar foto"
                  className={cx('absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-beon-ink text-white hover:bg-beon-red', focusRing)}>
                  <Camera className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="mt-3 text-lg font-semibold tracking-tight text-beon-ink">{me.nome}</p>
              <p className="text-sm text-beon-muted">{me.profile.especialidade || ROLE_LABEL[me.role]}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {me.laboratorio && <span className="rounded-full bg-beon-tint px-2.5 py-0.5 text-xs font-medium text-beon-red">{me.laboratorio}</span>}
                {me.area && <span className="rounded-full bg-beon-soft px-2.5 py-0.5 text-xs font-medium text-beon-body">{me.area}</span>}
              </div>
              <div className="mt-4 flex w-full flex-col gap-2">
                <Button icon={Camera} onClick={() => setEditor('nova')}>{me.avatar ? 'Trocar foto' : 'Colocar foto'}</Button>
                {me.avatar && (
                  <div className="flex gap-2">
                    <Button className="flex-1" icon={PenLine} onClick={() => setEditor('editar')}>Editar</Button>
                    <Button className="flex-1" variant="ghost" icon={Trash2} onClick={removerFoto}>Remover</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <form onSubmit={salvar}>
            <Cartao titulo="Seus dados" descricao="Nome, contato e onde você atua.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Nome completo" htmlFor="p-nome">
                  <input id="p-nome" className={inputClass} value={form.nome} onChange={set('nome')} autoComplete="name" required minLength={3} maxLength={120} />
                </Campo>
                <Campo label="E-mail" htmlFor="p-email" dica="Também serve para entrar na plataforma.">
                  <input id="p-email" type="email" className={inputClass} value={form.email} onChange={set('email')} autoComplete="email" maxLength={120} />
                </Campo>
                <Campo label="Área" htmlFor="p-area" dica="Sua área ou diretoria.">
                  <input id="p-area" className={inputClass} value={form.area} onChange={set('area')} maxLength={120} placeholder="Ex.: Diretoria de Rede" />
                </Campo>
                <Campo label="Cargo" htmlFor="p-cargo">
                  <input id="p-cargo" className={inputClass} value={form.cargo} onChange={set('cargo')} maxLength={80} placeholder="Ex.: Engenheira de dados" />
                </Campo>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-1.5 block text-sm font-medium text-beon-ink">Laboratório</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {LABORATORIOS.map(lab => {
                      const sel = form.laboratorio === lab
                      return (
                        <button key={lab} type="button" aria-pressed={sel} onClick={() => setForm(f => ({ ...f, laboratorio: lab }))}
                          className={cx('flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-colors', focusRing,
                            sel ? 'border-beon-red bg-beon-tint text-beon-red' : 'border-beon-line bg-white text-beon-body hover:border-beon-muted/50 hover:text-beon-ink')}>
                          {sel && <Check className="h-4 w-4" aria-hidden />}{lab}
                        </button>
                      )
                    })}
                  </div>
                  {!labValido && <p className="mt-1 text-xs text-beon-muted">{form.laboratorio ? `"${form.laboratorio}" não é mais uma opção: escolha um dos laboratórios.` : 'Escolha seu laboratório.'}</p>}
                </fieldset>
                <Campo label="Especialidade" htmlFor="p-especialidade" dica="Aparece abaixo do seu nome nas publicações.">
                  <input id="p-especialidade" className={cx(inputClass)} value={form.especialidade} onChange={set('especialidade')} maxLength={80} placeholder="Ex.: Visão computacional" />
                </Campo>
                <div className="sm:col-span-2">
                  <Campo label="Bio" htmlFor="p-bio">
                    <textarea id="p-bio" rows={4} className={cx(inputClass, 'resize-y')} value={form.bio} onChange={set('bio')} maxLength={BIO_MAX}
                      placeholder="Conte o que você faz, no que está trabalhando e sobre o que gosta de conversar." />
                  </Campo>
                  <p className={cx('mt-1 text-right text-xs tabular-nums', form.bio.length > BIO_MAX - 40 ? 'text-beon-red' : 'text-beon-muted')}>{form.bio.length}/{BIO_MAX}</p>
                </div>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-1.5 block text-sm font-medium text-beon-ink">Interesses</legend>
                  <p className="mb-2 text-xs text-beon-muted">Usados para sugerir pessoas e publicações.</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMUNITY_TOPICS.map(t => {
                      const Icon = topicIcon(t.id)
                      const sel = form.interesses.includes(t.id)
                      return (
                        <button key={t.id} type="button" aria-pressed={sel} onClick={() => alternarInteresse(t.id)} title={t.descricao}
                          className={cx('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors', focusRing,
                            sel ? 'border-beon-ink bg-beon-ink text-white' : 'border-beon-line bg-white text-beon-body hover:border-beon-muted/50 hover:text-beon-ink')}>
                          <Icon className="h-3.5 w-3.5" aria-hidden />{t.label}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-beon-line pt-4">
                <Button type="submit" variant="primary" icon={Check} disabled={!mudou} loading={salvando}>Salvar alterações</Button>
                {mudou && <Button variant="ghost" onClick={() => setForm(inicial)}>Descartar</Button>}
                {!mudou && <span className="inline-flex items-center gap-1.5 text-xs text-beon-muted"><UserRound className="h-3.5 w-3.5" aria-hidden /> Tudo salvo</span>}
              </div>
            </Cartao>
          </form>

          <TrocarSenha username={me.username} />
        </div>
      </div>

      <EditorDeFoto open={editor !== null} origem={editor === 'editar' ? me.avatar : undefined} onClose={() => setEditor(null)} onSalvar={enviarFoto} />
    </div>
  )
}
