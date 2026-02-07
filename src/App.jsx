import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import { supabase } from './lib/supabase'; // Real DB
import { products as initialSeedData } from './data/products';
import { Info, RotateCcw, Trash2, X, Database, Lock } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [products, setProducts] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrash, setShowTrash] = useState(false);

  // --- AUTH LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault();
    // SENHA DEFINIDA AQUI (Você pode mudar depois)
    const SECRET_PASS = "hionas060226";

    if (passwordInput === SECRET_PASS) {
      setIsAuthenticated(true);
      localStorage.setItem("gelar_auth", "true"); // Lembrar login
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  useEffect(() => {
    // Verificar se já logou antes
    const savedAuth = localStorage.getItem("gelar_auth");
    if (savedAuth === "true") setIsAuthenticated(true);
  }, []);

  // --- DATABASE SYNC ---

  // 1. Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchProducts();
  }, [isAuthenticated]); // Só carrega se estiver logado

  // 2. Create Product
  const handleAddProduct = async () => {
    const newProduct = {
      name: 'Novo Produto',
      volume: 'Volume',
      category: 'Outros',
      image_url: null,
      prices: [{ label: 'Unidade', value: '0,00' }]
    };

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
    if (window.confirm("Isso excluirá do banco de dados para sempre. Confirmar?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setTrash(trash.filter(p => p.id !== id));
      }
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
    const seed = initialSeedData.map(({ id, image, ...rest }) => ({
      ...rest,
      image_url: null
    }));

    const { error } = await supabase.from('products').insert(seed);
    if (error) alert("Erro ao popular banco: " + error.message);
    else {
      alert("Banco populado com sucesso!");
      fetchProducts();
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("gelar_auth");
  }


  // --- COMPONENT LOGIC ---

  const normalizeText = (text) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "") // Remove espaços
      .toLowerCase();
  };

  const filteredProducts = products.filter(product => {
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

  // --- MIGRATION TOOL (Temporary) ---
  const handleMigrateCategories = async () => {
    if (!confirm("Isso vai atualizar TODOS os produtos no banco para as novas categorias (Long Neck / Latas). Continuar?")) return;

    try {
      setLoading(true);
      const { data: allProds } = await supabase.from('products').select('*');
      let updatedCount = 0;

      for (const p of allProds) {
        let newCat = p.category;

        // Regra 1: Latão 473ml -> Latas
        if (p.category === 'Latão 473ml') newCat = 'Latas';

        // Regra 2: Long Neck / Latão -> Separar
        if (p.category === 'Long Neck / Latão') {
          const name = (p.name || '').toLowerCase();
          const vol = (p.volume || '').toLowerCase();

          if (name.includes('latão') || vol.includes('473') || vol.includes('473ml') || vol.includes('lata')) {
            newCat = 'Latas';
          } else {
            newCat = 'Long Neck';
          }
        }

        if (newCat !== p.category) {
          await supabase.from('products').update({ category: newCat }).eq('id', p.id);
          updatedCount++;
        }
      }
      alert(`Sucesso! ${updatedCount} produtos foram migrados.`);
      fetchProducts();
    } catch (err) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <img src="/logo.png" alt="Gelar" style={{ height: 38 }} onError={(e) => e.target.style.display = 'none'} />
          </div>
          <p>Acesso Restrito</p>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Digite a senha..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={loginError ? 'error' : ''}
                autoFocus
              />
            </div>
            {loginError && <span className="error-msg">Senha incorreta</span>}
            <button type="submit" className="btn btn-primary full-width">ENTRAR</button>
          </form>
        </div>
        <style>{`
          .login-screen {
            height: 100vh;
            width: 100vw;
            background: #020617;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            background-image: radial-gradient(circle at 50% 10%, #1e293b 0%, #020617 100%);
          }
          .login-card {
            background: rgba(15, 23, 42, 0.6); 
            backdrop-filter: blur(12px);
            padding: 1.25rem; /* Ultra Compact */
            border-radius: 12px;
            width: 100%;
            max-width: 280px; /* Slimmer */
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .login-logo { margin-bottom: 0.75rem !important; }
          
          .login-card p { 
            color: #64748b; 
            margin-bottom: 1rem; 
            font-size: 0.7rem; 
            text-transform: uppercase;
            letter-spacing: 0.15em;
            font-weight: 600;
          }
          
          .input-group { position: relative; margin-bottom: 0.5rem; }
          .input-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #475569; width: 14px; height: 14px; }
          
          .login-card input {
            width: 100%;
            padding: 8px 8px 8px 32px; /* Super compact */
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid #334155;
            border-radius: 6px;
            color: white;
            font-size: 0.85rem;
            outline: none;
            transition: all 0.2s;
          }
          .login-card input:focus { 
            border-color: #38bdf8; 
            background: rgba(30, 41, 59, 0.9);
            box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.3); 
          }
          
          .full-width { 
            width: 100%; 
            padding: 8px; 
            margin-top: 0.25rem; 
            font-size: 0.8rem;
            letter-spacing: 0.05em;
            border-radius: 6px;
          }
          .error-msg { color: #ef4444; font-size: 0.7rem; margin-bottom: 0.25rem; }          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}</style>
      </div>
    );
  }

  // --- RENDER: APP ---
  return (
    <div className="app-container">
      <Navbar
        activeCategory={activeCategory}
        onCategoryChange={(cat) => { setActiveCategory(cat); setShowTrash(false); }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddProduct={handleAddProduct}
        trashCount={trash.length}
        onOpenTrash={() => setShowTrash(!showTrash)}
      />

      <main className="container main-content">

        {loading && <div className="loading">Carregando estoque...</div>}

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
              <h2>Lixeira (Não salvos no banco)</h2>
              <button className="btn btn-secondary" onClick={() => setShowTrash(false)}>
                <X size={20} /> Fechar
              </button>
            </div>
            <p style={{ marginBottom: '1rem', color: '#ef4444' }}>Itens aqui ainda existem no banco, mas estão ocultos. Exclua definitivamente para limpar.</p>

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
          /* PRODUCT GRID */
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Gelar Depósito de Bebidas | Desenvolvido por @cviolla</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
            <button onClick={handleLogout} className="btn-logout-footer">Sair do Sistema</button>
            <span style={{ color: '#334155' }}>|</span>
            <button onClick={handleMigrateCategories} className="btn-logout-footer" style={{ color: '#f59e0b' }}>🛠️ Migrar Categorias</button>
          </div>
        </div>
      </footer>

      <style>{`
        .app-container { min-height: 100vh; display: flex; flex-direction: column; }
        .main-content { flex: 1; padding-top: 2rem; padding-bottom: 4rem; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
        
        .loading { color: white; text-align: center; padding: 2rem; }
        .empty-db-state {
          text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem;
          background: #18181b; border-radius: 12px; border: 1px dashed #3f3f46;
        }

        .footer { background: #020617; border-top: 1px solid #1e293b; color: #94a3b8; text-align: center; padding: 2rem 1rem; margin-top: auto; }
        .btn-logout-footer { background: none; border: none; color: #475569; font-size: 0.8rem; cursor: pointer; margin-top: 1rem; text-decoration: underline; }
        .btn-logout-footer:hover { color: #ef4444; }

        /* Trash Styles */
        .trash-view { background: #18181b; padding: 2rem; border-radius: 12px; border: 1px solid #334155; }
        .trash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .trash-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #27272a; margin-bottom: 0.5rem; border-radius: 8px; }
        .trash-actions { display: flex; gap: 0.5rem; }
        .btn-restore { background: #0ea5e9; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; }
        .btn-permanent-delete { background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; }
      `}</style>
    </div>
  );
}

export default App;
