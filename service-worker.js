// キャッシュ名を更新してバージョンアップします
// バージョンを上げることで既存のキャッシュを無効化します
const CACHE_NAME = 'matching-app-cache-v6';
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './profiles.html',
  './events.html',
  './calendar.html',
  './edit-profile.html',
  './manifest.json',
  './style.css',
  // JavaScript files
  './index.js',
  './login.js',
  './profiles.js',
  './events.js',
  './calendar.js',
  './edit-profile.js',
  './supabaseClient.js',
  // icons
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});