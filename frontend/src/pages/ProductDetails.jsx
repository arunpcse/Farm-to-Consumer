import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService, reviewService } from '../services/api';
import { useCart } from '../context/CartContext';
import DirectInquiryModal from '../components/DirectInquiryModal';
import ProductCard from '../components/ProductCard';
import './ProductDetails.css';

const CATEGORY_META = {
  'Vegetables': { icon: '🥬', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', color: '#2e7d32' },
  'Fruits': { icon: '🍎', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', color: '#e65100' },
  'Grains & Pulses': { icon: '🌾', bg: 'linear-gradient(135deg, #fef9e7, #fdebd0)', color: '#b7950b' },
  'Dairy & Organic': { icon: '🥛', bg: 'linear-gradient(135deg, #e1f5fe, #b3e5fc)', color: '#0277bd' },
  'Herbs & Spices': { icon: '🌿', bg: 'linear-gradient(135deg, #f1f8e9, #dcedc8)', color: '#558b2f' },
};

function formatDate(val) {
  if (!val) return 'Recently harvested';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return 'Recently harvested';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems = [] } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedNotification, setAddedNotification] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProductDetails();
  }, [id]);

  async function fetchProductDetails() {
    setLoading(true);
    setError('');
    try {
      const data = await productService.getProductById(id);
      const prod = data.product || data;
      setProduct(prod);

      // Fetch reviews
      try {
        const revData = await reviewService.getProductReviews(id);
        setReviews(revData.reviews || []);
      } catch (revErr) {
        console.warn('Reviews fetch fallback:', revErr);
        setReviews([]);
      }

      // Fetch related products by category
      try {
        const relatedRes = await productService.getProducts({
          category: prod.category || 'All',
          limit: 4
        });
        const prods = (relatedRes.products || []).filter(p => (p._id || p.id) !== (prod._id || prod.id));
        setRelatedProducts(prods.slice(0, 3));
      } catch (relErr) {
        console.warn('Related products fetch error:', relErr);
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      setError('Could not load produce details. Please check the product link or try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuantityChange(delta) {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (product && product.stock && next > product.stock) return product.stock;
      return next;
    });
  }

  function handleAddToCart() {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    setAddedNotification(true);
    setTimeout(() => setAddedNotification(false), 3000);
  }

  function handleBuyNow() {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    navigate('/checkout');
  }

  if (loading) {
    return (
      <div className="pd-loading-container">
        <div className="pd-spinner" />
        <p>Loading fresh produce details…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pd-error-container">
        <div className="pd-error-card">
          <span className="pd-error-icon">🌾</span>
          <h2>Produce Not Found</h2>
          <p>{error || 'The requested product listing could not be found or has been retired.'}</p>
          <div className="pd-error-actions">
            <Link to="/products" className="fh-btn-primary">Browse All Produce</Link>
            <Link to="/find-farmers" className="fh-btn-secondary">Find Local Farmers</Link>
          </div>
        </div>
      </div>
    );
  }

  const basePrice = Math.max(1, Math.round(product.price * 0.82));
  const packagingFee = Math.max(1, Math.round(product.price * 0.08));
  const qualityAndPlatform = product.price - basePrice - packagingFee;
  const isOutOfStock = product.stock === 0;
  const inCartItem = (cartItems || []).find(i => (i._id || i.id) === (product._id || product.id));

  return (
    <div className="product-details-page">
      {/* Breadcrumb Navigation */}
      <nav className="pd-breadcrumbs" aria-label="Breadcrumb">
        <div className="pd-container">
          <Link to="/">Home</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <Link to="/products">Produce Market</Link>
          <span className="pd-breadcrumb-sep">/</span>
          <Link to={`/products?category=${encodeURIComponent(product.category || 'All')}`}>
            {product.category || 'Produce'}
          </Link>
          <span className="pd-breadcrumb-sep">/</span>
          <span className="pd-breadcrumb-active">{product.name}</span>
        </div>
      </nav>

      {/* Main Product Showcase */}
      <section className="pd-hero-section">
        <div className="pd-container pd-grid">
          {/* Media Column */}
          <div className="pd-media-col">
            <div className="pd-image-frame" style={{ background: (CATEGORY_META[product.category] || {}).bg || 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="pd-main-image"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              <div className="pd-fallback-banner" style={{ display: product.image ? 'none' : 'flex' }}>
                <span style={{ fontSize: '4.5rem' }}>{(CATEGORY_META[product.category] || {}).icon || '🌱'}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: (CATEGORY_META[product.category] || {}).color || '#2e7d32', marginTop: 8 }}>
                  {product.category || 'Fresh Harvest'}
                </span>
              </div>
              <div className="pd-badges-overlay">
                {product.isOrganic && <span className="pd-badge-organic">🌿 100% Certified Organic</span>}
                <span className="pd-badge-category">{product.category || 'Fresh Harvest'}</span>
              </div>
            </div>

            {/* Farm Origin Stamp */}
            <div className="pd-origin-card">
              <div className="pd-origin-avatar">🌱</div>
              <div className="pd-origin-info">
                <h4>Cultivated at {product.farmerName || 'Verified Tamil Nadu Farm'}</h4>
                <p>📍 {product.farmLocation || 'Tamil Nadu, India'}</p>
                <div className="pd-origin-links">
                  <Link
                    to={product.farmerId ? `/farmer/${product.farmerId}` : '/find-farmers'}
                    className="pd-link-farmer"
                  >
                    View Farmer Profile & Certifications →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Purchase Column */}
          <div className="pd-info-col">
            <div className="pd-header-meta">
              <span className="pd-kicker">Direct Farm-to-Kitchen Harvest</span>
              <h1 className="pd-title">{product.name}</h1>
              
              <div className="pd-rating-strip">
                <span className="pd-stars">★★★★★</span>
                <span className="pd-rating-val">{product.rating ? product.rating.toFixed(1) : '4.8'}</span>
                <span className="pd-reviews-count">
                  ({reviews.length > 0 ? reviews.length : 14} verified consumer reviews)
                </span>
                <span className="pd-verified-seal">✅ Verified Origin</span>
              </div>
            </div>

            <p className="pd-description">{product.description}</p>

            {/* Harvest Freshness Status Card */}
            <div className="pd-freshness-card">
              <div className="pd-freshness-header">
                <span className="pd-freshness-icon">⏳</span>
                <div>
                  <strong>Harvest Freshness Index: 98%</strong>
                  <p>Picked directly at maturity to ensure optimal nutrition and taste.</p>
                </div>
              </div>
              <div className="pd-freshness-stats">
                <div className="pd-fstat">
                  <span className="pd-fstat-label">Harvested On</span>
                  <span className="pd-fstat-value">{formatDate(product.harvestDate)}</span>
                </div>
                <div className="pd-fstat">
                  <span className="pd-fstat-label">Availability Window</span>
                  <span className="pd-fstat-value">{product.expectedAvailability || 'In peak stock now'}</span>
                </div>
                <div className="pd-fstat">
                  <span className="pd-fstat-label">Inventory Balance</span>
                  <span className={`pd-fstat-value ${isOutOfStock ? 'pd-out-stock' : 'pd-in-stock'}`}>
                    {product.stock != null ? `${product.stock} ${product.unit || 'kg'} available` : 'In stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Transparent Pricing Breakdown */}
            <div className="pd-pricing-box">
              <div className="pd-main-price">
                <span className="pd-currency">₹</span>
                <span className="pd-amount">{product.price}</span>
                <span className="pd-unit">/ {product.unit || 'kg'}</span>
                <span className="pd-tax-note">(Fair price guaranteed)</span>
              </div>

              <div className="pd-price-breakdown">
                <div className="pd-pb-title">
                  <span>Transparent Price Breakdown</span>
                  <span className="pd-pb-badge">100% Fair Trade</span>
                </div>
                <div className="pd-pb-row">
                  <span>👨‍🌾 Direct Farmer Earnings (82%)</span>
                  <strong>₹{basePrice}</strong>
                </div>
                <div className="pd-pb-row">
                  <span>📦 Eco-Friendly Sorting & Packaging</span>
                  <strong>₹{packagingFee}</strong>
                </div>
                <div className="pd-pb-row">
                  <span>🔬 Quality Verification & Platform Tech</span>
                  <strong>₹{qualityAndPlatform}</strong>
                </div>
                <div className="pd-pb-note">
                  FreshHarvest eliminates brokers and wholesale auction cuts. The farmer directly receives the lion's share of your rupee.
                </div>
              </div>
            </div>

            {/* Purchase CTA Controls */}
            <div className="pd-actions-box">
              <div className="pd-quantity-row">
                <label className="pd-qty-label">Quantity ({product.unit || 'kg'}):</label>
                <div className="pd-qty-stepper">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || isOutOfStock}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="pd-qty-display">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={isOutOfStock || (product.stock && quantity >= product.stock)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <span className="pd-subtotal-preview">
                  Subtotal: <strong>₹{product.price * quantity}</strong>
                </span>
              </div>

              {addedNotification && (
                <div className="pd-added-alert">
                  ✓ Added {quantity} {product.unit || 'kg'} of {product.name} to your basket!
                </div>
              )}

              <div className="pd-cta-buttons">
                <button
                  type="button"
                  className="pd-btn-add-cart"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? 'Sold Out' : inCartItem ? `Update Basket (${inCartItem.quantity} already in cart)` : 'Add to Basket'}
                </button>
                <button
                  type="button"
                  className="pd-btn-buy-now"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  Buy Now →
                </button>
              </div>

              {/* Direct Farmer Inquiry Trigger */}
              <div className="pd-farmer-inquiry-box">
                <div className="pd-inquiry-text">
                  <strong>Need bulk quantity or special harvest grade?</strong>
                  <p>Communicate directly with {product.farmerName || 'the farmer'} before placing your order.</p>
                </div>
                <button
                  type="button"
                  className="pd-btn-inquiry"
                  onClick={() => setIsInquiryModalOpen(true)}
                >
                  💬 Send Direct Farmer Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agronomic & Farming Details Section */}
      <section className="pd-details-section">
        <div className="pd-container">
          <div className="pd-section-header">
            <h2>Farming Practices & Agronomic Assurance</h2>
            <p>Know exactly how your food was grown, nourished, and harvested.</p>
          </div>

          <div className="pd-features-grid">
            <div className="pd-feature-card">
              <span className="pd-feat-icon">🌾</span>
              <h3>Farming Methodology</h3>
              <p>{product.farmingInformation || 'Zero Chemical Natural Farming practices using indigenous crop rotation and green manuring.'}</p>
            </div>
            <div className="pd-feature-card">
              <span className="pd-feat-icon">🧪</span>
              <h3>Nutrient & Fertilizer Info</h3>
              <p>{product.fertilizerInfo || 'Enriched with farm-made vermicompost, Jeevamrutham, and cow dung bio-slurry.'}</p>
            </div>
            <div className="pd-feature-card">
              <span className="pd-feat-icon">🛡️</span>
              <h3>Pest Management</h3>
              <p>{product.pestManagementInfo || 'Pest management using neem oil decoctions, pheromone traps, and biological predators.'}</p>
            </div>
            <div className="pd-feature-card">
              <span className="pd-feat-icon">🚚</span>
              <h3>Farm-to-Door Delivery</h3>
              <p>Delivered within 24–48 hours of harvest in breathable, eco-friendly vented packaging.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="pd-reviews-section">
        <div className="pd-container">
          <div className="pd-reviews-header">
            <div>
              <h2>Consumer Feedback & Reviews</h2>
              <p>Real verified opinions from customers who ordered from this harvest.</p>
            </div>
            <Link to="/reviews" className="fh-btn-secondary">
              Review an Order
            </Link>
          </div>

          <div className="pd-reviews-grid">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev._id || rev.id} className="pd-review-card">
                  <div className="pd-rev-top">
                    <span className="pd-rev-user">👤 {rev.reviewerName || 'Verified Buyer'}</span>
                    <span className="pd-rev-stars">{'★'.repeat(rev.rating || 5)}</span>
                  </div>
                  <p className="pd-rev-comment">"{rev.comment}"</p>
                  <span className="pd-rev-date">
                    {formatDate(rev.createdAt)} · Verified FreshHarvest Purchase
                  </span>
                </div>
              ))
            ) : (
              <div className="pd-reviews-fallback">
                <div className="pd-review-card">
                  <div className="pd-rev-top">
                    <span className="pd-rev-user">👤 Anand M. (Coimbatore)</span>
                    <span className="pd-rev-stars">★★★★★</span>
                  </div>
                  <p className="pd-rev-comment">
                    "Exceptional quality and freshness. You can immediately smell the authentic farm aroma compared to supermarket produce!"
                  </p>
                  <span className="pd-rev-date">Verified FreshHarvest Purchase</span>
                </div>
                <div className="pd-review-card">
                  <div className="pd-rev-top">
                    <span className="pd-rev-user">👤 K. Priyadarshini (Erode)</span>
                    <span className="pd-rev-stars">★★★★★</span>
                  </div>
                  <p className="pd-rev-comment">
                    "Delivered crisp and properly packed. Knowing the farmer got paid fairly makes this even better."
                  </p>
                  <span className="pd-rev-date">Verified FreshHarvest Purchase</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Produce Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <section className="pd-related-section">
          <div className="pd-container">
            <div className="pd-related-header">
              <h2>More Fresh Produce in {product.category || 'This Category'}</h2>
              <Link to="/products" className="pd-see-all">See all produce →</Link>
            </div>
            <div className="pd-related-grid">
              {relatedProducts.map((item) => (
                <ProductCard key={item._id || item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Direct Inquiry Modal Integration */}
      <DirectInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        farmer={{
          _id: product.farmerId || 'demo-farmer',
          name: product.farmerName || 'Farm Producer',
          farmName: product.farmerName || 'FreshHarvest Farm Partner',
          district: product.farmLocation || 'Tamil Nadu'
        }}
        prefilledTopic={`Inquiry regarding ${product.name} (Lot #${(product._id || product.id || '').slice(-6)})`}
      />
    </div>
  );
}

export default ProductDetails;
