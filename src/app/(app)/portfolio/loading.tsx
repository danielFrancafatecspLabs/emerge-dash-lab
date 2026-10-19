import { Skeleton } from '@/components/ui'

/** Esqueleto da aba Portfólio enquanto os dados do Jira chegam. */
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-beon-soft" aria-busy="true" aria-label="Carregando o portfólio">
      <div className="space-y-3 border-b border-beon-line bg-white px-6 py-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-72 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-9 w-28 rounded-full" />)}
        </div>
      </div>
      <div className="flex gap-3 px-6 pt-3">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[76px] flex-1 rounded-2xl" />)}
      </div>
      <div className="flex flex-1 gap-3 overflow-hidden px-6 py-3">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[60vh] w-[288px] shrink-0 rounded-2xl" />)}
      </div>
    </div>
  )
}
