import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// CRITICAL ERROR HANDLER - Must be first
window.onerror = function (msg, url, line, col, error) {
  const root = document.getElementById('root') || document.body;
  root.innerHTML = `
    <div style="color: #ef4444; background: #0f172a; padding: 20px; font-family: sans-serif; height: 100vh;">
      <h1>Erro Fatal de Inicialização</h1>
      <p><strong>Erro:</strong> ${msg}</p>
      <p><strong>Arquivo:</strong> ${url}</p>
      <p><strong>Linha:</strong> ${line}</p>
      <pre style="background: #1e293b; padding: 10px; border-radius: 5px; overflow: auto; color: #e2e8f0;">
        ${error ? error.stack : 'Sem stacktrace'}
      </pre>
      <button onclick="localStorage.clear(); window.location.reload();" style="padding: 10px 20px; background: #38bdf8; border: none; font-weight: bold; cursor: pointer; margin-top: 20px;">
        LIMPAR DADOS E REINICIAR
      </button>
    </div>
  `;
  return false;
};

import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <CartProvider>
        <App />
      </CartProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Registro do Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado!', reg))
      .catch(err => console.log('Erro ao registrar Service Worker:', err));
  });
}
