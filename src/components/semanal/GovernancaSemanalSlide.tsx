'use client'

import { Fragment } from 'react'
import { dataAtualizacao, GOV_LAYOUT as L, layoutGovernanca, TECNOLOGIAS_GOV, type SemanalGovernanca } from '@/lib/semanal-governanca'
import { SLIDE_H, SLIDE_W } from './SlideArt'

// Slide "Governança beOn Labs": áreas que mais experimentam × fases da jornada. Cada experimento (ou iniciativa,
// em Piloto e Em escala) é uma bolinha na cor da tecnologia, com o nome embaixo; o que não cabe vira "+N".
// A geometria vem de layoutGovernanca, a mesma do PPTX.

const RED = '#CC0000'
const DARK_RED = '#8B0000'
const INK = '#1F2328'
const MUTED = '#5B6472'
const LINHA = '#E5E7EB'
const AMX = 'AMX, Calibri, "Segoe UI", Arial, sans-serif'
const COR = Object.fromEntries(TECNOLOGIAS_GOV.map(t => [t.id, t.cor]))

function Legenda({ titulo, children, x, w }: { titulo: string; children: React.ReactNode; x: number; w: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: 16, width: w }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{titulo}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 11.5, color: MUTED, whiteSpace: 'nowrap' }}>{children}</div>
    </div>
  )
}

