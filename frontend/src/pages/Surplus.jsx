import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { surplusService } from '../services/api';
import { useCart } from '../context/CartContext';
import './Surplus.css';

export default function Surplus() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedId, setAddedId] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadSurplus() {
      setLoading(true);
      try {
        const res = await surplusService.getSurplusListings();
        setListings(res.listings || []);
      } catch (err) {
        setError(err.message || 'Failed to load surplus listings.');
      } finally {
        setLoading(false);
      }
    }
    loadSurplus();
  }, []);

  function handleClaim(listing) {
    addToCart({
      id: listing.productId || listing._id,
      name: `${listing.productName} (Surplus Special)`,
      price: listing.offerPrice,
      unit: 'kg',
      image: listing.productImage,
      farmerName: listing.farmerName,
      quantity: listing.minimumOrderQuantity || 1
    });
    setAddedId(listing._id);
    setTimeout(() => setAddedId(null), 2500);
  }

  function formatTimeRemaining(endDate) {
    if (!endDate) return 'Ending Soon';
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return 'Flash Offer Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h remaining`;
    return `${hours} hours remaining`;
  }

  return (
    <div className="surplus-page">
      {/* Hero Banner */}
      <section className="surplus-hero">
        <div className="surplus-hero-badge">
          <span className="flame-icon">🔥</span> Anti-Waste Flash Produce Initiative
        </div>
        <h1>Surplus & Unsold Harvest Deals</h1>
        <p>
          Help local farmers prevent harvest spoilage. Purchase bumper yields and excess farm batches directly at <strong>up to 40% discount</strong>. Guaranteed farm fresh, delivered to your door.
        </p>
        <div className="surplus-stats-ribbon">
          <div className="stat-item">
            <span className="stat-number">3,420 kg</span>
            <span className="stat-label">Farm Produce Rescued</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">₹1.8L+</span>
            <span className="stat-label">Saved by Buyers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Farmer Revenue Direct</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="surplus-container">
        {loading && (
          <div className="surplus-loading">
            <div className="surplus-spinner"></div>
            <p>Gathering fresh surplus batches directly from partner farms...</p>
          </div>
        )}

        {error && (
          <div className="surplus-alert error">
            <span>⚠️</span> {error}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="surplus-empty">
            <div className="empty-icon">🌱</div>
            <h3>All Surplus Produce Rescued!</h3>
            <p>Farmers currently have zero excess stock. Check back tomorrow morning after farm harvest rounds!</p>
            <Link to="/products" className="btn-explore">Browse Standard Farm Shop</Link>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <div className="surplus-grid">
            {listings.map((item) => {
              const discountPercent = Math.round(
                ((item.standardPrice - item.offerPrice) / item.standardPrice) * 100
              );
              return (
                <div key={item._id} className="surplus-card">
                  <div className="surplus-card-img-wrap">
                    <img src={item.productImage} alt={item.productName} className="surplus-card-img" />
                    <span className="discount-tag">-{discountPercent}% OFF</span>
                    <span className="countdown-pill">
                      ⏳ {formatTimeRemaining(item.offerEndDate)}
                    </span>
                  </div>

                  <div className="surplus-card-body">
                    <div className="surplus-farmer-meta">
                      <span className="farmer-icon">👨‍🌾</span> {item.farmerName}
                    </div>
                    <h3 className="surplus-title">{item.productName}</h3>

                    <div className="surplus-price-row">
                      <div className="price-stack">
                        <span className="offer-price">₹{item.offerPrice}</span>
                        <span className="unit-label">/ kg</span>
                        <span className="original-price">₹{item.standardPrice}</span>
                      </div>
                      <div className="stock-info">
                        <span className="stock-badge">
                          📦 {item.availableQuantity} kg left
                        </span>
                      </div>
                    </div>

                    <div className="surplus-details-box">
                      <p className="offer-notes">"{item.offerNotes}"</p>
                      <div className="moq-line">
                        <strong>Min Order Quantity:</strong> {item.minimumOrderQuantity} kg
                      </div>
                    </div>

                    <div className="surplus-actions">
                      <button
                        className={`btn-claim ${addedId === item._id ? 'added' : ''}`}
                        onClick={() => handleClaim(item)}
                      >
                        {addedId === item._id ? '✓ Added to Cart!' : `Claim at ₹${item.offerPrice}/kg`}
                      </button>
                      <Link to={`/farmer/${item.farmerId}`} className="btn-view-farm">
                        View Farm
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Informational Waste Prevention Banner */}
        <section className="surplus-impact-banner">
          <div className="impact-text">
            <h3>Why FreshHarvest Surplus Matters</h3>
            <p>
              In traditional supply chains, over 30% of post-harvest fresh vegetables and fruits spoil before reaching city markets due to distributor middlemen. FreshHarvest's Surplus module gives farmers immediate direct access to bulk mess kitchens, restaurants, and families, ensuring nothing goes to waste while keeping produce affordable.
            </p>
          </div>
          <div className="impact-action">
            <Link to="/products" className="btn-secondary-light">Shop Regular Harvest</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
