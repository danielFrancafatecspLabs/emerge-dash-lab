import { redirect } from 'next/navigation'

// O guia de hipóteses foi incorporado à Trilha de Experimentação.
export default function FrameworkHipotesesPage() {
  redirect('/comunidade/trilha?etapa=hipotese')
}
