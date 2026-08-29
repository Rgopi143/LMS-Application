import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to redirect requests to the backend Web Service in production
const BACKEND_URL = ((import.meta as any).env.VITE_BACKEND_URL || 'https://ranbidge-lms-backend.onrender.com').replace(/\/$/, '');

const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string') {
    if (input.startsWith('/api/') || input.startsWith('/uploads/')) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocalhost && BACKEND_URL) {
        input = BACKEND_URL + input;
      }
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
