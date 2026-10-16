import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService, orderService, reviewService } from '../services/api';
import './Reviews.css';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="rv-star-picker">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          className={`rv-star-btn ${s <= (hover || value) ? 'active' : ''}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >★</button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const user = authService.getCurrentUser();
  const [orders, setOrders] = useState([]);
  const [reviewed, setReviewed] = useState({}); // { orderId_productId: true }
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState(null); // { order, product }
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      try {
        const res = await orderService.getOrders();
        const delivered = (res.orders || []).filter(o => o.orderStatus === 'Delivered');
        setOrders(delivered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="reviews-page">
        <div className="rv-inner">
          <div className="rv-login">
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>🔒</span>
            <h2>Please Login</h2>
            <p>You need to be logged in to write reviews.</p>
            <Link to="/login" className="fh-btn-primary">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  function openModal(order, product) {
    setModal({ order, product });
    setRating(5);
    setComment('');
    setMsg('');
  }

  function closeModal() {
    setModal(null);
  }

  async function submitReview() {
    if (!rating) return;
    setSubmitting(true);
    try {
      await reviewService.createReview({
        orderId: modal.order.orderId,
        productId: modal.product.productId || modal.product._id,
        farmerId: modal.product.farmerId || null,
        reviewerName: user.name,
        rating,
        comment
      });
      const key = `${modal.order.orderId}_${modal.product.productId || modal.product._id}`;
      setReviewed(prev => ({ ...prev, [key]: true }));
      setMsg('Review submitted! Thank you. ✅');
      setTimeout(closeModal, 1800);
    } catch (e) {
      setMsg(`❌ ${e.message || 'Failed to submit review.'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="reviews-page">
      <div className="rv-inner">
        <div className="rv-header">
          <h1>⭐ Rate & Review</h1>
          <p>Share your experience with the farmers and products you've ordered from.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="rv-empty">
            <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📦</p>
            <p style={{ marginBottom: 6 }}>No delivered orders found.</p>
            <p>Complete an order first, then come back to leave a review!</p>
            <Link to="/products" style={{ display: 'inline-block', marginTop: 16 }} className="fh-btn-primary">🌾 Browse Products</Link>
          </div>
        ) : (
          orders.map(order => (
            <div key={order._id} className="rv-order-card">
              <div className="rv-order-header">
                <div>
                  <div className="rv-order-id">Order: {order.orderId}</div>
                  <div className="rv-order-date">Delivered: {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN') : new Date(order.updatedAt).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="rv-products">
                {(order.items || []).map((product, idx) => {
                  const key = `${order.orderId}_${product.productId || product._id || idx}`;
                  const isReviewed = reviewed[key];
                  return (
                    <div key={key} className="rv-product-row">
                      <div className="rv-product-img">
                        {product.image
                          ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                          : '🥬'
                        }
                      </div>
                      <div>
                        <div className="rv-product-name">{product.name}</div>
                        <div className="rv-product-meta">
                          {product.quantity} {product.unit} · ₹{product.price}/{product.unit}
                          {product.farmerName && <> · 👨‍🌾 {product.farmerName}</>}
                        </div>
                      </div>
                      <div className="rv-product-action">
                        {isReviewed ? (
                          <span className="rv-reviewed-badge">✅ Reviewed</span>
                        ) : (
                          <button className="rv-write-btn" onClick={() => openModal(order, product)}>
                            ✍️ Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {modal && (
        <div className="rv-modal-overlay" onClick={closeModal}>
          <div className="rv-modal" onClick={e => e.stopPropagation()}>
            <div className="rv-modal-title">Rate Your Experience</div>
            <div className="rv-modal-product">
              📦 {modal.product.name} · 👨‍🌾 {modal.product.farmerName || 'Farmer'}
            </div>

            <StarPicker value={rating} onChange={setRating} />

            <label className="rv-comment-label">Your Review (optional)</label>
            <textarea
              className="rv-comment-input"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with the product and farmer..."
            />

            {msg && (
              <p className={msg.startsWith('❌') ? 'rv-msg-err' : 'rv-msg-ok'}>{msg}</p>
            )}

            <div className="rv-modal-actions">
              <button className="rv-cancel-btn" onClick={closeModal}>Cancel</button>
              <button className="rv-submit-btn" onClick={submitReview} disabled={submitting || !rating}>
                {submitting ? 'Submitting...' : '✅ Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
