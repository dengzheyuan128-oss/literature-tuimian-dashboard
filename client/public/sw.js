/**
 * 钝学推免指南 - Service Worker
 * 提供离线访问和缓存策略
 */

const CACHE_NAME = 'tuimian-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 立即激活新 Service Worker
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // 立即控制所有页面
  self.clients.claim();
});

// 请求拦截 - 缓存优先策略（静态资源）+ 网络优先策略（API）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') return;

  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') return;

  // 跳过 Supabase API 请求（始终走网络）
  if (url.hostname.includes('supabase')) return;

  // 跳过百度统计请求
  if (url.hostname.includes('baidu.com')) return;

  // 静态资源：缓存优先
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // 只缓存成功的响应
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML 页面：网络优先，失败后使用缓存
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 缓存最新的 HTML
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // 网络失败，尝试使用缓存
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // 其他请求：网络优先
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 接收来自主线程的消息
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
