import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth/request'
import { versaoDoApp } from '@/lib/osint/app-files'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Versão do app OSINT no ar e a última verificação do deploy automático (o detalhe do erro só para admins). */
export async function GET(request: NextRequest) {
  const v = versaoDoApp()
  const admin = !!await getAdmin(request)
  return NextResponse.json({
    ...v,
    admin,
    deploy: v.deploy && (admin ? v.deploy : { ...v.deploy, message: '', step: '' }),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
