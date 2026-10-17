'use client'

import { useState, useEffect, useCallback } from 'react'
import { CommunityPost } from '@/lib/community'
import { Heart, MessageSquare, Link2, Send, Clock, User, Building2 } from 'lucide-react'

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPost, setNewPost] = useState('')
  const [newLink, setNewLink] = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<string>('')

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch('/jira/api/community/posts')
      const data = await res.json()
      if (Array.isArray(data)) setPosts(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPosts()
    // Get current user from cookie (we can't read httpOnly, but we can try a simple endpoint)
    fetch('/jira/api/auth/me').then(r => r.json()).then(d => {
      if (d.username) setCurrentUser(d.username)
    }).catch(() => {})
  }, [loadPosts])

  async function handlePost() {
    if (!newPost.trim()) return
    setPosting(true)
    setError('')
    try {
      const res = await fetch('/jira/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost.trim(), linkUrl: newLink.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao publicar'); return }
      setNewPost('')
      setNewLink('')
      await loadPosts()
    } catch {
      setError('Erro de conexão')
    } finally {
      setPosting(false)
    }
  }

  async function toggleLike(postId: string) {
    try {
      const res = await fetch('/jira/api/community/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (res.ok) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, likes: data.likes } : p
        ))
      }
    } catch {
      // silent
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Agora'
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return d.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </div>
            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Post creator */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="Compartilhe algo com a comunidade..."
              className="w-full border-0 resize-none text-sm focus:outline-none placeholder:text-gray-400 min-h-[60px]"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newLink}
                onChange={e => setNewLink(e.target.value)}
                placeholder="Link (opcional)"
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-400"
              />
              <button
                onClick={handlePost}
                disabled={posting || !newPost.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {posting ? '...' : 'Publicar'}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
      </div>

      {/* Posts feed */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhuma postagem ainda. Seja o primeiro a compartilhar!</p>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
            {/* Author */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {post.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{post.authorName}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {post.authorLab && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {post.authorLab}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(post.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

            {/* Link preview */}
            {post.linkUrl && (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <Link2 className="w-3.5 h-3.5" />
                  <span className="truncate">{post.linkUrl}</span>
                </div>
              </a>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  currentUser && post.likes.includes(currentUser)
                    ? 'text-red-600'
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    currentUser && post.likes.includes(currentUser) ? 'fill-red-600' : ''
                  }`}
                />
                {post.likes.length > 0 && post.likes.length}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <MessageSquare className="w-4 h-4" />
                Comentar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}