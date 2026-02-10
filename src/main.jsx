import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext'
import ErrorBoundary from './components/ErrorBoundary' // Import

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
