import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { CartProvider } from './context/CartContext'
import ErrorBoundary from './components/ErrorBoundary'

const App = lazy(() => import('./App.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <CartProvider>
        <Suspense fallback={<div style={{ color: 'white' }}>Carregando App...</div>}>
          <App />
        </Suspense>
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
