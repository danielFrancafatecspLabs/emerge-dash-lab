'use client'

// Uma publicação no feed (ou aberta na página dela), com ações e conversa encadeada.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Bookmark, CornerDownRight, ExternalLink, FlaskConical, Lightbulb, Link2, MessageCircle, MoreHorizontal, Send, Share2, Trash2, UserRound,
} from 'lucide-react'
import {
  HORIZONTE_LABEL, MATERIAL_STATUS_LABEL, MATERIAL_TIPO_LABEL, POST_LIMITS, SINAL_DIMENSAO_LABEL,
  type CommunityComment, type CommunityPost,
} from '@/lib/community'
import { api, BASE_PATH, errorMessage } from './api'
import { useCommunity } from './CommunityProvider'
import { dataHora, tempoRelativo } from './format'
import { Avatar, Button, Dialog, cx, focusRing, inputClass } from './ui'
import { KindBadge, TopicTag } from './visuals'

const md: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-comm-red underline-offset-2 hover:underline">{children}</a>,
  strong: ({ children }) => <strong className="font-semibold text-comm-ink">{children}</strong>,
  code: ({ children }) => <code className="rounded bg-comm-soft px-1 py-0.5 text-[0.9em]">{children}</code>,
  blockquote: ({ children }) => <blockquote className="mb-3 border-l-2 border-comm-line pl-3 text-comm-muted">{children}</blockquote>,
  h1: ({ children }) => <p className="mb-2 font-semibold text-comm-ink">{children}</p>,
  h2: ({ children }) => <p className="mb-2 font-semibold text-comm-ink">{children}</p>,
  h3: ({ children }) => <p className="mb-2 font-semibold text-comm-ink">{children}</p>,
  img: () => null,
}

export function RichText({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cx('break-words text-[15px] leading-relaxed text-comm-body', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{children}</ReactMarkdown>
    </div>
  )
}

function dominio(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export function postUrl(id: string) {
  return `${window.location.origin}${BASE_PATH}/comunidade/post/${id}`
}

// ── Ações ───────────────────────────────────────────────────────────────────────────────────

function ActionButton({ icon: Icon, label, count, active, onClick, pressed }: {
  icon: typeof Lightbulb; label: string; count?: number; active?: boolean; onClick: () => void; pressed?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cx(
        'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors',
        active ? 'text-comm-red hover:bg-comm-tint' : 'text-comm-muted hover:bg-comm-soft hover:text-comm-ink',
        focusRing,
      )}
    >
      <Icon className={cx('h-[17px] w-[17px]', active && 'fill-current')} aria-hidden />
      <span>{label}</span>
      {!!count && <span className="tabular-nums">{count}</span>}
    </button>
  )
}

function PostMenu({ post, onDelete }: { post: CommunityPost; onDelete: () => void }) {
  const { me } = useCommunity()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])
  const canDelete = !!me && (me.username === post.authorUsername || me.role === 'admin')
  const isMine = me?.username === post.authorUsername
  const item = cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-comm-body hover:bg-comm-soft hover:text-comm-ink', focusRing)
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu" aria-label="Mais ações"
        className={cx('inline-flex h-8 w-8 items-center justify-center rounded-full text-comm-muted hover:bg-comm-soft hover:text-comm-ink', focusRing)}>
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-comm-line bg-white p-1.5 shadow-xl">
          <Link role="menuitem" href={`/comunidade/pessoas/${encodeURIComponent(post.authorUsername)}`} className={item}>
            <UserRound className="h-4 w-4" aria-hidden /> {isMine ? 'Ver meu perfil' : 'Ver perfil'}
          </Link>
          {!isMine && (
            <button role="menuitem" type="button" className={item} onClick={() => router.push(`/comunidade/mensagens?com=${encodeURIComponent(post.authorUsername)}`)}>
              <MessageCircle className="h-4 w-4" aria-hidden /> Enviar mensagem
            </button>
          )}
          {canDelete && (
            <button role="menuitem" type="button" className={cx(item, 'text-red-700 hover:text-red-800')} onClick={() => { setOpen(false); onDelete() }}>
              <Trash2 className="h-4 w-4" aria-hidden /> Excluir publicação
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Comentários ─────────────────────────────────────────────────────────────────────────────

function raizDe(comment: CommunityComment, byId: Map<string, CommunityComment>) {
  let atual = comment
  const vistos = new Set<string>()
  while (atual.parentId && byId.has(atual.parentId) && !vistos.has(atual.id)) {
    vistos.add(atual.id)
    atual = byId.get(atual.parentId)!
  }
  return atual
}

function CommentForm({ post, parent, onDone, autoFocus }: { post: CommunityPost; parent?: CommunityComment; onDone?: () => void; autoFocus?: boolean }) {
  const { me, upsertPost, toast } = useCommunity()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const comment = await api<CommunityComment>(`/community/posts/${post.id}/comments`, { method: 'POST', json: { content: text, parentId: parent?.id } })
      upsertPost({ ...post, comments: [...post.comments, comment] })
      setText('')
      onDone?.()
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setSending(false)
    }
  }
  if (!me) return null
  return (
    <form onSubmit={submit} className="flex items-start gap-2.5">
      <Avatar nome={me.nome} src={me.avatar} size={30} />
      <div className="relative flex-1">
        <label className="sr-only" htmlFor={`c-${post.id}-${parent?.id ?? 'root'}`}>{parent ? `Responder a ${parent.authorName}` : 'Escreva um comentário'}</label>
        <textarea
          id={`c-${post.id}-${parent?.id ?? 'root'}`}
          autoFocus={autoFocus}
          rows={1}
          value={text}
          maxLength={POST_LIMITS.comment}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e) }}
          placeholder={parent ? `Responder a ${parent.authorName}…` : post.kind === 'pergunta' ? 'Escreva uma resposta…' : 'Adicione um comentário…'}
          className={cx(inputClass, 'min-h-[40px] resize-none rounded-2xl py-2 pr-11 text-sm [field-sizing:content]')}
        />
        <button type="submit" disabled={!text.trim() || sending} aria-label="Enviar comentário"
          className={cx('absolute bottom-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-comm-red text-white disabled:bg-comm-line disabled:text-comm-muted', focusRing)}>
          <Send className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </form>
  )
}

