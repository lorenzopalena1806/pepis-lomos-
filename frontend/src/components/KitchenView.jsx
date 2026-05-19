import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function KitchenView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/kitchen/orders/');
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh cada 10 segundos
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const changeStatus = async (orderId, newStatus) => {
    try {
      await axios.post(`http://localhost:8000/api/kitchen/orders/${orderId}/status/`, { estado: newStatus });
      fetchOrders(); // Recargar después de cambiar
    } catch (error) {
      alert("Error al actualizar el estado");
    }
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
      <h1 style={{ color: 'var(--primary-mustard)', marginBottom: '2rem', textAlign: 'center' }}>🔪 Comandera Pepi's</h1>
      
      {loading && <p>Cargando comandas...</p>}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {orders.map(order => (
          <div key={order.id} style={{ 
            backgroundColor: order.estado === 'PREPARANDO' ? '#334155' : '#1e293b', 
            borderRadius: '12px', 
            padding: '1.5rem',
            border: order.estado === 'PREPARANDO' ? '2px solid var(--primary-mustard)' : '2px solid transparent'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #475569', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>#{order.id}</span>
              <span style={{ color: '#94a3b8' }}>{order.hora}</span>
            </div>
            
            <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}><strong>Cliente:</strong> {order.cliente} ({order.tipo_entrega})</p>
            
            <ul style={{ listStyleType: 'none', padding: 0, marginBottom: '2rem' }}>
              {order.items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                  <strong>{item.cantidad}x</strong> {item.producto}
                  {item.modificadores.length > 0 && (
                    <div style={{ fontSize: '0.9rem', color: '#fbbf24', marginLeft: '1.5rem' }}>
                      {item.modificadores.map(m => `+ ${m}`).join(', ')}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {order.estado === 'PENDIENTE' && (
                <button 
                  onClick={() => changeStatus(order.id, 'PREPARANDO')}
                  style={{ flex: 1, padding: '0.8rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  Empezar a Preparar
                </button>
              )}
              {order.estado === 'PREPARANDO' && (
                <button 
                  onClick={() => changeStatus(order.id, 'LISTO')}
                  style={{ flex: 1, padding: '0.8rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  ¡Listo para Entregar!
                </button>
              )}
            </div>
          </div>
        ))}

        {!loading && orders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', fontSize: '1.5rem', marginTop: '3rem' }}>
            No hay pedidos pendientes. ¡A descansar! ☕
          </div>
        )}
      </div>
    </div>
  );
}
