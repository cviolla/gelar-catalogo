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
import { normalizeText, NAVBAR_HEIGHT_DESKTOP, NAVBAR_HEIGHT_MOBILE } from './utils/helpers';

function App() {
    const { cart, addToCart, updateQuantity } = useCart();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLogin, setShowLogin] = useState(false); // Modal de Login
    const [passwordInput, setPasswordInput] = useState("");
    const [loginError, setLoginError] = useState(false);

    const [products, setProducts] = useState(initialSeedData || []); // Init with data immediately
    const [trash, setTrash] = useState([]);
    const [loading, setLoading] = useState(false); // No loading state needed for local init

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
        const SECRET_PASS = "hionas060226";

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



    // 1. Fetch Products (or Load from Local)
    const fetchProducts = async () => {
        setLoading(true);
        console.log("Checking database connection...");

        // --- LOCAL MODE ---
        if (!supabase) {
            console.warn('Supabase not configured. Using LOCAL STORAGE data.');
            const localData = localStorage.getItem('gelar_products');
            if (localData) {
                try {
                    setProducts(JSON.parse(localData));
                } catch (e) {
                    setProducts(initialSeedData || []);
                }
            } else {
                setProducts(initialSeedData || []);
                localStorage.setItem('gelar_products', JSON.stringify(initialSeedData)); // Init local
            }
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar produtos:', error);
                // Fallback to local on error
                const localData = localStorage.getItem('gelar_products');
                setProducts(localData ? JSON.parse(localData) : (initialSeedData || []));
            } else {
                if (data && data.length > 0) {
                    setProducts(data);
                } else {
                    console.log("Database empty, using local data.");
                    setProducts(initialSeedData || []);
                }
            }
        } catch (err) {
            console.error('Critical error fetching products:', err);
            const localData = localStorage.getItem('gelar_products');
            setProducts(localData ? JSON.parse(localData) : (initialSeedData || []));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedAuth = localStorage.getItem("gelar_auth");
        if (savedAuth === "true") setIsAuthenticated(true);
        fetchProducts();
    }, []);

    // Helper to save local
    const saveToLocal = (newProducts) => {
        localStorage.setItem('gelar_products', JSON.stringify(newProducts));
        setProducts(newProducts);
    };

    // 2. Create Product
    const handleAddProduct = async () => {
        const newProduct = {
            id: Date.now(), // Local ID
            name: 'Novo Produto',
            volume: 'Volume',
            category: 'Outros',
            image_url: null,
            prices: [{ label: 'Unidade', value: '0,00' }]
        };

        if (!supabase) {
            const updated = [newProduct, ...products];
            saveToLocal(updated);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveCategory("Todos");
            return;
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{ ...newProduct, id: undefined }]) // Let supabase gen ID
            .select();

        if (error) {
            alert('Erro ao criar produto no banco. (Fallback local ativado)');
            const updated = [newProduct, ...products];
            saveToLocal(updated);
        } else {
            setProducts([data[0], ...products]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveCategory("Todos");
        }
    };

    // 3. Update Product
    const handleUpdateProduct = async (updatedProduct) => {
        if (!supabase) {
            const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
            saveToLocal(updated);
            return;
        }

        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

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

    // 4. Delete
    const handleDeleteProduct = (id) => {
        const productToDelete = products.find(p => p.id === id);
        if (productToDelete) {
            const updated = products.filter(p => p.id !== id);
            if (!supabase) {
                saveToLocal(updated);
            } else {
                setProducts(updated);
            }
            setTrash([productToDelete, ...trash]);
        }
    };

    const handlePermanentDelete = async (id) => {
        // Local trash logic simplified
        if (window.confirm("Isso excluirá do banco de dados para sempre. Confirmar?")) {
            if (!supabase) {
                setTrash(trash.filter(p => p.id !== id));
                return;
            }
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (!error) {
                setTrash(trash.filter(p => p.id !== id));
            }
        }
    };

    const handleRestoreProduct = async (id) => {
        const productToRestore = trash.find(p => p.id === id);
        if (productToRestore) {
            if (!supabase) {
                saveToLocal([productToRestore, ...products]);
                setTrash(trash.filter(p => p.id !== id));
                return;
            }

            setProducts([productToRestore, ...products]);
            setTrash(trash.filter(p => p.id !== id));
            // In real app, you might need to re-insert to DB if it was hard deleted, 
            // but here 'delete' was soft (moved to trash state only) unless permanent.
            // If it was just moved to state trash, it's fine.
        }
    };

    // 5. SEED BUTTON (Utility)
    const handleSeedDatabase = async () => {
        if (!window.confirm("Isso vai inserir todos os produtos iniciais no banco. Pode duplicar se já existirem. Continuar?")) return;

        setLoading(true);

        if (!supabase) {
            localStorage.setItem('gelar_products', JSON.stringify(initialSeedData));
            setProducts(initialSeedData);
            alert("Banco LOCAL resetado com sucesso!");
            setLoading(false);
            return;
        }

        const seed = initialSeedData.map(({ id, image, ...rest }) => ({
            ...rest,
            image_url: image // Use the local image path if available
        }));

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


    // --- DEBUG RENDER ---
    return (
        <div style={{ color: 'white', padding: 20 }}>
            <h1>HOOKS + LOGIC LOADED SUCCESSFULLY</h1>
            <p>Products: {products.length}</p>
            <p>Cart Items: {cart.length}</p>
            <p>Auth: {isAuthenticated ? 'Yes' : 'No'}</p>
            <button onClick={() => alert('Logic seems fine')}>Test Click</button>
        </div>
    );
}

export default App;
