import { AlertCircle, Mail } from 'lucide-react'
import { CONTATOS_DO_JIRA } from '@/lib/jira-contatos'

/**
 * O que aparece quando os dados do Jira não estão disponíveis (o Jira não respondeu e não há leitura guardada).
 * `compacto` serve para blocos menores (ex.: a prévia da home da Comunidade).
 */
export function JiraIndisponivel({ compacto, detalhe }: { compacto?: boolean; detalhe?: string | null }) {
  return (
    <div role="alert" className={compacto ? 'rounded-2xl border border-beon-line bg-white p-5' : 'mx-auto w-full max-w-xl rounded-[28px] border border-beon-line bg-white p-8 text-center sm:p-10'}>
      <span className={compacto ? 'mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-beon-tint text-beon-red' : 'mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-beon-tint text-beon-red'}>
        <AlertCircle className={compacto ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden />
      </span>
      <h2 className={compacto ? 'text-[15px] font-bold text-beon-ink' : 'text-xl font-extrabold tracking-tight text-beon-ink sm:text-2xl'}>
        Desculpe, não conseguimos acessar o Jira.
      </h2>
      <p className={compacto ? 'mt-1 text-sm leading-relaxed text-beon-body' : 'mt-2 text-[15px] leading-relaxed text-beon-body'}>
        Provavelmente é um problema interno. Para consultar esse tipo de dado, entre em contato com:
      </p>
      <ul className={compacto ? 'mt-3 space-y-2' : 'mx-auto mt-5 max-w-sm space-y-2 text-left'}>
        {CONTATOS_DO_JIRA.map(c => (
          <li key={c.email}>
            <a href={`mailto:${c.email}?subject=${encodeURIComponent('Dados do Jira indisponíveis no beOn Labs')}`}
              className="flex items-center gap-3 rounded-2xl border border-beon-line px-4 py-3 transition-colors hover:border-beon-red/40 hover:bg-beon-tint/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beon-red/60">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beon-soft text-beon-red"><Mail className="h-4 w-4" aria-hidden /></span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-beon-ink">{c.nome}</span>
                <span className="block truncate text-[13px] text-beon-body">{c.email}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {detalhe && (
        <details className="mt-5 text-left">
          <summary className="cursor-pointer text-xs font-medium text-beon-muted">Detalhes técnicos</summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-beon-soft p-3 text-xs text-beon-body">{detalhe}</pre>
        </details>
      )}
    </div>
  )
}
