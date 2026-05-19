import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../services/api';

export const KitchenView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carga los pedidos y filtra los terminados
  const loadOrders = async () => {
    const data = await getOrders();
    const activeOrders = data.filter(order => order.status !== 'entregado' && order.status !== 'cancelado');
    setOrders(activeOrders);
    setLoading(false);
  };

  // El "Radar": actualiza la pantalla sola cada 10 segundos
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cambia el estado al tocar el botón
  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      loadOrders(); 
    } catch (error) {
      alert("No se pudo actualizar el estado del pedido");
    }
  };

  // Acomoda la hora para que se lea fácil
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Colores de la tarjeta
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pendiente': return { borderTop: '8px solid #dc3545', bg: '#fff5f5' }; 
      case 'preparando': return { borderTop: '8px solid #ffc107', bg: '#fffdf0' }; 
      default: return { borderTop: '8px solid #6c757d', bg: '#f8f9fa' };
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>Cargando KDS...</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#1e1e1e', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#ffc107', textAlign: 'center', marginBottom: '30px' }}>👨‍🍳 PANTALLA DE COCINA</h1>
      
      {orders.length === 0 ? (
        <p style={{ color: '#aaa', textAlign: 'center', fontSize: '1.2rem' }}>No hay pedidos pendientes. ¡Plancha limpia!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {orders.map((order) => {
            const style = getStatusStyle(order.status);
            return (
              <div 
                key={order.id} 
                style={{ 
                  backgroundColor: style.bg, 
                  borderRadius: '8px', 
                  padding: '15px', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  borderTop: style.borderTop,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#000' }}>Pedido #{order.id}</span>
                    <span style={{ color: '#555', fontWeight: 'bold' }}>🕒 {formatTime(order.created_at)}</span>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ 
                      backgroundColor: order.status === 'pendiente' ? '#dc3545' : '#ffc107', 
                      color: order.status === 'pendiente' ? '#fff' : '#000',
                      padding: '3px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>Items:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {order.items?.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '8px', color: '#000' }}>
                          <strong style={{ fontSize: '1.05rem' }}>{item.quantity}x {item.product_name}</strong>
                          
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>
                              Agregados: {item.modifiers.map(mod => mod.name).join(', ')}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {order.status === 'pendiente' && (
                    <button 
                      onClick={() => handleStatusChange(order.id, 'preparando')}
                      style={{ flex: 1, backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      👨‍🍳 Empezar a Hacer
                    </button>
                  )}
                  {order.status === 'preparando' && (
                    <button 
                      onClick={() => handleStatusChange(order.id, 'entregado')}
                      style={{ flex: 1, backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ✅ ¡Listo! Entregar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};