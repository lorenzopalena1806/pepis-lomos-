import React from 'react';

const headerStyle = {
  backgroundColor: 'var(--bg-card)',
  padding: '1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-color)',
  position: 'sticky',
  top: 0,
  zIndex: 10
};

const logoStyle = {
  color: 'var(--primary-mustard)',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  textTransform: 'uppercase'
};

const cartButtonStyle = {
  backgroundColor: 'var(--primary-mustard)',
  color: 'var(--bg-dark)',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  fontWeight: 'bold',
  fontSize: '1rem'
};

export default function Header({ cartItemCount, onOpenCart }) {
  return (
    <header style={headerStyle}>
      <div style={logoStyle}>🍔 Pepi's Lomos</div>
      <button style={cartButtonStyle} onClick={onOpenCart}>
        🛒 Carrito ({cartItemCount})
      </button>
    </header>
  );
}
