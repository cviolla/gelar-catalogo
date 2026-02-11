import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <CartProvider>
        {/* <App /> */}
        <div style={{ color: 'white', padding: 50, textAlign: 'center' }}>
          <h1>DEBUG MODE: VERCEL IS WORKING</h1>
          <p>Se você vê isso, o problema está no App.jsx</p>
        </div>
      </CartProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Forçar remoção de Service Worker antigo (cache killer)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log('Service Worker desativado para limpeza de cache.');
    }
  });
}
