import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    subtotal,
    deliveryFee,
    tax,
    totalAmount
  } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty-cart-container">
        <div className="empty-cart-card">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your Fresh Harvest Cart is Empty</h2>
          <p>You haven't added any farm-fresh produce to your cart yet. Explore our fresh harvests directly from local farmers!</p>
          <Link to="/products" className="fh-btn-primary explore-btn">
            Browse Fresh Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Header Breadcrumb & Title */}
        <div className="cart-header">
          <div>
            <span className="cart-subtitle">Review & Manage Items</span>
            <h1 className="cart-title">Review Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})</h1>
          </div>
          <button onClick={clearCart} className="clear-cart-btn" title="Remove all items">
            🗑️ Clear Cart
          </button>
        </div>

        <div className="cart-layout">
          {/* Items List */}
          <section className="cart-items-section">
            <div className="cart-table-header">
              <span className="col-product">Product</span>
              <span className="col-price">Unit Price</span>
              <span className="col-qty">Update Quantity</span>
              <span className="col-subtotal">Subtotal</span>
              <span className="col-action">Action</span>
            </div>

            <div className="cart-items-list">
              {cartItems.map((item) => {
                const id = item._id || item.id;
                const itemSubtotal = item.price * item.quantity;

                return (
                  <div key={id} className="cart-item-row">
                    {/* Product Details */}
                    <div className="cart-item-product">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                        alt={item.name}
                        className="cart-item-img"
                      />
                      <div className="cart-item-meta">
                        <span className="cart-item-category">{item.category || 'Farm Fresh'}</span>
                        <h3 className="cart-item-title">{item.name}</h3>
                        <span className="cart-item-farmer">👨‍🌾 {item.farmerName || 'Local Farmer'}</span>
                        <span className="cart-item-unit">Unit: {item.unit || 'kg'}</span>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="cart-item-price">
                      <span className="price-val">₹{item.price}</span>
                      <span className="price-unit">/{item.unit || 'kg'}</span>
                    </div>

                    {/* Update Cart Quantity Controls */}
                    <div className="cart-item-qty">
                      <div className="qty-stepper" aria-label="Update Cart Quantity">
                        <button
                          type="button"
                          className="qty-btn minus"
                          onClick={() => updateQuantity(id, item.quantity - 1)}
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-number" title="Current quantity">{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn plus"
                          onClick={() => updateQuantity(id, item.quantity + 1)}
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="stock-info">In Stock</span>
                    </div>

                    {/* Subtotal */}
                    <div className="cart-item-subtotal">
                      <span className="subtotal-val">₹{itemSubtotal}</span>
                    </div>

                    {/* Remove Product from Cart */}
                    <div className="cart-item-action">
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeFromCart(id)}
                        title={`Remove ${item.name} from Cart`}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-footer-bar">
              <Link to="/products" className="continue-shopping-link">
                ← Continue Shopping
              </Link>
              <span className="delivery-note">
                🚚 Free delivery on fresh orders above ₹300!
              </span>
            </div>
          </section>

          {/* Cart Summary & Checkout */}
          <aside className="cart-summary-section">
            <div className="cart-summary-card">
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-breakdown">
                <div className="summary-row">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="summary-amount">₹{subtotal}</span>
                </div>

                <div className="summary-row">
                  <span>Delivery Charges</span>
                  <span className="summary-amount">
                    {deliveryFee === 0 ? (
                      <strong className="free-badge">FREE</strong>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>

                <div className="summary-row">
                  <span>Estimated Tax (5% GST)</span>
                  <span className="summary-amount">₹{tax}</span>
                </div>

                {deliveryFee === 0 && (
                  <div className="savings-badge">
                    🎉 You unlocked Free Delivery! (Saved ₹40)
                  </div>
                )}

                <div className="summary-divider"></div>

                <div className="summary-total-row">
                  <span>Grand Total</span>
                  <span className="total-amount">₹{totalAmount}</span>
                </div>
              </div>

              {/* Action: Proceed to Confirm Order */}
              <button
                type="button"
                className="checkout-btn"
                onClick={() => navigate('/checkout')}
              >
                Confirm Order & Checkout →
              </button>

              <div className="trust-badges">
                <div className="trust-item">
                  <span>🛡️</span>
                  <span>100% Organic & Chemical-Free</span>
                </div>
                <div className="trust-item">
                  <span>⚡</span>
                  <span>Direct Farm Gate Price Guarantee</span>
                </div>
                <div className="trust-item">
                  <span>🌱</span>
                  <span>Direct Support to Local Farmers</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Cart;
