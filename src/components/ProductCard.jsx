import React, { useState, useRef } from 'react';
import { Edit2, Save, X, Upload, Image as ImageIcon, Plus, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { categories } from '../data/products';
import { supabase } from '../lib/supabase'; // Import Supabase Client

export default function ProductCard({ product, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({ ...product });
  const [uploading, setUploading] = useState(false); // Estado de load
  const fileInputRef = useRef(null);

  // Tabela de Palavras-Chave -> Categoria
  const keywordMap = {
    'cerveja': 'Cervejas', 'brahma': 'Cervejas', 'skol': 'Cervejas', 'antarctica': 'Cervejas',
    'heineken': 'Long Neck / Latão', 'stella': 'Long Neck / Latão', 'budweiser': 'Long Neck / Latão', 'corona': 'Long Neck / Latão',
    'imperio': 'Cervejas', 'amstel': 'Latão 473ml', 'latão': 'Latão 473ml', 'latao': 'Latão 473ml',
    'refri': 'Refrigerantes', 'coca': 'Refrigerantes', 'fanta': 'Refrigerantes', 'guarana': 'Refrigerantes', 'sprite': 'Refrigerantes', 'pepsi': 'Refrigerantes',
    'agua': 'Águas', 'água': 'Águas', 'mineral': 'Águas',
    'gelo': 'Gelo', 'escama': 'Gelo',
    'carvão': 'Carvão', 'carvao': 'Carvão'
  };

  const autoCategorize = (text) => {
    const lowerText = text.toLowerCase();
    for (const [key, category] of Object.entries(keywordMap)) {
      if (lowerText.includes(key)) return category;
    }
    return null;
  };

  // Handle text changes with Auto-Categorization
  const handleChange = (field, value) => {
    setEditedProduct(prev => {
      const updates = { ...prev, [field]: value };

      // Se alterou o nome, tenta adivinhar a categoria
      if (field === 'name') {
        const suggestedCategory = autoCategorize(value);
        if (suggestedCategory) {
          updates.category = suggestedCategory;
        }
      }
      return updates;
    });
  };

  // Handle Price Changes in the array
  const handlePriceChange = (index, field, value) => {
    const newPrices = [...editedProduct.prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setEditedProduct(prev => ({ ...prev, prices: newPrices }));
  };

  const addPriceRow = () => {
    setEditedProduct(prev => ({
      ...prev,
      prices: [...prev.prices, { label: 'Nova Opção', value: 'R$ 0,00' }]
    }));
  };

  const removePriceRow = (index) => {
    setEditedProduct(prev => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index)
    }));
  };

  // Handle Image Upload (SUPABASE STORAGE)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'products' bucket
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      // Update State immediately with the new cloud URL
      setEditedProduct(prev => ({
        ...prev,
        image_url: data.publicUrl,
        image: data.publicUrl // Fallback for immediate preview if needed
      }));

    } catch (error) {
      alert('Erro ao enviar imagem: ' + error.message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    onUpdate(editedProduct);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProduct({ ...product });
    setIsEditing(false);
  };

  return (
    <div className={`product-card ${isEditing ? 'editing' : ''}`}>
      {/* Image Area */}
      <div className="card-image-area">
        {editedProduct.image_url || editedProduct.image ? (
          <img
            src={editedProduct.image_url || editedProduct.image}
            alt={editedProduct.name}
            className="product-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/400x300?text=Sem+Imagem'; // Fallback
            }}
          />
        ) : (
          <div className="placeholder-img">
            <ImageIcon size={48} opacity={0.3} />
          </div>
        )}

        {isEditing && (
          <div className="image-overlay">
            <button className="btn-upload" onClick={() => fileInputRef.current.click()}>
              <Upload size={20} /> Alterar Foto
            </button>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        )}

        <div className="volume-badge">
          {isEditing ? (
            <input
              className="input-mini"
              value={editedProduct.volume}
              onChange={(e) => handleChange('volume', e.target.value)}
            />
          ) : (
            editedProduct.volume
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="card-content">
        {/* Category Badge / Selector */}
        <div style={{ marginBottom: '0.5rem' }}>
          {isEditing ? (
            <select
              className="input-select"
              value={editedProduct.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              {categories.filter(c => c !== 'Todos').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          ) : (
            <span className="category-badge">{editedProduct.category}</span>
          )}
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          {isEditing ? (
            <select
              className="input-select"
              value={editedProduct.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              {categories.filter(c => c !== 'Todos').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          ) : (
            <span className="category-badge">{editedProduct.category}</span>
          )}
        </div>

        {uploading && (
          <div className="uploading-indicator">
            <Loader2 className="spin" size={16} /> Enviando imagem...
          </div>
        )}

        {uploading && (
          <div className="uploading-indicator">
            <Loader2 className="spin" size={16} /> Enviando imagem...
          </div>
        )}

        <div className="card-header">
          {isEditing ? (
            <input
              className="input-title"
              value={editedProduct.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          ) : (
            <h3>{editedProduct.name}</h3>
          )}

          <div className="card-actions-top">
            <button
              className="btn-icon btn-delete"
              onClick={() => {
                if (window.confirm('Mover para lixeira?')) onDelete(product.id);
              }}
              title="Excluir"
            >
              <Trash2 size={18} />
            </button>
            <button
              className="btn-icon"
              onClick={isEditing ? handleCancel : () => setIsEditing(true)}
              title={isEditing ? "Cancelar" : "Editar"}
            >
              {isEditing ? <X size={20} /> : <Edit2 size={18} />}
            </button>
          </div>
        </div>

        {/* Prices List */}
        <div className="prices-list">
          {editedProduct.prices.map((price, index) => (
            <div key={index} className="price-row">
              {isEditing ? (
                <>
                  <input
                    className="input-label"
                    value={price.label}
                    onChange={(e) => handlePriceChange(index, 'label', e.target.value)}
                    placeholder="Tipo (ex: Caixa)"
                  />
                  <input
                    className="input-value"
                    value={price.value}
                    onChange={(e) => handlePriceChange(index, 'value', e.target.value)}
                    placeholder="Valor"
                  />
                  <button className="btn-remove" onClick={() => removePriceRow(index)}>
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="price-label">{price.label}:</span>
                  <span className="price-value">R$ {price.value.replace('R$ ', '')}</span>
                </>
              )}
            </div>
          ))}

          {isEditing && (
            <button className="btn-add-price" onClick={addPriceRow}>
              <Plus size={16} /> Adicionar Preço
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="card-actions">
          <button className="btn btn-primary full-width" onClick={handleSave}>
            <Save size={18} /> Salvar Alterações
          </button>
        </div>
      )}

      <style>{`
        .product-card {
          background: var(--bg-card); /* Respond to theme */
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
          border: 1px solid transparent;
          display: flex;
          flex-direction: column;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: rgba(12, 170, 220, 0.3);
        }

        .product-card.editing {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px var(--color-accent);
          transform: none;
        }

        .card-image-area {
          height: 140px; /* Reduced form 200px for compactness */
          background: #020617; /* Darkest layer */
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #111827;
        }

        .product-img {
          width: 100%;
          height: 100%;
          object-fit: contain; /* Mostra o produto inteiro */
          padding: 1rem;
        }

        .placeholder-img {
          color: #94a3b8;
        }

        .volume-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-upload {
          background: #0f172a;
          color: white;
          border: 1px solid #334155;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .card-content {
          padding: 0.75rem; /* Tighter padding */
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem; /* Reduced from 1rem */
          gap: 0.5rem;
        }

        .card-header h3 {
          font-size: 1rem; /* Slightly smaller for density */
          color: var(--color-primary);
          margin: 0;
          line-height: 1.2;
          font-weight: 600;
        }

        .prices-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem; /* Tighter gaps */
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem; /* Compact font */
          border-bottom: 1px dashed #27272a; /* Darker dash */
          padding-bottom: 2px;
        }

        .price-row:last-child {
          border-bottom: none;
        }

        .price-label {
          color: var(--text-muted);
        }

        .price-value {
          font-weight: 700;
          color: var(--color-primary);
        }

        /* Inputs for Edit Mode */
        .input-mini {
          width: 80px;
          padding: 2px 5px;
          font-size: 0.75rem;
          border-radius: 4px;
          border: 1px solid white;
        }

        .input-title {
          font-size: 1.1rem;
          font-weight: 700;
          width: 100%;
          padding: 4px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          color: var(--color-primary);
        }

        .input-label {
          width: 40%;
          padding: 4px;
          font-size: 0.85rem;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
        }

        .input-value {
          width: 40%;
          padding: 4px;
          font-size: 0.85rem;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          text-align: right;
        }

        /* Buttons */
        .btn-icon {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .btn-icon:hover {
          color: var(--color-secondary);
          background: rgba(12, 170, 220, 0.1);
        }

        .btn-delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .card-actions-top {
          display: flex;
          gap: 0.5rem;
        }

        .btn-remove {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .btn-add-price {
          width: 100%;
          background: rgba(15, 23, 42, 0.5);
          color: var(--color-secondary);
          border: 1px dashed var(--color-secondary);
          padding: 6px;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 0.5rem;
        }
        
        .card-actions {
          padding: 1rem;
          background: #0f172a;
          border-top: 1px solid #334155;
        }
        
        .input-select {
          width: 100%;
          padding: 4px;
          border-radius: 4px;
          border: 1px solid #1e293b;
          background: #09090b;
          color: var(--color-primary);
          font-size: 0.8rem;
        }

        .category-badge {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid #1e293b;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .uploading-indicator {
          color: var(--color-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .full-width {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
