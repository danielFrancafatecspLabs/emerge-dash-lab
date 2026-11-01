import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import fs from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { invalidarDashboardRaw } from '@/lib/jira'

export const dynamic = 'force-dynamic'

/**
 * "Ler o Jira agora" (só admins): o próximo carregamento busca no Jira em vez de servir a leitura do dia. A busca é incremental (só changelog e
 * comentário das issues alteradas) e, se o Jira falhar, a última versão continua valendo.
 *
 * As classificações por IA (portfólio e segmento) ficam: elas são por epic e os epics novos são classificados ao chegar,
 * então apagá-las só faria a IA reclassificar todos os epics a cada clique.
 */
export async function POST(request: NextRequest) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Só admins podem ler o Jira fora da leitura diária.' }, { status: 403 })
  invalidarDashboardRaw()

  // Cache de fetch do Next.js (outras chamadas externas que usem revalidate).
  const fetchCacheDir = path.join(process.cwd(), '.next', 'cache', 'fetch-cache')
  if (fs.existsSync(fetchCacheDir)) {
    fs.rmSync(fetchCacheDir, { recursive: true, force: true })
  }

  revalidatePath('/', 'layout')

  return NextResponse.json({ ok: true })
}
