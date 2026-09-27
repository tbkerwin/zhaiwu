// 负债追踪 PWA Service Worker
const CACHE_NAME = 'zhaiwu-v11';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css?v=11',
  './js/app.js?v=11',
  './js/data.js?v=11',
  './assets.json',
  './manifest.json',
  './icons/icon.svg'
];

// 安装时预缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 单个资源失败不影响整体安装
      return Promise.all(
        urlsToCache.map(url => cache.add(url).catch(err => console.warn('预缓存失败：', url, err)))
      );
    })
  );
  self.skipWaiting();
});

// 激活时清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求
// HTML 导航请求：网络优先（保证拿到最新版本），离线时回退缓存
// 静态资源：缓存优先（带版本号，更新时通过查询串自然失效）
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  // 页面导航请求
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：缓存优先，后台更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
