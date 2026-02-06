import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import { supabase } from './lib/supabase'; // Real DB
import { products as initialSeedData } from './data/products';
import { Info, RotateCcw, Trash2, X, Database } from 'lucide-react';

function App() {
  const [products, setProducts] = useState([]);
  const [trash, setTrash] = useState([]); // In future this could be a 'deleted_at' column in DB
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrash, setShowTrash] = useState(false);

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

      // Auto-Seed: Se o banco estiver vazio, sugere popular
      if (data && data.length === 0) {
        // Optional: auto-seed logic could go here
      }
    }
    setLoading(false);
  };

  useEffect(() => {
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
    // Optimistic Update (atualiza na tela antes do banco)
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
  // For this MVP, we are using local trash state, but for persistent trash 
  // we would need a 'deleted' column. To keep it simple and persistent:
  // We will DELETE from DB but keep in 'trash' state locally until page refresh.
  // OR BETTER: We create a 'trash' table? 
  // Let's stick to true DELETE for 'Permanent' and 'Local State' for Undo buffer.
  const handleDeleteProduct = (id) => {
    const productToDelete = products.find(p => p.id === id);
    if (productToDelete) {
      setTrash([productToDelete, ...trash]); // Add to local trash
      setProducts(products.filter(p => p.id !== id)); // Remove from local view

      // We DON'T delete from DB yet, giving chance to restore.
      // If user closes page, item effectively remains in DB but 'hidden' ??
      // No, for a real app, 'soft delete' is best.
      // Let's do Real Delete on 'Excluir Definitivamente' and Temporary Hide here.
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
    // Format data for DB (remove IDs to let DB generate UUIDs)
    const seed = initialSeedData.map(({ id, image, ...rest }) => ({
      ...rest,
      image_url: null // Start without images to avoid complexity
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

  // Search Normalization Helper
  const normalizeText = (text) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Filter Logic
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const normName = normalizeText(product.name || "");
    const normSearch = normalizeText(searchTerm);
    return matchesCategory && normName.includes(normSearch);
  });

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
