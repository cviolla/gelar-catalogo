import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Home, User, Phone, MapPin, CreditCard, ShoppingCart, ArrowLeft, Send, Loader2, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parsePrice, formatPrice } from '../utils/helpers';

export default function CartComponent() {
    const { cart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, cartTotal } = useCart();
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '', neighborhood: '', reference: '', payment: 'Pix' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState("5521964788628"); // Fallback

    // Buscar configurações do banco (WhatsApp)
    React.useEffect(() => {
        async function fetchConfig() {
            if (!supabase) {
                console.warn("Supabase not initialized, using default WhatsApp number.");
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('store_config')
                    .select('value')
                    .eq('key', 'whatsapp_number')
                    .single();

                if (data && data.value) {
                    setWhatsappNumber(data.value);
                }
            } catch (err) {
                console.error("Erro ao carregar config:", err);
            }
        }
        fetchConfig();
    }, []);

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
            `- ${item.productName} (${item.priceLabel}): ${item.quantity}x ${item.priceValue} = *${formatPrice(parsePrice(item.priceValue) * item.quantity)}*`
        ).join('\n');

        const totalFormatted = `*${formatPrice(cartTotal)}*`;

        const message = `*NOVO PEDIDO - GELAR DEPÓSITO*\n\n` +
            `*Cliente:* ${customer.name}\n` +
            `*Telefone:* ${displayPhone}\n` +
            `*Endereço:* ${customer.address} - ${customer.neighborhood}\n` +
            `*Referência:* ${customer.reference}\n` +
            `*Pagamento:* *${customer.payment.toUpperCase()}*\n\n` +
            `*ITENS DO PEDIDO:*\n${orderItems}\n\n` +
            `*TOTAL:* ${totalFormatted}\n` +
            `_(Taxa de entrega a combinar)_\n` +
            `____________________________________________`;

        const encodedMessage = encodeURIComponent(message);

        // SAVE ORDER TO SUPABASE
        try {
            if (supabase) {
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
                }
            } else {
                console.warn("Supabase client not available, order not saved to DB.");
            }
        } catch (err) {
            console.error("Unexpected error saving order:", err);
        }

        const waLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(waLink, '_blank');

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
                <ShoppingCart size={24} color="#38BDF8" />
                {cart.length > 0 && (
                    <span className="cart-badge">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                )}
            </div>

            <div className="cart-label-container">
                {cart.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="cart-label">VER PEDIDO ✨</span>
                        <span className="cart-total-preview">{formatPrice(cartTotal)}</span>
                    </div>
                ) : (
                    <span className="cart-label">CARRINHO VAZIO</span>
                )}
            </div>
        </button>
    );

    return (
        <div className="cart-overlay" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
            <div className="cart-container">
                <div className="cart-header">
                    <div className="header-top">
                        <h2>Seu Carrinho</h2>
                        <button className="btn-close" onClick={() => setIsCartOpen(false)} aria-label="Fechar carrinho"><X size={24} aria-hidden="true" /></button>
                    </div>
                    <button className="btn-back-text" onClick={() => setIsCartOpen(false)} aria-label="Voltar para o catálogo">
                        <ArrowLeft size={18} aria-hidden="true" /> VOLTAR PARA PEDIDOS
                    </button>
                </div>

                <div className="cart-body">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <ShoppingCart size={48} opacity={0.3} />
                            <p>Seu carrinho está vazio.</p>
                            <button onClick={() => setIsCartOpen(false)} className="btn-continue">
                                <ArrowLeft size={18} />
                                VOLTAR PARA PEDIDOS
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
                                            aria-label={`Remover ${item.productName} (${item.priceLabel}) do carrinho`}
                                        >
                                            <Trash2 size={18} aria-hidden="true" />
                                        </button>

                                        <div className="item-controls">
                                            <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="btn-qty" aria-label={`Diminuir quantidade de ${item.productName}`}>
                                                <Minus size={16} aria-hidden="true" />
                                            </button>
                                            <span className="qty-value" aria-live="polite" aria-atomic="true">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="btn-qty" aria-label={`Aumentar quantidade de ${item.productName}`}>
                                                <Plus size={16} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-total">
                                <span>Total:</span>
                                <span className="total-value">{formatPrice(cartTotal)}</span>
                            </div>
                            <p style={{ textAlign: 'center', color: '#fbbf24', fontSize: '0.9rem', marginBottom: '1.5rem', fontStyle: 'italic', fontWeight: 'bold' }}>
                                * TAXA DE ENTREGA A COMBINAR
                            </p>

                            <form onSubmit={handleCheckout} className="checkout-form">
                                <h3>Finalizar Pedido</h3>

                                <div className="input-group">
                                    <User size={18} />
                                    <input
                                        placeholder="Seu Nome"
                                        required
                                        value={customer.name}
                                        onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                        aria-label="Seu Nome Completo"
                                    />
                                </div>

                                <div className="input-group">
                                    <Phone size={18} />
                                    <input
                                        placeholder="Seu Telefone"
                                        required
                                        value={customer.phone}
                                        onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                        aria-label="Seu Telefone com DDD"
                                    />
                                </div>

                                <div className="input-group">
                                    <textarea
                                        placeholder="Endereço (Rua e Número)"
                                        required
                                        value={customer.address}
                                        onChange={e => setCustomer({ ...customer, address: e.target.value })}
                                        style={{ minHeight: '60px' }}
                                        aria-label="Endereço Completo (Rua e Número)"
                                    />
                                </div>

                                <div className="input-group">
                                    <MapPin size={18} />
                                    <input
                                        placeholder="Bairro"
                                        required
                                        value={customer.neighborhood}
                                        onChange={e => setCustomer({ ...customer, neighborhood: e.target.value })}
                                        aria-label="Seu Bairro"
                                    />
                                </div>

                                <div className="input-group">
                                    <MapPin size={18} />
                                    <input
                                        placeholder="Ponto de Referência"
                                        value={customer.reference}
                                        onChange={e => setCustomer({ ...customer, reference: e.target.value })}
                                        aria-label="Ponto de Referência (Opcional)"
                                    />
                                </div>

                                <div className="input-group">
                                    <CreditCard size={18} />
                                    <select
                                        value={customer.payment}
                                        onChange={e => setCustomer({ ...customer, payment: e.target.value })}
                                        aria-label="Método de Pagamento"
                                    >
                                        <option value="Pix">Pix</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                                        <option value="Cartão de Débito">Cartão de Débito</option>
                                    </select>
                                </div>
                                <p style={{ color: '#fbbf24', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1.5rem', marginTop: '1.5rem', fontWeight: '700', letterSpacing: '0.02em' }}>
                                    ⚠️ COMPRAS NO CARTÃO POSSUEM ACRÉSCIMO.
                                </p>

                                <button type="submit" className="btn-whatsapp" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <Loader2 className="animate-spin" size={24} />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                            <span>Enviar Pedido</span>
                                        </div>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
}
