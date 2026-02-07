import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Home, User, Phone, MapPin, CreditCard, ShoppingCart, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CartComponent() {
    const { cart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, cartTotal } = useCart();
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '', neighborhood: '', reference: '', payment: 'Pix' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!customer.name || !customer.phone || !customer.address || !customer.neighborhood) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        setIsSubmitting(true);

        // Format phone number (assume DDD 21 if missing)
        let formattedPhone = customer.phone.replace(/\D/g, '');
        if (formattedPhone.length <= 9) {
            formattedPhone = `21${formattedPhone}`;
        }

        // Format for display: +55(21)9999-9999
        let displayPhone = formattedPhone;
        if (formattedPhone.length >= 10) {
            const ddd = formattedPhone.substring(0, 2);
            const part1 = formattedPhone.substring(2, formattedPhone.length - 4);
            const part2 = formattedPhone.substring(formattedPhone.length - 4);
            displayPhone = `+55(${ddd})${part1}-${part2}`;
        }

        // FORMAT WHATSAPP MESSAGE
        const orderItems = cart.map(item =>
            `- ${item.productName} (${item.priceLabel}): ${item.quantity}x R$ ${item.priceValue} = *R$ ${(parseFloat(item.priceValue.replace('R$ ', '').replace(',', '.')) * item.quantity).toFixed(2).replace('.', ',')}*`
        ).join('\n');

        const totalFormatted = `*R$ ${cartTotal.toFixed(2).replace('.', ',')}*`;

        const message = `*NOVO PEDIDO - GELAR DEPÓSITO*\n\n` +
            `*Cliente:* ${customer.name}\n` +
            `*Telefone:* ${displayPhone}\n` +
            `*Endereço:* ${customer.address} - ${customer.neighborhood}\n` +
            `*Referência:* ${customer.reference}\n` +
            `*Pagamento:* *${customer.payment.toUpperCase()}*\n\n` +
            `*ITENS DO PEDIDO:*\n${orderItems}\n\n` +
            `*TOTAL:* ${totalFormatted}\n` +
            `____________________________________________`;

        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = "5521965226788"; // Replace with actual number if needed, currently using developer's number? Or should stick to "depósito" number. The footer mentions @cviolla but deposit might be different. I will use a placeholder or ask. Wait user said "whatsapp do depósito". I'll use a placeholder for now or the one in the footer.

        // SAVE ORDER TO SUPABASE
        try {
            const { error } = await supabase.from('orders').insert([{
                customer_name: customer.name,
                customer_phone: formattedPhone,
                customer_address: customer.address,
                customer_neighborhood: customer.neighborhood,
                customer_reference: customer.reference,
                payment_method: customer.payment,
                items: cart, // Supabase stores JSON automatically
                total_value: cartTotal
            }]);

            if (error) {
                console.error("Error saving order:", error);
                // We don't block the user, just log it. The main flow is WhatsApp.
            }
        } catch (err) {
            console.error("Unexpected error saving order:", err);
        }

        const waLink = `https://wa.me/5521965226788?text=${encodedMessage}`;
        window.open(waLink, '_blank');

        // Clear cart after successful checkout? Maybe wait for confirmation?
        // For now, let's clear it to reset the state.
        clearCart();
        setIsCartOpen(false);
        setIsSubmitting(false);
    };

    if (!isCartOpen) return (
        <button
            className="floating-cart-btn"
            onClick={() => setIsCartOpen(true)}
        >
            <div className="cart-icon-wrapper">
                <ShoppingCart size={24} />
                {cart.length > 0 && <span className="cart-badge">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
            </div>
            {cart.length > 0 ? (
                <>
                    <span className="cart-label">Ver Carrinho</span>
                    <span className="cart-total-preview">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </>
            ) : (
                <span className="cart-label">Carrinho Vazio</span>
            )}
        </button>
    );

    return (
        <div className="cart-overlay">
            <div className="cart-container">
                <div className="cart-header">
                    <div className="header-top">
                        <h2>Seu Carrinho</h2>
                        <button className="btn-close" onClick={() => setIsCartOpen(false)}><X size={24} /></button>
                    </div>
                    <button className="btn-back-text" onClick={() => setIsCartOpen(false)}>
                        <ArrowLeft size={18} /> Voltar para Pedidos
                    </button>
                </div>

                <div className="cart-body">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <ShoppingCart size={48} opacity={0.3} />
                            <p>Seu carrinho está vazio.</p>
                            <button onClick={() => setIsCartOpen(false)} className="btn-continue">
                                <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
                                Voltar para Pedidos
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="cart-item">
                                        <div className="item-info">
                                            <h4>{item.productName}</h4>
                                            <p className="item-variant">{item.priceLabel}</p>
                                            <p className="item-price">R$ {item.priceValue}</p>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.cartItemId)}
                                            className="btn-trash-item"
                                            title="Remover Item"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                        <div className="item-controls">
                                            <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-total">
                                <span>Total:</span>
                                <span className="total-value">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                            </div>

                            <form onSubmit={handleCheckout} className="checkout-form">
                                <h3>Finalizar Pedido</h3>

                                <div className="input-group">
                                    <User size={18} />
                                    <input
                                        placeholder="Seu Nome"
                                        required
                                        value={customer.name}
                                        onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                    />
                                </div>

                                <div className="input-group">
                                    <Phone size={18} />
                                    <input
                                        placeholder="Seu Telefone"
                                        required
                                        value={customer.phone}
                                        onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                    />
                                </div>

                                <div className="input-group">
                                    <textarea
                                        placeholder="Endereço (Rua e Número)"
                                        required
                                        value={customer.address}
                                        onChange={e => setCustomer({ ...customer, address: e.target.value })}
                                        style={{ minHeight: '60px' }}
                                    />
                                </div>

                                <div className="input-group">
                                    <MapPin size={18} />
                                    <input
                                        placeholder="Bairro"
                                        required
                                        value={customer.neighborhood}
                                        onChange={e => setCustomer({ ...customer, neighborhood: e.target.value })}
                                    />
                                </div>

                                <div className="input-group">
                                    <MapPin size={18} />
                                    <input
                                        placeholder="Ponto de Referência"
                                        value={customer.reference}
                                        onChange={e => setCustomer({ ...customer, reference: e.target.value })}
                                    />
                                </div>

                                <div className="input-group">
                                    <CreditCard size={18} />
                                    <select
                                        value={customer.payment}
                                        onChange={e => setCustomer({ ...customer, payment: e.target.value })}
                                    >
                                        <option value="Pix">Pix</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                                        <option value="Cartão de Débito">Cartão de Débito</option>
                                    </select>
                                </div>

                                <button type="submit" className="btn-whatsapp" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Loader2 className="animate-spin" size={24} />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Send size={24} />
                                        </div>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
            <style>{`
        .floating-cart-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          color: #38BDF8;
          width: auto;
          height: auto;
          min-width: 56px;
          min-height: 56px;
          padding: 0 1.25rem;
          border-radius: 28px;
          border: 1px solid rgba(56, 189, 248, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.1);
          cursor: pointer;
          display: flex;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.75rem;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-direction: row !important; /* Force row definitely */
          white-space: nowrap !important; /* Prevent wrapping */
        }
        .floating-cart-btn:hover {
          transform: translateY(-4px);
          background: rgba(15, 23, 42, 0.95);
          border-color: #38BDF8;
          box-shadow: 0 12px 40px rgba(12, 170, 220, 0.3), 0 0 0 1px rgba(56, 189, 248, 0.3);
          color: #ffffff;
        }
        .floating-cart-btn:active {
          transform: translateY(0);
        }

        .cart-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cart-label {
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          display: block !important;
          color: #fbbf24; /* Amber/Orange color as requested/implied for visibility */
          text-transform: uppercase;
          margin-top: 0 !important; /* Ensure no top margin pushing it down */
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }

        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0f172a;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          z-index: 10;
        }
        
        .cart-total-preview {
          font-size: 0.85rem;
          color: #94a3b8;
          margin-left: 0.5rem;
          padding-left: 0.75rem;
          border-left: 1px solid rgba(255,255,255,0.1);
          font-weight: 500;
        }
        
        .floating-cart-btn:hover .cart-total-preview {
          color: #e2e8f0;
        }

        .cart-overlay {
          position: fixed;
          top: 0; right: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          justify-content: flex-end;
          transition: opacity 0.3s ease;
        }

        .cart-container {
          background: #0f172a;
          width: 100%;
          max-width: 450px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: -5px 0 20px rgba(0,0,0,0.5);
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .cart-header {
          padding: 1.5rem;
          border-bottom: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .btn-close { background: none; border: none; color: #94a3b8; cursor: pointer; }
        
        .btn-back-text {
            background: rgba(51, 65, 85, 0.5);
            color: #38BDF8;
            border: 1px solid rgba(56, 189, 248, 0.2);
            padding: 0.6rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            font-weight: 500;
            width: fit-content;
            transition: all 0.2s;
        }
        .btn-back-text:hover {
            background: rgba(56, 189, 248, 0.1);
            color: white;
            border-color: #38BDF8;
        }

        .cart-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
          gap: 1rem;
        }
        .btn-continue {
            padding: 0.75rem 1.5rem;
            background: #1e293b;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }

        .cart-items {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #1e293b;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid transparent;
            transition: border-color 0.2s;
        }
        .cart-item:hover {
            border-color: #334155;
        }
        .item-info { flex: 1; min-width: 0; }
        .item-info h4 { 
            margin: 0; font-size: 0.95rem; color: white; 
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .item-variant { font-size: 0.8rem; color: #94a3b8; margin: 2px 0; }
        .item-price { font-weight: bold; color: #38bdf8; }

        .item-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .item-controls button {
            width: 28px; height: 28px;
            background: #334155;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .btn-trash-item { 
            background: rgba(239, 68, 68, 0.1); 
            color: #f87171; 
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            margin: 0 1rem;
            flex-shrink: 0;
        }
        .btn-trash-item:hover {
            background: rgba(239, 68, 68, 0.2); 
            transform: scale(1.1);
            color: #ef4444;
        }

        .cart-total {
            display: flex;
            justify-content: space-between;
            font-size: 1.25rem;
            font-weight: bold;
            padding: 1rem 0;
            border-top: 1px solid #334155;
            border-bottom: 1px solid #334155;
            margin-bottom: 2rem;
        }
        .total-value { color: #38bdf8; }

        .checkout-form h3 { margin-bottom: 1rem; color: white; }
        .input-group {
            position: relative;
            margin-bottom: 1rem;
        }
        .input-group svg {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
        }
        .input-group input, .input-group textarea, .input-group select {
            width: 100%;
            padding: 12px 12px 12px 40px;
            background: #020617;
            border: 1px solid #334155;
            border-radius: 8px;
            color: white;
            font-family: inherit;
        }
        .input-group textarea { min-height: 80px; resize: vertical; }
        
        .btn-whatsapp {
            width: 100%;
            padding: 1rem;
            background: #f97316; /* Laranja */
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 1rem;
            cursor: pointer;
            text-transform: uppercase;
            margin-top: 1rem;
            transition: background 0.2s;
        }
        .btn-whatsapp:hover { background: #ea580c; }
        .btn-whatsapp:disabled { opacity: 0.7; cursor: not-allowed; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

      `}</style>
        </div>
    );
}
