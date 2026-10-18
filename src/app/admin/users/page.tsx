'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, Inbox, Pencil, Plus, Trash2, UserPlus, Users, X } from 'lucide-react'
import { PortalShell } from '@/components/portal/PortalShell'
import { refreshPendingSignups } from '@/components/portal/usePortalSession'
import { Avatar, Button, Dialog, EmptyState, ErrorState, Skeleton, cx, focusRing, inputClass } from '@/components/ui'
import { ROLE_LABEL } from '@/lib/auth/client'
import type { AuthSessionRole } from '@/lib/auth/session'
import type { UserPublic } from '@/lib/auth/users'

type FormState = { username: string; password: string; role: AuthSessionRole; nome: string; laboratorio: string }
const EMPTY_FORM: FormState = { username: '', password: '', role: 'viewer', nome: '', laboratorio: '' }
const ROLES = Object.keys(ROLE_LABEL) as AuthSessionRole[]

const ROLE_TONE: Record<AuthSessionRole, string> = {
  admin: 'bg-beon-tint text-beon-redhi',
  executivo: 'bg-sky-50 text-sky-800',
  financeiro: 'bg-emerald-50 text-emerald-800',
  viewer: 'bg-stone-100 text-stone-700',
  community: 'bg-amber-50 text-amber-800',
}

