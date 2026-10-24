import { NextResponse } from 'next/server'

// O vault é somente leitura em produção; o app já guarda a importação no navegador (localStorage).
export async function POST() {
  return NextResponse.json({ error: 'Persistência no servidor desativada' }, { status: 405 })
}
