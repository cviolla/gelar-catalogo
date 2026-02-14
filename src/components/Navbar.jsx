import React from 'react';
import { Search, Plus, Trash2, Lock, ShoppingCart, X, RefreshCcw } from 'lucide-react';
import { categories } from '../data/products';
import { useCart } from '../context/CartContext';

export default function Navbar({ activeCategory, onCategoryChange, searchTerm, onSearchChange, onAddProduct, trashCount, onOpenTrash, onManualRefresh, isAuthenticated, onLoginClick }) {
  const { setIsCartOpen, cart, lastAddedTime } = useCart();
  const cartItemCount = cart.reduce((a, b) => a + b.quantity, 0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const scrollRef = React.useRef(null);
  const itemsRef = React.useRef({});

  React.useEffect(() => {
    if (lastAddedTime > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [lastAddedTime]);

  React.useEffect(() => {
    const activeBtn = itemsRef.current[activeCategory];
    if (activeBtn && scrollRef.current) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeCategory]);
  return (
    <header className="navbar-container">
      <div className="container">
        {/* Top Bar with Logo & Search */}
        <div className="top-bar">
          <div className="logo">
            <div className="navbar-logo">
              <a href="/" title="Início">
                <img src="/logo.png" alt="Gelar Logo" className="logo-img" onError={(e) => e.target.style.display = 'none'} />
              </a>
            </div>
            <div>
              <span>Depósito de Bebidas</span>
            </div>
          </div>

          <div className="search-bar">
            <Search className="search-icon" size={18} strokeWidth={3} />
            <input
              type="text"
              placeholder="Buscar no catálogo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => onSearchChange('')}
                aria-label="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="actions-area">
            {/* Status Indicator */}
            <div className="online-badge" onClick={onManualRefresh} style={{ cursor: 'pointer' }} title="Sincronizar App">
              <div className="status-dot"></div>
              <span className="status-text">{isAuthenticated ? 'ADMIN' : 'ONLINE'}</span>
              <RefreshCcw size={12} className="refresh-icon-mini" style={{ marginLeft: '4px', opacity: 0.5 }} />
            </div>

            {isAuthenticated ? (
              <>
                {trashCount > 0 && (
                  <button className="btn btn-secondary btn-trash" onClick={onOpenTrash} title="Lixeira">
                    <Trash2 size={20} /> <span className="badge">{trashCount}</span>
                  </button>
                )}
                <button className="btn btn-primary" onClick={onAddProduct}>
                  <Plus size={20} /> <span className="btn-text">Novo</span>
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={onLoginClick} title="Área Restrita" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                <Lock size={18} />
              </button>
            )}

            <button
              className={`btn-cart-nav ${isAnimating ? 'bump' : ''}`}
              onClick={() => setIsCartOpen(true)}
              title="Ir para Carrinho"
            >
              <ShoppingCart size={20} color={isAnimating ? '#fbbf24' : 'white'} />
              {cartItemCount > 0 && <span className="nav-cart-badge">{cartItemCount}</span>}
            </button>
          </div>
        </div>

        {/* Categories Scroll */}
        <nav className="categories-nav">
          <ul className="categories-list" ref={scrollRef}>
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  ref={el => itemsRef.current[cat] = el}
                  className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => onCategoryChange(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

    </header>
  );
}