function CommentView({ post, comment, onReply }: { post: CommunityPost; comment: CommunityComment; onReply: (c: CommunityComment) => void }) {
  const { me, member, upsertPost, toast } = useCommunity()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const canDelete = !!me && (me.username === comment.authorUsername || me.role === 'admin')
  async function remove() {
    setDeleting(true)
    try {
      await api(`/community/posts/${post.id}/comments/${comment.id}`, { method: 'DELETE' })
      upsertPost({ ...post, comments: post.comments.filter(c => c.id !== comment.id && c.parentId !== comment.id) })
      toast('Comentário excluído.')
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setDeleting(false)
      setConfirm(false)
    }
  }
  const autor = member(comment.authorUsername)
  return (
    <div className="flex gap-2.5">
      <Link href={`/comunidade/pessoas/${encodeURIComponent(comment.authorUsername)}`} className={cx('rounded-full', focusRing)} aria-label={`Perfil de ${comment.authorName}`}>
        <Avatar nome={comment.authorName} src={autor?.avatar} size={30} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-comm-soft px-3.5 py-2.5">
          <p className="text-[13px]">
            <Link href={`/comunidade/pessoas/${encodeURIComponent(comment.authorUsername)}`} className="font-semibold text-comm-ink hover:underline">{comment.authorName}</Link>
            {autor?.especialidade && <span className="text-comm-muted"> · {autor.especialidade}</span>}
          </p>
          <RichText className="mt-0.5 text-sm">{comment.content}</RichText>
        </div>
        <div className="mt-1 flex items-center gap-3 px-2 text-xs text-comm-muted">
          <time dateTime={comment.createdAt} title={dataHora(comment.createdAt)}>{tempoRelativo(comment.createdAt)}</time>
          <button type="button" onClick={() => onReply(comment)} className="font-medium hover:text-comm-ink">Responder</button>
          {canDelete && <button type="button" onClick={() => setConfirm(true)} className="font-medium hover:text-red-700">Excluir</button>}
        </div>
      </div>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Excluir comentário?" description="As respostas a este comentário também serão removidas. Não é possível desfazer.">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button variant="danger" loading={deleting} onClick={remove}>Excluir</Button>
        </div>
      </Dialog>
    </div>
  )
}

