import React from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 40
};

const drawerStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  maxWidth: '400px',
  backgroundColor: 'var(--bg-card)',
  zIndex: 50,
  padding: '1rem',
  boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column'
};

const closeBtnStyle = {
  backgroundColor: 'transparent',
  color: 'white',
  fontSize: '1.5rem',
  alignSelf: 'flex-end',
  marginBottom: '1rem'
};

const checkoutBtnStyle = {
  backgroundColor: 'var(--primary-mustard)',
  color: 'var(--bg-dark)',
  padding: '1rem',
  borderRadius: '8px',
  fontWeight: 'bold',
  fontSize: '1.2rem',
  marginTop: 'auto',
  textAlign: 'center',
  width: '100%'
};

export default function CartDrawer({ isOpen, onClose, cart, setCart, onProceedToCheckout }) {
  if (!isOpen) return null;

  const total = cart.reduce((acc, item) => acc + (item.precio_total * item.cantidad), 0);

  const removeItem = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={drawerStyle}>
        <button style={closeBtnStyle} onClick={onClose}>✖</button>
        <h2 style={{ marginBottom: '1rem' }}>Tu Pedido</h2>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>El carrito está vacío.</p>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.cantidad}x {item.nombre}</div>
                  {item.modifiers && item.modifiers.map(m => (
                    <div key={m.id} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+ {m.nombre}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-mustard)' }}>${item.precio_total * item.cantidad}</span>
                  <button onClick={() => removeItem(idx)} style={{ color: '#EF4444', backgroundColor: 'transparent', fontSize: '0.8rem', marginTop: '0.5rem' }}>Quitar</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              <span>Subtotal:</span>
              <span>${total}</span>
            </div>
            <button style={checkoutBtnStyle} onClick={onProceedToCheckout}>
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </>
  );
}
