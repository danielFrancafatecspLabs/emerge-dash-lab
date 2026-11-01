import { JiraIndisponivel } from '@/components/jira/JiraIndisponivel'
import { PortalPage } from './PortalPage'

/** Página do portal cujos dados do Jira não estão disponíveis: mantém menu e barra e mostra quem procurar. */
export function PortalDataError({ title, error }: { title: string; error: string | null }) {
  return (
    <PortalPage title={title}>
      <div className="flex flex-1 items-start justify-center p-6 sm:pt-16">
        <JiraIndisponivel detalhe={error} />
      </div>
    </PortalPage>
  )
}
