/* Service worker do push do beOn Radar: mostra a notícia (com foto, fonte e provocação) e, no clique, abre a
   discussão no fórum ou a matéria na fonte. Uma notícia por vez: a tag fixa substitui qualquer aviso anterior. */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let d = {}
  try { d = event.data ? event.data.json() : {} } catch { d = { title: 'beOn Radar', body: event.data ? event.data.text() : '' } }
  const opcoes = {
    body: d.body || 'Tem notícia nova no beOn Radar.',
    icon: d.icon || '/jira/radar-push-icone.png',
    badge: d.badge || '/jira/radar-push-badge.png',
    image: d.image,
    tag: d.tag || 'beon-radar',
    renotify: false,
    timestamp: d.timestamp || Date.now(),
    data: { url: d.url || '/jira/comunidade/newsletter', fonte: d.fonte },
    actions: [
      { action: 'discutir', title: '💬 Discutir no fórum' },
      ...(d.fonte ? [{ action: 'fonte', title: '↗ Ler na fonte' }] : []),
    ],
  }
  event.waitUntil(self.registration.showNotification(d.title || 'beOn Radar', opcoes))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const { url, fonte } = event.notification.data || {}
  if (event.action === 'fonte' && fonte) {
    event.waitUntil(self.clients.openWindow(fonte))
    return
  }
  const destino = new URL(url || '/jira/comunidade/newsletter', self.location.origin).href
  event.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const aberta = janelas.find(j => new URL(j.url).pathname.startsWith('/jira/'))
    if (aberta) {
      await aberta.focus()
      if ('navigate' in aberta) await aberta.navigate(destino)
      return
    }
    await self.clients.openWindow(destino)
  })())
})
