/**
 * Service Worker for Push Notifications
 * Handles push events and notification clicks
 */

// Cache name for offline support
const CACHE_NAME = 'presence-push-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Push Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Push Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - receive push notification
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let data = {
    title: 'Presence Notification',
    body: 'New attendance update',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'attendance-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    renotify: data.renotify,
    vibrate: data.vibrate,
    data: data.data,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') {
    return;
  }

  // Navigate to the URL specified in notification data
  const urlToOpen = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (client.navigate) {
              return client.navigate(urlToOpen);
            }
            return client;
          }
        }
        // Open new window if none found
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

async function syncAttendance() {
  // Sync any offline attendance data when back online
  console.log('Syncing attendance data...');
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
