import React, { useState } from 'react';
import { submitCheckout } from '../services/api';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  zIndex: 60,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '1rem'
};

const modalStyle = {
  backgroundColor: 'var(--bg-card)',
  width: '100%',
  maxWidth: '500px',
  borderRadius: '12px',
  padding: '2rem',
  position: 'relative'
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem',
  marginBottom: '1rem',
  backgroundColor: 'var(--bg-dark)',
  border: '1px solid var(--border-color)',
  color: 'white',
  borderRadius: '8px',
  fontSize: '1rem'
};

const selectStyle = { ...inputStyle, appearance: 'none' };

export default function CheckoutModal({ isOpen, onClose, cart, storeStatus, onClearCart }) {
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    telefono_cliente: '',
    tipo_entrega: 'TAKE_AWAY',
    direccion_envio: '',
    metodo_pago: 'EFECTIVO',
    cupon_codigo: '',
    notas_cliente: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    if (!formData.nombre_cliente || !formData.telefono_cliente) {
      setError("Nombre y teléfono son obligatorios.");
      return;
    }
    if (formData.tipo_entrega === 'DELIVERY' && !formData.direccion_envio) {
      setError("Necesitamos tu dirección para el delivery.");
      return;
    }

    setLoading(true);
    setError('');

    // Formatear payload
    const payload = {
      ...formData,
      items: cart.map(item => ({
        product_id: item.product_id,
        cantidad: item.cantidad,
        modifiers: item.modifiers || []
      }))
    };

    try {
      const response = await submitCheckout(payload);
      onClearCart();
      onClose();
      // Redirigir a WhatsApp
      window.open(response.whatsapp_url, '_blank');
    } catch (err) {
      setError(err.error || "Ocurrió un error al procesar tu pedido.");
    } finally {
      setLoading(false);
    }
  };

  const deliveryCost = formData.tipo_entrega === 'DELIVERY' ? parseFloat(storeStatus.costo_delivery || 0) : 0;
  const subtotal = cart.reduce((acc, item) => acc + (item.precio_total * item.cantidad), 0);
  
  // Calcular descuento simulado (el backend hace el real)
  let descuento = 0;
  if (formData.metodo_pago === 'EFECTIVO') {
    descuento = (subtotal * 10) / 100; // Hardcoded a 10% para MVP frontend, el real está en backend
  }

  const total = subtotal + deliveryCost - descuento;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: 'white', fontSize: '1.5rem' }}>✖</button>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-mustard)' }}>Finalizar Pedido</h2>
        
        {error && <div style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</div>}

        <input style={inputStyle} name="nombre_cliente" placeholder="Tu Nombre *" value={formData.nombre_cliente} onChange={handleChange} />
        <input style={inputStyle} name="telefono_cliente" placeholder="WhatsApp (ej. +549...) *" value={formData.telefono_cliente} onChange={handleChange} />
        
        <select style={selectStyle} name="tipo_entrega" value={formData.tipo_entrega} onChange={handleChange}>
          <option value="TAKE_AWAY">Retiro por el local (Take Away)</option>
          <option value="DELIVERY">Envío a Domicilio (Delivery)</option>
        </select>

        {formData.tipo_entrega === 'DELIVERY' && (
          <input style={inputStyle} name="direccion_envio" placeholder="Calle, Número, Piso/Depto *" value={formData.direccion_envio} onChange={handleChange} />
        )}

        <select style={selectStyle} name="metodo_pago" value={formData.metodo_pago} onChange={handleChange}>
          <option value="EFECTIVO">Efectivo (10% Descuento)</option>
          <option value="TRANSFERENCIA">Transferencia / Débito</option>
        </select>

        <textarea 
          style={{...inputStyle, resize: 'vertical', minHeight: '80px'}} 
          name="notas_cliente" 
          placeholder="Notas para la cocina (Ej: Sin mayonesa, papas sin sal)" 
          value={formData.notas_cliente} 
          onChange={handleChange} 
        />

        <input 
          style={{...inputStyle, marginTop: '1rem', border: '1px solid var(--primary-mustard)'}} 
          name="cupon_codigo" 
          placeholder="¿Tienes un cupón? Ingrésalo aquí" 
          value={formData.cupon_codigo} 
          onChange={handleChange} 
        />

        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Subtotal:</span> <span>${subtotal}</span></div>
          {formData.tipo_entrega === 'DELIVERY' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}><span>Envío:</span> <span>+${deliveryCost}</span></div>
          )}
          {descuento > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10B981' }}><span>Descuento Efectivo:</span> <span>-${descuento}</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <span>Total a Pagar:</span> <span style={{ color: 'var(--primary-mustard)' }}>${total}</span>
          </div>
        </div>

        <button 
          onClick={handleCheckout} 
          disabled={loading}
          style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--primary-mustard)', color: 'var(--bg-dark)', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1.5rem' }}>
          {loading ? 'Procesando...' : 'Confirmar y Enviar WhatsApp'}
        </button>
      </div>
    </div>
  );
}
