import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { farmerService, reviewService } from '../services/api';
import { useCart } from '../context/CartContext';
import DirectInquiryModal from '../components/DirectInquiryModal';
import './FarmerProfile.css';

function StarDisplay({ rating, size = 'normal' }) {
  return (
    <div className="fp-stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= Math.round(rating) ? 'fp-star' : 'fp-star-empty'}>★</span>
      ))}
    </div>
  );
}

export default function FarmerProfile() {
  const { farmerId } = useParams();
  const { addToCart, cartItems } = useCart();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [reviews, setReviews] = useState([]);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await farmerService.getFarmerById(farmerId);
        setData(res);
        // fetch reviews
        const rev = await reviewService.getFarmerReviews(farmerId);
        setReviews(rev.reviews || []);
      } catch (e) {
        setError(e.message || 'Failed to load farmer profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [farmerId]);

  if (loading) {
    return (
      <div className="fp-loading">
        <div className="spinner" />
        <p>Loading farmer profile...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fp-error">
        <span style={{ fontSize: '2.5rem' }}>⚠️</span>
        <p>{error}</p>
        <Link to="/find-farmers" className="fh-btn-primary">← Back to Farmers</Link>
      </div>
    );
  }

  const { farmer, user, products = [] } = data || {};
  if (!farmer) return null;

  const rating = farmer.rating || 0;

  return (
    <div className="farmer-profile-page">
      {/* Hero */}
      <div className="fp-hero">
        <div className="fp-hero-inner">
          <div className="fp-avatar">{(user?.name || farmer.farmName || 'F').charAt(0)}</div>
          <div className="fp-hero-info">
            <h1 className="fp-farm-name">{farmer.farmName}</h1>
            <p className="fp-farmer-name">Farmer: {user?.name || 'N/A'}</p>

            <div className="fp-badges">
              {farmer.isVerified && <span className="fp-badge verified">Verified farmer</span>}
              {farmer.farmingType && (
                <span className="fp-badge organic">{farmer.farmingType} (farmer-provided)</span>
              )}
              {farmer.experience && (
                <span className="fp-badge">{farmer.experience} yrs experience</span>
              )}
              {farmer.farmSize && (
                <span className="fp-badge">{farmer.farmSize}</span>
              )}
            </div>

            <div className="fp-badges">
              <span className="fp-badge">{[farmer.village, farmer.taluk, farmer.district, farmer.state].filter(Boolean).join(', ')}</span>
            </div>

            <div className="fp-rating-row">
              <StarDisplay rating={rating} />
              <span className="fp-rating-num">{rating.toFixed(1)}</span>
              <span className="fp-review-count">({farmer.totalReviews || 0} reviews)</span>
            </div>

            <div className="fp-action-btns">
              <button className="fp-btn-contact" onClick={() => setShowContact(true)}>
                Contact farmer
              </button>
              <Link to={`/bulk-order/${farmerId}`} className="fp-btn-bulk">
                Request bulk order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="fp-content">
        <div className="fp-tabs">
          {['about', 'products', 'reviews'].map(tab => (
            <button
              key={tab}
              className={`fp-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'about' && 'About farm'}
              {tab === 'products' && `Products (${products.length})`}
              {tab === 'reviews' && `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="fp-about-grid">
            <div className="fp-info-card">
              <h4>📍 Location Details</h4>
              {[
                ['State', farmer.state],
                ['District', farmer.district],
                ['Taluk', farmer.taluk],
                ['Village / Native', farmer.village || farmer.native],
              ].map(([label, val]) => val && (
                <div key={label} className="fp-info-row">
                  <span className="fp-info-label">{label}</span>
                  <span className="fp-info-value">{val}</span>
                </div>
              ))}
            </div>

            <div className="fp-info-card">
              <h4>🏡 Farm Details</h4>
              {[
                ['Farm Name', farmer.farmName],
                ['Farm Size', farmer.farmSize],
                ['Experience', farmer.experience ? `${farmer.experience} years` : null],
                ['Farming Type', farmer.farmingType],
              ].map(([label, val]) => val && (
                <div key={label} className="fp-info-row">
                  <span className="fp-info-label">{label}</span>
                  <span className="fp-info-value">{val}</span>
                </div>
              ))}
            </div>

            <div className="fp-info-card">
              <h4>🧪 Farming Practices</h4>
              {[
                ['Soil Type', farmer.soilType],
                ['Fertilizer', farmer.fertilizerUsed],
                ['Pest Management', farmer.pestManagement],
                ['Practices', farmer.farmingPractices],
              ].map(([label, val]) => val && (
                <div key={label} className="fp-info-row">
                  <span className="fp-info-label">{label}</span>
                  <span className="fp-info-value" style={{ maxWidth: '60%', textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>

            {farmer.bio && (
              <div className="fp-info-card">
                <h4>ℹ️ About the Farmer</h4>
                <p style={{ color: '#4b5563', lineHeight: 1.7, fontSize: '0.92rem' }}>{farmer.bio}</p>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          products.length === 0 ? (
            <div className="fp-no-reviews">
              <p style={{ fontSize: '2rem' }}>📦</p>
              <p>This farmer has not listed any products yet.</p>
            </div>
          ) : (
            <div className="fp-products-grid">
              {products.map(product => {
                const inCart = cartItems.find(c => (c._id || c.id) === product._id);
                return (
                  <div key={product._id} className="fp-product-card">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="fp-product-img" />
                    ) : (
                      <div className="fp-product-img-placeholder">🥬</div>
                    )}
                    <div className="fp-product-body">
                      <div className="fp-product-name">
                        {product.name}
                        {product.isSurplus && <span className="fp-surplus-tag">Surplus</span>}
                      </div>
                      <div className="fp-product-meta">{product.category} · {product.stock} {product.unit} available</div>
                      {product.harvestDate && (
                        <div className="fp-product-harvest">
                          🌱 Harvested: {new Date(product.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                      {product.expectedAvailability && (
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 8 }}>
                          📅 Available: {product.expectedAvailability}
                        </div>
                      )}
                      <div className="fp-product-footer">
                        <div className="fp-product-price">
                          ₹{product.isSurplus && product.surplusPrice ? product.surplusPrice : product.price}
                          <span>/{product.unit}</span>
                        </div>
                        <button
                          className={`fp-add-btn ${inCart ? 'in-cart' : ''}`}
                          onClick={() => addToCart(product, 1)}
                          disabled={product.stock <= 0}
                        >
                          {product.stock <= 0 ? 'Out of Stock' : inCart ? `✓ In Cart (${inCart.quantity})` : '+ Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          reviews.length === 0 ? (
            <div className="fp-no-reviews">
              <p style={{ fontSize: '2rem' }}>⭐</p>
              <p>No reviews yet for this farmer.</p>
            </div>
          ) : (
            <div className="fp-reviews-list">
              {reviews.map(review => (
                <div key={review._id} className="fp-review-card">
                  <div className="fp-review-header">
                    <span className="fp-reviewer">👤 {review.reviewerName}</span>
                    <span className="fp-review-date">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="fp-review-stars">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className="fp-review-star">{s <= review.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  {review.comment && <p className="fp-review-comment">"{review.comment}"</p>}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Direct Contact Inquiry Modal (Module 9) */}
      <DirectInquiryModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
        farmer={{ ...farmer, name: user?.name }}
      />
    </div>
  );
}
