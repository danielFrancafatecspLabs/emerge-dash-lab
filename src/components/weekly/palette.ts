// Paleta compartilhada entre os slides da Weekly — mesma marca (vermelho
// Claro, ver tailwind.config.ts `brand.red`), mesma rampa ordinal validada
// com a skill de dataviz (monotônica, ΔL >= 0.06, contraste do texto branco
// entre 5.8:1 e 19.9:1 em todos os degraus — scripts/validate_palette.js
// --ordinal). Um único lugar evita a rampa divergir entre slides.
export const RED = '#8B0000'
export const CLARO_RED = '#CC0000'     // brand.red — vermelho principal da marca Claro
export const CLARO_DARKER = '#6B0000' // brand.darker
export const CLARO_LIGHT = '#FFE5E5'  // brand.light
export const CLARO_LIGHTER = '#FFF5F5' // brand.lighter
export const WARNING_INK = '#92400E'
export const WARNING_LIGHT = '#FEF3C7'
export const WARNING_LIGHTER = '#FFFBEB'
export const RAMP = ['#C42420', '#A81715', '#8B1210', '#6E0E0D', '#500908', '#350505', '#1A0202']
// Rampa âmbar (6 degraus, mesmo matiz de WARNING_INK) — usada na esteira do
// slide de Bloqueios, para diferenciar visualmente de "Governança" (vermelho)
// mantendo a mesma linguagem de funil conectado. Validada com a skill de
// dataviz — scripts/validate_palette.js --ordinal.
export const WARNING_RAMP = ['#D97706', '#B45309', '#92400E', '#6B330A', '#4A2306', '#2E1504']
