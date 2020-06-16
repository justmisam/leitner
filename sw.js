const cacheName = "leitner-v1";

const libCssAssets = [
    "/css/snackbar.min.css"
]
const cssAssets = [
    "/css/style.css"
]
const imgAssets = [
    "/img/favicon.png",
    "/img/logo-bg.png",
    "/img/logo.png",
    "/img/menu.png",
    "/img/search.png"
]
const libScriptAssets = [
    "/js/Dropbox-sdk.min.js",
    "/js/FileSaver.min.js",
    "/js/FileSaver.min.js.map",
    "/js/jquery-3.5.1.min.js",
    "js/snackbar.min.js"
]
const basicScriptAssets = [
    "/js/backup.js",
    "/js/db.js",
    "/js/utils.js"
]
const pageScriptAssets = [
    "/js/edit.js",
    "/js/index.js",
    "/js/list.js",
    "/js/review.js",
]
const pageAssets = [
    "/edit.html",
    "/index.html",
    "/list.html",
    "/review.html"
];
const PWAAssets = [
    "/app.js"
];

self.addEventListener("install", async event => {
    const cache = await caches.open(cacheName);
    await cache.addAll(libCssAssets);
    await cache.addAll(cssAssets);
    await cache.addAll(imgAssets);
    await cache.addAll(libScriptAssets);
    await cache.addAll(basicScriptAssets);
    await cache.addAll(pageScriptAssets);
    await cache.addAll(pageAssets);
    await cache.addAll(PWAAssets);
});

self.addEventListener("fetch", event => {
    const appURL = "https://leitner.misam.ir";
    const req = event.request;
    const catchAssets = [].concat(...[libCssAssets, cssAssets, imgAssets, libScriptAssets, basicScriptAssets, pageScriptAssets, PWAAssets]);
    var isCacheFirst = false;
    for (var url of catchAssets) {
        if (!url.startsWith("/")) {
            url = appURL + url;
        }
        if (req.url == url || req.url.startsWith(url + "?")) {
            isCacheFirst = true;
            break;
        }
    }
    if (isCacheFirst) {
        event.respondWith(cacheFirst(req));
    } else {
        event.respondWith(networkFirst(req));
    }
});

async function networkFirst(req) {
    const cache = await caches.open(cacheName);
    try { 
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
    } catch (e) {
        const cachedResponse = await cache.match(req);
        return cachedResponse;
    }
}

async function cacheFirst(req) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(req);
    return cachedResponse || networkFirst(req);
}
