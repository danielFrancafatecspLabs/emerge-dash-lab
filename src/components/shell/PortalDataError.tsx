import { AlertCircle } from 'lucide-react'
import { PortalPage } from './PortalPage'

/** Página do portal cujos dados do Jira não carregaram: mantém menu e barra para a pessoa seguir navegando. */
export function PortalDataError({ title, error }: { title: string; error: string | null }) {
  return (
    <PortalPage title={title} refreshable>
      <div className="flex flex-1 items-start justify-center p-6 sm:pt-16">
        <div role="alert" className="w-full max-w-lg rounded-2xl border border-beon-line bg-white p-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-beon-tint text-beon-red">
            <AlertCircle className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold text-beon-ink">Não foi possível carregar os dados do Jira</h2>
          <p className="mt-1.5 text-sm text-beon-muted">
            Tente “Atualizar dados” em instantes. Se continuar, confira as variáveis JIRA_BASE_URL, JIRA_EMAIL e JIRA_API_TOKEN do servidor.
          </p>
          {error && (
            <details className="mt-5 text-left">
              <summary className="cursor-pointer text-xs font-medium text-beon-muted">Detalhes técnicos</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-beon-soft p-3 text-xs text-beon-body">{error}</pre>
            </details>
          )}
        </div>
      </div>
    </PortalPage>
  )
}
