'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { CONVERSA_INICIAL, conversaReducer, type EventoCientista } from '@/lib/community/cientista'
import { errorMessage } from '../api'
import { cientista } from './client'

/** Estado da conversa com o Cientista: carrega a transcrição e transforma o fluxo SSE em mensagens. */
export function useConversa(sid: string) {
  const [s, dispatch] = useReducer(conversaReducer, CONVERSA_INICIAL)
  const iniciado = useRef<string | null>(null)
  const on = useCallback((e: EventoCientista) => dispatch({ t: 'evento', e }), [])

  const carregar = useCallback(async () => {
    try {
      const estado = await cientista.sessao(sid)
      dispatch({ t: 'carregado', estado })
      if (!(estado.transcricao ?? []).length && estado.status === 'conversa') {
        dispatch({ t: 'pensando' })
        await cientista.iniciar(sid, on)
      }
    } catch (err) {
      dispatch({ t: 'erro_carga', msg: errorMessage(err) })
    }
  }, [sid, on])

  useEffect(() => {
    if (iniciado.current === sid) return
    iniciado.current = sid
    carregar()
  }, [sid, carregar])

  const enviar = useCallback(async (texto: string) => {
    dispatch({ t: 'pessoa', texto })
    await cientista.mensagem(sid, texto, on)
  }, [sid, on])

  const anexar = useCallback(async (file: File) => {
    dispatch({ t: 'pessoa', texto: `📎 ${file.name}` })
    await cientista.arquivo(sid, file, on)
  }, [sid, on])

  const retomar = useCallback(async () => {
    dispatch({ t: 'pessoa', texto: 'Voltei para ajustar a ficha conforme a revisão do Lab.' })
    await cientista.retomar(sid, on)
  }, [sid, on])

  return { ...s, enviar, anexar, retomar }
}
