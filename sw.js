// 오프라인에서도 열리게 앱 파일을 저장해 둠. 앱을 고치면 VERSION 숫자를 올리기
const VERSION = "lotto-v2";
const SHELL = ["./", "index.html", "jsQR.js", "manifest.webmanifest", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "favicon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 당첨번호는 항상 새로 받음 (저장 안 함)
  if (url.hostname === "smok95.github.io") return;
  // 글꼴: 한 번 받으면 저장해 두고 씀
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(VERSION + "-fonts").then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // 화면(index.html)은 인터넷 되면 새로 받고, 안 되면 저장본
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); }
      return res;
    }).catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
