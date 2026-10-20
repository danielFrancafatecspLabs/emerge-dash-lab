import { TrilhaExperimentacao } from '@/components/trilha/Trilha'
import { isEtapaTrilha } from '@/lib/community/trilha'

export default function TrilhaPage({ searchParams }: { searchParams: { etapa?: string | string[] } }) {
  const etapa = searchParams.etapa
  return <TrilhaExperimentacao etapaInicial={isEtapaTrilha(etapa) ? etapa : null} />
}
