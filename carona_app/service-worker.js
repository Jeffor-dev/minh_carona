const CACHE_NAME = 'transporte-kaizen-v2'; // Mudei para v2 para forçar o celular a atualizar
const ASSETS = [
  '/',
  'index.html',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // O addAll retorna uma promessa; se um arquivo falhar, nada é cacheado
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna o arquivo do cache ou busca na rede
      return response || fetch(event.request);
    })
  );
});