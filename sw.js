const assetCacheName = 'restaurant-review-cache-v3';
// jhgjhgdsfgjhdsf

self.addEventListener('install', (event) => {
  console.log('Service worker installed.');
  caches.open(assetCacheName).then((cache) => {
    console.log('Cache opened');
  })
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurant-review-') &&
                 cacheName !== assetCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if(url.origin === location.origin) {
    event.respondWith(
      caches.open(assetCacheName)
      .then((cache) => {
        return cache.match(url.pathname).then((response) => {
          if (response) return response;

          return fetch(url.pathname).then((fetchResponse) => {
            cache.put(url.pathname, fetchResponse.clone())
            return fetchResponse;
          }, (error) => {
            console.log(error);
          })
        })
      })
    )
  }
});

self.addEventListener('message', (event) => {
  if(event.data.action === 'skipWaiting') {
    console.log('SkipWaiting');
    self.skipWaiting();
  }
});