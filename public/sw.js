const CACHE_NAME = 'nolgong-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/nolgong/'])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // OAuth 콜백 및 Supabase 인증 요청은 서비스워커가 처리하지 않음
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.searchParams.has('code') ||
    url.searchParams.has('error')
  ) {
    return
  }

  // Network-first: 네트워크 우선, 실패 시 캐시 폴백
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
      }
      return response
    }).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match('/nolgong/'))
    )
  )
})
