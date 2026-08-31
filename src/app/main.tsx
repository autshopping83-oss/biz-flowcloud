import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from '../components/ToastContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../features/auth/AuthContext';
import { AuthGuard } from '../features/auth/AuthGuard';
import '../index.css';

const removeSplash = () => {
  const splash = document.getElementById('app-splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 500);
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <ToastProvider>
            <App onReady={removeSplash} />
          </ToastProvider>
        </AuthGuard>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