function CommentThread({ post, limit }: { post: CommunityPost; limit?: number }) {
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null)
  const [showAll, setShowAll] = useState(!limit)
  const threads = useMemo(() => {
    const byId = new Map(post.comments.map(c => [c.id, c]))
    const roots = post.comments.filter(c => !c.parentId || !byId.has(c.parentId))
    return roots.map(root => ({ root, replies: post.comments.filter(c => c !== root && raizDe(c, byId).id === root.id) }))
  }, [post.comments])
  const visiveis = showAll || !limit ? threads : threads.slice(-limit)
  const ocultas = threads.length - visiveis.length

  return (
    <div className="mt-3 space-y-3">
      {ocultas > 0 && (
        <button type="button" onClick={() => setShowAll(true)} className="text-[13px] font-medium text-comm-muted hover:text-comm-ink">
          Ver {ocultas} {ocultas === 1 ? 'comentário anterior' : 'comentários anteriores'}
        </button>
      )}
      {visiveis.map(({ root, replies }) => (
        <div key={root.id} className="space-y-2.5">
          <CommentView post={post} comment={root} onReply={setReplyTo} />
          {(replies.length > 0 || (replyTo && (replyTo.id === root.id || replies.includes(replyTo)))) && (
            <div className="ml-10 space-y-2.5 border-l border-comm-line pl-3">
              {replies.map(r => <CommentView key={r.id} post={post} comment={r} onReply={setReplyTo} />)}
              {replyTo && (replyTo.id === root.id || replies.includes(replyTo)) && (
                <div className="flex items-start gap-1">
                  <CornerDownRight className="mt-2.5 h-3.5 w-3.5 shrink-0 text-comm-muted" aria-hidden />
                  <div className="flex-1"><CommentForm post={post} parent={replyTo} autoFocus onDone={() => setReplyTo(null)} /></div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <CommentForm post={post} />
    </div>
  )
}

// ── Publicação ──────────────────────────────────────────────────────────────────────────────

export function PostItem({ post, detail, onTopic }: { post: CommunityPost; detail?: boolean; onTopic?: (topic: string) => void }) {
  const { me, member, upsertPost, removePost, patchProfile, toast, openComposer } = useCommunity()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(!!detail)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [liking, setLiking] = useState(false)

  const autor = member(post.authorUsername)
  const liked = !!me && post.likes.includes(me.username)
  const saved = !!me && me.profile.salvos.includes(post.id)
  const longo = !detail && post.content.length > 420

  async function toggleLike() {
    if (!me || liking) return
    setLiking(true)
    const optimistic = liked ? post.likes.filter(u => u !== me.username) : [...post.likes, me.username]
    upsertPost({ ...post, likes: optimistic })
    try {
      const res = await api<{ likes: string[] }>('/community/posts/like', { method: 'POST', json: { postId: post.id } })
      upsertPost({ ...post, likes: res.likes })
    } catch (err) {
      upsertPost(post)
      toast(errorMessage(err), 'error')
    } finally {
      setLiking(false)
    }
  }

  async function toggleSave() {
    const ok = await patchProfile({ toggleSalvo: post.id }, p => ({ ...p, salvos: saved ? p.salvos.filter(s => s !== post.id) : [...p.salvos, post.id] }))
    if (ok) toast(saved ? 'Removida dos salvos.' : 'Salva para ler depois.')
  }

  async function share() {
    const url = postUrl(post.id)
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copiado.')
    } catch {
      toast(url, 'info')
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await api(`/community/posts/${post.id}`, { method: 'DELETE' })
      removePost(post.id)
      toast('Publicação excluída.')
      setConfirmDelete(false)
      if (detail) router.push('/comunidade')
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const perfil = `/comunidade/pessoas/${encodeURIComponent(post.authorUsername)}`
  const subtitulo = autor?.especialidade || autor?.cargo || post.authorLab || autor?.laboratorio

  return (
    <article className={cx('border-b border-comm-line px-4 py-5 sm:px-6', !detail && 'transition-colors hover:bg-comm-soft/30')} aria-labelledby={`post-${post.id}`}>
      <div className="flex gap-3">
        <Link href={perfil} className={cx('shrink-0 self-start rounded-full', focusRing)} aria-label={`Perfil de ${post.authorName}`}>
          <Avatar nome={post.authorName} src={autor?.avatar || post.authorAvatar} size={44} ativo={autor?.ativoAgora} />
        </Link>
        <div className="min-w-0 flex-1">
          <header className="flex items-start justify-between gap-2">
            <div className="min-w-0 text-sm leading-tight">
              <Link href={perfil} className="font-semibold text-comm-ink hover:underline">{post.authorName}</Link>
              <p className="mt-0.5 truncate text-[13px] text-comm-muted">
                {subtitulo && <>{subtitulo} · </>}
                <Link href={`/comunidade/post/${post.id}`} className="hover:underline">
                  <time dateTime={post.createdAt} title={dataHora(post.createdAt)}>{tempoRelativo(post.createdAt)}</time>
                </Link>
              </p>
            </div>
            <PostMenu post={post} onDelete={() => setConfirmDelete(true)} />
          </header>

          {post.kind !== 'discussao' && <KindBadge kind={post.kind} className="mt-2.5" />}

          {post.title && (
            <h3 id={`post-${post.id}`} className={cx('mt-2 font-semibold leading-snug tracking-tight text-comm-ink', detail ? 'text-[22px]' : 'text-[17px]')}>
              {detail ? post.title : <Link href={`/comunidade/post/${post.id}`} className="hover:underline">{post.title}</Link>}
            </h3>
          )}
          {!post.title && <span id={`post-${post.id}`} className="sr-only">Publicação de {post.authorName}</span>}

          <div className={cx('mt-2', longo && !expanded && 'relative max-h-[9.5rem] overflow-hidden')}>
            <RichText>{post.content}</RichText>
            {longo && !expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white" />}
          </div>
          {longo && (
            <button type="button" onClick={() => setExpanded(e => !e)} className="mt-1 text-sm font-medium text-comm-ink hover:underline">
              {expanded ? 'Mostrar menos' : 'Ler mais'}
            </button>
          )}

          {post.kind === 'sinal' && (post.meta.dimensao || post.meta.horizonte || post.meta.evidencias || post.meta.implicacoes) && (
            <dl className="mt-3 grid gap-x-6 gap-y-2.5 rounded-2xl border border-teal-100 bg-teal-50/40 p-4 text-sm sm:grid-cols-2">
              {post.meta.dimensao && <div><dt className="text-xs font-medium text-teal-800">Dimensão</dt><dd className="text-comm-ink">{SINAL_DIMENSAO_LABEL[post.meta.dimensao]}</dd></div>}
              {post.meta.horizonte && <div><dt className="text-xs font-medium text-teal-800">Horizonte</dt><dd className="text-comm-ink">{HORIZONTE_LABEL[post.meta.horizonte]}</dd></div>}
              {post.meta.evidencias && <div className="sm:col-span-2"><dt className="text-xs font-medium text-teal-800">Evidências</dt><dd className="whitespace-pre-line text-comm-body">{post.meta.evidencias}</dd></div>}
              {post.meta.implicacoes && <div className="sm:col-span-2"><dt className="text-xs font-medium text-teal-800">Possíveis implicações</dt><dd className="whitespace-pre-line text-comm-body">{post.meta.implicacoes}</dd></div>}
            </dl>
          )}

          {post.kind === 'pesquisa' && post.meta.materialTipo && (
            <p className="mt-3 text-[13px] text-comm-muted">
              {MATERIAL_TIPO_LABEL[post.meta.materialTipo]}
              {post.meta.materialStatus && <> · <span className={post.meta.materialStatus === 'em-elaboracao' ? 'font-medium text-amber-700' : ''}>{MATERIAL_STATUS_LABEL[post.meta.materialStatus]}</span></>}
            </p>
          )}

          {post.linkUrl && (
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer"
              className={cx('mt-3 flex items-center gap-3 rounded-xl border border-comm-line px-3.5 py-2.5 text-sm hover:border-comm-muted/40 hover:bg-comm-soft/50', focusRing)}>
              <Link2 className="h-4 w-4 shrink-0 text-comm-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium text-comm-ink">{dominio(post.linkUrl)}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-comm-muted" aria-hidden />
            </a>
          )}

          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {post.tags.map(t => <TopicTag key={t} id={t} onClick={onTopic ? () => onTopic(t) : () => router.push(`/comunidade?topico=${t}`)} />)}
            </div>
          )}

          <div className="-ml-3 mt-3 flex flex-wrap items-center gap-0.5">
            <ActionButton icon={Lightbulb} label="Útil" count={post.likes.length} active={liked} pressed={liked} onClick={toggleLike} />
            <ActionButton icon={MessageCircle} label={post.kind === 'pergunta' ? 'Responder' : 'Comentar'} count={post.comments.length}
              active={commentsOpen && !detail} onClick={() => setCommentsOpen(o => detail || !o)} />
            <ActionButton icon={Bookmark} label={saved ? 'Salvo' : 'Salvar'} active={saved} pressed={saved} onClick={toggleSave} />
            <ActionButton icon={Share2} label="Copiar link" onClick={share} />
            {post.kind === 'sinal' && (
              <ActionButton icon={FlaskConical} label="Propor experimento" onClick={() => openComposer({
                kind: 'experimento',
                tags: post.tags,
                linkUrl: postUrl(post.id),
                content: `Sinal relacionado: ${post.title}\n\nHipótese: acreditamos que … Saberemos que deu certo quando …`,
              })} />
            )}
          </div>

          {commentsOpen && <CommentThread post={post} limit={detail ? undefined : 3} />}
        </div>
      </div>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir publicação?" description="A publicação e os comentários dela serão removidos para todos. Não é possível desfazer.">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button variant="danger" loading={deleting} onClick={remove}>Excluir</Button>
        </div>
      </Dialog>
    </article>
  )
}
