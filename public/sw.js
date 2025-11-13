self.addEventListener('install', function () {
  self.skipWaiting()
})
self.addEventListener('activate', function () {
  self.clients.claim()
})
