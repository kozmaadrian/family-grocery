import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './styles/tokens.css';
import App from './App.vue';
import { router } from './router';

createApp(App).use(createPinia()).use(router).mount('#app');

// Register the service worker where supported; ignore environments that block it
// (private windows, embedded webviews, some corporate policies).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* offline install unavailable here; the app still works online */
    });
  });
}
