'use client'

import { useState, useEffect, useCallback } from 'react'
import { PortalShell } from '@/components/portal/PortalShell'
import { Story, STORY_CATEGORIA_LABEL, type StoryCategoria } from '@/lib/community/stories'
import { Image, Plus, Pencil, Trash2, X, Check, Eye, EyeOff, GripVertical } from 'lucide-react'

type FormState = { title: string; imageUrl: string; linkUrl: string; order: number; categoria: StoryCategoria; texto: string }
const EMPTY_FORM: FormState = { title: '', imageUrl: '', linkUrl: '', order: 0, categoria: 'novidade', texto: '' }

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/jira/api/admin/stories')
      if (res.status === 403) { setError('Acesso restrito a administradores.'); return }
      const data = await res.json()
      if (!Array.isArray(data)) { setError(data.error ?? 'Erro ao carregar'); return }
      setStories(data)
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, order: stories.length })
    setShowForm(true)
  }

  function openEdit(s: Story) {
    setEditingId(s.id)
    setForm({ title: s.title, imageUrl: s.imageUrl, linkUrl: s.linkUrl, order: s.order, categoria: s.categoria ?? 'novidade', texto: s.texto ?? '' })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { title: form.title, imageUrl: form.imageUrl, linkUrl: form.linkUrl, order: form.order, categoria: form.categoria, texto: form.texto }
      const url = editingId
        ? `/jira/api/admin/stories/${editingId}`
        : '/jira/api/admin/stories'
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

  async function toggleActive(s: Story) {
    await fetch(`/jira/api/admin/stories/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    })
    await load()
  }

  async function remove(s: Story) {
    if (!confirm(`Remover story "${s.title}"?`)) return
    await fetch(`/jira/api/admin/stories/${s.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <PortalShell title="Stories da Comunidade" description="Destaques exibidos no topo do feed da Comunidade">
        <div className="p-6 max-w-4xl mx-auto w-full">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-beon-ink">Stories</h2>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-beon-red hover:bg-beon-redhi"
              
            >
              <Plus size={15} /> Novo Story
            </button>
          </div>

          {/* Form inline */}
          {showForm && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  {editingId ? 'Editar Story' : 'Novo Story'}
                </span>
                <button onClick={() => setShowForm(false)}>
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Título</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Título do story"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ordem</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value as StoryCategoria }))}
                  >
                    {Object.entries(STORY_CATEGORIA_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Texto do story (opcional, até 500 caracteres)</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    rows={3}
                    maxLength={500}
                    value={form.texto}
                    onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
                    placeholder="Resumo exibido ao abrir o story"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">URL da Imagem</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Link (opcional)</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-600"
                    value={form.linkUrl}
                    onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                    placeholder="https://... ou /comunidade/..."
                  />
                </div>
              </div>
              {form.imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img src={form.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
                </div>
              )}
              <div className="flex justify-end mt-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-beon-red hover:bg-beon-redhi disabled:opacity-60"
                >
                  <Check size={14} /> {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {/* Stories grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
            ) : stories.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Nenhum story cadastrado. Crie o primeiro!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {stories.sort((a, b) => a.order - b.order).map(s => (
                  <div key={s.id} className={`relative rounded-xl border overflow-hidden group ${s.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                    <div className="aspect-[9/16] bg-gray-100 relative">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image size={32} className="text-gray-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-semibold truncate">{s.title}</p>
                        {s.linkUrl && <p className="text-white/60 text-xs truncate">{s.linkUrl}</p>}
                      </div>
                    </div>
                    <div className="p-2 flex items-center justify-between bg-white">
                      <span className="text-xs text-gray-400">#{s.order}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleActive(s)} title={s.active ? 'Desativar' : 'Ativar'}>
                          {s.active ? <Eye size={14} className="text-green-500" /> : <EyeOff size={14} className="text-gray-400" />}
                        </button>
                        <button onClick={() => openEdit(s)} title="Editar">
                          <Pencil size={14} className="text-gray-400 hover:text-gray-700" />
                        </button>
                        <button onClick={() => remove(s)} title="Remover">
                          <Trash2 size={14} className="text-gray-400 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </PortalShell>
  )
}
