import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { farmerService, bulkOrderService } from '../services/api';
import './BulkOrder.css';

const BUYER_TYPES = ['Grocery Shop', 'Restaurant', 'Hotel', 'College Canteen', 'Hostel Mess', 'Other'];

export default function BulkOrder() {
  const { farmerId } = useParams();
  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Selections: { [productId]: quantity }
  const [selections, setSelections] = useState({});

  const [form, setForm] = useState({
    buyerName: '', buyerEmail: '', buyerPhone: '', buyerType: 'Grocery Shop', orgName: '',
    street: '', city: '', district: '', state: 'Tamil Nadu', zipCode: '',
    requestedDeliveryDate: '', notes: ''
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await farmerService.getFarmerById(farmerId);
        setFarmer(res.farmer);
        setProducts(res.products || []);
      } catch (e) {
        setError(e.message || 'Failed to load farmer details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [farmerId]);

  function toggleProduct(productId) {
    setSelections(prev => {
      if (prev[productId] !== undefined) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      const product = products.find(p => p._id === productId);
      return { ...prev, [productId]: product?.minBulkOrderQty || 10 };
    });
  }

  function setQty(productId, qty) {
    setSelections(prev => ({ ...prev, [productId]: Math.max(1, Number(qty)) }));
  }

  const selectedItems = Object.entries(selections).map(([productId, qty]) => {
    const p = products.find(pr => pr._id === productId);
    if (!p) return null;
    const price = p.isSurplus && p.surplusPrice ? p.surplusPrice : p.price;
    return { productId, name: p.name, quantity: qty, pricePerUnit: price, unit: p.unit, totalPrice: qty * price };
  }).filter(Boolean);

  const totalAmount = selectedItems.reduce((s, i) => s + i.totalPrice, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Please select at least one product and enter a quantity.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        buyerName: form.buyerName,
        buyerEmail: form.buyerEmail,
        buyerPhone: form.buyerPhone,
        buyerType: form.buyerType,
        orgName: form.orgName,
        farmerId,
        farmerName: farmer?.farmName,
        items: selectedItems,
        totalAmount,
        deliveryAddress: { street: form.street, city: form.city, district: form.district, state: form.state, zipCode: form.zipCode },
        requestedDeliveryDate: form.requestedDeliveryDate || null,
        buyerNote: form.notes
      };
      const res = await bulkOrderService.createBulkOrder(payload);
      setSuccess(res.bulkOrder);
    } catch (e) {
      setError(e.message || 'Failed to submit bulk order.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" /></div>;

  if (success) {
    return (
      <div className="bulk-order-page">
        <div className="bo-inner">
          <div className="bo-success">
            <div className="bo-success-icon">✅</div>
            <h2>Bulk Order Requested!</h2>
            <p>Your bulk order <strong>{success.bulkOrderId}</strong> has been sent to the farmer.<br />The farmer will review and respond to your request.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/bulk-orders" className="fh-btn-primary">📋 View My Bulk Orders</Link>
              <Link to="/find-farmers" className="fh-btn-secondary">👨‍🌾 Find More Farmers</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-order-page">
      <div className="bo-inner">
        <div className="bo-header">
          <h1>🏪 Request Bulk Order</h1>
          <p>Contact the farmer directly for large quantity orders at wholesale prices.</p>
        </div>

        {farmer && (
          <div className="bo-farmer-banner">
            <span className="bo-farmer-icon">👨‍🌾</span>
            <div className="bo-farmer-info">
              <h3>{farmer.farmName}</h3>
              <p>📍 {[farmer.village, farmer.district, farmer.state].filter(Boolean).join(', ')} · {farmer.farmingType} Farming · {farmer.experience ? `${farmer.experience} yrs exp` : ''}</p>
            </div>
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="bo-layout">
            {/* Left: Form */}
            <div>
              {/* Buyer Info */}
              <div className="bo-form-section" style={{ marginBottom: 20 }}>
                <div className="bo-section-title">👤 Your Information</div>
                <div className="bo-form-grid">
                  <div className="bo-form-group">
                    <label className="bo-label">Full Name *</label>
                    <input className="bo-input" value={form.buyerName} onChange={e => setForm(f => ({ ...f, buyerName: e.target.value }))} required placeholder="Your name" />
                  </div>
                  <div className="bo-form-group">
                    <label className="bo-label">Phone Number *</label>
                    <input className="bo-input" value={form.buyerPhone} onChange={e => setForm(f => ({ ...f, buyerPhone: e.target.value }))} required placeholder="+91 98765 43210" />
                  </div>
                  <div className="bo-form-group">
                    <label className="bo-label">Email</label>
                    <input className="bo-input" type="email" value={form.buyerEmail} onChange={e => setForm(f => ({ ...f, buyerEmail: e.target.value }))} placeholder="email@example.com" />
                  </div>
                  <div className="bo-form-group">
                    <label className="bo-label">Buyer Type *</label>
                    <select className="bo-select" value={form.buyerType} onChange={e => setForm(f => ({ ...f, buyerType: e.target.value }))}>
                      {BUYER_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="bo-form-group full">
                    <label className="bo-label">Organization / Business Name</label>
                    <input className="bo-input" value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} placeholder="e.g. Sunrise Mess, Hotel Grand" />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="bo-form-section" style={{ marginBottom: 20 }}>
                <div className="bo-section-title">📦 Select Products & Quantities</div>
                {products.length === 0 ? (
                  <div className="bo-empty-products">This farmer hasn't listed any products yet.</div>
                ) : (
                  <div className="bo-products-list">
                    {products.map(p => {
                      const isSelected = selections[p._id] !== undefined;
                      const qty = selections[p._id] || 0;
                      const price = p.isSurplus && p.surplusPrice ? p.surplusPrice : p.price;
                      return (
                        <div key={p._id} className={`bo-product-row ${isSelected ? 'selected' : ''}`}>
                          <input type="checkbox" className="bo-product-checkbox" checked={isSelected} onChange={() => toggleProduct(p._id)} />
                          <div className="bo-product-details">
                            <div className="bo-product-name">{p.name} {p.isSurplus && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem', padding: '2px 7px', borderRadius: 999 }}>Surplus</span>}</div>
                            <div className="bo-product-price">₹{price}/{p.unit}</div>
                            <div className="bo-product-stock">Stock: {p.stock} {p.unit} · Min bulk: {p.minBulkOrderQty || 10} {p.unit}</div>
                          </div>
                          {isSelected && (
                            <>
                              <div>
                                <input type="number" className="bo-qty-input" value={qty} min={p.minBulkOrderQty || 1} max={p.stock}
                                  onChange={e => setQty(p._id, e.target.value)} />
                                <div className="bo-min-qty">min {p.minBulkOrderQty || 10} {p.unit}</div>
                              </div>
                              <div className="bo-product-subtotal">₹{(qty * price).toLocaleString('en-IN')}</div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div className="bo-form-section" style={{ marginBottom: 20 }}>
                <div className="bo-section-title">🚚 Delivery Address</div>
                <div className="bo-form-grid">
                  <div className="bo-form-group full">
                    <label className="bo-label">Street / Area *</label>
                    <input className="bo-input" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} required placeholder="Street address" />
                  </div>
                  <div className="bo-form-group">
                    <label className="bo-label">City *</label>
                    <input className="bo-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required placeholder="City" />
                  </div>
                  <div className="bo-form-group">
                    <label className="bo-label">District</label>
                    <input className="bo-input" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="District" />
                  </div>
                  <div className="bo-form-group">
                    <label className="bo-label">State</label>
                    <input className="bo-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                  <div className="bo-form-group">
                    <label className="bo-label">Pincode</label>
                    <input className="bo-input" value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} placeholder="600001" />
                  </div>
                  <div className="bo-form-group">
                    <label className="bo-label">Requested Delivery Date</label>
                    <input className="bo-input" type="date" value={form.requestedDeliveryDate} onChange={e => setForm(f => ({ ...f, requestedDeliveryDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="bo-form-group full">
                    <label className="bo-label">Notes to Farmer</label>
                    <textarea className="bo-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any specific requirements, packaging notes, etc." />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Summary */}
            <div className="bo-summary">
              <div className="bo-summary-title">📋 Order Summary</div>
              {selectedItems.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>
                  Select products from the left to see your order summary.
                </p>
              ) : (
                <>
                  <div className="bo-summary-items">
                    {selectedItems.map(item => (
                      <div key={item.productId} className="bo-summary-row">
                        <span>{item.name} ×{item.quantity}{item.unit}</span>
                        <strong>₹{item.totalPrice.toLocaleString('en-IN')}</strong>
                      </div>
                    ))}
                  </div>
                  <hr className="bo-summary-divider" />
                  <div className="bo-summary-total">
                    <span>Total</span>
                    <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 8 }}>*Final price to be confirmed by farmer</p>
                </>
              )}
              <button type="submit" className="bo-submit-btn" disabled={submitting || selectedItems.length === 0}>
                {submitting ? 'Sending Request...' : '📤 Send Bulk Order Request'}
              </button>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
                The farmer will review and respond to your request within 24 hours.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
