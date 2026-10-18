import { NextResponse } from 'next/server'
import { carregarSemanal } from '@/lib/semanal-source'
import { montarComiteResumo } from '@/lib/comite-resumo'

export const dynamic = 'force-dynamic'

/** Slide "beOn Labs — visão geral" da Weekly, já formatado. */
export async function GET() {
  const semanal = await carregarSemanal()
  return NextResponse.json({
    geradoEm: semanal.geradoEm,
    isSample: semanal.isSample,
    view: montarComiteResumo(semanal.resumo, semanal.geradoEm),
  })
}
