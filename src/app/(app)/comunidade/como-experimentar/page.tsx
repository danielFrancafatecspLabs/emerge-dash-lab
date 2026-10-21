import { redirect } from 'next/navigation'

// O mini-curso foi incorporado à Trilha de Experimentação.
export default function ComoExperimentarPage() {
  redirect('/comunidade/trilha?etapa=e-um-experimento')
}
