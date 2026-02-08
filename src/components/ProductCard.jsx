import React, { useState, useRef } from 'react';
import { Edit2, Save, X, Upload, Image as ImageIcon, Plus, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { autoCategorize } from '../utils/helpers';
import { categories } from '../data/products';

export default function ProductCard({ product, onUpdate, onDelete, onExpand, readOnly }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({ ...product });
  const [uploading, setUploading] = useState(false); // Estado de load
  const fileInputRef = useRef(null);

  // Stop propagation for buttons and inputs
  const stopProp = (e) => e.stopPropagation();


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

  const handleSave = async () => {
    setUploading(true);
    await onUpdate(editedProduct);
    setUploading(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProduct({ ...product });
    setIsEditing(false);
  };

  return (
    <div
      className={`product-card ${isEditing ? 'editing' : ''}`}
      onClick={() => !isEditing && onExpand && onExpand(product)}
      style={{ cursor: !isEditing ? 'pointer' : 'default' }}
    >
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
            <button className="btn-upload" onClick={(e) => { stopProp(e); fileInputRef.current.click(); }}>
              <Upload size={20} /> Alterar Foto
            </button>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={(e) => { stopProp(e); handleImageUpload(e); }}
            />
          </div>
        )}

        <div className="volume-badge">
          {isEditing ? (
            <input
              className="input-mini"
              value={editedProduct.volume}
              onClick={stopProp}
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
        <div style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
          {isEditing ? (
            <select
              className="input-select"
              value={editedProduct.category}
              onClick={stopProp}
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



        <div className="card-header">
          {isEditing ? (
            <input
              className="input-title"
              value={editedProduct.name}
              onClick={stopProp}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          ) : (
            <h3>{editedProduct.name}</h3>
          )}

          {!readOnly && !isEditing && (
            <div className="card-actions-top">
              <button
                className="btn-icon btn-delete"
                onClick={(e) => {
                  stopProp(e);
                  if (window.confirm('Mover para lixeira?')) onDelete(product.id);
                }}
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
              <button
                className="btn-icon btn-edit"
                onClick={(e) => {
                  stopProp(e);
                  setIsEditing(true);
                }}
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Prices List - Sorted Low to High on View */}
        <div className="prices-list">
          {(isEditing ? (editedProduct.prices || []) : [...(editedProduct.prices || [])].sort((a, b) => {
            // Helper to parse "95,00" -> 95.00
            const parseVal = (v) => parseFloat(String(v?.value || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.') || 0);
            return parseVal(a) - parseVal(b);
          })).map((price, index) => (
            <div key={index} className="price-row">
              {isEditing ? (
                <>
                  <input
                    className="input-label"
                    value={price.label || ''}
                    onChange={(e) => handlePriceChange(index, 'label', e.target.value)}
                    placeholder="Tipo (ex: Caixa)"
                  />
                  <input
                    className="input-value"
                    value={price.value || ''}
                    onChange={(e) => handlePriceChange(index, 'value', e.target.value)}
                    placeholder="Valor"
                  />
                  <button className="btn-remove" onClick={() => removePriceRow(index)}>
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className={`price-label ${price.label === 'Promoção' ? 'text-promo' : ''}`}>
                    {price.label === 'Promoção' ? 'PROMO' : price.label}{price.label === 'Promoção' ? '' : ':'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', flex: 1 }}>
                    <span className={`price-value ${price.label === 'Promoção' ? 'text-promo' : ''}`}>
                      {(() => {
                        const cartItemId = `${product.id}-${price.label}`;
                        const itemInCart = cart.find(item => item.cartItemId === cartItemId);
                        const quantity = itemInCart ? itemInCart.quantity : 1;

                        const isTextPrice = /[a-zA-Z]/.test(String(price.value).replace(/^R\$\s*/, ''));
                        if (isTextPrice) return price.value;

                        const unitValue = parseFloat(String(price.value).replace('R$ ', '').replace(/\./g, '').replace(',', '.') || 0);
                        const totalValue = unitValue * quantity;

                        return `R$ ${totalValue.toFixed(2).replace('.', ',')}`;
                      })()}
                    </span>
                    {(() => {
                      const cartItemId = `${product.id}-${price.label}`;
                      const itemInCart = cart.find(item => item.cartItemId === cartItemId);

                      if (itemInCart) {
                        return (
                          <div className="quantity-control-expanded" style={{ height: '24px' }}>
                            <button
                              className="btn-qty-minus"
                              style={{ width: '22px', fontSize: '0.9rem' }}
                              onClick={(e) => { stopProp(e); updateQuantity(cartItemId, itemInCart.quantity - 1); }}
                            >
                              -
                            </button>
                            <span className="qty-value" style={{ minWidth: '25px', padding: '0 0.4rem', fontSize: '0.75rem' }}>
                              {itemInCart.quantity}
                            </span>
                            <button
                              className="btn-qty-plus"
                              style={{ width: '22px', fontSize: '0.9rem' }}
                              onClick={(e) => { stopProp(e); addToCart(product, price); }}
                            >
                              +
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          className="btn-add-cart"
                          onClick={(e) => { stopProp(e); addToCart(product, price); }}
                        >
                          +
                        </button>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          ))}

          {isEditing && (
            <button className="btn-add-price" onClick={(e) => { stopProp(e); addPriceRow(); }}>
              <Plus size={16} /> Adicionar Preço
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="card-actions-edit">
          <button className="btn btn-primary flex-1" onClick={handleSave}>
            SALVAR
          </button>
          <button className="btn btn-secondary flex-1" onClick={handleCancel}>
            VOLTAR
          </button>
        </div>
      )}

    </div>
  );
}
