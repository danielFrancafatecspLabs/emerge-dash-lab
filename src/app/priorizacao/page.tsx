import PriorizacaoClient from '@/components/priorizacao/PriorizacaoClient'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default function PriorizacaoPage() {
  return <PriorizacaoClient />
}