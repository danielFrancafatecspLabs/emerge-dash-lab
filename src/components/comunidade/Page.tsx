// Estrutura das páginas da Comunidade: cabeçalho e colunas de conteúdo.

import type { ReactNode } from 'react'
import { cx } from '@/components/ui'

/** Duas colunas de conteúdo: principal e painel auxiliar (este some abaixo de 1024px). */
export function PageColumns({ children, aside, wide }: { children: ReactNode; aside?: ReactNode; wide?: boolean }) {
  return (
    <div className="flex justify-center gap-8 lg:px-6">
      <div className={cx('w-full min-w-0', wide ? 'max-w-[960px]' : 'max-w-[680px]')}>{children}</div>
      {aside && <aside className="sticky top-0 hidden h-dvh w-[320px] shrink-0 overflow-y-auto py-6 lg:block" aria-label="Descoberta">{aside}</aside>}
    </div>
  )
}

export function PageHeader({ title, description, action, eyebrow }: { title: string; description?: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-5 pt-6 sm:px-6 md:pt-8">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-beon-red">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-beon-ink sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-beon-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
