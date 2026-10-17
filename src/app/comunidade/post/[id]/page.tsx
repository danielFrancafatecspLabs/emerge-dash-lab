'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, FileX } from 'lucide-react'
import type { CommunityPost } from '@/lib/community/model'
import { api, ApiError, errorMessage } from '@/components/comunidade/api'
import { useCommunity } from '@/components/comunidade/CommunityProvider'
import { PageColumns } from '@/components/comunidade/CommunityShell'
import { DiscoveryRail } from '@/components/comunidade/DiscoveryRail'
import { PostItem } from '@/components/comunidade/PostItem'
import { EmptyState, ErrorState, PostSkeleton, cx, focusRing } from '@/components/comunidade/ui'

export default function PostPage({ params }: { params: { id: string } }) {
  const { posts, upsertPost } = useCommunity()
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'nao-encontrado' | string>('carregando')
  const post = posts.data?.find(p => p.id === params.id)

  async function carregar() {
    setEstado('carregando')
    try {
      upsertPost(await api<CommunityPost>(`/community/posts/${params.id}`))
      setEstado('ok')
    } catch (err) {
      setEstado(err instanceof ApiError && err.status === 404 ? 'nao-encontrado' : errorMessage(err))
    }
  }

  // Busca a versão mais recente da publicação (comentários incluídos) ao abrir o link.
  useEffect(() => { carregar() }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageColumns aside={<DiscoveryRail />}>
      <div className="flex items-center gap-2 border-b border-comm-line px-2 py-2 sm:px-4">
        <Link href="/comunidade" className={cx('inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-comm-body hover:bg-comm-soft', focusRing)}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao feed
        </Link>
      </div>
      {post ? <PostItem post={post} detail /> : estado === 'carregando' ? <PostSkeleton /> : estado === 'nao-encontrado' ? (
        <EmptyState icon={FileX} title="Publicação não encontrada">Ela pode ter sido excluída por quem publicou.</EmptyState>
      ) : <ErrorState message={estado} onRetry={carregar} />}
    </PageColumns>
  )
}
