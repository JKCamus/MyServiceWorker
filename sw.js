
//sw.js
var cacheStorageKey = 'sw-test-v2';
var cacheList = [
  '/sw-test/',
  '/sw-test/index.html',
  '/sw-test/style.css',
  '/sw-test/app.js',
  '/sw-test/image-list.js',
  '/sw-test/star-wars-logo.jpg',
  '/sw-test/gallery/bountyHunters.jpg',
  '/sw-test/gallery/myLittleVader.jpg',
  '/sw-test/gallery/snowTroopers.jpg'
]
console.log('this is sw2');


// 当浏览器解析完sw.js时, 触发install事件
self.addEventListener('install', function (e) {
  console.log('install');

  // 将cacheList中要缓存的内容，通过addAll方法，请求一遍放入caches 中
  e.waitUntil(
    caches.open(cacheStorageKey).then(function (cache) {
      return cache.addAll(cacheList)
    }).then(() => {
      console.log('直接接管')
      return self.skipWaiting();
    })
  );
});

// 激活时, 触发activate事件
self.addEventListener('activate', function (e) {
  console.log('activate');

  // active 事件中通常做一些过期资源释放的工作，匹配到就从 caches 中删除
  var cacheDeletePromises = caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.map(name => {
      if (name !== cacheStorageKey) {
        return caches.delete(name);
      } else {
        return Promise.resolve();
      }
    }));
  });


  e.waitUntil(
    Promise.all([cacheDeletePromises]).then(() => {
      console.log('控制未控制的页面')
      return self.clients.claim()
    })
  );
});

self.addEventListener('fetch', function (event) {

  //忽略chrome插件请求
  if (event.request.url.indexOf('chrome-extension://') === 0) {
    return
  }

  event.respondWith(caches.match(event.request,
    {
      cacheName: cacheStorageKey
    }).then(function (response) {
      if (response !== undefined) {
        return response;
      } else {
        return fetch(event.request).then(function (response) {
          // response 是个stream流, 所以要缓存的话需要clone一份
          let responseClone = response.clone();
          caches.open(cacheStorageKey).then(function (cache) {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(function () {
          return caches.match('/sw-test/gallery/myLittleVader.jpg');
        });
      }
    }));
});
