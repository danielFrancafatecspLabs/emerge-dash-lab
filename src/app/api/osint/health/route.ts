import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Modo offline/determinístico: sem Gemini. O app lê aiEnabled daqui.
export async function GET() {
  return NextResponse.json({ status: 'ok', aiEnabled: false, hasApiKey: false, aiActive: false })
}
