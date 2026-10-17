'use client'

// Compositor de publicações: um único formulário para discussões, perguntas, pesquisas,
// experimentos e sinais de Future Thinking. Os campos se ajustam ao tipo escolhido.

import { useEffect, useState, type FormEvent } from 'react'
import { Link2 } from 'lucide-react'
import {
  HORIZONTE_LABEL, MATERIAL_STATUS_LABEL, MATERIAL_TIPO_LABEL, POST_KINDS, POST_KIND_LABEL, POST_LIMITS, SINAL_DIMENSAO_LABEL,
  type CommunityPost, type Horizonte, type MaterialStatus, type MaterialTipo, type PostKind, type SinalDimensao,
} from '@/lib/community'
import { COMMUNITY_TOPICS } from '@/lib/community-topics'
import { api, errorMessage } from './api'
import { useCommunity } from './CommunityProvider'
import { Button, Chip, Dialog, cx, inputClass } from './ui'
import { KIND_STYLE, topicIcon } from './visuals'

const DICA: Record<PostKind, { titulo: string; texto: string }> = {
  discussao: { titulo: 'Título (opcional)', texto: 'Compartilhe uma ideia, um aprendizado ou uma provocação para a comunidade.' },
  pergunta: { titulo: 'Qual é a sua pergunta?', texto: 'Dê contexto: o que você já tentou e que tipo de resposta ajudaria.' },
  pesquisa: { titulo: 'Título do material', texto: 'Resuma o que o material traz e por que ele é útil para a comunidade.' },
  experimento: { titulo: 'Nome do experimento (opcional)', texto: 'Conte a hipótese, como testou e o que aprendeu — inclusive o que não funcionou.' },
  sinal: { titulo: 'Qual é o sinal?', texto: 'Descreva objetivamente a mudança que você está observando.' },
}

interface FormState {
  kind: PostKind
  title: string
  content: string
  linkUrl: string
  tags: string[]
  materialTipo: MaterialTipo
  materialStatus: MaterialStatus
  dimensao: SinalDimensao
  horizonte: Horizonte | ''
  evidencias: string
  implicacoes: string
}

const EMPTY: FormState = {
  kind: 'discussao', title: '', content: '', linkUrl: '', tags: [],
  materialTipo: 'artigo', materialStatus: 'publicado', dimensao: 'tecnologica', horizonte: '', evidencias: '', implicacoes: '',
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-comm-ink">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-comm-muted">{hint}</p>}
    </div>
  )
}

function Select<T extends string>({ id, value, options, onChange }: { id: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value as T)} className={inputClass}>
      {(Object.keys(options) as T[]).map(k => <option key={k} value={k}>{options[k]}</option>)}
    </select>
  )
}

