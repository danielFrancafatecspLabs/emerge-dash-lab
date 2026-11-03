'use client'

// Selo da versão do app OSINT no ar: commit, quando foi publicada e quando o deploy automático verificou o repositório.
// Mostra quando a atualização automática não está ativa ou falhou (o motivo detalhado só para admins).

import { useEffect, useState } from 'react'
import type { StatusDoDeploy, VersaoDoApp } from '@/lib/osint/app-files'
import { api } from '@/components/comunidade/api'
import { tempoRelativo } from '@/components/comunidade/format'
import { cx } from '@/components/ui'

type Resposta = VersaoDoApp & { admin: boolean; deploy: StatusDoDeploy | null }

/** Verificação mais antiga que isso indica que o timer de 5 minutos parou. */
const ATRASO_MS = 30 * 60_000

export function VersaoDoOsint() {
  const [v, setV] = useState<Resposta | null>(null)
  useEffect(() => { api<Resposta>('/osint/versao').then(setV).catch(() => setV(null)) }, [])
  if (!v) return null

  const curto = (sha: string | null | undefined) => (sha ? sha.slice(0, 7) : '')
  const d = v.deploy
  const parado = !!d && Date.now() - Date.parse(d.checkedAt) > ATRASO_MS

  let tom: 'ok' | 'alerta' | 'erro' = 'ok'
  let texto: string
  let detalhe = ''
  if (v.origem === 'embutida') {
    tom = 'alerta'
    texto = 'Atualização automática inativa: exibindo a cópia do app que vem com o código'
    detalhe = 'Na VM: bash ops/osint-app-doctor.sh mostra o que falta (timer, credencial, Node ou OSINT_APP_DIR).'
  } else {
    texto = `App no commit ${curto(v.revisao)}${v.publicadaEm ? ` · publicado ${tempoRelativo(v.publicadaEm)}` : ''}`
    if (d?.result === 'error') {
      tom = 'erro'
      texto += ` · última atualização falhou${d.step ? ` (${d.step})` : ''}`
      detalhe = d.message
    } else if (parado) {
      tom = 'alerta'
      texto += ` · sem verificação desde ${tempoRelativo(d!.checkedAt)}`
      detalhe = 'O timer osint-app-deploy parou de rodar. Na VM: bash ops/osint-app-doctor.sh'
    } else if (d) {
      texto += ` · verificado ${tempoRelativo(d.checkedAt)}`
    }
  }

  return (
    <span className="flex min-w-0 max-w-[560px] flex-col items-end gap-0.5 text-right" role="status">
      <span className={cx('inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[10px] font-semibold',
        tom === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        tom === 'alerta' && 'border-amber-200 bg-amber-50 text-amber-900',
        tom === 'erro' && 'border-red-200 bg-red-50 text-red-800')} title={v.admin && detalhe ? detalhe : undefined}>
        <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', tom === 'ok' ? 'bg-emerald-500' : tom === 'alerta' ? 'bg-amber-500' : 'bg-red-600')} aria-hidden />
        <span className="truncate">{texto}</span>
      </span>
      {v.admin && detalhe && <span className="max-w-full truncate text-[10px] text-slate-500" title={detalhe}>{detalhe}</span>}
    </span>
  )
}
