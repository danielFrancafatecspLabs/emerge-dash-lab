'use client'

import { useState } from 'react'
import {
  X, Loader2, Check,
  DollarSign, Wallet, MessageSquareText, History, Calendar, User, Building2,
} from 'lucide-react'
import type { BeneficioEpicRow } from './BeneficiosClient'
import { STATUS_CONFIG } from './BeneficiosClient'
import type { ValidacaoBeneficio, StatusValidacao } from '@/lib/beneficios'

interface Props {
  row: BeneficioEpicRow
  canEdit: boolean
  onClose: () => void
  onUpdated: (epicKey: string, validacao: ValidacaoBeneficio) => void
}

function formatBRLFull(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_ORDER: StatusValidacao[] = ['nao_validado', 'em_validacao', 'validado', 'rejeitado']

export default function BeneficioDetailDrawer({ row, canEdit, onClose, onUpdated }: Props) {
  const v = row.validacao
  const [status, setStatus] = useState<StatusValidacao>(v?.statusValidacao ?? 'nao_validado')
  const [valorValidado, setValorValidado] = useState<string>(v?.beneficioValidado != null ? String(v.beneficioValidado) : '')
  const [observacoes, setObservacoes] = useState(v?.observacoes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const dirty = status !== (v?.statusValidacao ?? 'nao_validado')
    || valorValidado !== (v?.beneficioValidado != null ? String(v.beneficioValidado) : '')
    || observacoes !== (v?.observacoes ?? '')

  const potencial = row.beneficioPotencial ?? 0
  const validadoNum = valorValidado.trim() === '' ? null : Number(valorValidado)
  const diff = validadoNum !== null ? validadoNum - potencial : null

  async function salvar() {
    setSaving(true)
    setErrorMsg('')
    try {
      const res = await fetch('/jira/api/beneficios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          epicKey: row.key,
          statusValidacao: status,
          beneficioValidado: validadoNum,
          observacoes: observacoes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Erro ao salvar')
        return
      }
      onUpdated(row.key, json as ValidacaoBeneficio)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setErrorMsg('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(17,24,39,0.5)' }} onClick={onClose}>
      <div
        className="bg-white h-full flex flex-col shadow-2xl"
        style={{ width: 'min(560px, 100vw)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-shrink-0" style={{ background: '#FBFBFB' }}>
          <div className="min-w-0">
            <p className="font-mono font-bold" style={{ fontSize: 11, color: '#CC0000' }}>{row.key}</p>
            <h2 className="font-bold text-gray-900 leading-snug mt-0.5" style={{ fontSize: 16 }}>{row.nome}</h2>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium" style={{ fontSize: 10.5 }}>
              {row.status}
            </span>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 transition-colors text-gray-400 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* ── Quantitativo ── */}
          <section className="flex flex-col gap-2.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign size={12} /> Benefício Quantitativo
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 p-3">
                <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wide">Potencial (Jira)</p>
                <p className="text-lg font-extrabold text-gray-900 mt-0.5">{row.beneficioPotencial ? formatBRLFull(row.beneficioPotencial) : '—'}</p>
              </div>
              <div className="rounded-xl border p-3" style={{ borderColor: '#BBF7D0', background: '#F0FDF4' }}>
                <p className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: '#15803D' }}>Validado (Financeiro)</p>
                {canEdit ? (
                  <>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-gray-400 font-bold text-sm">R$</span>
                      <input
                        type="number"
                        min={0}
                        value={valorValidado}
                        onChange={e => setValorValidado(e.target.value)}
                        placeholder="0"
                        className="w-full font-extrabold text-lg text-emerald-800 bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-400"
                      />
                    </div>
                    {validadoNum !== null && !Number.isNaN(validadoNum) && (
                      <p className="text-[10.5px] text-emerald-600 mt-0.5">{formatBRLFull(validadoNum)}</p>
                    )}
                  </>
                ) : (
                  <p className="text-lg font-extrabold mt-0.5" style={{ color: '#15803D' }}>
                    {v?.beneficioValidado != null ? formatBRLFull(v.beneficioValidado) : '—'}
                  </p>
                )}
              </div>
            </div>
            {diff !== null && (
              <p className={`text-xs font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {diff >= 0 ? 'Acima' : 'Abaixo'} do potencial em {formatBRLFull(Math.abs(diff))}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
              <p>Custo Estimado: <strong className="text-gray-700">{row.custoEstimado ? formatBRLFull(row.custoEstimado) : '—'}</strong></p>
              <p>Custo Realizado: <strong className="text-gray-700">{row.custoRealizado ?? '—'}</strong></p>
            </div>
          </section>

          {/* ── Status de validação ── */}
          <section className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Wallet size={12} /> Status de Validação
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ORDER.map(st => {
                const cfg = STATUS_CONFIG[st]
                const Icon = cfg.icon
                const ativo = status === st
                return (
                  <button
                    key={st}
                    disabled={!canEdit}
                    onClick={() => setStatus(st)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-all disabled:cursor-not-allowed"
                    style={ativo
                      ? { background: cfg.text, color: 'white', borderColor: cfg.text }
                      : { background: cfg.bg, color: cfg.text, borderColor: cfg.border, opacity: canEdit ? 1 : 0.7 }}
                  >
                    <Icon size={13} /> {cfg.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Qualitativo ── */}
          <section className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquareText size={12} /> Justificativa Qualitativa (cadastrada no Jira)
            </p>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-gray-600" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              {row.beneficioQualitativo || <span className="italic text-gray-400">Nenhuma justificativa qualitativa cadastrada.</span>}
            </div>
          </section>

          {/* ── Observações do financeiro ── */}
          <section className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Observações da Validação Financeira
            </p>
            {canEdit ? (
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Evidências, memória de cálculo, ressalvas..."
                className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
            ) : (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-gray-600" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                {observacoes || <span className="italic text-gray-400">Sem observações registradas.</span>}
              </div>
            )}
          </section>

          {/* ── Metadados ── */}
          <section className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-500"><Building2 size={12} className="text-gray-300" /> {row.dominio ?? '—'}</div>
            <div className="flex items-center gap-1.5 text-gray-500"><User size={12} className="text-gray-300" /> {row.sponsor ?? '—'}</div>
            <div className="flex items-center gap-1.5 text-gray-500"><User size={12} className="text-gray-300" /> Lab: {row.labResponsavel}</div>
            <div className="flex items-center gap-1.5 text-gray-500"><Calendar size={12} className="text-gray-300" /> Criado em {formatDate(row.criadoEm)}</div>
          </section>

          {/* ── Auditoria / histórico ── */}
          {v && (v.validadoPor || v.historico.length > 0) && (
            <section className="flex flex-col gap-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <History size={12} /> Histórico
              </p>
              {v.validadoPor && (
                <p className="text-xs text-gray-500">
                  Validado por <strong className="text-gray-700">{v.validadoPor}</strong> em {formatDate(v.dataValidacao)}
                </p>
              )}
              <div className="flex flex-col gap-1.5 border-l-2 border-gray-100 pl-3 ml-1">
                {[...v.historico].reverse().map((h, i) => (
                  <div key={i} className="text-xs text-gray-500">
                    <span className="text-gray-700 font-medium">{h.autor}</span> {h.acao}
                    {h.detalhe && <span className="text-gray-400"> · {h.detalhe}</span>}
                    <p className="text-gray-300" style={{ fontSize: 10 }}>{formatDateTime(h.data)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Footer ── */}
        {canEdit && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0" style={{ background: '#FBFBFB' }}>
            <div className="text-xs">
              {errorMsg && <span className="text-red-600">{errorMsg}</span>}
              {saved && !errorMsg && <span className="text-emerald-600 flex items-center gap-1"><Check size={13} /> Salvo com sucesso</span>}
            </div>
            <button
              onClick={salvar}
              disabled={!dirty || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-colors"
              style={{ background: '#8B0000' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
