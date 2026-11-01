// Onde a pessoa está, sem mandar nada para fora: primeiro pelo fuso horário do navegador; se ela pedir, pela
// localização do aparelho, comparada aqui mesmo com uma lista de cidades (a mais próxima até 250 km).

export interface Local { cidade: string; pais: string; fonte: 'fuso' | 'aparelho' }

const FUSOS: Record<string, [string, string]> = {
  'America/Sao_Paulo': ['São Paulo', 'Brasil'], 'America/Bahia': ['Salvador', 'Brasil'], 'America/Fortaleza': ['Fortaleza', 'Brasil'],
  'America/Recife': ['Recife', 'Brasil'], 'America/Belem': ['Belém', 'Brasil'], 'America/Manaus': ['Manaus', 'Brasil'],
  'America/Cuiaba': ['Cuiabá', 'Brasil'], 'America/Campo_Grande': ['Campo Grande', 'Brasil'], 'America/Porto_Velho': ['Porto Velho', 'Brasil'],
  'America/Boa_Vista': ['Boa Vista', 'Brasil'], 'America/Rio_Branco': ['Rio Branco', 'Brasil'], 'America/Maceio': ['Maceió', 'Brasil'],
  'America/Araguaina': ['Palmas', 'Brasil'], 'America/Noronha': ['Fernando de Noronha', 'Brasil'], 'America/Santarem': ['Santarém', 'Brasil'],
  'America/New_York': ['Nova York', 'Estados Unidos'], 'America/Chicago': ['Chicago', 'Estados Unidos'], 'America/Denver': ['Denver', 'Estados Unidos'],
  'America/Los_Angeles': ['Los Angeles', 'Estados Unidos'], 'America/Toronto': ['Toronto', 'Canadá'], 'America/Mexico_City': ['Cidade do México', 'México'],
  'America/Bogota': ['Bogotá', 'Colômbia'], 'America/Lima': ['Lima', 'Peru'], 'America/Santiago': ['Santiago', 'Chile'],
  'America/Argentina/Buenos_Aires': ['Buenos Aires', 'Argentina'], 'America/Buenos_Aires': ['Buenos Aires', 'Argentina'], 'America/Montevideo': ['Montevidéu', 'Uruguai'],
  'America/Asuncion': ['Assunção', 'Paraguai'], 'America/Caracas': ['Caracas', 'Venezuela'],
  'Europe/Lisbon': ['Lisboa', 'Portugal'], 'Europe/London': ['Londres', 'Reino Unido'], 'Europe/Madrid': ['Madri', 'Espanha'], 'Europe/Paris': ['Paris', 'França'],
  'Europe/Berlin': ['Berlim', 'Alemanha'], 'Europe/Amsterdam': ['Amsterdã', 'Países Baixos'], 'Europe/Rome': ['Roma', 'Itália'], 'Europe/Zurich': ['Zurique', 'Suíça'],
  'Europe/Dublin': ['Dublin', 'Irlanda'], 'Europe/Stockholm': ['Estocolmo', 'Suécia'], 'Europe/Helsinki': ['Helsinque', 'Finlândia'],
  'Asia/Tokyo': ['Tóquio', 'Japão'], 'Asia/Seoul': ['Seul', 'Coreia do Sul'], 'Asia/Shanghai': ['Xangai', 'China'], 'Asia/Hong_Kong': ['Hong Kong', 'China'],
  'Asia/Singapore': ['Singapura', 'Singapura'], 'Asia/Kolkata': ['Mumbai', 'Índia'], 'Asia/Dubai': ['Dubai', 'Emirados Árabes Unidos'],
  'Asia/Jerusalem': ['Jerusalém', 'Israel'], 'Asia/Tel_Aviv': ['Tel Aviv', 'Israel'], 'Australia/Sydney': ['Sydney', 'Austrália'],
  'Africa/Johannesburg': ['Joanesburgo', 'África do Sul'], 'Africa/Lagos': ['Lagos', 'Nigéria'], 'Africa/Cairo': ['Cairo', 'Egito'],
}

/** Cidade e país pelo fuso do navegador (o fuso de São Paulo vale para quase todo o Sudeste, Sul e Centro-Oeste). */
export function localPeloFuso(fuso: string): Local {
  const conhecido = FUSOS[fuso]
  if (conhecido) return { cidade: conhecido[0], pais: conhecido[1], fonte: 'fuso' }
  const cidade = fuso.split('/').pop()?.replace(/_/g, ' ') || 'algum lugar'
  return { cidade, pais: 'no mundo', fonte: 'fuso' }
}

