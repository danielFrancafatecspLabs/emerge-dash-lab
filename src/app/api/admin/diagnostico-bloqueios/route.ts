import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { categoriaDoSinal, epicBloqueado, sinaisDeBloqueio, statusEncerrado } from '@/lib/bloqueio'
import { anexarCamposDeBloqueio, camposParaBloqueio, EXPERIMENTACAO_BOARD_ID, getAllBoardIssues, resolverCamposDinamicos } from '@/lib/jira'

// Diagnóstico da detecção de bloqueios (só admin): quais campos de bloqueio o Jira tem, quantos Epics
// cada sinal marca, a lista de bloqueados com o porquê e o valor BRUTO dos campos em alguns Epics, para
// conferir o formato que a API devolve. Lê o Jira na hora, sem cache.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const bruto = (v: unknown) => {
  const s = JSON.stringify(v)
  return s && s.length > 300 ? `${s.slice(0, 300)}…` : v
}

export async function GET(request: NextRequest) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  try {
    const campos = await resolverCamposDinamicos()
    const pedidos = ['summary', 'status', ...camposParaBloqueio(campos)]
    const brutos = await getAllBoardIssues(EXPERIMENTACAO_BOARD_ID, pedidos.join(','))
    const issues = anexarCamposDeBloqueio(brutos, campos)

    const porSinal: Record<string, number> = {}
    const bloqueados: { key: string; nome: string; status: string; sinais: string[] }[] = []
    const encerradosComSinal: { key: string; status: string; sinais: string[] }[] = []
    for (const i of issues) {
      const b = sinaisDeBloqueio(i.fields)
      for (const s of b.sinais) {
        const tipo = categoriaDoSinal(s)
        porSinal[tipo] = (porSinal[tipo] ?? 0) + 1
      }
      const detalhe = { status: i.fields.status, motivoBloqueio: b.motivo, flagged: b.flag, sinaisBloqueio: b.sinais }
      if (epicBloqueado(detalhe)) bloqueados.push({ key: i.key, nome: i.fields.summary, status: i.fields.status?.name, sinais: b.sinais })
      else if (b.sinais.length && statusEncerrado(i.fields.status)) encerradosComSinal.push({ key: i.key, status: i.fields.status?.name, sinais: b.sinais })
    }

    // Valor bruto dos campos candidatos nos primeiros Epics em que algum deles veio preenchido.
    const ids = camposParaBloqueio(campos)
    const amostra = brutos
      .map(i => {
        const f = i.fields as unknown as Record<string, unknown>
        const preenchidos = Object.fromEntries(ids.filter(id => {
          const v = f[id]
          return v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
        }).map(id => [id, bruto(f[id])]))
        return { key: i.key, status: i.fields.status?.name, campos: preenchidos }
      })
      .filter(a => Object.keys(a.campos).length > 0)
      .slice(0, 25)

    return NextResponse.json({
      board: EXPERIMENTACAO_BOARD_ID,
      totalEpics: issues.length,
      totalBloqueados: bloqueados.length,
      camposDeBloqueio: { origem: campos.origem, campos: campos.bloqueio },
      epicsPorSinal: porSinal,
      bloqueados,
      encerradosComSinal: encerradosComSinal.length,
      amostraValoresBrutos: amostra,
    })
  } catch (err) {
    console.error('[diagnostico-bloqueios]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
