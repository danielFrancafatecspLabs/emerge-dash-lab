// Cliente do Cientista no navegador: tudo passa pelo proxy autenticado da Comunidade.
import { lerBlocosSse, type EstadoCientista, type EventoCientista, type Kit, type Papeis, type PapelConversa } from '@/lib/cientista'
import { api, BASE_PATH } from '../api'

const RAIZ = '/community/cientista'
type On = (e: EventoCientista) => void

async function sse(path: string, body: unknown, on: On): Promise<void> {
  let res: Response
  try {
    res = await fetch(`${BASE_PATH}/api${RAIZ}${path}`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
    })
  } catch {
    on({ type: 'error', message: 'Sem conexão com o Cientista. Verifique sua rede e tente novamente.' })
    return
  }
  if (!res.ok || !res.body) {
    const erro = await res.json().then(b => b?.error).catch(() => null)
    on({ type: 'error', message: erro || 'O Cientista não conseguiu responder agora. Tente novamente.' })
    return
  }
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buffer = ''
  let terminou = false
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += dec.decode(value, { stream: true })
    const { eventos, resto } = lerBlocosSse(buffer)
    buffer = resto
    for (const e of eventos) {
      if (e.type === 'done') terminou = true
      on(e)
    }
  }
  if (!terminou) on({ type: 'error', message: 'A resposta foi interrompida. Envie de novo para continuar.' })
}

function base64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result).split(',')[1] ?? '')
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

export const MAX_ARQUIVO = 15 * 1024 * 1024

export const cientista = {
  health: () => api<{ ok: boolean }>(`${RAIZ}/health`),
  papeis: () => api<Papeis>(`${RAIZ}/papeis`),
  criarSessao: (papel: PapelConversa, preferencias: Record<string, string>) =>
    api<EstadoCientista>(`${RAIZ}/sessoes`, { method: 'POST', json: { papel, preferencias } }),
  sessao: (sid: string) => api<EstadoCientista>(`${RAIZ}/sessoes/${sid}`),
  iniciar: (sid: string, on: On) => sse(`/sessoes/${sid}/iniciar`, {}, on),
  mensagem: (sid: string, texto: string, on: On) => sse(`/sessoes/${sid}/mensagens`, { texto }, on),
  arquivo: async (sid: string, file: File, on: On) => {
    if (file.size > MAX_ARQUIVO) return on({ type: 'error', message: 'O arquivo passa de 15 MB. Envie uma amostra menor.' })
    return sse(`/sessoes/${sid}/arquivos`, { nome: file.name, conteudo_base64: await base64(file) }, on)
  },
  retomar: (sid: string, on: On) => sse(`/sessoes/${sid}/retomar`, {}, on),
  kit: (sid: string) => api<Kit>(`${RAIZ}/sessoes/${sid}/kit`),
  kitUrl: (sid: string) => `${BASE_PATH}/api${RAIZ}/sessoes/${sid}/kit.zip`,
  fichaUrl: (sid: string) => `${BASE_PATH}/api${RAIZ}/sessoes/${sid}/ficha.md`,
}
