import { Skeleton } from '@/components/ui'

/** Esqueleto da aba Comparativo enquanto os dados do Jira chegam. */
export default function Loading() {
  return (
    <div className="min-h-dvh bg-beon-soft" aria-busy="true" aria-label="Carregando o comparativo">
      <div className="border-b border-beon-line bg-white px-6 py-4"><Skeleton className="h-5 w-40" /></div>
      <div className="mx-auto max-w-[1400px] space-y-5 px-6 py-5">
        <Skeleton className="h-8 w-80 rounded-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[150px] rounded-2xl" />)}
        </div>
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    </div>
  )
}
