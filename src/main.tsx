import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to redirect requests to the backend Web Service in production
const BACKEND_URL = ((import.meta as any).env.VITE_BACKEND_URL || 'https://ranbidge-lms-application.onrender.com').replace(/\/$/, '');

const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  let requestUrl = input;

  if (typeof requestUrl === 'string') {
    if (requestUrl.startsWith('/api/') || requestUrl.startsWith('/uploads/')) {
      if (!isLocalhost && BACKEND_URL) {
        requestUrl = BACKEND_URL + requestUrl;
      }
    }
  }

  const response = await originalFetch(requestUrl, init);

  if (!isLocalhost && BACKEND_URL && response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const bodyText = await response.text();
        const data = JSON.parse(bodyText);

        const rewriteUrls = (obj: any): any => {
          if (!obj) return obj;
          if (typeof obj === 'string') {
            if (obj.startsWith('/uploads/') || obj.startsWith('/api/')) {
              return BACKEND_URL + obj;
            }
            return obj;
          }
          if (Array.isArray(obj)) {
            return obj.map(item => rewriteUrls(item));
          }
          if (typeof obj === 'object') {
            const fresh: any = {};
            for (const key of Object.keys(obj)) {
              fresh[key] = rewriteUrls(obj[key]);
            }
            return fresh;
          }
          return obj;
        };

        const rewritten = rewriteUrls(data);
        return new Response(JSON.stringify(rewritten), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (e) {
        console.debug('Failed to rewrite JSON urls:', e);
      }
    }
  }

  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
