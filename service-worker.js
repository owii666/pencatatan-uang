/* =====================================================================
   KEUANGANKU — Service Worker (PWA)
   ---------------------------------------------------------------------
   Strategi caching:
   - Navigasi halaman (HTML) : NETWORK FIRST  -> pengguna selalu menerima
     versi terbaru saat online; fallback ke cache saat offline.
   - Asset same-origin & CDN : STALE-WHILE-REVALIDATE -> tampil instan dari
     cache, diperbarui di latar belakang saat online.
   - Request non-GET dan request ke Google Apps Script (sinkronisasi data
     keuangan pengguna) TIDAK disentuh cache sama sekali.
   Update cache: naikkan CACHE_VERSION setiap rilis baru -> cache lama
   dihapus otomatis saat aktivasi.
   ===================================================================== */

const CACHE_VERSION = 'keuanganku-v1.0.0';
const APP_CACHE = `${CACHE_VERSION}-app`;
const CDN_CACHE = `${CACHE_VERSION}-cdn`;

/* App shell: dibuat ulang saat instalasi dengan cache 'reload' agar tidak
   tercemar cache HTTP browser yang usang. */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png'
];

/* Whitelist CDN pihak ketiga yang boleh di-cache (CSS/JS/font aplikasi).
   Host di luar daftar ini TIDAK di-cache. */
const CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.tailwindcss.com',
  'unpkg.com',
  'cdn.jsdelivr.net'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await Promise.all(
      PRECACHE_URLS.map((url) =>
        cache.add(new Request(url, { cache: 'reload' }))
      )
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Hapus semua cache versi lama agar pengguna tidak terjebak versi usang
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== APP_CACHE && key !== CDN_CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

/* Halaman: network first, fallback ke cache saat offline */
async function networkFirstPage(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached =
      (await cache.match(request)) ||
      (await cache.match('/index.html')) ||
      (await cache.match('/'));
    if (cached) return cached;
    return new Response(
      '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Offline</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Anda sedang offline</h1><p>Buka kembali aplikasi setelah koneksi tersedia.</p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/* Asset: stale-while-revalidate */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkUpdate = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  return cached || (await networkUpdate) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Hanya request GET yang dipertimbangkan (POST/PUT/DELETE dilewati apa adanya)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // JANGAN pernah menyentuh/menyimpan sinkronisasi data keuangan pengguna
  if (
    url.hostname === 'script.google.com' ||
    url.hostname.endsWith('.googleusercontent.com')
  ) {
    return;
  }

  // Navigasi halaman
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // Asset same-origin
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, APP_CACHE));
    return;
  }

  // Asset CDN yang di-whitelist
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
  }
  // Host eksternal lain: dibiarkan lewat tanpa cache
});
