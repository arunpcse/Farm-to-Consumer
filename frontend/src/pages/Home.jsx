import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService, farmerService } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import './Home.css';

const CATEGORIES = [
  { name: 'Vegetables', count: '18+ Varieties', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fruits', count: '12+ Harvests', img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Grains & Pulses', count: 'Single-Origin Rice', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Dairy & Organic', count: 'Pure A2 & Honey', img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Herbs & Spices', count: 'Salem Curcumin', img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80' },
];

const TRUST_METRICS = [
  { val: '150+', label: 'Verified Farms Across Tamil Nadu' },
  { val: '< 24h', label: 'Farm-to-Doorstep Transit Window' },
  { val: '82%+', label: 'Direct Grower Payout Guaranteed' },
  { val: '14,200 kg', label: 'Edible Surplus Rescued from Waste' },
];

const STEPS = [
  {
    num: '01',
    title: 'Browse Fresh Harvest',
    desc: 'Explore peak-fresh crops harvested today with full transparency on origin, farm location, and picking date.'
  },
  {
    num: '02',
    title: 'Transparent Pricing',
    desc: 'Zero middlemen markups. Every rupee is broken down: 82%+ to the farmer, 8% eco-packaging, 10% quality logistics.'
  },
  {
    num: '03',
    title: 'Farm-Gate Harvest',
    desc: 'Produce is picked to order from local verified farmers in Erode, Coimbatore, Thanjavur, and Nilgiris.'
  },
  {
    num: '04',
    title: 'Direct Gentle Delivery',
    desc: 'Delivered in breathable eco-crates directly to your kitchen or commercial establishment in under 24 hours.'
  }
];

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredFarmers, setFeaturedFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    setLoading(true);
    try {
      const [prodRes, farmRes] = await Promise.allSettled([
        productService.getProducts({ sortBy: 'rating', limit: 4 }),
        farmerService.getFarmers()
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value.products?.length > 0) {
        setFeaturedProducts(prodRes.value.products.slice(0, 4));
      }
      if (farmRes.status === 'fulfilled') {
        const fList = Array.isArray(farmRes.value) ? farmRes.value : farmRes.value.farmers || [];
        setFeaturedFarmers(fList.slice(0, 3));
      }
    } catch (err) {
      console.error('Home data load error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  }

  return (
    <div className="home-page">
      {/* ── 1. Hero Showcase ─────────────────────────────────── */}
      <section className="hm-hero">
        <div className="hm-container hm-hero-grid">
          <div className="hm-hero-content">
            <div className="hm-hero-badge">
              <span>🌱 100% Direct From Tamil Nadu Farms</span>
              <span className="hm-badge-dot" />
              <span>Delivered Within 24 Hours</span>
            </div>

            <h1 className="hm-hero-title">
              Peak Fresh Produce, Directly From The Growers Who Nurtured It.
            </h1>

            <p className="hm-hero-sub">
              Skip wholesale auctions and week-old cold storage. Experience vine-ripened vegetables, hill fruits, and heritage grains with 100% price transparency and fair farmer payouts.
            </p>

            {/* Quick Hero Search Form */}
            <form className="hm-search-bar" onSubmit={handleSearchSubmit}>
              <span className="hm-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search tomatoes, bananas, Ponni rice, pure A2 milk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search produce"
              />
              <button type="submit" className="hm-btn-search">
                Find Produce
              </button>
            </form>

            <div className="hm-quick-tags">
              <span>Popular:</span>
              <button type="button" onClick={() => navigate('/products?search=Tomatoes')}>Tomatoes</button>
              <button type="button" onClick={() => navigate('/products?search=Bananas')}>Bananas</button>
              <button type="button" onClick={() => navigate('/products?search=Rice')}>Ponni Rice</button>
              <button type="button" onClick={() => navigate('/products?search=Milk')}>A2 Milk</button>
              <button type="button" onClick={() => navigate('/surplus')}>🔥 Surplus Deals</button>
            </div>

            <div className="hm-hero-actions">
              <Link to="/products" className="hm-btn-primary">
                Shop Fresh Harvest →
              </Link>
              <Link to="/find-farmers" className="hm-btn-secondary">
                Meet Verified Farmers
              </Link>
            </div>
          </div>

          <div className="hm-hero-visual">
            <div className="hm-visual-card">
              <img
                src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80"
                alt="Fresh Vine Tomatoes"
                className="hm-visual-img"
              />
              <div className="hm-visual-overlay">
                <div className="hm-vo-pill">🌿 Today's Harvest Lot</div>
                <h3>Organic Farm Tomatoes</h3>
                <p>📍 Ramasamy Farms · Perundurai, Erode</p>
                <div className="hm-vo-foot">
                  <span className="hm-vo-price">₹38 / kg</span>
                  <span className="hm-vo-share">82% directly paid to farmer</span>
                </div>
              </div>
            </div>

            {/* Floating Trust Pill */}
            <div className="hm-float-pill">
              <span className="hm-fp-icon">⚡</span>
              <div>
                <strong>Harvested Today, 06:00 AM</strong>
                <span>Guaranteed delivered in under 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Trust Metrics Bar ─────────────────────────────── */}
      <section className="hm-metrics-bar">
        <div className="hm-container hm-metrics-grid">
          {TRUST_METRICS.map(m => (
            <div key={m.label} className="hm-metric-item">
              <span className="hm-metric-val">{m.val}</span>
              <span className="hm-metric-label">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Shop by Category ─────────────────────────────── */}
      <section className="hm-section">
        <div className="hm-container">
          <div className="hm-section-head">
            <div>
              <span className="hm-kicker">Harvest Catalog</span>
              <h2>Shop by Farm Category</h2>
              <p>Direct seasonal produce sourced straight from specialized Tamil Nadu farm clusters.</p>
            </div>
            <Link to="/products" className="hm-link-all">View All Produce →</Link>
          </div>

          <div className="hm-cat-grid">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="hm-cat-card"
              >
                <div className="hm-cat-media">
                  <img src={cat.img} alt={cat.name} loading="lazy" />
                </div>
                <div className="hm-cat-info">
                  <h3>{cat.name}</h3>
                  <span className="hm-cat-count">{cat.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Today's Featured Harvest ─────────────────────── */}
      <section className="hm-section hm-section-ivory">
        <div className="hm-container">
          <div className="hm-section-head">
            <div>
              <span className="hm-kicker">Direct From Field</span>
              <h2>Today's Fresh Harvest Highlights</h2>
              <p>Top-rated produce harvested at peak ripeness, fully traceable to individual farms.</p>
            </div>
            <Link to="/products" className="hm-link-all">Browse Full Store ({featuredProducts.length} items) →</Link>
          </div>

          <div className="hm-products-grid">
            {featuredProducts.map(item => {
              const inCart = (cartItems || []).some(c => (c._id || c.id) === (item._id || item.id));
              return (
                <ProductCard
                  key={item._id || item.id}
                  item={item}
                  onAdd={addToCart}
                  inCart={inCart}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Anti-Waste Surplus Clearance Banner ───────────── */}
      <section className="hm-surplus-banner">
        <div className="hm-container hm-sb-inner">
          <div className="hm-sb-copy">
            <span className="hm-sb-tag">🔥 Food Waste Prevention Initiative</span>
            <h2>Save Money While Rescuing Extra Farm Harvest</h2>
            <p>
              When a bumper harvest yields excess stock, farmers offer flash discounts rather than letting nutritious produce spoil. Get 20% to 40% off same-day farm produce.
            </p>
            <div className="hm-sb-stats">
              <div><strong>14,280 kg</strong><span>Produce Rescued</span></div>
              <div><strong>₹4,12,000</strong><span>Farmer Value Saved</span></div>
              <div><strong>18.6 Tons</strong><span>CO₂ Avoided</span></div>
            </div>
            <Link to="/surplus" className="hm-btn-surplus">
              Explore Surplus Flash Deals →
            </Link>
          </div>
          <div className="hm-sb-graphic">
            <div className="hm-sb-card">
              <span className="hm-sb-badge">FLASH DEAL</span>
              <h3>Bumper Harvest Clearance</h3>
              <p>Sweet Cavendish Bananas · Sirumalai Foothills</p>
              <div className="hm-sb-price-row">
                <span className="hm-old-price">₹55 / doz</span>
                <span className="hm-new-price">₹38 / doz</span>
                <span className="hm-save-tag">31% OFF</span>
              </div>
              <span className="hm-sb-timer">⏳ Deal ends tonight</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Verified Farmers Spotlight ───────────────────── */}
      <section className="hm-section">
        <div className="hm-container">
          <div className="hm-section-head">
            <div>
              <span className="hm-kicker">Authentic Origin</span>
              <h2>Meet Your Local Growers</h2>
              <p>Trace every apple, tomato, and rice grain to the family farm that cultivated it.</p>
            </div>
            <Link to="/find-farmers" className="hm-link-all">Search All 150+ Farmers →</Link>
          </div>

          <div className="hm-farmers-grid">
            {(featuredFarmers.length > 0 ? featuredFarmers : [
              {
                _id: 'f1',
                farmName: 'Ramasamy Organic Farms',
                name: 'Murugan R.',
                native: 'Perundurai',
                district: 'Erode',
                experience: '15 Years',
                farmingType: 'Organic',
                rating: 4.9,
                verified: true
              },
              {
                _id: 'f2',
                farmName: 'Kaveri Valley Orchards',
                name: 'Lakshmi P.',
                native: 'Pollachi',
                district: 'Coimbatore',
                experience: '12 Years',
                farmingType: 'Natural',
                rating: 4.8,
                verified: true
              },
              {
                _id: 'f3',
                farmName: 'Thirunavukkarasu Naturals',
                name: 'Rajan K.',
                native: 'Kumbakonam',
                district: 'Thanjavur',
                experience: '22 Years',
                farmingType: 'Traditional',
                rating: 4.9,
                verified: true
              }
            ]).map(farmer => (
              <article key={farmer._id} className="hm-farmer-card">
                <div className="hm-fc-head">
                  <div className="hm-fc-avatar">
                    {(farmer.name || 'F').charAt(0)}
                  </div>
                  <div>
                    <h3 className="hm-fc-name">{farmer.farmName}</h3>
                    <p className="hm-fc-farmer">{farmer.name}</p>
                    <span className="hm-fc-loc">📍 {farmer.native || farmer.district}, {farmer.district}</span>
                  </div>
                  {farmer.verified && <span className="hm-fc-verified">✓ Verified</span>}
                </div>

                <div className="hm-fc-stats">
                  <div>
                    <span className="hm-fcs-val">{farmer.experience || '10+ Years'}</span>
                    <span className="hm-fcs-lbl">Experience</span>
                  </div>
                  <div>
                    <span className="hm-fcs-val">{farmer.farmingType || 'Natural'}</span>
                    <span className="hm-fcs-lbl">Practice</span>
                  </div>
                  <div>
                    <span className="hm-fcs-val">⭐ {farmer.rating || '4.9'}</span>
                    <span className="hm-fcs-lbl">QA Rating</span>
                  </div>
                </div>

                <Link to={`/farmer/${farmer._id}`} className="hm-fc-link">
                  View Farm Profile & Fresh Catalog →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. B2B Institutional Procurement Band ───────────── */}
      <section className="hm-b2b-band">
        <div className="hm-container hm-b2b-inner">
          <div className="hm-b2b-copy">
            <span className="hm-b2b-badge">Commercial Food Service & Institutions</span>
            <h2>Procuring Fresh Farm Produce in Bulk for Hostels, Hotels, or Canteens?</h2>
            <p>
              Get reliable wholesale farm deliveries without the mandi markup. Receive standing weekly morning deliveries, negotiated bulk pricing, and dedicated agronomic QA checks.
            </p>
            <div className="hm-b2b-features">
              <span>✓ Custom Volume Tonnage (100kg+)</span>
              <span>✓ Daily 07:00 AM Delivery Routes</span>
              <span>✓ 100% Direct GST Farm Invoices</span>
            </div>
            <div className="hm-b2b-actions">
              <Link to="/bulk-buyer-dashboard" className="hm-btn-b2b-primary">
                Open B2B Procurement Portal
              </Link>
              <Link to="/bulk-order" className="hm-btn-b2b-secondary">
                Request a Bulk Quotation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. How FreshHarvest Works ───────────────────────── */}
      <section className="hm-section hm-section-ivory">
        <div className="hm-container">
          <div className="hm-section-head hm-head-center">
            <span className="hm-kicker">Simple & Transparent</span>
            <h2>How FreshHarvest Works</h2>
            <p>A fair, direct bridge connecting everyday kitchens with certified regional growers.</p>
          </div>

          <div className="hm-steps-grid">
            {STEPS.map(s => (
              <article key={s.num} className="hm-step-card">
                <span className="hm-step-num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
