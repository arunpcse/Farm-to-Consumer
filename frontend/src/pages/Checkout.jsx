import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { authService, orderService, profileService } from '../services/api';
import './Checkout.css';

function Checkout() {
  const { cartItems, cartCount, subtotal, deliveryFee, tax, totalAmount, clearCart, showToast } = useCart();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Shipping & Contact State
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Aathavan R');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'aathavanr.24cse@kongu.edu');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '9876543210');
  const [street, setStreet] = useState('Kongu Engineering College Campus, Perundurai');
  const [city, setCity] = useState('Erode');
  const [state, setState] = useState('Tamil Nadu');
  const [zipCode, setZipCode] = useState('638052');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Please leave fresh produce at the security desk / door.');

  // Select Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('aathavan@oksbi');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8912');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('•••');
  const [selectedBank, setSelectedBank] = useState('State Bank of India (SBI)');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill from saved profile address if available
  useEffect(() => {
    async function loadAddress() {
      if (currentUser) {
        try {
          const profile = await profileService.getProfile();
          if (profile.user?.addresses && profile.user.addresses.length > 0) {
            const defaultAddr = profile.user.addresses.find(a => a.isDefault) || profile.user.addresses[0];
            setStreet(defaultAddr.street);
            setCity(defaultAddr.city);
            setState(defaultAddr.state);
            setZipCode(defaultAddr.zipCode);
          }
        } catch (e) {
          // ignore if offline or not found
        }
      }
    }
    loadAddress();
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty-container">
        <div className="checkout-empty-card">
          <span className="empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Please add products to your cart before confirming your order.</p>
          <Link to="/products" className="fh-btn-primary">
            Browse Produce
          </Link>
        </div>
      </div>
    );
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError('');

    if (!customerName || !customerPhone || !street || !city || !zipCode) {
      setError('Please fill in all recipient contact and address details.');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentDetails = {};
      if (paymentMethod === 'UPI') paymentDetails.upiId = upiId;
      if (paymentMethod === 'Credit/Debit Card') paymentDetails.cardLast4 = '8912';
      if (paymentMethod === 'Net Banking') paymentDetails.bankName = selectedBank;

      const orderPayload = {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: {
          street,
          city,
          state,
          zipCode,
          label: 'Delivery Address'
        },
        items: cartItems.map(item => ({
          productId: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit || 'kg',
          image: item.image,
          farmerName: item.farmerName
        })),
        paymentMethod,
        paymentDetails,
        deliveryInstructions
      };

      const res = await orderService.placeOrder(orderPayload);
      clearCart();
      showToast('🎉 Order placed and confirmed successfully!');

      // Redirect to Payment Confirmation page
      navigate(`/payment-confirmation/${res.payment?.transactionId || res.order?.transactionId}`);
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <Link to="/cart" className="back-to-cart-link">
            ← Back to Review Cart
          </Link>
          <h1 className="checkout-title">Confirm Order & Checkout</h1>
          <p className="checkout-subtitle">
            Review your delivery details, select payment method, and confirm your order.
          </p>
        </div>

        {error && <div className="checkout-alert-error">{error}</div>}

        <form onSubmit={handlePlaceOrder} className="checkout-grid">
          {/* Left Column: Delivery Address & Payment Method */}
          <div className="checkout-form-column">
            {/* 1. Confirm Delivery Address */}
            <div className="checkout-card">
              <div className="card-header-badge">
                <span className="step-num">1</span>
                <h2>Confirm Delivery Address</h2>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Recipient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="E.g. Aathavan R"
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address (for invoice & updates)</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className="form-group">
                <label>Street Address / House / Flat *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street name, landmark, building"
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code / PIN *</label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="6-digit PIN"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Delivery Instructions / Notes (Optional)</label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Gate code, landmark, or specific drop-off notes"
                />
              </div>
            </div>

            {/* 2. Select Payment Method */}
            <div className="checkout-card">
              <div className="card-header-badge">
                <span className="step-num">2</span>
                <h2>Select Payment Method</h2>
              </div>

              <div className="payment-options-list">
                {/* Option: UPI */}
                <label className={`payment-option-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}>
                  <div className="option-radio-wrap">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="UPI"
                      checked={paymentMethod === 'UPI'}
                      onChange={() => setPaymentMethod('UPI')}
                    />
                    <div className="option-info">
                      <span className="option-title">📱 UPI / QR Code (Recommended)</span>
                      <span className="option-desc">Google Pay, PhonePe, Paytm, BHIM & Any UPI App</span>
                    </div>
                  </div>
                  <span className="instant-badge">Instant & Zero Fee</span>
                </label>

                {paymentMethod === 'UPI' && (
                  <div className="payment-detail-box">
                    <label>Enter UPI ID / VPA</label>
                    <div className="upi-input-row">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="mobile@upi or user@okhdfcbank"
                      />
                      <span className="verified-tag">✓ Verified UPI ID</span>
                    </div>
                    <div className="upi-popular-badges">
                      <span>Popular Apps: GPay • PhonePe • Paytm • Amazon Pay</span>
                    </div>
                  </div>
                )}

                {/* Option: Credit/Debit Card */}
                <label className={`payment-option-card ${paymentMethod === 'Credit/Debit Card' ? 'selected' : ''}`}>
                  <div className="option-radio-wrap">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Credit/Debit Card"
                      checked={paymentMethod === 'Credit/Debit Card'}
                      onChange={() => setPaymentMethod('Credit/Debit Card')}
                    />
                    <div className="option-info">
                      <span className="option-title">💳 Credit / Debit Card</span>
                      <span className="option-desc">Visa, MasterCard, RuPay, Maestro</span>
                    </div>
                  </div>
                  <span className="secure-badge">🔒 256-Bit SSL</span>
                </label>

                {paymentMethod === 'Credit/Debit Card' && (
                  <div className="payment-detail-box">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="16-digit card number"
                      />
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV / CVC</label>
                        <input
                          type="password"
                          maxLength="4"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="3 digits"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Option: Net Banking */}
                <label className={`payment-option-card ${paymentMethod === 'Net Banking' ? 'selected' : ''}`}>
                  <div className="option-radio-wrap">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Net Banking"
                      checked={paymentMethod === 'Net Banking'}
                      onChange={() => setPaymentMethod('Net Banking')}
                    />
                    <div className="option-info">
                      <span className="option-title">🏦 Net Banking</span>
                      <span className="option-desc">All Major Indian Public & Private Banks</span>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'Net Banking' && (
                  <div className="payment-detail-box">
                    <label>Select Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="bank-select"
                    >
                      <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Karur Vysya Bank (KVB)">Karur Vysya Bank (KVB)</option>
                      <option value="Canara Bank">Canara Bank</option>
                    </select>
                  </div>
                )}

                {/* Option: Cash on Delivery */}
                <label className={`payment-option-card ${paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}>
                  <div className="option-radio-wrap">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                    />
                    <div className="option-info">
                      <span className="option-title">💵 Cash on Delivery (COD)</span>
                      <span className="option-desc">Pay cash or scan QR on harvest delivery at your doorstep</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Confirm Order Review & Place Order Button */}
          <div className="checkout-summary-column">
            <div className="checkout-summary-card">
              <div className="card-header-badge">
                <span className="step-num">3</span>
                <h2>Confirm Order Summary</h2>
              </div>

              {/* Items List Snapshot */}
              <div className="confirm-items-snapshot">
                <span className="snapshot-title">Items ({cartCount})</span>
                <div className="snapshot-list">
                  {cartItems.map((item) => (
                    <div key={item._id || item.id} className="snapshot-item">
                      <img src={item.image} alt={item.name} className="snapshot-img" />
                      <div className="snapshot-meta">
                        <span className="snapshot-name">{item.name}</span>
                        <span className="snapshot-qty">{item.quantity} × ₹{item.price}/{item.unit || 'kg'}</span>
                      </div>
                      <span className="snapshot-total">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Guarantee */}
              <div className="harvest-guarantee-box">
                <span className="guarantee-icon">🌾</span>
                <div className="guarantee-text">
                  <strong>Fresh Morning Harvest Delivery</strong>
                  <span>Harvested at sunrise and delivered straight from local farms.</span>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="price-details-box">
                <div className="price-row">
                  <span>Items Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="price-row">
                  <span>Farm Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong className="free-text">FREE</strong> : `₹${deliveryFee}`}</span>
                </div>
                <div className="price-row">
                  <span>GST (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="price-divider"></div>
                <div className="price-total-row">
                  <span>Total Amount Due</span>
                  <span className="grand-total">₹{totalAmount}</span>
                </div>
              </div>

              {/* Selected Payment preview */}
              <div className="payment-preview-pill">
                <span>Selected Payment:</span>
                <strong>{paymentMethod}</strong>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="place-order-btn"
              >
                {isSubmitting ? 'Processing Order...' : `Place Order • ₹${totalAmount}`}
              </button>

              <p className="order-agreement-text">
                By clicking "Place Order", you confirm your order and agree to FreshHarvest's direct farm-to-table delivery terms.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
