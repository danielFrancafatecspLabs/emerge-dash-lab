import assert from 'node:assert/strict'
import test from 'node:test'
import config from '../next.config.mjs'

async function headersFor(path) {
  const rules = await config.headers()
  const headers = new Map()
  for (const rule of rules) {
    if (rule.source === '/:path*' || (rule.source === '/osint-app/:path*' && path.startsWith('/osint-app/'))) {
      for (const { key, value } of rule.headers) headers.set(key.toLowerCase(), value)
    }
  }
  return headers
}

test('OSINT assets allow framing only by the same origin and retain other protections', async () => {
  for (const path of ['/osint-app/index.html', '/osint-app/assets/app.js']) {
    const headers = await headersFor(path)
    assert.equal(headers.get('x-frame-options'), 'SAMEORIGIN')
    assert.equal(headers.get('content-security-policy'), "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'")
    assert.equal(headers.get('x-content-type-options'), 'nosniff')
  }
})

test('ordinary pages, APIs and lookalike paths remain protected from framing', async () => {
  for (const path of ['/login', '/osint', '/api/osint/health', '/osint-app-other/index.html']) {
    const headers = await headersFor(path)
    assert.equal(headers.get('x-frame-options'), 'DENY')
    assert.match(headers.get('content-security-policy'), /frame-ancestors 'none'/)
  }
})
