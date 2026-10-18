import { redirect } from 'next/navigation'

// A Weekly foi unificada na aba Semanal (deck do Comitê + acompanhamento da semana).
export default function WeeklyPage() {
  redirect('/semanal')
}
