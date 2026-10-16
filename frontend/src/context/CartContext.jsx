import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('freshharvest_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem('freshharvest_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  function showToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }

  function addToCart(product, quantity = 1) {
    const id = product._id || product.id;
    let addedName = product.name;

    setCartItems(prev => {
      const existing = prev.find(item => (item._id || item.id) === id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const maxStock = product.stock || 99;
        if (newQty > maxStock) {
          showToast(`Only ${maxStock} units of ${product.name} available in stock!`, 'warning');
          return prev;
        }
        showToast(`Updated ${product.name} quantity to ${newQty}!`);
        return prev.map(item =>
          (item._id || item.id) === id ? { ...item, quantity: newQty } : item
        );
      } else {
        showToast(`Added ${addedName} (${quantity} ${product.unit || 'kg'}) to your cart!`);
        return [
          ...prev,
          {
            ...product,
            quantity: Math.max(1, quantity)
          }
        ];
      }
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => {
        if ((item._id || item.id) === productId) {
          const maxStock = item.stock || 99;
          const validQty = Math.min(quantity, maxStock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  }

  function removeFromCart(productId) {
    const target = cartItems.find(item => (item._id || item.id) === productId);
    setCartItems(prev => prev.filter(item => (item._id || item.id) !== productId));
    if (target) {
      showToast(`Removed ${target.name} from cart`, 'info');
    }
  }

  function clearCart() {
    setCartItems([]);
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cartItems.length === 0 ? 0 : subtotal >= 300 ? 0 : 40;
  const tax = cartItems.length === 0 ? 0 : Math.round(subtotal * 0.05);
  const totalAmount = subtotal + deliveryFee + tax;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
        showToast
      }}
    >
      {children}
      {/* Toast container */}
      <div className="fh-toast-container" style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`fh-toast fh-toast-${toast.type}`}
            style={{
              background: toast.type === 'warning' ? '#fffbeb' : toast.type === 'info' ? '#eff6ff' : '#ecfdf5',
              border: `1px solid ${toast.type === 'warning' ? '#fde68a' : toast.type === 'info' ? '#bfdbfe' : '#a7f3d0'}`,
              color: toast.type === 'warning' ? '#92400e' : toast.type === 'info' ? '#1e40af' : '#065f46',
              padding: '12px 18px',
              borderRadius: '10px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              fontSize: '0.92rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'slideIn 0.25s ease-out'
            }}
          >
            <span>{toast.type === 'warning' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '🌿'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
