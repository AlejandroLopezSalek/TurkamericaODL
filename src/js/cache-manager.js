// ================================
// CACHE MANAGER - Auto Update Detection
// Add this script BEFORE app.js
// ================================

(function() {
  'use strict';

  const APP_VERSION = '1.0.6'; // ⚡ INCREMENTA ESTO CADA VEZ QUE DESPLIEGUES
  const VERSION_KEY = 'app_version';
  const LAST_CHECK_KEY = 'last_update_check';
  const CHECK_INTERVAL = 1 * 60 * 60 * 1000; // Check every 1 hour

  class CacheManager {
    constructor() {
      this.currentVersion = APP_VERSION;
      this.init();
    }

    init() {
      this.checkForUpdates();
      this.setupServiceWorkerUpdates();
      this.setupVisibilityListener();
    }

    // Check if app version has changed
    checkForUpdates() {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      const now = Date.now();

      // First time or version changed
      if (!storedVersion || storedVersion !== this.currentVersion) {
        console.log('[Cache] Version changed, clearing cache...');
        this.clearAllCaches();
        localStorage.setItem(VERSION_KEY, this.currentVersion);
        localStorage.setItem(LAST_CHECK_KEY, now.toString());
        return;
      }

      // Check periodically
      if (!lastCheck || (now - parseInt(lastCheck)) > CHECK_INTERVAL) {
        console.log('[Cache] Periodic check for updates...');
        this.checkServerVersion();
        localStorage.setItem(LAST_CHECK_KEY, now.toString());
      }
    }

    // Check server for version changes
    async checkServerVersion() {
      try {
        // Add timestamp to bypass cache
        const response = await fetch(`/manifest.json?t=${Date.now()}`, {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          // You can add version to manifest.json or check if content changed
          console.log('[Cache] Server check complete');
        }
      } catch (error) {
        console.log('[Cache] Could not check server version:', error);
      }
    }

    // Clear all caches
    async clearAllCaches() {
      try {
        // Clear browser cache storage
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => {
              console.log('[Cache] Deleting cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        }

        // Clear localStorage cache
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('cache_') || key.startsWith('turkamerica_cache'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        console.log('[Cache] All caches cleared');
        
        // Show notification to user
        this.showUpdateNotification();
      } catch (error) {
        console.error('[Cache] Error clearing caches:', error);
      }
    }

    // Setup service worker update detection
    setupServiceWorkerUpdates() {
      if (!('serviceWorker' in navigator)) return;

      navigator.serviceWorker.ready.then(registration => {
        // Check for updates every hour
        setInterval(() => {
          console.log('[Cache] Checking for service worker updates...');
          registration.update();
        }, CHECK_INTERVAL);

        // Listen for update found
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Cache] New service worker available');
              this.showUpdateAvailableNotification(registration);
            }
          });
        });
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[Cache] Service worker updated, reloading...');
        window.location.reload();
      });
    }

    // Setup visibility change listener to check for updates
    setupVisibilityListener() {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          console.log('[Cache] Page visible, checking for updates...');
          this.checkForUpdates();
        }
      });
    }

    // Show update notification
    showUpdateNotification() {
      if (window.ToastSystem) {
        window.ToastSystem.info(
          'La aplicación se ha actualizado con las últimas mejoras',
          'Actualización',
          3000
        );
      }
    }

    // Show update available notification
    showUpdateAvailableNotification(registration) {
      if (window.ToastSystem) {
        const toast = window.ToastSystem.show({
          type: 'info',
          title: 'Actualización disponible',
          message: 'Hay una nueva versión disponible. Recarga para actualizar.',
          duration: 0,
          closable: true
        });

        // Add update button
        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'Actualizar ahora';
        updateBtn.style.cssText = `
          margin-top: 10px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        `;
        updateBtn.onclick = () => {
          if (registration.waiting) {
            registration.waiting.postMessage('skipWaiting');
          }
        };
        
        const toastContent = toast.querySelector('.toast-content');
        if (toastContent) {
          toastContent.appendChild(updateBtn);
        }
      }
    }

    // Force reload with cache bypass
    forceReload() {
      window.location.reload(true);
    }

    // Get current version
    getVersion() {
      return this.currentVersion;
    }
  }

  // Initialize cache manager
  window.CacheManager = new CacheManager();

  // Expose utility functions
  window.clearAppCache = () => window.CacheManager.clearAllCaches();
  window.checkAppVersion = () => window.CacheManager.checkForUpdates();
  window.getAppVersion = () => window.CacheManager.getVersion();

  console.log('[Cache Manager] Initialized - Version:', APP_VERSION);

})();