'use client'

// Slide "beOn Labs — visão geral" do deck do Comitê (V6), reproduzido nas coordenadas, cores e fontes do
// slide original (templates/comite-resumo.pptx) e preenchido com os dados do Jira. As posições estão em EMU
// (a unidade do PowerPoint) e são convertidas para o canvas de 1280×720 da Weekly.

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { ComiteResumoView } from '@/lib/comite-resumo'

export const SLIDE_W = 1280
export const SLIDE_H = 720

const K = SLIDE_W / 9_144_000                  // px por EMU
const px = (emu: number) => emu * K
const pt = (centesimos: number) => (centesimos / 100) * 12_700 * K   // tamanho de fonte (sz do PowerPoint)

const ARIAL = 'Arial, "Helvetica Neue", Helvetica, sans-serif'
const CALIBRI = 'Calibri, Carlito, "Segoe UI", Arial, sans-serif'
const SOMBRA = `0 ${px(25_400)}px ${px(101_600)}px rgba(0,0,0,0.07)`
const BORDA = '#E5E7EB'

type Caixa = [x: number, y: number, w: number, h: number]

const posicao = ([x, y, w, h]: Caixa): CSSProperties => ({ position: 'absolute', left: px(x), top: px(y), width: px(w), height: px(h) })

function Forma({ e, style, children }: { e: Caixa; style?: CSSProperties; children?: ReactNode }) {
  return <div style={{ ...posicao(e), ...style }}>{children}</div>
}

/** Retângulo arredondado: `adj` é o raio em 100 000 avos do lado menor (como no PowerPoint). */
function Cartao({ e, adj, fundo = '#fff', borda, sombra }: { e: Caixa; adj: number; fundo?: string; borda?: string; sombra?: boolean }) {
  return (
    <Forma e={e} style={{
      background: fundo, borderRadius: px(Math.min(e[2], e[3]) * adj / 100_000),
      border: borda ? `1px solid ${borda}` : undefined, boxShadow: sombra ? SOMBRA : undefined, boxSizing: 'border-box',
    }} />
  )
}

function Circulo({ e, cor }: { e: Caixa; cor: string }) {
  return <Forma e={e} style={{ background: cor, borderRadius: '50%' }} />
}

