const CACHE_NAME = 'room-tidy-ai-v4'; // Updated version to clear old cache
const staticCache = [
  '/',
  '/manifest.json',
  '/index.html'
];

// Auth-related routes that should always be fetched from network
const authRoutes = [
  '/auth',
  '/api/auth',
  'supabase.co'
];

// Check if request is auth-related
const isAuthRoute = (url) => {
  return authRoutes.some(route => url.includes(route));
};

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing service worker v4');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔧 SW: Caching static resources');
        return cache.addAll(staticCache);
      })
      .catch(error => {
        console.error('🔧 SW: Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch event - network first for auth, cache for static resources
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Always fetch auth-related requests from network
  if (isAuthRoute(url)) {
    console.log('🔧 SW: Network-first for auth route:', url);
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try to serve a basic fallback
          if (url.includes('/auth')) {
            return caches.match('/');
          }
          throw new Error('Network unavailable for auth route');
        })
    );
    return;
  }

  // For static resources, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('🔧 SW: Serving from cache:', url);
          return response;
        }
        
        console.log('🔧 SW: Fetching from network:', url);
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses for static assets
            if (response.status === 200 && event.request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(error => {
            console.error('🔧 SW: Fetch failed:', url, error);
            // For navigation requests, serve the main page
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            throw error;
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 SW: Activating service worker v4');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🔧 SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🔧 SW: Service worker activated');
      return self.clients.claim();
    })
  );
});