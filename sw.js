// 负债追踪 PWA Service Worker
const CACHE_NAME = 'zhaiwu-v8';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './assets.json',
  './manifest.json',
  './icons/icon.svg'
];

// 安装时缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
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
    })
  );
  self.clients.claim();
});

// 拦截请求：优先使用缓存，离线可用
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});