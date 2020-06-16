const cacheName = "leitner-v1";

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
    "/js/jquery-1.11.1.min.js",
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
    const catchAssets = [].concat(...[cssAssets, imgAssets, libScriptAssets, basicScriptAssets, pageScriptAssets, PWAAssets]);
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

var window = self;
importScripts("/js/utils.js");
importScripts("/js/db.js");

function showNotification(title, message, tag) {
    return new Promise(resolve => {
        self.registration
            .getNotifications({ tag })
            .then(existingNotifications => {})
            .then(() => {
                const icon = "/img/favicon.png";
                return self.registration.showNotification(title, {body: message, tag: tag, icon: icon})
            })
            .then(resolve)
    })
}

self.addEventListener("notificationclick", event => {
    event.waitUntil(clients.openWindow("/review.html"));
});

setInterval(function() {
    var date = new Date();
    if(date.getHours() === 9) {
        const db = new DB(function() {
            db.findReview(function() {}, function(count) {
                console.log(count);
                showNotification("Leitner", "There are " + count + " card(s) to review!", getNow());
            });
        });
    }
}, 1000*60*60);
