self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'GAMZELİECZANEM', {
      body: data.body || 'Sepetinizdeki ürünler sizi bekliyor!',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'cart-abandonment',
      renotify: true,
      data: { url: '/sepet' },
      actions: [
        { action: 'open', title: '🛒 Sepete Git' },
        { action: 'close', title: 'Kapat' },
      ],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'close') return
  const url = event.notification.data?.url || '/sepet'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/sepet') && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
