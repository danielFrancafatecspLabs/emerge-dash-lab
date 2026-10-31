import { Skeleton } from '@/components/ui'

/** Esqueleto da aba Exploração. */
export default function Loading() {
  return (
    <div className="min-h-dvh bg-beon-soft" aria-busy="true" aria-label="Carregando a exploração">
      <div className="border-b border-beon-line bg-white px-6 py-4"><Skeleton className="h-5 w-40" /></div>
      <div className="mx-auto max-w-[1400px] space-y-4 px-6 py-5">
        <Skeleton className="h-[230px] rounded-2xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[130px] rounded-2xl" />)}
        </div>
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
    </div>
  )
}
