/**
 * bootstrap-native.js
 * Определяет платформу (native/web), готовит постоянное хранилище.
 * Загружается ДО всех остальных скриптов (подключён в <head>).
 */
(function () {
  'use strict';

  const cap = window.Capacitor;
  const isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());

  document.documentElement.classList.add(isNative ? 'is-native' : 'is-web');
  document.documentElement.dataset.platform = isNative ? 'native' : 'web';

  window.AMIX_NATIVE = isNative;

  console.log('[Amix] Platform:', isNative ? 'native (Capacitor)' : 'web (browser)');

  async function requestPersistentStorage() {
    try {
      if (navigator.storage && typeof navigator.storage.persist === 'function') {
        const granted = await navigator.storage.persist();
        console.log('[Amix] persistent storage:', granted);
      }
    } catch (e) {
      console.warn('[Amix] persist() failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', requestPersistentStorage, { once: true });
  } else {
    requestPersistentStorage();
  }
})();