export default function GovernancaSemanalSlide({ governanca: g, geradoEm }: { governanca: SemanalGovernanca; geradoEm: string }) {
  const lay = layoutGovernanca(g)
  const x0 = L.margem, x1 = SLIDE_W - L.margem
  const andamento = lay.grupos.find(gr => gr.grupo.id === 'andamento')

  return (
    <div style={{ width: SLIDE_W, height: SLIDE_H, position: 'relative', overflow: 'hidden', background: '#fff', color: INK, fontFamily: AMX }}>
      {/* Título e legendas */}
      <div style={{ position: 'absolute', left: x0, top: 18, fontSize: 30, fontWeight: 700, color: RED, letterSpacing: 2, whiteSpace: 'nowrap' }}>
        GOVERNANÇA <span style={{ letterSpacing: 0 }}>beOn Labs</span>
      </div>
      <Legenda titulo="SUB-STATUS" x={440} w={190}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/jira/semanal/icones/prioridade.png" alt="" style={{ width: 14, height: 14 }} />Prioridade
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/jira/semanal/icones/cadeado.png" alt="" style={{ width: 12, height: 12 }} />Bloqueio
        </span>
      </Legenda>
      <Legenda titulo="TIPO DE TECNOLOGIA" x={640} w={480}>
        {TECNOLOGIAS_GOV.map(t => (
          <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.cor }} />{t.label}
          </span>
        ))}
      </Legenda>
      <div style={{ position: 'absolute', right: L.margem, top: 16, width: 120, textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>ATUALIZADO EM:</div>
        <div style={{ marginTop: 4, border: `1.5px solid ${RED}`, borderRadius: 4, fontSize: 12, fontWeight: 700, padding: '1px 0' }}>{dataAtualizacao(geradoEm)}</div>
      </div>

      {/* Total de experimentos */}
      <div style={{
        position: 'absolute', left: x0, top: L.faixaY, width: x1 - x0, height: L.faixaH, border: `2px solid ${RED}`, borderBottom: 'none',
        borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
        fontSize: 15, fontWeight: 700, color: RED, letterSpacing: 3,
      }}>{g.totalExperimentos} EXPERIMENTOS</div>

      {/* Cabeçalho das fases */}
      <div style={{ position: 'absolute', left: x0, top: L.grupoY, width: L.areaW, height: L.grupoH + L.subH, background: DARK_RED, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>ÁREA</div>
      {lay.grupos.map(({ grupo, x, w }) => (
        <div key={grupo.id} style={{ position: 'absolute', left: x, top: L.grupoY, width: w, height: L.grupoH, background: RED, color: '#fff',
          borderLeft: '2px solid #fff', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
          <span style={{ fontSize: 24, fontWeight: 700 }}>{grupo.total}</span>
          <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{grupo.label}</span>
        </div>
      ))}
      {lay.grupos.flatMap(({ grupo }) => grupo.colunas.map((gc, k) => {
        const col = lay.colunas.find(c => c.id === gc.id)!
        return (
          <div key={gc.id} style={{ position: 'absolute', left: col.x, top: L.subY, width: col.w, height: L.subH, background: '#FBE4E4', color: DARK_RED,
            borderLeft: k === 0 ? '2px solid #fff' : '1px dashed #E8A0A0', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 700 }}>
            {gc.label && <>{gc.label}<span style={{ fontWeight: 400 }}>({gc.total})</span></>}
          </div>
        )
      }))}

      {/* Fundo de destaque dos experimentos em andamento */}
      {andamento && (
        <div style={{ position: 'absolute', left: andamento.x, top: L.gradeY, width: andamento.w, height: L.gradeFim - L.gradeY, background: '#FFF6F6' }} />
      )}

      {/* Linhas por área */}
      {lay.linhas.map((linha, r) => (
        <Fragment key={linha.area}>
          <div style={{ position: 'absolute', left: x0, top: linha.y, width: L.areaW, height: linha.h, background: INK, color: '#fff',
            borderTop: r ? '2px solid #fff' : 'none', boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 10px',
            fontSize: 12.5, fontWeight: 700, lineHeight: 1.15, textTransform: 'uppercase' }}>{linha.area}</div>
          {r > 0 && <div style={{ position: 'absolute', left: x0 + L.areaW, top: linha.y, width: x1 - x0 - L.areaW, height: 1, background: LINHA }} />}
          {linha.celulas.flatMap(cel => [
            ...cel.itens.map(({ x, y, item, linhasNome }) => (
              <div key={item.key} title={`${item.key} · ${item.nome}`} style={{ position: 'absolute', left: x, top: y, width: L.itemW, textAlign: 'center' }}>
                <span style={{ position: 'relative', display: 'inline-block', width: L.bolinha, height: L.bolinha, borderRadius: '50%', background: COR[item.tecnologia],
                  boxShadow: 'inset -2px -2px 3px rgba(0,0,0,0.25)' }}>
                  {item.prioridade && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/jira/semanal/icones/prioridade.png" alt="Prioridade" style={{ position: 'absolute', left: -8, top: -5, width: 12, height: 12 }} />
                  )}
                  {item.bloqueio && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/jira/semanal/icones/cadeado.png" alt="Bloqueio" style={{ position: 'absolute', right: -11, top: -4, width: 10, height: 10 }} />
                  )}
                </span>
                <div style={{ fontSize: L.fonteNome, lineHeight: 1.1, color: INK, marginTop: 1, whiteSpace: 'nowrap' }}>
                  {linhasNome.map((t, k) => <div key={k}>{t}</div>)}
                </div>
              </div>
            )),
            ...(cel.mais ? [(
              <div key={`${cel.coluna}-mais`} style={{ position: 'absolute', left: cel.mais.x, top: cel.mais.y, width: L.itemW, textAlign: 'center', color: MUTED }}>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: `${L.bolinha + 1}px` }}>+{cel.mais.n}</div>
                <div style={{ fontSize: L.fonteNome, lineHeight: 1.1 }}>mais</div>
              </div>
            )] : []),
          ])}
        </Fragment>
      ))}

      {/* Divisórias das colunas */}
      {lay.colunas.map((c, k) => {
        const inicioDeGrupo = lay.grupos.some(gr => gr.x === c.x)
        return (
          <div key={c.id} style={{ position: 'absolute', left: c.x, top: L.gradeY, width: 0, height: L.gradeFim - L.gradeY,
            borderLeft: inicioDeGrupo ? `1px solid ${k === 0 ? 'transparent' : '#C9CDD3'}` : '1px dashed #E3B5B5' }} />
        )
      })}
    </div>
  )
}
