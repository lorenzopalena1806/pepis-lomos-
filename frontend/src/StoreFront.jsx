import { useState, useEffect } from 'react'
import Header from './components/Header'
import CartDrawer from './components/CartDrawer'
import CheckoutModal from './components/CheckoutModal'
import ProductModal from './components/ProductModal'
import { getStoreStatus, getMenu } from './services/api'
import './App.css'

function StoreFront() {
  const [storeStatus, setStoreStatus] = useState({ is_open: true });
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    getStoreStatus().then(status => setStoreStatus(status));
    getMenu().then(data => setMenu(data));
  }, []);

  const handleProductClick = (product) => {
    if (!storeStatus.is_open) return;
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAddToCart = (item) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(
        cartItem => 
          cartItem.product_id === item.product_id && 
          JSON.stringify(cartItem.modifiers.sort()) === JSON.stringify(item.modifiers.sort())
      );

      if (existingItemIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].cantidad += item.cantidad;
        newCart[existingItemIndex].precio_total += item.precio_total;
        return newCart;
      }
      return [...prevCart, item];
    });
    setIsCartOpen(true);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <Header cartItemCount={cart.reduce((sum, item) => sum + item.cantidad, 0)} onOpenCart={() => setIsCartOpen(true)} />
      
      <main style={{ padding: '1rem' }}>
        {!storeStatus.is_open && (
          <div style={{ backgroundColor: '#EF4444', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
            {storeStatus.message || `El local se encuentra cerrado. Abrimos a las ${storeStatus.horario_apertura || '...'} hs.`}
          </div>
        )}
        
        <h2>Menú</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {menu.length === 0 ? <p>Cargando menú...</p> : (
            menu.map(product => (
              <div 
                key={product.id} 
                onClick={() => handleProductClick(product)}
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  cursor: storeStatus.is_open ? 'pointer' : 'not-allowed',
                  opacity: storeStatus.is_open ? 1 : 0.6
                }}>
                {product.imagen_url && (
                  <img src={product.imagen_url} alt={product.nombre} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                )}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{product.nombre}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{product.descripcion}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-mustard)' }}>${product.precio_base}</span>
                    <button 
                      disabled={!storeStatus.is_open}
                      style={{ 
                        backgroundColor: storeStatus.is_open ? 'var(--primary-mustard)' : 'gray', 
                        color: 'var(--bg-dark)', padding: '0.5rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', border: 'none' 
                      }}>
                      Elegir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        setCart={setCart} 
        onProceedToCheckout={handleProceedToCheckout} 
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        cart={cart}
        storeStatus={storeStatus}
        onClearCart={() => setCart([])}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />
    </div>
  )
}

export default StoreFront
