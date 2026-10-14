/* Amix service worker — офлайн-оболочка приложения.
 * Кэширует только страницу Amix, иконки и код библиотеки WebLLM с CDN.
 * Файлы самой ИИ-модели (Hugging Face / jsDelivr CDN моделей) воркер НЕ трогает —
 * их кэширует сам WebLLM в Cache Storage браузера.
 * Firebase (www.gstatic.com) тоже не кэшируется: для входа всё равно нужна сеть.
 * При выкладке новой версии index.html обязательно увеличь VERSION. */
const VERSION = 'v3';
const SHELL_CACHE = 'amix-shell-' + VERSION;
const LIB_CACHE   = 'amix-lib-'   + VERSION;

const SHELL = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'bootstrap-native.js'
];

/* Только эти хосты кэшируются воркером. Всё остальное идёт напрямую. */
const LIB_HOSTS = ['esm.run', 'cdn.jsdelivr.net'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.allSettled(
      SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' })))
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL_CACHE, LIB_CACHE];
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith('amix-') && !keep.includes(n))
        .map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
  const network = fetch(request).then((res) => {
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  if (cached) { network.catch(() => {}); return cached; }
  const res = await network;
  if (res) return res;
  if (request.mode === 'navigate') {
    const fallback = (await cache.match('index.html')) || (await cache.match('./'));
    if (fallback) return fallback;
  }
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.status === 200) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Свои файлы (index.html, иконки, manifest) — stale-while-revalidate */
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, SHELL_CACHE));
    return;
  }

  /* WebLLM с CDN — cache-first, чтобы офлайн тоже работал */
  if (LIB_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(req, LIB_CACHE));
    return;
  }

  /* Всё остальное (Firebase www.gstatic.com, huggingface.co, raw.githubusercontent.com ...)
     идёт напрямую без кэша воркера: у Firebase своя логика, а веса модели
     кэширует сам WebLLM в Cache Storage браузера. */
});