import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST() {
  const cwd = process.cwd()

  // 1. Apaga caches dos LLMs (portfólio + segmento)
  const llmCaches = ['.portfolio-cache.json', '.segmento-cache-v2.json']
  const deleted: string[] = []
  for (const f of llmCaches) {
    const fp = path.join(cwd, f)
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp)
      deleted.push(f)
    }
  }

  // 2. Apaga cache de fetch do Next.js (dados do Jira)
  const fetchCacheDir = path.join(cwd, '.next', 'cache', 'fetch-cache')
  if (fs.existsSync(fetchCacheDir)) {
    fs.rmSync(fetchCacheDir, { recursive: true, force: true })
  }

  // 3. Invalida as rotas para forçar re-render
  revalidatePath('/estrategia')
  revalidatePath('/portfolio')

  return NextResponse.json({ ok: true, deleted })
}
