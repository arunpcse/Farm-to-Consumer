import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FindFarmers.css';

const API_BASE_URL = 'http://localhost:5000/api';

const TN_DISTRICTS = [
  '', 'Erode', 'Coimbatore', 'Salem', 'Thanjavur', 'Nilgiris', 'Tiruppur', 'Dharmapuri',
];

const DEMO_FARMERS = [
  {
    _id: 'f1',
    farmName: 'Green Valley Organics',
    name: 'Murugan R.',
    native: 'Bhavani',
    district: 'Erode',
    taluk: 'Bhavani',
    rating: 4.9,
    reviewCount: 128,
    verified: true,
    productCount: 14,
    experience: '15 Years',
    farmingType: 'Organic',
    avatar: null,
  },
  {
    _id: 'f2',
    farmName: 'Nilgiris Fresh Farm',
    name: 'Lakshmi P.',
    native: 'Ooty',
    district: 'Nilgiris',
    taluk: 'Udhagamandalam',
    rating: 4.8,
    reviewCount: 92,
    verified: true,
    productCount: 9,
    experience: '8 Years',
    farmingType: 'Natural',
    avatar: null,
  },
  {
    _id: 'f3',
    farmName: 'Cauvery Delta Farms',
    name: 'Rajan K.',
    native: 'Kumbakonam',
    district: 'Thanjavur',
    taluk: 'Kumbakonam',
    rating: 4.7,
    reviewCount: 67,
    verified: true,
    productCount: 21,
    experience: '22 Years',
    farmingType: 'Conventional',
    avatar: null,
  },
  {
    _id: 'f4',
    farmName: 'Salem Spice Gardens',
    name: 'Selvam V.',
    native: 'Yercaud',
    district: 'Salem',
    taluk: 'Yercaud',
    rating: 4.6,
    reviewCount: 45,
    verified: false,
    productCount: 7,
    experience: '10 Years',
    farmingType: 'Mixed',
    avatar: null,
  },
  {
    _id: 'f5',
    farmName: 'Kongu Agro Farm',
    name: 'Prabhakaran M.',
    native: 'Avinashi',
    district: 'Tiruppur',
    taluk: 'Avinashi',
    rating: 4.5,
    reviewCount: 38,
    verified: true,
    productCount: 11,
    experience: '6 Years',
    farmingType: 'Organic',
    avatar: null,
  },
  {
    _id: 'f6',
    farmName: 'Dharmapuri Hill Produce',
    name: 'Sumathi A.',
    native: 'Pappireddipatti',
    district: 'Dharmapuri',
    taluk: 'Pappireddipatti',
    rating: 4.8,
    reviewCount: 54,
    verified: true,
    productCount: 16,
    experience: '12 Years',
    farmingType: 'Natural',
    avatar: null,
  },
];

function FarmingTypeBadge({ type }) {
  const colorMap = {
    Organic: '#065f46',
    Natural: '#1d4ed8',
    Conventional: '#92400e',
    Mixed: '#6b21a8',
  };
  return (
    <span
      className="farmer-type-badge"
      style={{ background: colorMap[type] || '#374151' }}
    >
      {type}
    </span>
  );
}

function StarDisplay({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="farmer-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`fstar ${i < full ? 'fstar-full' : i === full && half ? 'fstar-half' : 'fstar-empty'}`}>
          ★
        </span>
      ))}
      <span className="farmer-rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

