var assets = [
    "./",
    "./index.html",
    "./style.css",
    "./js/app.js",
    "images/0.png",
    "images/1.png",
    "images/2.png",
    "images/3.png",
    "images/4.png",
    "icons/32.png",
    "icons/128.png",
    "icons/256.png",
    "icons/512.png",
]

self.addEventListener("install", function(installEvent) {
    installEvent.waitUntil(
        caches.open("my-test-pwa").then(function(cache) {
            cache.addAll(assets)
        })
    )
})

self.addEventListener("fetch", function(fetchEvent) {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(function(res) {
            return res || fetch(fetchEvent.request)
        })
    )
})