// Versão atualizada: 1.0.1 - Gatilho de Deploy Vercel
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartComponent from './components/Cart';
import OrderHistory from './components/OrderHistory';
import { supabase } from './lib/supabase'; // Real DB
import { products as initialSeedData, categories } from './data/products';
import { useCart } from './context/CartContext';
import { Info, RotateCcw, Trash2, X, Database, Lock, Plus } from 'lucide-react';
import { normalizeText, NAVBAR_HEIGHT_DESKTOP, NAVBAR_HEIGHT_MOBILE, parsePrice, formatPrice } from './utils/helpers';

function App() {
    const { cart, addToCart, updateQuantity } = useCart();
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("gelar_auth") === "true");
    const [showLogin, setShowLogin] = useState(false); // Modal de Login
    const [passwordInput, setPasswordInput] = useState("");
    const [loginError, setLoginError] = useState(false);

    const [products, setProducts] = useState([]);
    const [trash, setTrash] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeCategory, setActiveCategory] = useState(categories[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showTrash, setShowTrash] = useState(false);
    const [showOrderHistory, setShowOrderHistory] = useState(false);
    const [isScrollingFromClick, setIsScrollingFromClick] = useState(false);
    const [expandedProduct, setExpandedProduct] = useState(null);

    const categoryRefs = React.useRef({});

    // --- INTERSECTION OBSERVER ---
    useEffect(() => {
        if (searchTerm) return; // Desativa observer durante busca

        const options = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // Ajuste para detectar o topo melhor
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            if (isScrollingFromClick) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveCategory(entry.target.id);
                }
            });
        }, options);

        Object.values(categoryRefs.current).forEach(section => {
            if (section) observer.observe(section);
        });

        // Fallback para o final da página (garantir que Carvão seja selecionado)
        const handleScroll = () => {
            if (isScrollingFromClick || searchTerm) return;

            // Se o usuário rolou perto do fim da página (últimos 100px)
            const isNearBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 100;

            if (isNearBottom) {
                const visibleCategories = categories.filter(c => {
                    const productsInCategory = products.filter(p => p.category === c);
                    return productsInCategory.length > 0;
                });
                if (visibleCategories.length > 0) {
                    const lastCat = visibleCategories[visibleCategories.length - 1];
                    if (activeCategory !== lastCat) {
                        setActiveCategory(lastCat);
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, [products, searchTerm, isScrollingFromClick]);

    const handleCategoryClick = (cat) => {
        setActiveCategory(cat);
        setShowTrash(false);

        if (cat === "Todos") {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const section = categoryRefs.current[cat];
        if (section) {
            setIsScrollingFromClick(true);
            const isMobile = window.innerWidth <= 480;
            const navbarHeight = isMobile ? NAVBAR_HEIGHT_MOBILE : NAVBAR_HEIGHT_DESKTOP;
            const targetPosition = section.getBoundingClientRect().top + window.pageYOffset - (navbarHeight);

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Reativar observer após o scroll terminar (timeout aproximado)
            setTimeout(() => setIsScrollingFromClick(false), 1000);
        }
    };

    // --- AUTH LOGIC ---
    const handleLogin = (e) => {
        e.preventDefault();
        // SENHA DEFINIDA AQUI (Você pode mudar depois)
        const SECRET_PASS = import.meta.env.VITE_ADMIN_PASSWORD;

        if (passwordInput === SECRET_PASS) {
            setIsAuthenticated(true);
            setShowLogin(false);
            localStorage.setItem("gelar_auth", "true"); // Lembrar login
        } else {
            setLoginError(true);
            setTimeout(() => setLoginError(false), 2000);
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem("gelar_auth");
        setPasswordInput("");
    };



    // 1. Fetch Products
    const fetchProducts = async () => {
        if (!supabase) {
            console.error('Supabase client not initialized. Check your environment variables.');
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar produtos:', error);
            setError('Não foi possível carregar os produtos. Tente novamente mais tarde.');
        } else {
            setProducts(data || []);
            setError(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        // FETCH PRODUCTS ON START (ALWAYS)
        fetchProducts();
    }, []);

    // 2. Create Product
    const handleAddProduct = async () => {
        const newProduct = {
            name: 'Novo Produto',
            volume: 'Volume',
            category: 'Outros',
            image_url: null,
            prices: [{ label: 'Unidade', value: '0,00' }]
        };

        if (!supabase) {
            alert('Configuração do banco de dados ausente (VITE_SUPABASE_URL / ANON_KEY)');
            return;
        }

        const { data, error } = await supabase
            .from('products')
            .insert([newProduct])
            .select();

        if (error) {
            alert('Erro ao criar produto');
            console.error(error);
        } else {
            setProducts([data[0], ...products]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveCategory("Todos");
        }
    };

    // 3. Update Product
    const handleUpdateProduct = async (updatedProduct) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

        if (!supabase) return;
        const { error } = await supabase
            .from('products')
            .update({
                name: updatedProduct.name,
                volume: updatedProduct.volume,
                category: updatedProduct.category,
                prices: updatedProduct.prices,
                image_url: updatedProduct.image_url
            })
            .eq('id', updatedProduct.id);

        if (error) console.error('Erro ao atualizar:', error);
    };

    // 4. Delete (Move to Trash / Soft Delete)
    const handleDeleteProduct = (id) => {
        const productToDelete = products.find(p => p.id === id);
        if (productToDelete) {
            setTrash([productToDelete, ...trash]);
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const handlePermanentDelete = async (id) => {
        if (!window.confirm("Isso excluirá do banco de dados para sempre. Confirmar?")) return;
        if (!supabase) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) {
            setTrash(trash.filter(p => p.id !== id));
        }
    };

    const handleRestoreProduct = (id) => {
        const productToRestore = trash.find(p => p.id === id);
        if (productToRestore) {
            setProducts([productToRestore, ...products]);
            setTrash(trash.filter(p => p.id !== id));
        }
    };

    // 5. SEED BUTTON (Utility)
    const handleSeedDatabase = async () => {
        if (!window.confirm("Isso vai inserir todos os produtos iniciais no banco. Pode duplicar se já existirem. Continuar?")) return;

        setLoading(true);
        const seed = initialSeedData.map(({ id: _id, image: _image, ...rest }) => ({
            ...rest,
            image_url: null
        }));

        if (!supabase) {
            alert("Erro: Cliente Supabase não inicializado.");
            setLoading(false);
            return;
        }
        const { error } = await supabase.from('products').insert(seed);
        if (error) alert("Erro ao popular banco: " + error.message);
        else {
            alert("Banco populado com sucesso!");
            fetchProducts();
        }
        setLoading(false);
    };

    // --- COMPONENT LOGIC ---


    const filteredProducts = React.useMemo(() => {
        return products.filter(product => {
            // Normalização
            const normSearch = normalizeText(searchTerm);
            const normName = normalizeText(product.name || "");
            const normVolume = normalizeText(product.volume || "");
            const normProductCategory = normalizeText(product.category || "");

            const matchesSearch =
                normName.includes(normSearch) ||
                normVolume.includes(normSearch) ||
                normProductCategory.includes(normSearch);

            // Lógica inteligente: Se tem busca, ignora a categoria ativa e busca em tudo.
            // Se não tem busca, respeita a categoria.
            const isGlobalSearch = searchTerm.length > 0;

            if (isGlobalSearch) {
                return matchesSearch;
            } else {
                return (activeCategory === "Todos" || product.category === activeCategory);
            }
        });
    }, [products, searchTerm, activeCategory]);

    // --- MIGRATION TOOL (Temporary) ---


    // --- RENDER: APP ---
    return (
        <div className="app-container">
            {/* LOGIN OVERLAY */}
            {showLogin && (
                <div className="login-overlay">
                    <div className="login-card">
                        <div className="navbar-logo">
                            <img src="/logo.png" style={{ height: '42px', width: 'auto' }} alt="Gelar" />
                        </div>

                        <div className="login-header-text">
                            <h2>Bem-vindo</h2>
                            <p>ÁREA RESTRITA</p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <input
                                    type="password"
                                    placeholder="Senha de Acesso"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    autoFocus
                                />
                                <Lock className="input-icon" size={18} />
                            </div>

                            {loginError && (
                                <div className="error-msg">
                                    <Info size={14} /> Senha incorreta
                                </div>
                            )}

                            <div className="login-actions">
                                <button type="submit" className="btn-login-submit">
                                    ENTRAR
                                </button>
                                <button
                                    type="button"
                                    className="btn-login-cancel"
                                    onClick={() => setShowLogin(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Navbar
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryClick}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAddProduct={handleAddProduct}
                trashCount={trash.length}
                onOpenTrash={() => setShowTrash(!showTrash)}
                isAuthenticated={isAuthenticated}
                onLoginClick={() => setShowLogin(true)}
            />

            <main className="container main-content">

                {loading && <div className="loading">Carregando estoque...</div>}

                {error && (
                    <div className="empty-db-state" style={{ borderColor: '#ef4444' }}>
                        <Info size={48} color="#ef4444" />
                        <h2>Erro de Conexão</h2>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={fetchProducts}>Tentar Novamente</button>
                    </div>
                )}

                {!loading && products.length === 0 && !showTrash && (
                    <div className="empty-db-state">
                        <Database size={48} color="#fbbf24" />
                        <h2>Banco de Dados Vazio</h2>
                        <p>Comece do zero ou carregue a lista padrão.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" onClick={handleAddProduct}>Criar Primeiro Produto</button>
                            <button className="btn btn-secondary" onClick={handleSeedDatabase}>Carregar Lista Padrão</button>
                        </div>
                    </div>
                )}

                {/* TRASH VIEW OVERLAY */}
                {showTrash ? (
                    <div className="trash-view">
                        <div className="trash-header">
                            <h2>Lixeira (Sessão Atual)</h2>
                            <button className="btn btn-secondary" onClick={() => setShowTrash(false)}>
                                <X size={20} /> Fechar
                            </button>
                        </div>
                        <p style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                            Produtos removidos nesta sessão. Eles ainda aparecem no catálogo após atualizar a página, a menos que sejam <strong>excluídos permanentemente</strong>.
                        </p>

                        {trash.map(item => (
                            <div key={item.id} className="trash-item">
                                <span>{item.name}</span>
                                <div className="trash-actions">
                                    <button className="btn-restore" onClick={() => handleRestoreProduct(item.id)}><RotateCcw size={18} /></button>
                                    <button className="btn-permanent-delete" onClick={() => handlePermanentDelete(item.id)}><X size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* PRODUCT DISPLAY */
                    <div className="content-wrapper">
                        {searchTerm ? (
                            <div className="products-grid">
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onUpdate={handleUpdateProduct}
                                        onDelete={handleDeleteProduct}
                                        onExpand={setExpandedProduct} // Novo prop
                                        readOnly={!isAuthenticated}
                                    />
                                ))}
                            </div>
                        ) : (
                            categories.map(cat => {
                                const productsInCategory = products.filter(p => p.category === cat);
                                if (productsInCategory.length === 0) return null;
                                return (
                                    <section
                                        key={cat}
                                        id={cat}
                                        className="category-section"
                                        ref={el => categoryRefs.current[cat] = el}
                                    >
                                        <div className="products-grid">
                                            {productsInCategory.map(product => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                    onUpdate={handleUpdateProduct}
                                                    onDelete={handleDeleteProduct}
                                                    onExpand={setExpandedProduct} // Novo prop
                                                    readOnly={!isAuthenticated}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })
                        )}
                    </div>
                )}
            </main>

            {/* PRODUCT EXPANDED MODAL */}
            {expandedProduct && (
                <div
                    className="product-modal-overlay"
                    onClick={() => setExpandedProduct(null)}
                >
                    <div className="product-card expanded-card" onClick={(e) => e.stopPropagation()}>
                        <div className="card-image-area">
                            <img
                                src={expandedProduct.image_url || expandedProduct.image}
                                alt={expandedProduct.name}
                                className="product-img"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/400x300?text=Sem+Imagem';
                                }}
                            />
                            <div className="volume-badge">{expandedProduct.volume}</div>
                            <button className="btn-close-modal" onClick={() => setExpandedProduct(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="card-content">
                            <div className="card-header">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="category-badge" style={{ alignSelf: 'flex-start', marginBottom: '4px' }}>
                                        {expandedProduct.category}
                                    </span>
                                    <h3>{expandedProduct.name}</h3>
                                </div>
                            </div>

                            <div className="prices-list">
                                {expandedProduct.prices?.map((price, idx) => {
                                    const cartItemId = `${expandedProduct.id}-${price.label}`;
                                    const itemInCart = cart.find(item => item.cartItemId === cartItemId);
                                    const quantity = itemInCart ? itemInCart.quantity : 1;

                                    return (
                                        <div key={idx} className={`price-row ${itemInCart ? 'in-cart' : ''}`}>
                                            <div className="price-details">
                                                <span className={`price-label ${price.label === 'Promoção' ? 'text-promo' : ''}`}>
                                                    {price.label === 'Promoção' ? 'PROMO' : price.label}{price.label === 'Promoção' ? '' : ':'}
                                                </span>
                                                <span className={`price-value ${price.label === 'Promoção' ? 'text-promo' : ''}`}>
                                                    {formatPrice(parsePrice(price.value) * quantity)}
                                                </span>
                                            </div>

                                            <div className="price-action">
                                                {itemInCart ? (
                                                    <div className="quantity-control-expanded">
                                                        <button
                                                            className="btn-qty-minus"
                                                            onClick={() => updateQuantity(cartItemId, itemInCart.quantity - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="qty-value">{itemInCart.quantity}</span>
                                                        <button
                                                            className="btn-qty-plus"
                                                            onClick={() => addToCart(expandedProduct, price)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="btn-add-cart"
                                                        onClick={() => addToCart(expandedProduct, price)}
                                                    >
                                                        +
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CartComponent />

            <footer className="footer">
                <div className="container">
                    {isAuthenticated && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                            <button onClick={handleLogout} className="btn-logout-footer" style={{ marginTop: 0 }}>Sair do Sistema</button>
                            <span style={{ color: '#334155' }}>|</span>
                            <button onClick={() => setShowOrderHistory(true)} className="btn-logout-footer" style={{ color: '#38bdf8', marginTop: 0 }}>Histórico de Pedidos</button>
                        </div>
                    )}

                    <p className="footer-copyright" style={{ marginTop: 0 }}>© {new Date().getFullYear()} Gelar Depósito de Bebidas | Desenvolvido por <a href="https://wa.me/5521965226788" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>@cviolla</a></p>
                </div>
            </footer>

            {/* ORDER HISTORY OVERLAY */}
            {showOrderHistory && <OrderHistory onClose={() => setShowOrderHistory(false)} />}
        </div>
    );
}

export default App;
