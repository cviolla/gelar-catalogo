import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, User, Phone, MapPin, DollarSign, Package, Search, ChevronDown, ChevronUp, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { parsePrice, formatPrice } from '../utils/helpers';

export default function OrderHistory({ onClose }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [error, setError] = useState(null);

    // 'active' = Pedidos Normais | 'trash' = Lixeira
    const [viewMode, setViewMode] = useState('active');

    const fetchOrders = async () => {
        setLoading(true);

        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        // Filtro de Lixeira
        if (viewMode === 'active') {
            query = query.is('deleted_at', null);
        } else {
            query = query.not('deleted_at', 'is', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar pedidos:', error);
            setError('Não foi possível carregar o histórico de pedidos.');
            setOrders([]);
        } else {
            setOrders(data || []);
            setError(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [viewMode]); // Recarrega quando muda a aba


    // 1. Soft Delete (Mover para Lixeira)
    const handleSoftDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Mover pedido para a lixeira?")) return;

        const { error } = await supabase
            .from('orders')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            alert("Erro ao excluir: " + error.message);
        } else {
            // Remove da lista localmente para feedback instantâneo
            setOrders(orders.filter(o => o.id !== id));
        }
    };

    // 2. Restaurar da Lixeira
    const handleRestore = async (id, e) => {
        e.stopPropagation();
        const { error } = await supabase
            .from('orders')
            .update({ deleted_at: null })
            .eq('id', id);

        if (error) {
            alert("Erro ao restaurar: " + error.message);
        } else {
            setOrders(orders.filter(o => o.id !== id));
        }
    };

    // 3. Excluir Permanentemente
    const handlePermanentDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("ATENÇÃO: Isso apagará o pedido PARA SEMPRE. Confirmar?")) return;

        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Erro ao apagar definitivamente: " + error.message);
        } else {
            setOrders(orders.filter(o => o.id !== id));
        }
    };

    const toggleExpand = (id) => {
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const filteredOrders = orders.filter(order =>
        (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_phone || '').includes(searchTerm)
    );

    return (
        <div className="order-history-overlay">
            <div className={`order-history-container ${viewMode === 'trash' ? 'trash-mode' : ''}`}>
                <div className="history-header">
                    <h2>Histórico de Pedidos</h2>
                    <button className="btn-close" onClick={onClose}><X size={24} /></button>
                </div>

                {/* ABAS / TABS */}
                <div className="history-tabs">
                    <button
                        className={`tab-btn ${viewMode === 'active' ? 'active' : ''}`}
                        onClick={() => setViewMode('active')}
                    >
                        <Package size={16} /> Pedidos Ativos
                    </button>
                    <button
                        className={`tab-btn ${viewMode === 'trash' ? 'active-trash' : ''}`}
                        onClick={() => setViewMode('trash')}
                    >
                        <Trash2 size={16} /> Lixeira
                    </button>
                </div>

                <div className="history-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Buscar pedidos por nome ou telefone"
                    />
                </div>

                <div className="history-content">
                    {loading ? (
                        <div className="loading-state">Carregando...</div>
                    ) : error ? (
                        <div className="empty-state" style={{ color: '#ef4444' }}>
                            <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
                            <p>{error}</p>
                            <button
                                onClick={fetchOrders}
                                style={{ background: 'none', border: 'none', color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer', marginTop: '8px' }}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="empty-state">
                            {viewMode === 'active' ? 'Nenhum pedido ativo.' : 'Lixeira vazia.'}
                        </div>
                    ) : (
                        <div className="orders-list">
                            {filteredOrders.map(order => (
                                <div key={order.id} className="order-card">
                                    <div className="order-summary" onClick={() => toggleExpand(order.id)}>
                                        <div className="order-info-main">
                                            <span className="order-date"><Calendar size={14} /> {formatDate(order.created_at)}</span>
                                            <span className="order-customer-name">
                                                <strong>{order.customer_name}</strong>
                                                {viewMode === 'trash' && <span className="deleted-tag">NA LIXEIRA</span>}
                                            </span>
                                        </div>
                                        <div className="order-info-value">
                                            <span className="order-total">{formatPrice(order.total_value)}</span>

                                            {/* ACTIONS TOOLBAR */}
                                            <div className="card-actions">
                                                {viewMode === 'active' ? (
                                                    <button
                                                        className="btn-icon-action delete"
                                                        title="Mover para Lixeira"
                                                        onClick={(e) => handleSoftDelete(order.id, e)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn-icon-action restore"
                                                            title="Restaurar"
                                                            onClick={(e) => handleRestore(order.id, e)}
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>
                                                        <button
                                                            className="btn-icon-action permanent"
                                                            title="Excluir Definitivamente"
                                                            onClick={(e) => handlePermanentDelete(order.id, e)}
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {expandedOrderId === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>

                                    {expandedOrderId === order.id && (
                                        <div className="order-details">
                                            <div className="detail-row">
                                                <User size={16} /> <span>{order.customer_name}</span>
                                            </div>
                                            <div className="detail-row">
                                                <Phone size={16} /> <span>{order.customer_phone}</span>
                                            </div>
                                            <div className="detail-row">
                                                <MapPin size={16} />
                                                <span>
                                                    {order.customer_address}
                                                    {order.customer_neighborhood && ` - ${order.customer_neighborhood}`}
                                                    {order.customer_reference && ` (Ref: ${order.customer_reference})`}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <DollarSign size={16} /> <span>Pgto: <strong>{order.payment_method}</strong></span>
                                            </div>

                                            <div className="order-items-list">
                                                <h4>Itens do Pedido:</h4>
                                                {order.items && order.items.map((item, idx) => (
                                                    <div key={idx} className="order-item-row">
                                                        <span>{item.quantity}x {item.productName} ({item.priceLabel})</span>
                                                        <span>{formatPrice(item.priceValue)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="lgpd-note">
                                                * Dados confidenciais. Uso interno exclusivo.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
}
