import { PortalPage } from '@/components/shell/PortalPage'
import ExploracaoClient from '@/components/exploracao/ExploracaoClient'
import { oportunidadesDeExemplo } from '@/lib/exploracao/exemplo'
import { resumirExploracao } from '@/lib/exploracao/modelo'

export const dynamic = 'force-dynamic'

export default function ExploracaoPage() {
  const hoje = new Date()
  // O Discovery Flow 2.0 ainda não tem fonte no Jira: a página usa a base ilustrativa (e avisa na tela).
  const oportunidades = oportunidadesDeExemplo(hoje)
  return (
    <PortalPage title="Exploração" description="Discovery Flow 2.0: da identificação da oportunidade ao direcionamento para a esteira">
      <ExploracaoClient oportunidades={oportunidades} resumo={resumirExploracao(oportunidades, hoje)} hoje={hoje.toISOString()} ilustrativo />
    </PortalPage>
  )
}
