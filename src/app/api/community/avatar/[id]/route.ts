import { NextResponse } from 'next/server'
import { lerFoto } from '@/lib/auth/account'

export const dynamic = 'force-dynamic'

/** Foto de perfil enviada em Meu perfil (exige sessão, como o resto de /api/community). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const foto = lerFoto(params.id)
  if (!foto) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
  // O endereço muda a cada nova foto (?v=), então pode ficar em cache.
  return new NextResponse(new Uint8Array(foto.bytes), {
    headers: { 'Content-Type': foto.mime, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  })
}