function FindFarmers() {
  const [filters, setFilters] = useState({
    state: 'Tamil Nadu',
    district: '',
    taluk: '',
    village: '',
    search: '',
  });
  const [applied, setApplied] = useState({
    state: 'Tamil Nadu',
    district: '',
    taluk: '',
    village: '',
    search: '',
  });
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFarmers(applied);
  }, []);

  async function fetchFarmers(f) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (f.district) params.set('district', f.district);
      if (f.taluk) params.set('taluk', f.taluk);
      if (f.village) params.set('village', f.village);
      if (f.search) params.set('search', f.search);
      const res = await fetch(`${API_BASE_URL}/farmers?${params.toString()}`);
      if (!res.ok) throw new Error('Backend not available');
      const data = await res.json();
      setFarmers(Array.isArray(data) ? data : data.farmers || []);
    } catch {
      // Fall back to demo data filtered client-side
      let demo = DEMO_FARMERS;
      if (f.district) demo = demo.filter(d => d.district === f.district);
      if (f.taluk) demo = demo.filter(d => d.taluk.toLowerCase().includes(f.taluk.toLowerCase()));
      if (f.village) demo = demo.filter(d => d.native.toLowerCase().includes(f.village.toLowerCase()));
      if (f.search) {
        const q = f.search.toLowerCase();
        demo = demo.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.farmName.toLowerCase().includes(q)
        );
      }
      setFarmers(demo);
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    setApplied({ ...filters });
    fetchFarmers(filters);
  }

  function handleClear() {
    const clean = { state: 'Tamil Nadu', district: '', taluk: '', village: '', search: '' };
    setFilters(clean);
    setApplied(clean);
    fetchFarmers(clean);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="find-farmers-page">
      {/* Page Header */}
      <div className="ff-header">
        <div className="ff-header-inner">
          <h1 className="ff-title">Find farmers by native</h1>
          <p className="ff-subtitle">
            Filter Tamil Nadu farms by district, taluk, and village. Verification status is shown
            on each profile and is not assumed from registration alone.
          </p>
        </div>
      </div>

      <div className="ff-layout">
        {/* ── Sidebar Filters ───────────────────────────────── */}
        <aside className="ff-sidebar">
          <div className="ff-sidebar-card">
            <h2 className="ff-sidebar-title">Location filters</h2>

            <div className="ff-form-group">
              <label>State</label>
              <select name="state" value={filters.state} onChange={handleChange} disabled>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>
            </div>

            <div className="ff-form-group">
              <label>District</label>
              <select name="district" value={filters.district} onChange={handleChange}>
                <option value="">All Districts</option>
                {TN_DISTRICTS.filter(Boolean).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="ff-form-group">
              <label>Taluk</label>
              <input
                type="text"
                name="taluk"
                placeholder="e.g. Bhavani"
                value={filters.taluk}
                onChange={handleChange}
              />
            </div>

            <div className="ff-form-group">
              <label>Village / Native</label>
              <input
                type="text"
                name="village"
                placeholder="e.g. Ooty, Kumbakonam"
                value={filters.village}
                onChange={handleChange}
              />
            </div>

            <div className="ff-form-group">
              <label>Search by Name / Farm</label>
              <input
                type="text"
                name="search"
                placeholder="Farmer or farm name..."
                value={filters.search}
                onChange={handleChange}
              />
            </div>

            <div className="ff-filter-actions">
              <button className="ff-btn-apply" onClick={handleApply}>
                Apply Filters
              </button>
              <button className="ff-btn-clear" onClick={handleClear}>
                Clear Filters
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────── */}
        <main className="ff-main">
          <div className="ff-results-bar">
            <span className="ff-result-count">
              {loading ? 'Searching…' : `${farmers.length} farmer${farmers.length !== 1 ? 's' : ''} found`}
            </span>
            {applied.district && (
              <span className="ff-active-filter">📍 {applied.district}</span>
            )}
            {applied.search && (
              <span className="ff-active-filter">🔍 "{applied.search}"</span>
            )}
          </div>

          {loading ? (
            <div className="ff-loading">
              <div className="ff-spinner" />
              <p>Finding farmers near you…</p>
            </div>
          ) : error ? (
            <div className="ff-error">{error}</div>
          ) : farmers.length === 0 ? (
            <div className="ff-empty">
              <span className="ff-empty-icon">🌾</span>
              <h3>No Farmers Found</h3>
              <p>Try adjusting your filters or clearing them to see all farmers.</p>
              <button className="ff-btn-apply" onClick={handleClear}>Show All Farmers</button>
            </div>
          ) : (
            <div className="farmers-grid">
              {farmers.map((farmer) => (
                <article key={farmer._id} className="farmer-card">
                  <div className="farmer-card-top">
                    <div className="farmer-avatar-wrap">
                      {farmer.avatar ? (
                        <img src={farmer.avatar} alt={farmer.name} className="farmer-avatar-img" />
                      ) : (
                        <span className="farmer-avatar-emoji">
                          {(farmer.name || 'F').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="farmer-card-meta">
                      <h3 className="farmer-farm-name">{farmer.farmName}</h3>
                      <p className="farmer-person-name">{farmer.name}</p>
                      <div className="farmer-location">
                        <span>📍 {farmer.native}, {farmer.district}</span>
                      </div>
                    </div>
                    {farmer.verified && (
                      <span className="farmer-verified-badge" title="Verified Farmer">✅ Verified</span>
                    )}
                  </div>

                  <div className="farmer-card-body">
                    <StarDisplay rating={farmer.rating} />
                    <span className="farmer-review-count">({farmer.reviewCount} reviews)</span>
                  </div>

                  <div className="farmer-card-stats">
                    <div className="fcs-item">
                      <span className="fcs-value">{farmer.productCount}</span>
                      <span className="fcs-label">Products</span>
                    </div>
                    <div className="fcs-divider" />
                    <div className="fcs-item">
                      <span className="fcs-value">{farmer.experience}</span>
                      <span className="fcs-label">Experience</span>
                    </div>
                    <div className="fcs-divider" />
                    <div className="fcs-item">
                      <FarmingTypeBadge type={farmer.farmingType} />
                      <span className="fcs-label">Method</span>
                    </div>
                  </div>

                  <Link to={`/farmer/${farmer._id}`} className="farmer-view-btn">
                    View Profile →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default FindFarmers;