function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function enviar(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Não foi possível concluir a operação')
  return data
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-beon-ink">
        {label} {hint && <span className="font-normal text-beon-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

/** Um pedido de cadastro feito pela tela de login. */
function PedidoCard({ user, onDecidir }: { user: UserPublic; onDecidir: (decisao: 'aprovar' | 'recusar', role: AuthSessionRole) => Promise<void> }) {
  const [role, setRole] = useState<AuthSessionRole>('community')
  const [busy, setBusy] = useState<'aprovar' | 'recusar' | null>(null)
  async function decidir(decisao: 'aprovar' | 'recusar') {
    if (decisao === 'recusar' && !confirm(`Recusar o cadastro de ${user.nome || user.username}? O pedido será removido.`)) return
    setBusy(decisao)
    try { await onDecidir(decisao, role) } finally { setBusy(null) }
  }
  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
      <div className="flex min-w-0 flex-1 gap-3">
        <Avatar nome={user.nome || user.username} size={40} />
        <div className="min-w-0">
          <p className="font-semibold text-beon-ink">{user.nome || '—'}</p>
          <p className="truncate text-sm text-beon-muted">{user.username}</p>
          <p className="mt-1 text-sm text-beon-body">
            {user.laboratorio || 'Área não informada'} · pedido em {dataCurta(user.createdAt)}
          </p>
          {user.motivo && <p className="mt-2 rounded-lg bg-beon-soft px-3 py-2 text-sm text-beon-body">“{user.motivo}”</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <label className="sr-only" htmlFor={`perfil-${user.id}`}>Perfil de acesso</label>
        <select
          id={`perfil-${user.id}`}
          value={role}
          onChange={e => setRole(e.target.value as AuthSessionRole)}
          className={cx('h-8 rounded-full border border-beon-line bg-white pl-3 pr-8 text-[13px] text-beon-ink hover:bg-beon-soft', focusRing)}
        >
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <Button size="sm" variant="secondary" icon={X} loading={busy === 'recusar'} disabled={!!busy} onClick={() => decidir('recusar')}>Recusar</Button>
        <Button size="sm" variant="primary" icon={Check} loading={busy === 'aprovar'} disabled={!!busy} onClick={() => decidir('aprovar')}>Aprovar</Button>
      </div>
    </li>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPublic[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [aviso, setAviso] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const res = await fetch('/jira/api/admin/users')
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error(data.error ?? 'Erro ao carregar os usuários')
      setUsers(data)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Erro de conexão')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const pendentes = useMemo(() => (users ?? []).filter(u => u.status === 'pendente'), [users])
  const contas = useMemo(() => (users ?? []).filter(u => u.status !== 'pendente'), [users])

  async function executar(acao: () => Promise<unknown>, sucesso?: string) {
    setAviso('')
    try {
      await acao()
      if (sucesso) setAviso(sucesso)
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Erro de conexão')
    }
    await load()
    refreshPendingSignups()
  }

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(u: UserPublic) {
    setEditingId(u.id)
    setForm({ username: u.username, password: '', role: u.role, nome: u.nome || '', laboratorio: u.laboratorio || '' })
    setFormError('')
    setShowForm(true)
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const body: Record<string, unknown> = { username: form.username, role: form.role, nome: form.nome, laboratorio: form.laboratorio }
      if (form.password || !editingId) body.password = form.password
      await enviar(editingId ? `/jira/api/admin/users/${editingId}` : '/jira/api/admin/users', editingId ? 'PUT' : 'POST', body)
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PortalShell
      title="Usuários"
      description="Contas de acesso ao portal e à Comunidade"
      actions={<Button variant="primary" size="sm" icon={Plus} onClick={openNew}>Novo usuário</Button>}
    >
      <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6">
        {aviso && (
          <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-beon-line bg-white px-4 py-3 text-sm text-beon-body">
            {aviso}
            <button type="button" onClick={() => setAviso('')} aria-label="Fechar aviso" className={cx('rounded text-beon-muted hover:text-beon-ink', focusRing)}>
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        {loadError && !users ? (
          <div className="rounded-2xl border border-beon-line bg-white"><ErrorState message={loadError} onRetry={load} /></div>
        ) : (
          <>
            <section aria-labelledby="pedidos-titulo">
              <div className="mb-3 flex items-baseline gap-2">
                <h2 id="pedidos-titulo" className="text-base font-semibold text-beon-ink">Pedidos de cadastro</h2>
                {pendentes.length > 0 && <span className="rounded-full bg-beon-red px-2 py-0.5 text-xs font-semibold text-white">{pendentes.length}</span>}
              </div>
              <div className="overflow-hidden rounded-2xl border border-beon-line bg-white">
                {!users ? (
                  <div className="space-y-3 p-5"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-1/2" /></div>
                ) : pendentes.length === 0 ? (
                  <EmptyState icon={Inbox} title="Nenhum pedido aguardando">
                    Quem se cadastra pela tela de login aparece aqui. A conta só passa a funcionar depois que você aprova e escolhe o perfil.
                  </EmptyState>
                ) : (
                  <ul className="divide-y divide-beon-line">
                    {pendentes.map(u => (
                      <PedidoCard
                        key={u.id}
                        user={u}
                        onDecidir={(decisao, role) => executar(
                          () => enviar(`/jira/api/admin/users/${u.id}/aprovacao`, 'POST', { decisao, role }),
                          decisao === 'aprovar' ? `${u.nome || u.username} foi aprovado(a) como ${ROLE_LABEL[role]}.` : 'Pedido recusado.',
                        )}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section aria-labelledby="contas-titulo">
              <h2 id="contas-titulo" className="mb-3 text-base font-semibold text-beon-ink">Contas</h2>
              <div className="overflow-x-auto rounded-2xl border border-beon-line bg-white">
                {!users ? (
                  <div className="space-y-3 p-5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : contas.length === 0 ? (
                  <EmptyState icon={Users} title="Nenhuma conta cadastrada" action={<Button variant="primary" icon={UserPlus} onClick={openNew}>Criar a primeira conta</Button>} />
                ) : (
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-beon-line text-left text-xs font-semibold uppercase tracking-[0.06em] text-beon-muted">
                        <th className="px-5 py-3">Pessoa</th>
                        <th className="px-4 py-3">Área</th>
                        <th className="px-4 py-3">Perfil</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Criada em</th>
                        <th className="px-4 py-3"><span className="sr-only">Ações</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-beon-line">
                      {contas.map(u => (
                        <tr key={u.id} className="hover:bg-beon-soft/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar nome={u.nome || u.username} src={u.avatar} size={32} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-beon-ink">{u.nome || '—'}</p>
                                <p className="truncate text-xs text-beon-muted">{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-beon-body">{u.laboratorio || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-medium', ROLE_TONE[u.role])}>{ROLE_LABEL[u.role] ?? u.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => executar(() => enviar(`/jira/api/admin/users/${u.id}`, 'PUT', { active: !u.active }))}
                              title={u.active ? 'Desativar acesso' : 'Reativar acesso'}
                              className={cx(
                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                                u.active ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
                                focusRing,
                              )}
                            >
                              <span className={cx('h-1.5 w-1.5 rounded-full', u.active ? 'bg-emerald-500' : 'bg-stone-400')} aria-hidden />
                              {u.active ? 'Ativo' : 'Inativo'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-beon-muted">{dataCurta(u.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button type="button" onClick={() => openEdit(u)} aria-label={`Editar ${u.username}`} className={cx('rounded-lg p-2 text-beon-muted hover:bg-beon-soft hover:text-beon-ink', focusRing)}>
                                <Pencil className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => { if (confirm(`Remover o usuário "${u.username}"?`)) executar(() => enviar(`/jira/api/admin/users/${u.id}`, 'DELETE')) }}
                                aria-label={`Remover ${u.username}`}
                                className={cx('rounded-lg p-2 text-beon-muted hover:bg-beon-tint hover:text-beon-red', focusRing)}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <Dialog open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Editar usuário' : 'Novo usuário'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Usuário">
              <input className={inputClass} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="nome.sobrenome" required autoComplete="off" />
            </Field>
            <Field label="Senha" hint={editingId ? '(em branco mantém)' : undefined}>
              <input type="password" className={inputClass} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editingId} autoComplete="new-password" />
            </Field>
            <Field label="Nome">
              <input className={inputClass} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </Field>
            <Field label="Área">
              <input className={inputClass} value={form.laboratorio} onChange={e => setForm(f => ({ ...f, laboratorio: e.target.value }))} placeholder="Ex.: BeOn Lab" />
            </Field>
            <Field label="Perfil">
              <select className={inputClass} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AuthSessionRole }))}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </Field>
          </div>
          {formError && <p role="alert" className="text-sm font-medium text-beon-red">{formError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={saving}>Salvar</Button>
          </div>
        </form>
      </Dialog>
    </PortalShell>
  )
}