function Imagem({ e, src }: { e: Caixa; src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/jira/comite/${src}`} alt="" aria-hidden style={{ ...posicao(e), objectFit: 'contain' }} />
}

function Linha({ e }: { e: Caixa }) {
  const vertical = e[2] === 0
  return <Forma e={[e[0], e[1], vertical ? 9_525 : e[2], vertical ? e[3] : 9_525]} style={{ background: BORDA }} />
}

/** Texto ancorado como no PowerPoint (topo, centro ou base), sem margens internas. */
function Texto({ e, ancora = 'ctr', alinhar = 'left', padrao = false, children, entrelinha = 1.15 }: {
  e: Caixa; ancora?: 't' | 'ctr' | 'b'; alinhar?: 'left' | 'center' | 'right'; padrao?: boolean; entrelinha?: number; children: ReactNode
}) {
  return (
    <div style={{
      ...posicao(e), display: 'flex', flexDirection: 'column',
      justifyContent: ancora === 't' ? 'flex-start' : ancora === 'b' ? 'flex-end' : 'center',
      textAlign: alinhar, lineHeight: entrelinha,
      // Caixas de texto padrão do PowerPoint têm 0,1" de margem lateral e 0,05" vertical.
      padding: padrao ? `${px(45_720)}px ${px(91_440)}px` : 0, boxSizing: 'border-box',
    }}>
      {children}
    </div>
  )
}

function R({ sz, b, cor = '#000', fonte = ARIAL, children, espaco }: { sz: number; b?: boolean; cor?: string; fonte?: string; children: ReactNode; espaco?: number }) {
  return (
    <span style={{ fontSize: pt(sz), fontWeight: b ? 700 : 400, color: cor, fontFamily: fonte, whiteSpace: 'pre-wrap', letterSpacing: espaco ? pt(espaco) : undefined }}>
      {children}
    </span>
  )
}

/** Seta (homePlate/chevron do PowerPoint) com ponta de metade da altura. */
function Seta({ e, cor, entalhe }: { e: Caixa; cor: string; entalhe: boolean }) {
  const d = (e[3] / 2 / e[2]) * 100
  const pontos = entalhe
    ? `0 0, ${100 - d}% 0, 100% 50%, ${100 - d}% 100%, 0 100%, ${d}% 50%`
    : `0 0, ${100 - d}% 0, 100% 50%, ${100 - d}% 100%, 0 100%`
  return <Forma e={e} style={{ background: cor, clipPath: `polygon(${pontos})` }} />
}

/** Anel de percentual: fundo cinza e arco vermelho a partir do topo, no sentido horário. */
function Anel({ e, pct }: { e: Caixa; pct: number }) {
  const lado = px(e[2])
  const espessura = px(e[2] * 0.13)
  const r = (lado - espessura) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, pct))
  return (
    <svg style={posicao(e)} viewBox={`0 0 ${lado} ${lado}`} aria-hidden>
      <circle cx={lado / 2} cy={lado / 2} r={r} fill="none" stroke="#EDEDEF" strokeWidth={espessura} />
      {p > 0 && (
        <circle cx={lado / 2} cy={lado / 2} r={r} fill="none" stroke="#CC0000" strokeWidth={espessura}
          strokeDasharray={`${(c * p) / 100} ${c}`} transform={`rotate(-90 ${lado / 2} ${lado / 2})`} />
      )}
    </svg>
  )
}

function Detalhes({ e, href }: { e: Caixa; href: string }) {
  return (
    <Link href={href} title="Ver a lista na aba Semanal" style={{
      ...posicao(e), display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
      border: '1px solid #C00000', borderRadius: px(e[3] * 0.16667), background: '#fff',
      fontFamily: CALIBRI, fontSize: pt(800), fontWeight: 700, color: '#C00000', textDecoration: 'underline',
    }}>
      DETALHES
    </Link>
  )
}

const FATIAS: Record<ComiteResumoView['fatias'][number]['id'], { ponto: Caixa; texto: Caixa; rotulo: Caixa; barra: Caixa; cor: string; szPct: number; szRotulo: number }> = {
  exploracao: { ponto: [2116940, 837013, 89154, 89154], texto: [2287014, 751836, 508984, 271580], rotulo: [2215103, 1028041, 714785, 201168], barra: [2182270, 1235665, 720000, 68580], cor: '#F79646', szPct: 800, szRotulo: 700 },
  andamento: { ponto: [2976174, 827119, 89154, 89154], texto: [3089260, 741946, 714785, 288036], rotulo: [3060232, 1024083, 714785, 201168], barra: [2994074, 1237647, 828000, 68579], cor: '#E57373', szPct: 800, szRotulo: 700 },
  validadas: { ponto: [4011061, 827119, 89154, 89154], texto: [4168575, 724249, 604859, 288036], rotulo: [3959754, 1043303, 875224, 175788], barra: [3927412, 1243584, 1008000, 72000], cor: '#CC0000', szPct: 750, szRotulo: 750 },
  refutadas: { ponto: [5034373, 838250, 89154, 89154], texto: [5175881, 737571, 540735, 288036], rotulo: [5047866, 1043303, 875224, 183471], barra: [5021016, 1238553, 864000, 64835], cor: '#C4C7CE', szPct: 750, szRotulo: 750 },
  cancelados: { ponto: [6079039, 850330, 89154, 89154], texto: [6219293, 735380, 604859, 288036], rotulo: [6219293, 1023416, 604859, 201168], barra: [5996739, 1237685, 900000, 68580], cor: '#6B0000', szPct: 750, szRotulo: 750 },
}
// A barra de "Em andamento" é mais clara que o ponto, como no deck.
const COR_BARRA: Partial<Record<keyof typeof FATIAS, string>> = { andamento: '#F2B8B8' }

const METRICAS_X = [308610, 2464251, 4619892, 6775532]

function Numero({ e, valor, rotulo }: { e: Caixa; valor: string; rotulo: string }) {
  return (
    <Texto e={e} ancora="b">
      <span><R sz={2250} b cor="#1A1A1A">{valor}</R><R sz={825} cor="#6B7280">{`  ${rotulo}`}</R></span>
    </Texto>
  )
}

export function ComiteResumoSlide({ v, detalhesBase = '/semanal' }: { v: ComiteResumoView; detalhesBase?: string }) {
  const link = (secao: string) => `${detalhesBase}#semanal-${secao}`
  return (
    <div style={{ position: 'relative', width: SLIDE_W, height: SLIDE_H, background: '#fff', overflow: 'hidden', fontFamily: ARIAL }}>
      {/* Título */}
      <Texto e={[308610, 224023, 2259141, 397764]}><span><R sz={2250} b cor="#CC0000">beOn Labs</R></span></Texto>
      <Texto e={[1836045, 381000, 1501263, 215444]} ancora="t" padrao><span><R sz={800} b fonte={CALIBRI}>{v.ateLabel}</R></span></Texto>
      <Imagem e={[8172221, 249269, 662940, 315468]} src="logo.png" />

      {/* Total de experimentos */}
      <Cartao e={[308609, 641953, 6642571, 740664]} adj={8333} borda={BORDA} sombra />
      <Circulo e={[486918, 854551, 315468, 315468]} cor="#FFF5F5" />
      <Imagem e={[568940, 936573, 151425, 151425]} src="frasco.png" />
      <Texto e={[912114, 724249, 1165860, 370332]}><span><R sz={2550} b cor="#CC0000">{v.total}</R></span></Texto>
      <Texto e={[912114, 1108297, 1303020, 164592]}><span><R sz={788} cor="#6B7280">Total de experimentos no beOn Labs</R></span></Texto>
      <Linha e={[2084832, 765397, 0, 493776]} />
      {v.fatias.map(f => {
        const g = FATIAS[f.id]
        return (
          <div key={f.id}>
            <Circulo e={g.ponto} cor={g.cor} />
            <Texto e={g.texto} ancora="b"><span><R sz={1650} b cor="#1A1A1A">{f.numero}</R><R sz={g.szPct} cor="#6B7280">{`  ${f.pct}`}</R></span></Texto>
            <Texto e={g.rotulo} ancora="t"><span><R sz={g.szRotulo} cor="#6B7280">{f.label}</R></span></Texto>
            <Forma e={g.barra} style={{ background: COR_BARRA[f.id] ?? g.cor }} />
          </div>
        )
      })}

      {/* Benefício potencial total */}
      <Cartao e={[7048296, 641953, 1786865, 740664]} adj={8333} fundo="#1F1F1F" sombra />
      <Texto e={[7112036, 711956, 1936013, 329184]}><span><R sz={1200} b cor="#fff">{v.beneficioTotal}</R></span></Texto>
      <Texto e={[7119050, 987698, 2189759, 150876]}><span><R sz={788} cor="#E4E4E7">Benefício potencial total</R></span></Texto>
      <Texto e={[7113112, 1178300, 2313203, 123444]}>
        <span><R sz={600} cor="#A1A1AA">{v.beneficioTotalNota.replace(/ (\d+ experimentos?)$/, '\n$1')}</R></span>
      </Texto>
      <Circulo e={[8409965, 717895, 274320, 274320]} cor="#CC0000" />
      <Imagem e={[8481289, 789219, 131674, 131674]} src="moedas.png" />

      {/* Funil: Exploração → Experimentação → Piloto → Em escala */}
      <Seta e={[308611, 1569322, 2103947, 548953]} cor="#FFE5E5" entalhe={false} />
      <Circulo e={[445770, 1737455, 219456, 219456]} cor="#CC0000" />
      <Texto e={[445770, 1731105, 219456, 219456]} alinhar="center"><span><R sz={900} b cor="#fff">1</R></span></Texto>
      <Texto e={[761239, 1702149, 1453895, 315468]}>
        <span><R sz={800} b cor="#8B0000">Exploração</R></span>
        <span><R sz={800} fonte={CALIBRI}>Entender e validar o problema, o benefício potencial e definir as bases para experimentação</R></span>
      </Texto>
      <Seta e={[2215134, 1566437, 2157353, 561162]} cor="#F7C6C6" entalhe />
      <Circulo e={[2567751, 1724755, 219456, 219456]} cor="#6B0000" />
      <Texto e={[2567751, 1724755, 219456, 219456]} alinhar="center"><span><R sz={900} b cor="#fff">2</R></span></Texto>
      <Texto e={[2851470, 1708499, 1357882, 315468]}>
        <span><R sz={800} b cor="#6B0000">Experimentação</R></span>
        <span><R sz={800} fonte={CALIBRI}>Testar hipóteses rapidamente para gerar evidências e reduzir incertezas.</R></span>
      </Texto>
      <Seta e={[4209352, 1572101, 2905911, 552712]} cor="#CC0000" entalhe />
      <Circulo e={[4578481, 1750155, 219456, 219456]} cor="#fff" />
      <Texto e={[4578481, 1750155, 219456, 219456]} alinhar="center"><span><R sz={900} b cor="#CC0000">3</R></span></Texto>
      <Texto e={[4849500, 1683099, 2050117, 315468]}>
        <span><R sz={900} b cor="#fff" fonte={CALIBRI}>Piloto</R></span>
        <span><R sz={800} cor="#fff" fonte={CALIBRI}>Aguardando e em execução. Validar solução em ambiente controlado e confirmar seu potencial de escala.</R></span>
      </Texto>
      <Seta e={[6951180, 1574887, 2006815, 552712]} cor="#6B0000" entalhe />
      <Circulo e={[7238706, 1750155, 219456, 219456]} cor="#fff" />
      <Texto e={[7238706, 1743805, 219456, 219456]} alinhar="center"><span><R sz={900} b cor="#6B0000">4</R></span></Texto>
      <Texto e={[7483513, 1587587, 1382306, 475591]}>
        <span><R sz={800} b cor="#fff">Em escala</R></span>
        <span><R sz={700} cor="#fff" fonte={CALIBRI}>Operar, evoluir e ampliar a adoção da solução, maximizando a geração de valor para o negócio.</R></span>
      </Texto>

      {/* Exploração */}
      <Cartao e={[308611, 2242917, 1863917, 1773606]} adj={4500} borda={BORDA} sombra />
      <Texto e={[512978, 2383957, 1604686, 356616]} ancora="b">
        <span><R sz={700} b cor="#7F7F7F">{v.exploracao.ideiasNaoAvaliadas}</R></span>
        <span><R sz={2250} b cor="#1A1A1A">{v.exploracao.oportunidades}</R><R sz={825} cor="#6B7280">{`  ${v.exploracao.oportunidadesLabel}`}</R></span>
      </Texto>
      <Linha e={[459487, 2783935, 1562165, 0]} />
      <Texto e={[459487, 2852515, 1562165, 150876]}><span><R sz={713} cor="#6B7280">Benefício potencial</R></span></Texto>
      <Texto e={[459487, 3059525, 1562165, 233172]}><span><R sz={1275} b cor="#CC0000">{v.exploracao.beneficio}</R></span></Texto>
      <Circulo e={[459486, 3481180, 205740, 205740]} cor="#FFF5F5" />
      <Imagem e={[512978, 3526721, 98756, 98756]} src="lampada.png" />
      <Texto e={[727272, 3434173, 1287845, 288036]}><span><R sz={675} cor="#3F3F46">Triagem e priorização de ideias</R></span></Texto>
      <Detalhes e={[464078, 3785175, 1576219, 150876]} href={link('backlog')} />

      {/* Experimentação */}
      <Cartao e={[2268540, 2242917, 1863917, 1778252]} adj={4500} borda={BORDA} sombra />
      <Numero e={[2419416, 2331307, 1562165, 356616]} valor={v.experimentacao.experimentos} rotulo={v.experimentacao.experimentosLabel} />
      <Linha e={[2419416, 2783935, 1562165, 0]} />
      <Texto e={[2419416, 2852515, 1562165, 150876]}><span><R sz={713} cor="#6B7280">Benefício potencial</R></span></Texto>
      <Texto e={[2419416, 3046825, 1562165, 233172]}><span><R sz={1275} b cor="#CC0000">{v.experimentacao.beneficio}</R></span></Texto>
      <Circulo e={[2419415, 3467184, 205740, 205740]} cor="#FFF5F5" />
      <Imagem e={[2472908, 3514326, 98756, 98756]} src="engrenagem.png" />
      <Texto e={[2664396, 3421145, 1492213, 288036]}><span><R sz={675} cor="#3F3F46">Construção e validação da solução</R></span></Texto>
      <Detalhes e={[2420827, 3782555, 1576219, 150876]} href={link('andamento')} />

      {/* Piloto */}
      <Cartao e={[4228470, 2250658, 2646763, 1773605]} adj={4500} borda={BORDA} sombra />
      <Numero e={[4379346, 2302751, 2345011, 356616]} valor={v.piloto.experimentos} rotulo={v.piloto.experimentosLabel} />
      <Linha e={[4379346, 2708008, 2345011, 0]} />
      <Texto e={[4387916, 2763615, 1562165, 150876]}><span><R sz={713} cor="#6B7280">Benefício potencial</R></span></Texto>
      <Texto e={[4385797, 2914815, 1172506, 205740]}><span><R sz={788} b cor="#C00000">{v.piloto.aguardando}</R></span></Texto>
      <Texto e={[5322242, 2910884, 1407007, 205740]} alinhar="right"><span><R sz={900} b cor="#CC0000">{v.piloto.aguardandoBeneficio}</R></span></Texto>
      <Texto e={[4385797, 3101647, 1172506, 205740]}><span><R sz={788} b cor="#1A1A1A">{v.piloto.execucao}</R></span></Texto>
      <Texto e={[5256714, 3080607, 1469752, 205740]} alinhar="right"><span><R sz={900} b cor="#CC0000">{v.piloto.execucaoBeneficio}</R></span></Texto>
      {v.piloto.outlier && (
        <>
          <Cartao e={[4464299, 3331539, 2325980, 112686]} adj={50000} fundo="#D9D9D9" sombra />
          <Imagem e={[4584299, 3346604, 78882, 78883]} src="alerta.png" />
          <Texto e={[4711187, 3293560, 425195, 192024]}><span><R sz={500} b cor="#92400E">Outlier</R></span></Texto>
          <Texto e={[5072331, 3299021, 1562165, 150877]}><span><R sz={600} b fonte={CALIBRI}>{v.piloto.outlier}</R></span></Texto>
        </>
      )}
      <Circulo e={[4379345, 3474894, 205740, 205740]} cor="#FFF5F5" />
      <Imagem e={[4448739, 3532085, 98756, 98756]} src="pipeta.png" />
      <Texto e={[4653666, 3438852, 2070691, 288036]}><span><R sz={675} cor="#3F3F46">Avaliação e execução de pilotos em ambiente real</R></span></Texto>
      <Detalhes e={[4832334, 3778853, 1576219, 150876]} href={link('aguardando')} />

      {/* Em escala */}
      <Cartao e={[6971245, 2250659, 1863917, 1773604]} adj={4500} borda={BORDA} sombra />
      <Numero e={[7122121, 2283249, 1562165, 356616]} valor={v.escala.experimentos} rotulo={v.escala.experimentosLabel} />
      <Linha e={[7122121, 2719935, 1562165, 0]} />
      <Texto e={[7122121, 2772611, 1562165, 150876]}><span><R sz={713} cor="#6B7280">Benefício potencial</R></span></Texto>
      <Texto e={[7122121, 2933624, 1562165, 233172]}><span><R sz={1275} b cor="#CC0000">{v.escala.beneficio}</R></span></Texto>
      <Circulo e={[7122120, 3465250, 205740, 205740]} cor="#FFF5F5" />
      <Imagem e={[7175612, 3518742, 98756, 98756]} src="foguete.png" />
      <Texto e={[7396441, 3424102, 1287845, 288036]}><span><R sz={675} cor="#3F3F46">Escala e geração de valor</R></span></Texto>
      <Detalhes e={[7160710, 3773861, 1576219, 150876]} href={link('escala')} />

      {/* Principais métricas */}
      <Texto e={[308610, 4117181, 4114800, 150876]}><span><R sz={750} b cor="#CC0000" espaco={150}>PRINCIPAIS MÉTRICAS</R></span></Texto>
      {v.metricas.slice(0, 4).map((m, i) => {
        const x = METRICAS_X[i]
        const dx = x - 308610
        return (
          <div key={m.titulo}>
            <Cartao e={[x, 4309205, 2059629, 548640]} adj={11250} borda={BORDA} sombra />
            <Anel e={[432054 + dx, 4377785, 411480, 411480]} pct={m.pct} />
            <Texto e={[432054 + dx, 4377785, 411480, 411480]} alinhar="center"><span><R sz={900} b cor="#1A1A1A">{m.pctLabel}</R></span></Texto>
            <Texto e={[953262 + dx, 4398359, 1305249, 164592]}><span><R sz={825} b cor="#1A1A1A">{m.titulo}</R></span></Texto>
            <Texto e={[953262 + dx, 4562951, 1305249, 246888]} entrelinha={1.2}><span><R sz={675} cor="#6B7280">{m.descricao}</R></span></Texto>
          </div>
        )
      })}
    </div>
  )
}
