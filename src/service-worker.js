self.addEventListener('install', function(event) {
    console.log('service worker install', event);
});

self.addEventListener('activate', function(event) {
    console.log('service worker activate', event);
});

console.log('service worker load');