// Capitais do Brasil, polos de tecnologia e grandes cidades do mundo: [cidade, país, latitude, longitude].
const CIDADES: [string, string, number, number][] = [
  ['São Paulo', 'Brasil', -23.55, -46.63], ['Rio de Janeiro', 'Brasil', -22.91, -43.17], ['Belo Horizonte', 'Brasil', -19.92, -43.94],
  ['Brasília', 'Brasil', -15.79, -47.88], ['Curitiba', 'Brasil', -25.43, -49.27], ['Porto Alegre', 'Brasil', -30.03, -51.23],
  ['Florianópolis', 'Brasil', -27.6, -48.55], ['Salvador', 'Brasil', -12.97, -38.5], ['Recife', 'Brasil', -8.05, -34.88],
  ['Fortaleza', 'Brasil', -3.73, -38.52], ['Natal', 'Brasil', -5.79, -35.21], ['João Pessoa', 'Brasil', -7.12, -34.86],
  ['Maceió', 'Brasil', -9.67, -35.74], ['Aracaju', 'Brasil', -10.91, -37.07], ['Teresina', 'Brasil', -5.09, -42.8],
  ['São Luís', 'Brasil', -2.53, -44.3], ['Belém', 'Brasil', -1.46, -48.49], ['Macapá', 'Brasil', 0.03, -51.07],
  ['Manaus', 'Brasil', -3.12, -60.02], ['Boa Vista', 'Brasil', 2.82, -60.67], ['Porto Velho', 'Brasil', -8.76, -63.9],
  ['Rio Branco', 'Brasil', -9.97, -67.81], ['Palmas', 'Brasil', -10.18, -48.33], ['Goiânia', 'Brasil', -16.69, -49.26],
  ['Cuiabá', 'Brasil', -15.6, -56.1], ['Campo Grande', 'Brasil', -20.47, -54.62], ['Vitória', 'Brasil', -20.32, -40.34],
  ['Campinas', 'Brasil', -22.91, -47.06], ['Ribeirão Preto', 'Brasil', -21.18, -47.81], ['São José dos Campos', 'Brasil', -23.18, -45.89],
  ['Santos', 'Brasil', -23.96, -46.33], ['Uberlândia', 'Brasil', -18.92, -48.28], ['Londrina', 'Brasil', -23.31, -51.16],
  ['Joinville', 'Brasil', -26.3, -48.85], ['Juiz de Fora', 'Brasil', -21.76, -43.35],
  ['San Francisco', 'Estados Unidos', 37.77, -122.42], ['San José', 'Estados Unidos', 37.34, -121.89], ['Seattle', 'Estados Unidos', 47.61, -122.33],
  ['Los Angeles', 'Estados Unidos', 34.05, -118.24], ['Austin', 'Estados Unidos', 30.27, -97.74], ['Nova York', 'Estados Unidos', 40.71, -74.01],
  ['Boston', 'Estados Unidos', 42.36, -71.06], ['Chicago', 'Estados Unidos', 41.88, -87.63], ['Miami', 'Estados Unidos', 25.76, -80.19],
  ['Toronto', 'Canadá', 43.65, -79.38], ['Cidade do México', 'México', 19.43, -99.13], ['Bogotá', 'Colômbia', 4.71, -74.07],
  ['Lima', 'Peru', -12.05, -77.04], ['Santiago', 'Chile', -33.45, -70.67], ['Buenos Aires', 'Argentina', -34.6, -58.38],
  ['Montevidéu', 'Uruguai', -34.9, -56.16], ['Lisboa', 'Portugal', 38.72, -9.14], ['Porto', 'Portugal', 41.15, -8.61],
  ['Madri', 'Espanha', 40.42, -3.7], ['Barcelona', 'Espanha', 41.39, 2.17], ['Londres', 'Reino Unido', 51.51, -0.13],
  ['Dublin', 'Irlanda', 53.35, -6.26], ['Paris', 'França', 48.86, 2.35], ['Amsterdã', 'Países Baixos', 52.37, 4.9],
  ['Berlim', 'Alemanha', 52.52, 13.4], ['Munique', 'Alemanha', 48.14, 11.58], ['Zurique', 'Suíça', 47.38, 8.54],
  ['Milão', 'Itália', 45.46, 9.19], ['Estocolmo', 'Suécia', 59.33, 18.07], ['Helsinque', 'Finlândia', 60.17, 24.94],
  ['Tel Aviv', 'Israel', 32.09, 34.78], ['Dubai', 'Emirados Árabes Unidos', 25.2, 55.27], ['Mumbai', 'Índia', 19.08, 72.88],
  ['Bangalore', 'Índia', 12.97, 77.59], ['Singapura', 'Singapura', 1.35, 103.82], ['Hong Kong', 'China', 22.32, 114.17],
  ['Shenzhen', 'China', 22.54, 114.06], ['Xangai', 'China', 31.23, 121.47], ['Pequim', 'China', 39.9, 116.41],
  ['Seul', 'Coreia do Sul', 37.57, 126.98], ['Tóquio', 'Japão', 35.68, 139.69], ['Sydney', 'Austrália', -33.87, 151.21],
  ['Joanesburgo', 'África do Sul', -26.2, 28.05], ['Lagos', 'Nigéria', 6.52, 3.38], ['Cairo', 'Egito', 30.04, 31.24],
]

function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = (g: number) => (g * Math.PI) / 180
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

/** A cidade da lista mais próxima das coordenadas (até 250 km); longe de todas, null. */
export function cidadeMaisProxima(lat: number, lon: number, raioKm = 250): Local | null {
  let melhor: { c: (typeof CIDADES)[number]; d: number } | null = null
  for (const c of CIDADES) {
    const d = distanciaKm(lat, lon, c[2], c[3])
    if (!melhor || d < melhor.d) melhor = { c, d }
  }
  return melhor && melhor.d <= raioKm ? { cidade: melhor.c[0], pais: melhor.c[1], fonte: 'aparelho' } : null
}
