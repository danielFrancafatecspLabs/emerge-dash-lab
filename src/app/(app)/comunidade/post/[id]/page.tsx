'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, FileX } from 'lucide-react'
import type { CommunityPost } from '@/lib/community/model'
import { api, ApiError, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageColumns } from '@/components/comunidade/Page'
import { DiscoveryRail } from '@/components/comunidade/DiscoveryRail'
import { PostItem, PostSkeleton } from '@/components/comunidade/PostItem'
import { EmptyState, ErrorState, cx, focusRing } from '@/components/ui'

/** O id chega codificado na URL: as notícias do Radar e os sinais têm ":" no id (radar:..., que vira radar%3A...). */
function idDaUrl(bruto: string) {
  try { return decodeURIComponent(bruto) } catch { return bruto }
}

export default function PostPage({ params }: { params: { id: string } }) {
  const { posts, upsertPost } = useCommunity()
  const id = idDaUrl(params.id)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'nao-encontrado' | string>('carregando')
  const [carregado, setCarregado] = useState<CommunityPost | null>(null)
  // A versão do feed (que recebe curtidas e comentários na hora) tem prioridade; a carregada cobre o feed ainda vazio.
  const post = posts.data?.find(p => p.id === id) ?? (carregado?.id === id ? carregado : undefined)

  async function carregar() {
    setEstado('carregando')
    try {
      const p = await api<CommunityPost>(`/community/posts/${encodeURIComponent(id)}`)
      setCarregado(p)
      upsertPost(p)
      setEstado('ok')
    } catch (err) {
      setEstado(err instanceof ApiError && err.status === 404 ? 'nao-encontrado' : errorMessage(err))
    }
  }

  // Busca a versão mais recente da publicação (comentários incluídos) ao abrir o link.
  useEffect(() => { carregar() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageColumns aside={<DiscoveryRail />}>
      <div className="flex items-center gap-2 border-b border-beon-line px-2 py-2 sm:px-4">
        <Link href="/comunidade" className={cx('inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-beon-body hover:bg-beon-soft', focusRing)}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao feed
        </Link>
      </div>
      {post ? <PostItem post={post} detail /> : estado === 'carregando' || estado === 'ok' ? <PostSkeleton /> : estado === 'nao-encontrado' ? (
        <EmptyState icon={FileX} title="Publicação não encontrada">Ela pode ter sido excluída por quem publicou.</EmptyState>
      ) : <ErrorState message={estado} onRetry={carregar} />}
    </PageColumns>
  )
}
