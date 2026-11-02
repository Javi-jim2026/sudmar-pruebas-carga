const CACHE='sudmar-carga-offline-v1';
const BASE='/sudmar-pruebas-carga/';
const CORE=[BASE,BASE+'index.html',BASE+'app.js',BASE+'logos.js',BASE+'manifest.json'];
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(CORE);await Promise.allSettled(LIBS.map(url=>c.add(url)));await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(x=>x.startsWith('sudmar-carga-')&&x!==CACHE).map(x=>caches.delete(x)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(!((url.origin===self.location.origin&&url.pathname.startsWith(BASE))||LIBS.includes(url.href)))return;
 event.respondWith((async()=>{const c=await caches.open(CACHE);const cached=await c.match(req);if(cached)return cached;try{const res=await fetch(req);if(res.ok)event.waitUntil(c.put(req,res.clone()).catch(()=>{}));return res;}catch{return req.mode==='navigate'?(await c.match(BASE+'index.html')||Response.error()):Response.error();}})());
});