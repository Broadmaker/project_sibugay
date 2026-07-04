const CACHE = 'sibugay-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'css/styles.css',
  'js/app.js',
  'pages/home.html',
  'pages/browse.html',
  'pages/activities.html',
  'pages/culture.html',
  'pages/profile.html',
  'pages/word-detail.html',
  'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); })
      );
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var fetchPromise = fetch(event.request).then(function (response) {
        if (response && response.ok && event.request.method === 'GET') {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
