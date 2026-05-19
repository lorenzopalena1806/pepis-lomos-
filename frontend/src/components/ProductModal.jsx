import React, { useState, useEffect } from 'react';

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 60,
  display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
};

const modalStyle = {
  backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '600px',
  borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
  padding: '2rem', paddingBottom: '3rem', position: 'relative',
  maxHeight: '90vh', overflowY: 'auto'
};

const imgStyle = {
  width: '100%', height: '200px', objectFit: 'cover',
  borderRadius: '12px', marginBottom: '1rem', backgroundColor: 'var(--bg-dark)'
};

const qtyBtnStyle = {
  backgroundColor: 'var(--bg-dark)', color: 'white',
  border: '1px solid var(--border-color)', borderRadius: '50%',
  width: '40px', height: '40px', fontSize: '1.2rem',
  display: 'flex', justifyContent: 'center', alignItems: 'center'
};

export default function ProductModal({ isOpen, onClose, product, onAddToCart }) {
  const [cantidad, setCantidad] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setCantidad(1);
      setSelectedModifiers([]);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const toggleModifier = (modId) => {
    if (selectedModifiers.includes(modId)) {
      setSelectedModifiers(selectedModifiers.filter(id => id !== modId));
    } else {
      setSelectedModifiers([...selectedModifiers, modId]);
    }
  };

  const modifiersSubtotal = (product.modificadores || [])
    .filter(mod => selectedModifiers.includes(mod.id))
    .reduce((sum, mod) => sum + parseFloat(mod.precio_adicional), 0);

  const itemUnitPrice = parseFloat(product.precio_base) + modifiersSubtotal;
  const total = itemUnitPrice * cantidad;

  const handleAdd = () => {
    onAddToCart({
      product_id: product.id,
      nombre: product.nombre,
      precio_base: parseFloat(product.precio_base),
      precio_total: total,
      cantidad: cantidad,
      modifiers: selectedModifiers,
      modifiersDetails: (product.modificadores || []).filter(mod => selectedModifiers.includes(mod.id))
    });
    onClose();
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-dark)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '1rem', zIndex: 10, cursor: 'pointer' }}>✖</button>
        
        {product.imagen_url ? (
          <img src={product.imagen_url} alt={product.nombre} style={imgStyle} />
        ) : (
          <div style={{...imgStyle, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)'}}>Sin Imagen</div>
        )}
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{product.nombre}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{product.descripcion}</p>
        
        {product.modificadores && product.modificadores.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Personaliza tu pedido:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {product.modificadores.map(mod => (
                <label key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', backgroundColor: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedModifiers.includes(mod.id)} 
                      onChange={() => toggleModifier(mod.id)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span>{mod.nombre}</span>
                  </div>
                  {parseFloat(mod.precio_adicional) > 0 && (
                    <span style={{ color: 'var(--primary-mustard)' }}>+${mod.precio_adicional}</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-dark)', borderRadius: '12px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Cantidad</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={qtyBtnStyle} onClick={() => setCantidad(Math.max(1, cantidad - 1))}>-</button>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{cantidad}</span>
            <button style={qtyBtnStyle} onClick={() => setCantidad(cantidad + 1)}>+</button>
          </div>
        </div>

        <button 
          onClick={handleAdd}
          style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--primary-mustard)', color: 'var(--bg-dark)', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between', border: 'none', cursor: 'pointer' }}>
          <span>Agregar al Pedido</span>
          <span>${total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}
