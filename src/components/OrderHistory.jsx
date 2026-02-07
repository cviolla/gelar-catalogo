import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Calendar, User, Phone, MapPin, DollarSign, Package, Search, ChevronDown, ChevronUp, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

export default function OrderHistory({ onClose }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    // 'active' = Pedidos Normais | 'trash' = Lixeira
    const [viewMode, setViewMode] = useState('active');

    useEffect(() => {
        fetchOrders();
    }, [viewMode]); // Recarrega quando muda a aba

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
            // Se der erro (ex: coluna não existe), mostra vazio para não travar
            setOrders([]);
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    };

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
                    />
                </div>

                <div className="history-content">
                    {loading ? (
                        <div className="loading-state">Carregando...</div>
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
                                                {viewMode === 'trash' && <span className="deleted-tag">EXCLUÍDO</span>}
                                            </span>
                                        </div>
                                        <div className="order-info-value">
                                            <span className="order-total">R$ {parseFloat(order.total_value).toFixed(2).replace('.', ',')}</span>

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
                                                        <span>R$ {item.priceValue}</span>
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

            <style>{`
                .order-history-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(5px);
                    z-index: 2500;
                    display: flex; justify-content: center; align-items: center;
                    padding: 1rem;
                }
                .order-history-container {
                    background: #0f172a;
                    width: 100%; max-width: 600px;
                    height: 90vh;
                    border-radius: 16px;
                    border: 1px solid #334155;
                    display: flex; flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    transition: border-color 0.3s;
                }
                .order-history-container.trash-mode {
                    border-color: #ef4444;
                }

                .history-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #1e293b;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .history-header h2 { color: #f8fafc; font-size: 1.25rem; margin: 0; }
                .btn-close { background: none; border: none; color: #94a3b8; cursor: pointer; }

                /* TABS */
                .history-tabs {
                    display: flex;
                    border-bottom: 1px solid #1e293b;
                }
                .tab-btn {
                    flex: 1;
                    background: none;
                    border: none;
                    padding: 1rem;
                    color: #64748b;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    font-weight: 600;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                .tab-btn:hover { color: #94a3b8; background: #1e293b; }
                .tab-btn.active { color: #38bdf8; border-bottom-color: #38bdf8; }
                .tab-btn.active-trash { color: #ef4444; border-bottom-color: #ef4444; }

                .history-search {
                    padding: 1rem;
                    position: relative;
                    border-bottom: 1px solid #1e293b;
                }
                .search-icon { position: absolute; left: 24px; top: 50%; transform: translateY(-50%); color: #64748b; }
                .history-search input {
                    width: 100%; padding: 10px 10px 10px 40px;
                    background: #1e293b; border: 1px solid #334155; border-radius: 8px;
                    color: white; outline: none;
                }

                .history-content { flex: 1; overflow-y: auto; padding: 1rem; }
                .loading-state, .empty-state { text-align: center; color: #64748b; padding: 2rem; }

                .order-card {
                    background: #1e293b;
                    border-radius: 8px;
                    margin-bottom: 0.75rem;
                    border: 1px solid #334155;
                    overflow: hidden;
                }
                .order-summary {
                    padding: 1rem;
                    display: flex; justify-content: space-between; align-items: center;
                    cursor: pointer;
                    background: #1e293b;
                }
                .order-summary:hover { background: #334155; }
                
                .order-info-main { display: flex; flex-direction: column; gap: 4px; }
                .order-date { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #94a3b8; }
                .order-customer-name { color: white; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
                .deleted-tag { font-size: 0.6rem; background: #450a0a; color: #f87171; padding: 2px 6px; border-radius: 4px; border: 1px solid #991b1b; }
                
                .order-info-value { display: flex; align-items: center; gap: 12px; }
                .order-total { color: #4ade80; font-weight: bold; }

                /* ACTIONS */
                .card-actions { display: flex; gap: 0.5rem; margin-right: 0.5rem; }
                .btn-icon-action {
                    background: none; border: none; cursor: pointer; padding: 4px;
                    border-radius: 4px; display: flex; align-items: center; justify-content: center;
                    transition: background 0.2s;
                }
                .btn-icon-action.delete { color: #ef4444; }
                .btn-icon-action.delete:hover { background: rgba(239, 68, 68, 0.2); }
                
                .btn-icon-action.restore { color: #38bdf8; }
                .btn-icon-action.restore:hover { background: rgba(56, 189, 248, 0.2); }

                .btn-icon-action.permanent { color: #ef4444; }
                .btn-icon-action.permanent:hover { background: rgba(239, 68, 68, 0.2); }

                .order-details {
                    padding: 1rem;
                    background: #020617;
                    border-top: 1px solid #334155;
                    font-size: 0.9rem;
                }
                .detail-row {
                    display: flex; align-items: flex-start; gap: 10px;
                    margin-bottom: 0.75rem;
                    color: #cbd5e1;
                }
                .detail-row svg { min-width: 16px; color: #64748b; margin-top: 2px; }
                
                .order-items-list {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px dashed #334155;
                }
                .order-items-list h4 { color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.5rem; }
                .order-item-row {
                    display: flex; justify-content: space-between;
                    margin-bottom: 0.25rem;
                    color: #e2e8f0; font-size: 0.9rem;
                }
                
                .lgpd-note {
                    margin-top: 1.5rem;
                    font-size: 0.7rem; color: #475569; text-align: center; font-style: italic;
                }
            `}</style>
        </div>
    );
}
