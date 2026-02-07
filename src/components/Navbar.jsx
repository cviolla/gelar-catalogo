import React from 'react';
import { Search, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { categories } from '../data/products';

export default function Navbar({ activeCategory, onCategoryChange, searchTerm, onSearchChange, onAddProduct, trashCount, onOpenTrash }) {
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
            <Search className="search-icon" size={24} strokeWidth={3} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="actions-area">
            {/* Online Indicator */}
            <div className="online-badge">
              <div className="status-dot"></div>
              <span className="status-text">ONLINE</span>
            </div>

            {trashCount > 0 && (
              <button className="btn btn-secondary btn-trash" onClick={onOpenTrash} title="Lixeira">
                <Trash2 size={20} /> <span className="badge">{trashCount}</span>
              </button>
            )}
            <button className="btn btn-primary" onClick={onAddProduct}>
              <Plus size={20} /> <span className="btn-text">Novo</span>
            </button>
          </div>
        </div>

        {/* Categories Scroll */}
        <nav className="categories-nav">
          <ul className="categories-list">
            {categories.map((cat) => (
              <li key={cat}>
                <button
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

      <style>{`
        .navbar-container {
          background-color: #050b14 !important; /* Match card dark bg */
          color: white;
          padding: 1rem 0 0 0;
          border-bottom: 1px solid #1e293b;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo .icon {
          color: var(--color-accent);
        }

        .logo-img {
          height: 25px; /* Reduzido em 50% */
          width: auto;
          object-fit: contain;
        }

        .logo-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .online-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-right: 0.5rem;
          animation: fade-pulse 2s infinite ease-in-out;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
        }

        .status-text {
          color: #22c55e;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        @keyframes fade-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .logo h1 {
          color: white;
          margin: 0;
          font-size: 1.5rem;
          line-height: 1;
          text-transform: uppercase; /* GELAR */
          letter-spacing: 2px; /* Espaçamento premium */
        }

        .logo span {
          font-size: 0.75rem;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .search-bar {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-bar input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem; /* More space for icon */
          border-radius: 50px;
          border: 1px solid #1e293b;
          background: rgba(15, 23, 42, 0.6);
          color: white;
          font-family: inherit;
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
        }

        .search-bar input:focus {
          background: rgba(15, 23, 42, 0.9);
          border-color: var(--color-secondary);
          box-shadow: 0 0 15px rgba(12, 170, 220, 0.15);
          outline: none;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #ffffff; /* Pure White */
          filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); /* Glow */
          pointer-events: none;
          z-index: 10;
        }

        .actions-area {
          display: flex;
          gap: 0.75rem;
          margin-left: auto;
          align-items: center;
        }

        /* Categories Scroll */
        .categories-nav {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }

        .categories-list {
          display: flex;
          list-style: none;
          overflow-x: auto;
          padding: 0 1rem; /* 0.5rem top/bottom, 1rem sides */
          margin: 0;
          gap: 0.5rem;
          scrollbar-width: none; /* Firefox */
        }

        .categories-list::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .cat-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          padding: 1rem 0.5rem; /* Taller touch target */
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          position: relative;
          transition: color 0.2s;
        }

        .cat-btn:hover {
          color: white;
        }

        .cat-btn.active {
          color: var(--color-accent);
          font-weight: 700;
        }

        .cat-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--color-accent);
          border-radius: 3px 3px 0 0;
        }

        .btn-trash {
          background: #334155;
          color: #94a3b8;
          position: relative;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-trash:hover {
          background: #475569;
          color: white;
        }

        .badge {
          background: #ef4444;
          color: white;
          font-size: 0.75rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: bold;
        }

        @media (max-width: 480px) {
          .btn-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
