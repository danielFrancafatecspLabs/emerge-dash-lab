import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/complexidade
 *
 * Atualiza o campo customfield_30358 (Complexidade) de uma issue Jira. (was customfield_11664)
 *
 * Body: { key: string, complexidade: "Baixa" | "Média" | "Alta" }
 *
 * Usa Basic Auth com as variáveis de ambiente JIRA_EMAIL e JIRA_API_TOKEN.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, complexidade } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Campo "key" é obrigatório (ex.: "GL-123")' }, { status: 400 })
    }

    const valoresValidos = ['Baixa', 'Média', 'Alta']
    if (!complexidade || !valoresValidos.includes(complexidade)) {
      return NextResponse.json(
        { error: `Campo "complexidade" deve ser um de: ${valoresValidos.join(', ')}` },
        { status: 400 }
      )
    }

    const baseUrl = process.env.JIRA_BASE_URL
    const email = process.env.JIRA_EMAIL
    const token = process.env.JIRA_API_TOKEN

    if (!baseUrl || !email || !token) {
      return NextResponse.json({ error: 'Credenciais Jira não configuradas no servidor' }, { status: 500 })
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64')

    const jiraRes = await fetch(`${baseUrl}/rest/api/3/issue/${key}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          customfield_30358: complexidade,
        },
      }),
    })

    if (!jiraRes.ok) {
      const errorText = await jiraRes.text()
      return NextResponse.json(
        { error: `Jira retornou ${jiraRes.status}: ${errorText}` },
        { status: jiraRes.status }
      )
    }

    return NextResponse.json({
      success: true,
      key,
      complexidade,
      message: `Complexidade de ${key} atualizada para "${complexidade}"`,
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Erro interno: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}