export function Composer() {
  const { composer, closeComposer, upsertPost, toast } = useCommunity()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!composer) return
    setForm({ ...EMPTY, ...composer, kind: composer.kind ?? 'discussao', tags: composer.tags ?? [] })
    setError(null)
  }, [composer])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))
  const toggleTag = (id: string) => set('tags', form.tags.includes(id) ? form.tags.filter(t => t !== id) : form.tags.length >= POST_LIMITS.tags ? form.tags : [...form.tags, id])
  const precisaTitulo = ['pergunta', 'pesquisa', 'sinal'].includes(form.kind)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const post = await api<CommunityPost>('/community/posts', {
        method: 'POST',
        json: {
          kind: form.kind, title: form.title, content: form.content, linkUrl: form.linkUrl, tags: form.tags,
          meta: {
            materialTipo: form.materialTipo, materialStatus: form.materialStatus, dimensao: form.dimensao,
            horizonte: form.horizonte || undefined, evidencias: form.evidencias, implicacoes: form.implicacoes,
          },
        },
      })
      upsertPost(post)
      toast(form.kind === 'pergunta' ? 'Pergunta publicada. Avisaremos quando alguém responder.' : 'Publicação compartilhada com a comunidade.')
      closeComposer()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const dica = DICA[form.kind]
  return (
    <Dialog open={!!composer} onClose={closeComposer} title="Nova publicação" description="Escolha o tipo para receber os campos certos." size="lg">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-comm-ink">Tipo</legend>
          <div className="flex flex-wrap gap-2">
            {POST_KINDS.map(k => {
              const Icon = KIND_STYLE[k].icon
              return (
                <Chip key={k} selected={form.kind === k} onClick={() => set('kind', k)}>
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {POST_KIND_LABEL[k]}
                </Chip>
              )
            })}
          </div>
        </fieldset>

        <Field label={dica.titulo} htmlFor="comp-title">
          <input id="comp-title" className={inputClass} value={form.title} maxLength={POST_LIMITS.title} required={precisaTitulo}
            onChange={e => set('title', e.target.value)} />
        </Field>

        <Field label="Texto" htmlFor="comp-content" hint={`${form.content.length}/${POST_LIMITS.content} caracteres`}>
          <textarea id="comp-content" className={cx(inputClass, 'min-h-[140px] resize-y leading-relaxed')} value={form.content}
            maxLength={POST_LIMITS.content} placeholder={dica.texto} required onChange={e => set('content', e.target.value)} />
        </Field>

        {form.kind === 'pesquisa' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de material" htmlFor="comp-mtipo">
              <Select id="comp-mtipo" value={form.materialTipo} options={MATERIAL_TIPO_LABEL} onChange={v => set('materialTipo', v)} />
            </Field>
            <Field label="Situação" htmlFor="comp-mstatus">
              <Select id="comp-mstatus" value={form.materialStatus} options={MATERIAL_STATUS_LABEL} onChange={v => set('materialStatus', v)} />
            </Field>
          </div>
        )}

        {form.kind === 'sinal' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dimensão da mudança" htmlFor="comp-dim">
                <Select id="comp-dim" value={form.dimensao} options={SINAL_DIMENSAO_LABEL} onChange={v => set('dimensao', v)} />
              </Field>
              <Field label="Horizonte" htmlFor="comp-hor">
                <select id="comp-hor" value={form.horizonte} onChange={e => set('horizonte', e.target.value as Horizonte | '')} className={inputClass}>
                  <option value="">Não se aplica</option>
                  {(Object.keys(HORIZONTE_LABEL) as Horizonte[]).map(h => <option key={h} value={h}>{HORIZONTE_LABEL[h]}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Evidências e referências" htmlFor="comp-ev" hint="Onde você viu o sinal? Fontes, dados ou casos.">
              <textarea id="comp-ev" className={cx(inputClass, 'min-h-[72px]')} value={form.evidencias} maxLength={POST_LIMITS.meta} onChange={e => set('evidencias', e.target.value)} />
            </Field>
            <Field label="Possíveis implicações" htmlFor="comp-imp" hint="O que muda para negócios, clientes ou operações?">
              <textarea id="comp-imp" className={cx(inputClass, 'min-h-[72px]')} value={form.implicacoes} maxLength={POST_LIMITS.meta} onChange={e => set('implicacoes', e.target.value)} />
            </Field>
          </>
        )}

        <Field label={form.kind === 'pesquisa' ? 'Link do material' : 'Link (opcional)'} htmlFor="comp-link"
          hint="Para anexar documentos, imagens ou vídeos, cole o link do arquivo (SharePoint, OneDrive, YouTube…).">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-comm-muted" aria-hidden />
            <input id="comp-link" type="url" inputMode="url" className={cx(inputClass, 'pl-9')} placeholder="https://" value={form.linkUrl}
              onChange={e => set('linkUrl', e.target.value)} />
          </div>
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-comm-ink">Tópicos <span className="font-normal text-comm-muted">(até {POST_LIMITS.tags})</span></legend>
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_TOPICS.map(t => {
              const Icon = topicIcon(t.id)
              const selected = form.tags.includes(t.id)
              return (
                <Chip key={t.id} selected={selected} disabled={!selected && form.tags.length >= POST_LIMITS.tags} onClick={() => toggleTag(t.id)} className="disabled:opacity-40">
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {t.label}
                </Chip>
              )
            })}
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-xl bg-comm-tint px-4 py-2.5 text-sm text-comm-redhi">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-comm-line pt-4">
          <Button variant="ghost" onClick={closeComposer}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={saving}
            disabled={!form.content.trim() || (precisaTitulo && !form.title.trim())}>
            Publicar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
