import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for automatic updates & offline caching
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Resilient handling for transient Vite WebSocket / HMR disconnects in iframe/proxy environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event?.reason?.message || String(event?.reason || '');
    if (
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('failed to connect to websocket') ||
      reasonStr.includes('WebSocket closed without opened')
    ) {
      // Prevent unhandled rejection noise from transient WebSocket retries
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
