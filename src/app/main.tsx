import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from '../components/ToastContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import '../index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// --- GLOBAL TYPES ---
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}

// --- REMOVE SPLASH SCREEN ---
const removeSplash = () => {
  const splash = document.getElementById('app-splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 500);
  }
};

// --- INITIALIZATION ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// --- SERVICE WORKER REGISTRATION (PWA) ---
if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration.scope);
      })
      .catch(() => {
        // Silencioso - não crítico
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App onReady={removeSplash} />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
