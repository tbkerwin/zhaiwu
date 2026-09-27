// 负债消除追踪 - Service Worker
// 策略：
//   页面导航请求 → 网络优先（联网时总能拿到最新页面）
//   Vite 静态产物 → 缓存优先（文件名带内容哈希，内容变了文件名就变）
//   带时间戳的请求 → 直接走网络，不缓存

const CACHE = 'zhaiwu-v2'
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets.json',
  './icons/icon.svg'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(CORE.map(url => cache.add(url).catch(() => null)))
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // 带时间戳的请求不做缓存（用于强制刷新）
  if (url.searchParams.has('t')) {
    event.respondWith(fetch(request))
    return
  }

  // 页面导航：网络优先，离线回退缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {})
          return response
        })
        .catch(() =>
          caches.match(request).then(r => r || caches.match('./index.html'))
        )
    )
    return
  }

  // 静态资源：缓存优先，后台更新
  event.respondWith(
    caches.match(request).then(cached => {
      const fromNetwork = fetch(request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone()
            caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {})
          }
          return response
        })
        .catch(() => cached)
      return cached || fromNetwork
    })
  )
})
