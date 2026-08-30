'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import LogoutButton from '@/components/layout/LogoutButton'
import { UserPublic } from '@/lib/users'
import { Users, Plus, Pencil, Trash2, X, Check, Shield, Eye, Wallet } from 'lucide-react'

type FormState = { username: string; password: string; role: 'admin' | 'executivo' | 'viewer' | 'financeiro' }
const EMPTY_FORM: FormState = { username: '', password: '', role: 'viewer' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/jira/api/admin/users')
      if (res.status === 403) { setError('Acesso restrito a administradores.'); return }
      const data = await res.json()
      if (!Array.isArray(data)) { setError(data.error ?? 'Erro ao carregar'); return }
      setUsers(data)
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(u: UserPublic) {
    setEditingId(u.id)
    setForm({ username: u.username, password: '', role: u.role })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { username: form.username, role: form.role }
      if (form.password) body.password = form.password
      if (!editingId) body.password = form.password // obrigatório no create

      const url = editingId
        ? `/jira/api/admin/users/${editingId}`
        : '/jira/api/admin/users'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      setShowForm(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(u: UserPublic) {
    await fetch(`/jira/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    })
    await load()
  }

  async function remove(u: UserPublic) {
    if (!confirm(`Remover usuário "${u.username}"?`)) return
    await fetch(`/jira/api/admin/users/${u.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="flex min-h-dvh" style={{ background: '#f0f0f0' }}>
      <div className="flex-shrink-0" style={{ width: 72 }}>
        <div className="fixed top-0 left-0 h-full" style={{ width: 72 }}>
          <div style={{ background: '#8B0000', paddingTop: 52, height: '100%' }}>
            <Sidebar />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="fixed top-0 z-10 flex items-center justify-between px-5 py-3"
          style={{ left: 72, right: 0, background: '#8B0000', minHeight: 52 }}
        >
          <div className="flex items-center gap-2">
            <Users size={18} color="white" />
            <h1 className="text-white font-bold tracking-wide" style={{ fontSize: 14 }}>
              GESTÃO DE USUÁRIOS
            </h1>
          </div>
          <LogoutButton />
        </div>

        <main className="mt-14 p-6 max-w-3xl mx-auto w-full">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Usuários</h2>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ background: '#8B0000' }}
            >
              <Plus size={15} /> Novo Usuário
            </button>
          </div>

          {/* Form inline */}
          {showForm && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  {editingId ? 'Editar Usuário' : 'Novo Usuário'}
                </span>
                <button onClick={() => setShowForm(false)}>
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Usuário</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Senha {editingId && <span className="text-gray-400">(deixe em branco para manter)</span>}
                  </label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Perfil</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'viewer' | 'financeiro' }))}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: '#8B0000' }}
                >
                  <Check size={14} /> {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Nenhum usuário cadastrado. O acesso usa as variáveis de ambiente.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfil</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado em</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-red-50 text-red-700'
                            : u.role === 'financeiro'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role === 'admin' ? <Shield size={10} /> : u.role === 'financeiro' ? <Wallet size={10} /> : <Eye size={10} />}
                          {u.role === 'admin' ? 'Admin' : u.role === 'financeiro' ? 'Financeiro' : 'Viewer'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(u)}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                            u.active
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {u.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(u)} title="Editar">
                            <Pencil size={14} className="text-gray-400 hover:text-gray-700" />
                          </button>
                          <button onClick={() => remove(u)} title="Remover">
                            <Trash2 size={14} className="text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
