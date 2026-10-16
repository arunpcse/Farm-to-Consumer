import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  authService,
  farmerService,
  farmerProductService,
  bulkOrderService,
  contactService,
  surplusService
} from '../services/api';
import './FarmerDashboard.css';

const ORDER_STATUS_FLOW = ['Placed', 'Farmer Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];
const CATEGORIES = [
  { name: 'Vegetables', label: 'Vegetables / காய்கறிகள்', icon: '🥬', color: '#2e7d32' },
  { name: 'Fruits', label: 'Fruits / பழங்கள்', icon: '🍎', color: '#e65100' },
  { name: 'Grains & Pulses', label: 'Grains & Pulses / தானியங்கள்', icon: '🌾', color: '#b7950b' },
  { name: 'Dairy & Organic', label: 'Dairy & Organic / பால் & இயற்கை', icon: '🥛', color: '#0277bd' },
  { name: 'Herbs & Spices', label: 'Herbs & Spices / மூலிகைகள்', icon: '🌿', color: '#558b2f' }
];

const FARMING_METHODS = [
  { value: 'Organic', label: '🌱 100% Certified Organic (இயற்கை விவசாயம்)', desc: 'Zero synthetic chemicals, natural manure' },
  { value: 'Natural', label: '🍃 Natural / Zero Budget (இயற்கை முறை)', desc: 'Jeevamrutha, bio-inputs, traditional soil care' },
  { value: 'Conventional', label: '🚜 Traditional / Mixed (பாரம்பரிய முறை)', desc: 'Standard GAP practices with safe harvesting intervals' }
];

const CROP_PRESETS = [
  { name: 'Fresh Country Tomatoes (நாட்டு தக்காளி)', category: 'Vegetables', unit: 'kg', price: 38, icon: '🍅', method: 'Organic' },
  { name: 'Small Shallots / Onions (சின்ன வெங்காயம்)', category: 'Vegetables', unit: 'kg', price: 55, icon: '🧅', method: 'Natural' },
  { name: 'Organic Farm Potatoes (உருளைக்கிழங்கு)', category: 'Vegetables', unit: 'kg', price: 32, icon: '🥔', method: 'Organic' },
  { name: 'Ooty Fresh Carrots (கேரட்)', category: 'Vegetables', unit: 'kg', price: 48, icon: '🥕', method: 'Organic' },
  { name: 'Fresh Green Spinach (பசலைக்கீரை)', category: 'Vegetables', unit: 'bunch', price: 20, icon: '🥬', method: 'Organic' },
  { name: 'Red Bananas (செவ்வாழை)', category: 'Fruits', unit: 'dozen', price: 65, icon: '🍌', method: 'Natural' },
  { name: 'Salem Alphonso Mangoes (மாம்பழம்)', category: 'Fruits', unit: 'kg', price: 120, icon: '🥭', method: 'Organic' },
  { name: 'Heritage Ponni Rice (பாரம்பரிய பொன்னி அரிசி)', category: 'Grains & Pulses', unit: 'kg', price: 75, icon: '🌾', method: 'Natural' },
  { name: 'Pure Country Cow Milk (நாட்டுப்பசு பால்)', category: 'Dairy & Organic', unit: 'litre', price: 60, icon: '🥛', method: 'Organic' },
  { name: 'Salem Curcumin Turmeric (மஞ்சள்)', category: 'Herbs & Spices', unit: 'kg', price: 140, icon: '🌿', method: 'Organic' },
  { name: 'Country Green Chillies (பச்சை மிளகாய்)', category: 'Vegetables', unit: 'kg', price: 50, icon: '🌶️', method: 'Natural' },
  { name: 'Fresh Tender Coconut (செவ்விளநீர்)', category: 'Fruits', unit: 'piece', price: 45, icon: '🥥', method: 'Organic' }
];

const EMPTY_PRODUCT = {
  name: '',
  category: 'Vegetables',
  price: '',
  unit: 'kg',
  stock: '',
  harvestDate: new Date().toISOString().split('T')[0],
  expectedAvailability: 'Available Today',
  minimumOrderQuantity: 1,
  farmingMethod: 'Organic',
  farmingPractices: '',
  fertilizerUsed: '',
  pesticide: '',
  image: '',
  isSurplus: false,
  surplusPrice: '',
  minBulkOrderQty: 10,
  description: '',
  status: 'active',
  batchPricingMinQty: 10,
  batchPricingDiscount: 10
};

function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '-');
  return <span className={`fd-status fd-status-${normalized}`}>{status}</span>;
}

export default function FarmerDashboard() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview');

  // Data
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bulkOrders, setBulkOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [earningsTimeframe, setEarningsTimeframe] = useState('all');
  const [inquiries, setInquiries] = useState([]);
  const [surplusListings, setSurplusListings] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [newSurplusForm, setNewSurplusForm] = useState({
    productId: '',
    availableQuantity: '',
    offerPrice: '',
    minimumOrderQuantity: 5,
    offerNotes: '',
    offerEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // UI states
  const [loading, setLoading] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [profileForm, setProfileForm] = useState({
    farmName: '',
    native: '',
    state: 'Tamil Nadu',
    district: '',
    taluk: '',
    village: '',
    experience: '',
    farmSize: '',
    farmingType: 'Organic',
    farmingPractices: '',
    soilType: '',
    fertilizerUsed: '',
    pestManagement: '',
    bio: ''
  });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4500);
  };

  const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  // Fetch all data
  const loadData = useCallback(async () => {
    if (!user || user.role !== 'farmer') return;
    try {
      setLoad('data', true);
      const [profRes, prodRes, ordRes, bulkRes, earnRes, inqRes, surpRes] = await Promise.allSettled([
        farmerService.getMyProfile(),
        farmerService.getMyProducts(),
        farmerService.getMyOrders(),
        bulkOrderService.getBulkOrders({ farmerId: user.id }),
        farmerService.getMyEarnings({ timeframe: earningsTimeframe }),
        contactService.getMyInquiries(),
        surplusService.getMySurplusListings()
      ]);

      if (profRes.status === 'fulfilled') {
        const f = profRes.value?.farmer;
        setProfile(f);
        if (f) {
          setProfileForm({
            farmName: f.farmName || '',
            native: f.native || '',
            state: f.state || 'Tamil Nadu',
            district: f.district || '',
            taluk: f.taluk || '',
            village: f.village || '',
            experience: f.experience || '',
            farmSize: f.farmSize || '',
            farmingType: f.farmingType || 'Organic',
            farmingPractices: f.farmingPractices || '',
            soilType: f.soilType || '',
            fertilizerUsed: f.fertilizerUsed || '',
            pestManagement: f.pestManagement || '',
            bio: f.bio || ''
          });
        }
      }
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value?.products || []);
      if (ordRes.status === 'fulfilled') setOrders(ordRes.value?.orders || []);
      if (bulkRes.status === 'fulfilled') setBulkOrders(bulkRes.value?.bulkOrders || []);
      if (earnRes.status === 'fulfilled') setEarnings(earnRes.value);
      if (inqRes.status === 'fulfilled') setInquiries(inqRes.value?.inquiries || []);
      if (surpRes.status === 'fulfilled') setSurplusListings(surpRes.value?.listings || []);
    } catch (e) {
      console.error('Error loading farmer data:', e);
    } finally {
      setLoad('data', false);
    }
  }, [user?.id, earningsTimeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Image Upload Handler
  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMsg('error', 'Please choose a valid photo (JPEG, PNG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showMsg('error', 'Image size is too large (maximum 8MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setImagePreview(dataUrl);
      setProductForm(p => ({ ...p, image: dataUrl }));
      showMsg('success', '📸 Crop photo attached successfully!');
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setImagePreview('');
    setProductForm(p => ({ ...p, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function applyCropPreset(preset) {
    setProductForm(prev => ({
      ...prev,
      name: preset.name,
      category: preset.category,
      unit: preset.unit,
      price: preset.price,
      farmingMethod: preset.method || 'Organic'
    }));
    showMsg('success', `Selected: ${preset.name} (${preset.category})`);
  }

  if (!user) {
    return (
      <div className="fd-access-denied">
        <span style={{ fontSize: '3.5rem' }}>🔒</span>
        <h2>Farmer Portal Login Required</h2>
        <p>Please log in with your registered farmer account to manage your farm and produce.</p>
        <Link to="/login" className="fh-btn-primary">Farmer Login</Link>
      </div>
    );
  }

  if (user.role !== 'farmer') {
    return (
      <div className="fd-access-denied">
        <span style={{ fontSize: '3.5rem' }}>🌾</span>
        <h2>Farmer Account Required</h2>
        <p>This dedicated hub is built for verified farmers and growers.</p>
        <Link to="/register" className="fh-btn-secondary">Register as a Verified Farmer</Link>
      </div>
    );
  }

  // ---- Action Handlers ----
  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      setLoad('profile', true);
      await farmerService.createOrUpdateProfile(profileForm);
      showMsg('success', '✅ Farm profile saved successfully!');
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to save farm profile.');
    } finally {
      setLoad('profile', false);
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    try {
      setLoad('product', true);
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        minimumOrderQuantity: Number(productForm.minimumOrderQuantity || 1),
        batchPricing: productForm.batchPricingMinQty ? [
          {
            minQuantity: Number(productForm.batchPricingMinQty),
            discountPercentage: Number(productForm.batchPricingDiscount || 0)
          }
        ] : []
      };

      if (editingProductId) {
        await farmerProductService.updateProduct(editingProductId, payload);
        showMsg('success', '✅ Harvest listing updated successfully!');
      } else {
        await farmerProductService.addProduct(payload);
        showMsg('success', '🎉 New harvest added to live catalog!');
      }

      setProductForm(EMPTY_PRODUCT);
      setImagePreview('');
      setEditingProductId(null);
      await loadData();
      setActiveTab('my-products');
    } catch (err) {
      showMsg('error', err.message || 'Failed to save harvest listing.');
    } finally {
      setLoad('product', false);
    }
  }

  function startEdit(product) {
    const tier = (product.batchPricing && product.batchPricing[0]) || {};
    setProductForm({
      name: product.name || '',
      category: product.category || 'Vegetables',
      price: product.price || '',
      unit: product.unit || 'kg',
      stock: product.stock !== undefined ? product.stock : '',
      harvestDate: product.harvestDate ? product.harvestDate.split('T')[0] : '',
      expectedAvailability: product.expectedAvailability || 'Available Today',
      minimumOrderQuantity: product.minimumOrderQuantity || 1,
      farmingMethod: product.farmingMethod || 'Organic',
      farmingPractices: product.farmingPractices || '',
      fertilizerUsed: product.fertilizerUsed || '',
      pesticide: product.pesticide || '',
      image: product.image || '',
      isSurplus: product.isSurplus || false,
      surplusPrice: product.surplusPrice || '',
      minBulkOrderQty: product.minBulkOrderQty || 10,
      description: product.description || '',
      status: product.status || 'active',
      batchPricingMinQty: tier.minQuantity || 10,
      batchPricingDiscount: tier.discountPercentage || 10
    });
    setImagePreview(product.image || '');
    setEditingProductId(product._id);
    setActiveTab('add-product');
  }

  async function handleToggleProductStatus(productId, currentStatus) {
    try {
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await farmerProductService.updateProductStatus(productId, nextStatus);
      showMsg('success', `Product ${nextStatus === 'active' ? 'activated' : 'paused'}.`);
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to update product status.');
    }
  }

  async function handleDeleteProduct(productId, name) {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await farmerProductService.deleteProduct(productId);
      showMsg('success', 'Harvest deleted.');
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      showMsg('error', err.message);
    }
  }

  async function handleAcceptOrder(orderId) {
    try {
      await farmerService.acceptOrder(orderId);
      showMsg('success', '✅ Order accepted! Please prepare and pack the harvest.');
      await loadData();
    } catch (err) {
      showMsg('error', err.message);
    }
  }

  async function handleRejectOrder(orderId) {
    if (!window.confirm('Reject this customer order?')) return;
    try {
      await farmerService.rejectOrder(orderId);
      showMsg('success', 'Order cancelled.');
      await loadData();
    } catch (err) {
      showMsg('error', err.message);
    }
  }

  async function handleBulkStatus(bulkOrderId, status) {
    try {
      await bulkOrderService.updateBulkOrderStatus(bulkOrderId, status);
      showMsg('success', `Bulk order ${status.toLowerCase()}.`);
      await loadData();
    } catch (err) {
      showMsg('error', err.message);
    }
  }

  async function handleRespondInquiry(inquiryId) {
    const text = replyText[inquiryId];
    if (!text || !text.trim()) {
      showMsg('error', 'Please write a message to the customer.');
      return;
    }
    try {
      await contactService.respondInquiry(inquiryId, text);
      showMsg('success', 'Reply sent to customer!');
      setReplyText(prev => ({ ...prev, [inquiryId]: '' }));
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to send reply.');
    }
  }

  async function handleCreateSurplus(e) {
    e.preventDefault();
    try {
      await surplusService.createSurplusListing(newSurplusForm);
      showMsg('success', '🎉 Surplus flash deal listed at discount!');
      setNewSurplusForm({
        productId: '',
        availableQuantity: '',
        offerPrice: '',
        minimumOrderQuantity: 5,
        offerNotes: '',
        offerEndDate: ''
      });
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to create surplus listing.');
    }
  }

  async function handleDeleteSurplus(id) {
    try {
      await surplusService.deleteSurplusListing(id);
      showMsg('success', 'Surplus listing removed.');
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to delete listing.');
    }
  }

  const pendingOrders = orders.filter(o => o.orderStatus === 'Placed' || o.orderStatus === 'Farmer Accepted').length;
  const totalEarned = earnings?.totalEarnings || orders.filter(o => o.orderStatus === 'Delivered').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingInquiries = inquiries.filter(i => i.status === 'pending').length;

  const navItems = [
    { key: 'overview', icon: '🏡', label: 'Overview', sub: 'முகப்பு' },
    { key: 'my-products', icon: '🌾', label: `My Harvests (${products.length})`, sub: 'விளைச்சல்கள்' },
    { key: 'add-product', icon: '➕', label: editingProductId ? 'Edit Harvest' : 'Add Harvest', sub: 'பயிர் சேர்க்க' },
    { key: 'orders', icon: '📦', label: `Orders (${orders.length})`, sub: 'ஆர்டர்கள்', badge: pendingOrders > 0 ? pendingOrders : null },
    { key: 'bulk-orders', icon: '🏢', label: `Bulk / B2B (${bulkOrders.length})`, sub: 'மொத்த வியாபாரம்' },
    { key: 'inquiries', icon: '💬', label: `Buyer Inquiries (${pendingInquiries})`, sub: 'கேள்விகள்', badge: pendingInquiries > 0 ? pendingInquiries : null },
    { key: 'surplus', icon: '♻️', label: `Surplus Deals (${surplusListings.length})`, sub: 'உபரி விற்பனை' },
    { key: 'earnings', icon: '💰', label: 'Income & Payouts', sub: 'வருமானம்' },
    { key: 'profile', icon: '🚜', label: 'Farm Profile', sub: 'பண்ணை விவரம்' }
  ];

  return (
    <div className="fd-page">
      {/* Farmer Hub Hero Banner */}
      <div className="fd-top-banner">
        <div className="fd-top-banner-content">
          <div className="fd-farmer-avatar">🌾</div>
          <div className="fd-farmer-identity">
            <div className="fd-banner-pill">
              <span>✅ Certified Farm Producer</span>
              <span className="fd-loc-tag">📍 {profile?.district || 'Erode'}, Tamil Nadu</span>
            </div>
            <h1>வணக்கம், {profile?.farmName || user.name || 'Farmer'}!</h1>
            <p>Direct farm-gate access · 82%+ guaranteed payout to your bank · Zero middleman cut</p>
          </div>
          <div className="fd-helpline-box">
            <span className="fd-help-icon">📞</span>
            <div>
              <span className="fd-help-title">Farmer Support Desk</span>
              <strong>1800-419-FARM</strong>
              <small>7 AM – 8 PM (Tamil / English)</small>
            </div>
          </div>
        </div>
      </div>

      <div className="fd-shell">
        {/* Sidebar Nav */}
        <aside className="fd-sidebar">
          <div className="fd-sidebar-title">விவசாயி மையம் · Farmer Portal</div>
          <nav className="fd-nav-list">
            {navItems.map(item => (
              <button
                key={item.key}
                type="button"
                className={`fd-nav-btn ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.key);
                  if (item.key !== 'add-product') {
                    setEditingProductId(null);
                    setProductForm(EMPTY_PRODUCT);
                    setImagePreview('');
                  }
                }}
              >
                <span className="fd-nav-icon">{item.icon}</span>
                <div className="fd-nav-text">
                  <span className="fd-nav-main">{item.label}</span>
                  <span className="fd-nav-sub">{item.sub}</span>
                </div>
                {item.badge && <span className="fd-nav-counter">{item.badge}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="fd-main">
          {msg.text && (
            <div className={`fd-alert ${msg.type === 'success' ? 'fd-alert-success' : 'fd-alert-error'}`}>
              <span className="fd-alert-icon">{msg.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{msg.text}</span>
            </div>
          )}

          {/* ── 1. OVERVIEW TAB ─────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="fd-tab-pane">
              {/* Quick Actions Bar */}
              <div className="fd-quick-actions-bar">
                <button
                  type="button"
                  className="fd-quick-card fd-qc-add"
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm(EMPTY_PRODUCT);
                    setImagePreview('');
                    setActiveTab('add-product');
                  }}
                >
                  <span className="fd-qc-icon">➕</span>
                  <div>
                    <strong>Add New Harvest</strong>
                    <span>புதிய விளைச்சல் பதிவு செய்க</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="fd-quick-card fd-qc-orders"
                  onClick={() => setActiveTab('orders')}
                >
                  <span className="fd-qc-icon">📦</span>
                  <div>
                    <strong>View Customer Orders</strong>
                    <span>{pendingOrders} orders awaiting pack/dispatch</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="fd-quick-card fd-qc-payout"
                  onClick={() => setActiveTab('earnings')}
                >
                  <span className="fd-qc-icon">💰</span>
                  <div>
                    <strong>My Payouts & Income</strong>
                    <span>₹{(totalEarned || 0).toLocaleString('en-IN')} Earned</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="fd-quick-card fd-qc-surplus"
                  onClick={() => setActiveTab('surplus')}
                >
                  <span className="fd-qc-icon">♻️</span>
                  <div>
                    <strong>Sell Surplus Produce</strong>
                    <span>உபரி விளைச்சல் தள்ளுபடி விற்பனை</span>
                  </div>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="fd-stats-grid">
                <div className="fd-stat-card">
                  <div className="fd-stat-header">
                    <span className="fd-stat-icon">🌾</span>
                    <span className="fd-stat-badge green">Live</span>
                  </div>
                  <span className="fd-stat-label">Listed Harvests / விளைச்சல்</span>
                  <span className="fd-stat-value">{products.length} Items</span>
                </div>

                <div className="fd-stat-card">
                  <div className="fd-stat-header">
                    <span className="fd-stat-icon">📦</span>
                    <span className={`fd-stat-badge ${pendingOrders > 0 ? 'orange' : 'gray'}`}>
                      {pendingOrders > 0 ? `${pendingOrders} Pending` : 'All Clear'}
                    </span>
                  </div>
                  <span className="fd-stat-label">Active Orders / ஆர்டர்கள்</span>
                  <span className="fd-stat-value">{orders.length} Total</span>
                </div>

                <div className="fd-stat-card">
                  <div className="fd-stat-header">
                    <span className="fd-stat-icon">💰</span>
                    <span className="fd-stat-badge green">82% Share</span>
                  </div>
                  <span className="fd-stat-label">Total Earnings / மொத்த வருமானம்</span>
                  <span className="fd-stat-value">₹{(totalEarned || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="fd-stat-card">
                  <div className="fd-stat-header">
                    <span className="fd-stat-icon">💬</span>
                    <span className="fd-stat-badge blue">{pendingInquiries} New</span>
                  </div>
                  <span className="fd-stat-label">Direct Inquiries / கேள்விகள்</span>
                  <span className="fd-stat-value">{inquiries.length} Total</span>
                </div>
              </div>

              {/* Orders Requiring Action */}
              <div className="fd-card-box">
                <div className="fd-box-header">
                  <div>
                    <h3>📦 Immediate Orders to Pack & Dispatch</h3>
                    <p>Orders placed by consumers that need your acceptance and packing</p>
                  </div>
                  <button type="button" className="fd-btn-outline" onClick={() => setActiveTab('orders')}>
                    View All Orders →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="fd-empty-state">
                    <span style={{ fontSize: '3rem' }}>🌱</span>
                    <h4>No orders waiting right now</h4>
                    <p>When buyers order your fresh crops, they will appear here with one-click packing confirmation.</p>
                  </div>
                ) : (
                  <div className="fd-table-container">
                    <table className="fd-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer & Phone</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Quick Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 6).map(o => (
                          <tr key={o._id}>
                            <td>
                              <strong className="fd-order-code">{o.orderId}</strong>
                              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                                {new Date(o.createdAt).toLocaleDateString('en-IN')}
                              </div>
                            </td>
                            <td>
                              <strong>{o.customerName}</strong>
                              <div>
                                <a href={`tel:${o.customerPhone}`} className="fd-phone-link">
                                  📞 {o.customerPhone || 'Call Customer'}
                                </a>
                              </div>
                            </td>
                            <td>
                              <span className="fd-items-summary">
                                {(o.items || []).map(i => `${i.name} (${i.quantity})`).join(', ')}
                              </span>
                            </td>
                            <td>
                              <strong className="fd-price-text">₹{o.totalAmount?.toLocaleString('en-IN')}</strong>
                            </td>
                            <td>
                              <StatusBadge status={o.orderStatus} />
                            </td>
                            <td>
                              {o.orderStatus === 'Placed' && (
                                <button
                                  type="button"
                                  className="fd-btn-primary-sm"
                                  onClick={() => handleAcceptOrder(o._id)}
                                >
                                  ✅ Accept Order
                                </button>
                              )}
                              {o.orderStatus === 'Farmer Accepted' && (
                                <span className="fd-tag-prep">📦 Ready for Packing</span>
                              )}
                              {o.orderStatus === 'Delivered' && (
                                <span className="fd-tag-done">✓ Completed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 2. ADD / EDIT HARVEST TAB ──────────────────────── */}
          {activeTab === 'add-product' && (
            <div className="fd-tab-pane">
              <div className="fd-form-header">
                <div>
                  <h2>{editingProductId ? '✏️ Edit Harvest Details' : '➕ List New Fresh Harvest (புதிய விளைச்சல் பதிவு)'}</h2>
                  <p>Add your harvested produce directly so customers and bulk buyers can purchase at fair farm-gate rates.</p>
                </div>
                {editingProductId && (
                  <button
                    type="button"
                    className="fd-btn-outline"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm(EMPTY_PRODUCT);
                      setImagePreview('');
                      setActiveTab('my-products');
                    }}
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {/* Fast Preset Selector */}
              <div className="fd-presets-card">
                <div className="fd-presets-title">
                  <span>⚡ Quick Select Produce (விரைவு பயிர் தேர்வு)</span>
                  <small>Tap any crop below to auto-fill details:</small>
                </div>
                <div className="fd-presets-grid">
                  {CROP_PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      className="fd-preset-chip"
                      onClick={() => applyCropPreset(p)}
                    >
                      <span className="fd-chip-icon">{p.icon}</span>
                      <span className="fd-chip-label">{p.name.split('(')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Card */}
              <form onSubmit={handleAddProduct} className="fd-form-card">
                {/* 1. Basic Details */}
                <div className="fd-form-section">
                  <h3 className="fd-form-sec-title">1. Crop Information · பயிர் தகவல்கள்</h3>

                  <div className="fd-grid-2">
                    <div className="fd-field">
                      <label>Produce Name (பயிர் பெயர்) *</label>
                      <input
                        type="text"
                        required
                        className="fd-input"
                        placeholder="e.g. Country Tomatoes (நாட்டு தக்காளி)"
                        value={productForm.name}
                        onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>

                    <div className="fd-field">
                      <label>Category (பிரிவு) *</label>
                      <select
                        className="fd-input"
                        value={productForm.category}
                        onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.name} value={c.name}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="fd-grid-3">
                    <div className="fd-field">
                      <label>Price in Rupees (விலை ₹) *</label>
                      <div className="fd-input-addon">
                        <span>₹</span>
                        <input
                          type="number"
                          min="0"
                          required
                          className="fd-input"
                          placeholder="e.g. 38"
                          value={productForm.price}
                          onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="fd-field">
                      <label>Per Unit (அளவை)</label>
                      <select
                        className="fd-input"
                        value={productForm.unit}
                        onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}
                      >
                        <option value="kg">kg (கிலோ)</option>
                        <option value="bunch">bunch (கட்டு)</option>
                        <option value="dozen">dozen (டஜன்)</option>
                        <option value="litre">litre (லிட்டர்)</option>
                        <option value="piece">piece (எண்ணிக்கை)</option>
                        <option value="500g">500 grams</option>
                      </select>
                    </div>

                    <div className="fd-field">
                      <label>Available Quantity (கையிருப்பு) *</label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="fd-input"
                        placeholder="e.g. 50"
                        value={productForm.stock}
                        onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Photo Upload Section */}
                <div className="fd-form-section">
                  <h3 className="fd-form-sec-title">2. Crop Photo · புகைப்பட பதிவேற்றம்</h3>
                  <p className="fd-form-sec-sub">
                    💡 Farmers who upload real photos from their farm receive 3x more orders!
                  </p>

                  <div className="fd-photo-upload-box">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handlePhotoSelect}
                    />

                    <div className="fd-upload-left">
                      <button
                        type="button"
                        className="fd-btn-photo-upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span style={{ fontSize: '1.4rem' }}>📷</span>
                        <span>Take Photo with Camera / Choose from Gallery</span>
                      </button>
                      <small style={{ color: '#6b7280' }}>
                        Supports JPG, PNG, WEBP from your phone camera or gallery.
                      </small>
                    </div>

                    {/* Preview Box */}
                    <div className="fd-photo-preview-wrap">
                      {imagePreview || productForm.image ? (
                        <div className="fd-preview-card">
                          <img
                            src={imagePreview || productForm.image}
                            alt="Crop Preview"
                            className="fd-preview-img"
                          />
                          <div className="fd-preview-actions">
                            <span className="fd-tag-photo-ready">✓ Photo Ready</span>
                            <button
                              type="button"
                              className="fd-btn-remove-photo"
                              onClick={handleRemovePhoto}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="fd-no-photo-box">
                          <span style={{ fontSize: '2.5rem' }}>🌿</span>
                          <span>No photo attached yet.</span>
                          <small>Tap the button to snap a photo</small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="fd-field" style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      Or enter Image Web URL (Optional):
                    </label>
                    <input
                      type="text"
                      className="fd-input"
                      placeholder="https://..."
                      value={productForm.image}
                      onChange={e => {
                        setProductForm(p => ({ ...p, image: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {/* 3. Harvest Freshness & Practices */}
                <div className="fd-form-section">
                  <h3 className="fd-form-sec-title">3. Harvest Date & Farming Method · அறுவடை & முறை</h3>

                  <div className="fd-grid-2">
                    <div className="fd-field">
                      <div className="fd-label-row">
                        <label>Harvest Date (அறுவடை தேதி)</label>
                        <button
                          type="button"
                          className="fd-btn-text-action"
                          onClick={() => setProductForm(p => ({ ...p, harvestDate: new Date().toISOString().split('T')[0] }))}
                        >
                          🌱 Picked Today!
                        </button>
                      </div>
                      <input
                        type="date"
                        className="fd-input"
                        value={productForm.harvestDate}
                        onChange={e => setProductForm(p => ({ ...p, harvestDate: e.target.value }))}
                      />
                    </div>

                    <div className="fd-field">
                      <label>Expected Freshness Window</label>
                      <input
                        type="text"
                        className="fd-input"
                        placeholder="e.g. Fresh for 4-5 days"
                        value={productForm.expectedAvailability}
                        onChange={e => setProductForm(p => ({ ...p, expectedAvailability: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="fd-field">
                    <label>Farming Method (சாகுபடி முறை) *</label>
                    <div className="fd-method-grid">
                      {FARMING_METHODS.map(m => (
                        <label
                          key={m.value}
                          className={`fd-method-card ${productForm.farmingMethod === m.value ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="farmingMethod"
                            value={m.value}
                            checked={productForm.farmingMethod === m.value}
                            onChange={() => setProductForm(p => ({ ...p, farmingMethod: m.value }))}
                          />
                          <div className="fd-method-info">
                            <strong>{m.label}</strong>
                            <span>{m.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="fd-grid-2" style={{ marginTop: '12px' }}>
                    <div className="fd-field">
                      <label>Natural Fertilizers Used (இயற்கை உரம்)</label>
                      <input
                        type="text"
                        className="fd-input"
                        placeholder="e.g. Vermicompost, Cow dung manure, Panchagavya"
                        value={productForm.fertilizerUsed}
                        onChange={e => setProductForm(p => ({ ...p, fertilizerUsed: e.target.value }))}
                      />
                    </div>

                    <div className="fd-field">
                      <label>Pest Management (பூச்சி மேலாண்மை)</label>
                      <input
                        type="text"
                        className="fd-input"
                        placeholder="e.g. Neem oil spray, yellow sticky traps"
                        value={productForm.pesticide}
                        onChange={e => setProductForm(p => ({ ...p, pesticide: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="fd-field" style={{ marginTop: '12px' }}>
                    <label>Produce Description / Note for Consumers</label>
                    <textarea
                      rows={3}
                      className="fd-textarea"
                      placeholder="Describe the freshness, taste, and special care given to this harvest..."
                      value={productForm.description}
                      onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                </div>

                {/* 4. Wholesale / Bulk Tier Discounts (Optional) */}
                <div className="fd-form-section">
                  <h3 className="fd-form-sec-title">4. Wholesale & Surplus Discounts (Optional)</h3>
                  <div className="fd-bulk-tier-box">
                    <div className="fd-grid-2">
                      <div className="fd-field">
                        <label>Wholesale Bulk Tier (Min Order Qty)</label>
                        <input
                          type="number"
                          min="1"
                          className="fd-input"
                          placeholder="e.g. 10 kg"
                          value={productForm.batchPricingMinQty}
                          onChange={e => setProductForm(p => ({ ...p, batchPricingMinQty: e.target.value }))}
                        />
                      </div>
                      <div className="fd-field">
                        <label>Bulk Buyer Discount (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          className="fd-input"
                          placeholder="e.g. 10%"
                          value={productForm.batchPricingDiscount}
                          onChange={e => setProductForm(p => ({ ...p, batchPricingDiscount: e.target.value }))}
                        />
                      </div>
                    </div>

                    <label className="fd-checkbox-row">
                      <input
                        type="checkbox"
                        checked={productForm.isSurplus}
                        onChange={e => setProductForm(p => ({ ...p, isSurplus: e.target.checked }))}
                      />
                      <span>♻️ Also list as Surplus / Anti-Waste Deal at discounted rate</span>
                    </label>

                    {productForm.isSurplus && (
                      <div className="fd-grid-2" style={{ marginTop: '10px' }}>
                        <div className="fd-field">
                          <label>Special Surplus Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            className="fd-input"
                            placeholder="Discounted clearance rate"
                            value={productForm.surplusPrice}
                            onChange={e => setProductForm(p => ({ ...p, surplusPrice: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Row */}
                <div className="fd-form-submit-row">
                  <button
                    type="submit"
                    className="fd-btn-submit-large"
                    disabled={loading.product}
                  >
                    {loading.product ? 'Saving Harvest...' : (editingProductId ? '✅ Update Harvest Listing' : '🚀 Publish Harvest to Consumers')}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      className="fd-btn-outline"
                      onClick={() => {
                        setEditingProductId(null);
                        setProductForm(EMPTY_PRODUCT);
                        setImagePreview('');
                        setActiveTab('my-products');
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ── 3. MY PRODUCTS / HARVESTS TAB ──────────────────── */}
          {activeTab === 'my-products' && (
            <div className="fd-tab-pane">
              <div className="fd-box-header">
                <div>
                  <h2>🌾 My Listed Harvests ({products.length})</h2>
                  <p>All active crops currently available for consumers across Tamil Nadu</p>
                </div>
                <button
                  type="button"
                  className="fd-btn-primary"
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm(EMPTY_PRODUCT);
                    setImagePreview('');
                    setActiveTab('add-product');
                  }}
                >
                  ➕ Add New Harvest
                </button>
              </div>

              {products.length === 0 ? (
                <div className="fd-empty-state">
                  <span style={{ fontSize: '3rem' }}>🌾</span>
                  <h4>No produce listed yet</h4>
                  <p>Start listing your fresh farm harvests so local buyers and businesses can order directly!</p>
                  <button
                    type="button"
                    className="fd-btn-primary"
                    style={{ marginTop: '12px' }}
                    onClick={() => setActiveTab('add-product')}
                  >
                    Add Your First Crop
                  </button>
                </div>
              ) : (
                <div className="fd-crops-grid">
                  {products.map(p => {
                    const isInactive = p.status === 'inactive';
                    const isOutOfStock = p.stock === 0 || p.status === 'out_of_stock';

                    return (
                      <div key={p._id} className={`fd-crop-card ${isInactive ? 'inactive' : ''}`}>
                        <div className="fd-crop-media">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="fd-crop-img" />
                          ) : (
                            <div className="fd-crop-no-img">
                              <span>🌱</span>
                              <small>{p.category}</small>
                            </div>
                          )}
                          <span className={`fd-crop-pill ${isOutOfStock ? 'out' : (isInactive ? 'paused' : 'live')}`}>
                            {isOutOfStock ? 'Out of Stock' : (isInactive ? 'Paused' : 'Live on Store')}
                          </span>
                        </div>

                        <div className="fd-crop-body">
                          <span className="fd-crop-cat">{p.category}</span>
                          <h4 className="fd-crop-title">{p.name}</h4>

                          <div className="fd-crop-price-row">
                            <span className="fd-crop-price">₹{p.price} <small>/{p.unit}</small></span>
                            <span className="fd-crop-stock">📦 {p.stock} {p.unit} in stock</span>
                          </div>

                          <div className="fd-crop-meta-row">
                            <span>🌱 {p.farmingMethod || 'Organic'}</span>
                            {p.harvestDate && (
                              <span>📅 Picked: {new Date(p.harvestDate).toLocaleDateString('en-IN')}</span>
                            )}
                          </div>

                          <div className="fd-crop-actions">
                            <button
                              type="button"
                              className="fd-btn-edit-sm"
                              onClick={() => startEdit(p)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className="fd-btn-toggle-sm"
                              onClick={() => handleToggleProductStatus(p._id, p.status || 'active')}
                            >
                              {p.status === 'active' ? '⏸ Pause' : '▶ Activate'}
                            </button>
                            <button
                              type="button"
                              className="fd-btn-del-sm"
                              title="Delete"
                              onClick={() => handleDeleteProduct(p._id, p.name)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 4. CUSTOMER ORDERS TAB ─────────────────────────── */}
          {activeTab === 'orders' && (
            <div className="fd-tab-pane">
              <div className="fd-box-header">
                <div>
                  <h2>📋 Customer Orders ({orders.length})</h2>
                  <p>Orders from household consumers requiring packing and fleet dispatch</p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="fd-empty-state">
                  <span style={{ fontSize: '3rem' }}>📦</span>
                  <h4>No customer orders received yet</h4>
                  <p>When buyers order your crops, they will appear here with customer contact details.</p>
                </div>
              ) : (
                <div className="fd-orders-list">
                  {orders.map(o => (
                    <div key={o._id} className="fd-order-card">
                      <div className="fd-order-card-header">
                        <div>
                          <strong className="fd-order-id-badge">{o.orderId}</strong>
                          <span className="fd-order-date">Placed: {new Date(o.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <StatusBadge status={o.orderStatus} />
                      </div>

                      <div className="fd-order-grid">
                        <div className="fd-order-customer">
                          <span className="fd-sec-label">Customer Details:</span>
                          <strong>👤 {o.customerName}</strong>
                          <a href={`tel:${o.customerPhone}`} className="fd-phone-call-btn">
                            📞 Call Customer: {o.customerPhone || 'Not provided'}
                          </a>
                          <p className="fd-order-addr">📍 {o.shippingAddress?.address || 'Erode'}</p>
                        </div>

                        <div className="fd-order-items-col">
                          <span className="fd-sec-label">Harvest Items to Pack:</span>
                          <ul className="fd-items-list">
                            {(o.items || []).map((item, idx) => (
                              <li key={idx}>
                                <span>{item.name}</span>
                                <strong>× {item.quantity}</strong>
                                <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="fd-order-summary-col">
                          <span className="fd-sec-label">Payout Amount:</span>
                          <span className="fd-order-total-val">₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                          <small style={{ color: '#166534', fontWeight: 600 }}>✓ 82% Direct Payout Secured</small>

                          <div className="fd-order-action-btns">
                            {o.orderStatus === 'Placed' && (
                              <button
                                type="button"
                                className="fd-btn-accept-order"
                                onClick={() => handleAcceptOrder(o._id)}
                              >
                                ✅ Accept & Prepare Order
                              </button>
                            )}
                            {o.orderStatus === 'Farmer Accepted' && (
                              <div className="fd-status-info-box">
                                <span>📦 Order Accepted</span>
                                <small>Please pack crops for delivery fleet pickup</small>
                              </div>
                            )}
                            {o.orderStatus === 'Delivered' && (
                              <span className="fd-delivered-badge">🎉 Delivered Successfully</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 5. BULK ORDERS TAB ─────────────────────────────── */}
          {activeTab === 'bulk-orders' && (
            <div className="fd-tab-pane">
              <div className="fd-box-header">
                <div>
                  <h2>🏢 Bulk & B2B Inquiries ({bulkOrders.length})</h2>
                  <p>Inquiries from restaurants, cafes, and bulk institutional buyers</p>
                </div>
              </div>

              {bulkOrders.length === 0 ? (
                <div className="fd-empty-state">
                  <span style={{ fontSize: '3rem' }}>🏢</span>
                  <h4>No bulk B2B requests yet</h4>
                  <p>Bulk orders from restaurants and supermarkets in your area will be listed here.</p>
                </div>
              ) : (
                <div className="fd-table-container">
                  <table className="fd-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Buyer & Business</th>
                        <th>Required Produce</th>
                        <th>Target Qty</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkOrders.map(b => (
                        <tr key={b._id}>
                          <td><strong>{b.orderId || b._id}</strong></td>
                          <td>
                            <strong>{b.buyerName || b.businessName || 'Business Buyer'}</strong>
                            <div>{b.buyerPhone && <a href={`tel:${b.buyerPhone}`}>📞 {b.buyerPhone}</a>}</div>
                          </td>
                          <td>{b.produceName || b.category}</td>
                          <td><strong>{b.requiredQuantity} {b.unit || 'kg'}</strong></td>
                          <td><StatusBadge status={b.status} /></td>
                          <td>
                            {b.status === 'Requested' && (
                              <div className="fd-action-row">
                                <button
                                  type="button"
                                  className="fd-btn-accept"
                                  onClick={() => handleBulkStatus(b._id, 'Accepted')}
                                >
                                  Accept Deal
                                </button>
                                <button
                                  type="button"
                                  className="fd-btn-reject"
                                  onClick={() => handleBulkStatus(b._id, 'Rejected')}
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── 6. DIRECT BUYER CHAT / INQUIRIES ────────────────── */}
          {activeTab === 'inquiries' && (
            <div className="fd-tab-pane">
              <div className="fd-box-header">
                <div>
                  <h2>💬 Direct Buyer Messages ({inquiries.length})</h2>
                  <p>Customer inquiries about harvests, customized orders, and farming methods</p>
                </div>
              </div>

              {inquiries.length === 0 ? (
                <div className="fd-empty-state">
                  <span style={{ fontSize: '3rem' }}>💬</span>
                  <h4>No customer messages at this time</h4>
                  <p>When buyers ask questions from your profile or produce pages, you can reply directly here.</p>
                </div>
              ) : (
                <div className="fd-inquiries-list">
                  {inquiries.map(inq => (
                    <div key={inq._id} className="fd-inquiry-card">
                      <div className="fd-inquiry-header">
                        <div>
                          <strong>👤 {inq.senderName || 'Interested Customer'}</strong>
                          <span className="fd-inquiry-date">{new Date(inq.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <span className={`fd-status ${inq.status === 'responded' ? 'fd-status-delivered' : 'fd-status-pending'}`}>
                          {inq.status === 'responded' ? '✓ Responded' : 'Pending Reply'}
                        </span>
                      </div>

                      <div className="fd-inquiry-body">
                        <p className="fd-inquiry-msg">"{inq.message}"</p>
                        {inq.senderEmail && (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            Email: {inq.senderEmail} {inq.senderPhone && ` · Phone: ${inq.senderPhone}`}
                          </div>
                        )}

                        {inq.response ? (
                          <div className="fd-response-box">
                            <strong>Your Reply:</strong>
                            <p>{inq.response}</p>
                          </div>
                        ) : (
                          <div className="fd-reply-box">
                            <textarea
                              rows={2}
                              className="fd-textarea"
                              placeholder="Write your response to the buyer..."
                              value={replyText[inq._id] || ''}
                              onChange={e => setReplyText({ ...replyText, [inq._id]: e.target.value })}
                            />
                            <button
                              type="button"
                              className="fd-btn-reply"
                              onClick={() => handleRespondInquiry(inq._id)}
                            >
                              Send Reply 📤
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 7. SURPLUS FLASH DEALS ──────────────────────────── */}
          {activeTab === 'surplus' && (
            <div className="fd-tab-pane">
              <div className="fd-box-header">
                <div>
                  <h2>♻️ Surplus & Anti-Waste Listings ({surplusListings.length})</h2>
                  <p>Prevent harvest waste by listing unsold crops at 15–40% discounts for immediate clearance</p>
                </div>
              </div>

              {/* Create Surplus Deal */}
              <form onSubmit={handleCreateSurplus} className="fd-form-card" style={{ marginBottom: '24px' }}>
                <h3 className="fd-form-sec-title">Post New Surplus Flash Deal</h3>
                <div className="fd-grid-3">
                  <div className="fd-field">
                    <label>Select Your Harvest Crop *</label>
                    <select
                      required
                      className="fd-input"
                      value={newSurplusForm.productId}
                      onChange={e => setNewSurplusForm({ ...newSurplusForm, productId: e.target.value })}
                    >
                      <option value="">-- Choose Crop --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name} (₹{p.price}/{p.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="fd-field">
                    <label>Surplus Quantity Available (kg) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="fd-input"
                      placeholder="e.g. 30"
                      value={newSurplusForm.availableQuantity}
                      onChange={e => setNewSurplusForm({ ...newSurplusForm, availableQuantity: e.target.value })}
                    />
                  </div>

                  <div className="fd-field">
                    <label>Discounted Clearance Price (₹/kg) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="fd-input"
                      placeholder="e.g. 24"
                      value={newSurplusForm.offerPrice}
                      onChange={e => setNewSurplusForm({ ...newSurplusForm, offerPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="fd-field" style={{ marginTop: '12px' }}>
                  <label>Deal Notes for Buyers</label>
                  <input
                    type="text"
                    className="fd-input"
                    placeholder="e.g. Harvested yesterday morning, perfect for hotels or large families"
                    value={newSurplusForm.offerNotes}
                    onChange={e => setNewSurplusForm({ ...newSurplusForm, offerNotes: e.target.value })}
                  />
                </div>

                <button type="submit" className="fd-btn-primary" style={{ marginTop: '14px' }}>
                  🚀 Launch Surplus Deal
                </button>
              </form>

              {/* Surplus Listings List */}
              {surplusListings.length === 0 ? (
                <div className="fd-empty-state">
                  <span style={{ fontSize: '3rem' }}>♻️</span>
                  <h4>No active surplus deals</h4>
                  <p>List unsold high-yield crops to reduce food waste and earn immediate returns.</p>
                </div>
              ) : (
                <div className="fd-table-container">
                  <table className="fd-table">
                    <thead>
                      <tr>
                        <th>Produce</th>
                        <th>Clearance Price</th>
                        <th>Available Qty</th>
                        <th>Expires On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusListings.map(s => (
                        <tr key={s._id}>
                          <td><strong>{s.productName || s.productId?.name}</strong></td>
                          <td><strong style={{ color: '#dc2626' }}>₹{s.offerPrice} / kg</strong></td>
                          <td>{s.availableQuantity} kg</td>
                          <td>{s.offerEndDate ? new Date(s.offerEndDate).toLocaleDateString('en-IN') : 'Open'}</td>
                          <td>
                            <button
                              type="button"
                              className="fd-btn-del-sm"
                              onClick={() => handleDeleteSurplus(s._id)}
                            >
                              Remove Deal
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── 8. EARNINGS & PAYOUTS TAB ───────────────────────── */}
          {activeTab === 'earnings' && (
            <div className="fd-tab-pane">
              <div className="fd-box-header">
                <div>
                  <h2>💰 Farmer Earnings & Direct Payouts</h2>
                  <p>Guaranteed 82%+ farm-gate payout transparently reconciled on every delivery</p>
                </div>
                <div className="fd-timeframe-selector">
                  {['all', 'monthly', 'weekly'].map(tf => (
                    <button
                      key={tf}
                      type="button"
                      className={`fd-tf-btn ${earningsTimeframe === tf ? 'active' : ''}`}
                      onClick={() => setEarningsTimeframe(tf)}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fd-earnings-grid">
                <div className="fd-earning-card primary">
                  <span className="fd-ec-label">Total Realized Revenue</span>
                  <span className="fd-ec-val">₹{(earnings?.totalEarnings || totalEarned || 0).toLocaleString('en-IN')}</span>
                  <span className="fd-ec-sub">Directly remitted to farm bank account</span>
                </div>

                <div className="fd-earning-card">
                  <span className="fd-ec-label">Delivered Orders</span>
                  <span className="fd-ec-val">
                    {orders.filter(o => o.orderStatus === 'Delivered').length} Orders
                  </span>
                  <span className="fd-ec-sub">100% verified fulfillment</span>
                </div>

                <div className="fd-earning-card">
                  <span className="fd-ec-label">Direct Farm Share</span>
                  <span className="fd-ec-val">82%</span>
                  <span className="fd-ec-sub">Zero middleman deductions</span>
                </div>

                <div className="fd-earning-card">
                  <span className="fd-ec-label">Pending Processing</span>
                  <span className="fd-ec-val">
                    ₹{orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')}
                  </span>
                  <span className="fd-ec-sub">Dispatched / in transit</span>
                </div>
              </div>
            </div>
          )}

          {/* ── 9. FARM PROFILE TAB ────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="fd-tab-pane">
              <div className="fd-box-header">
                <div>
                  <h2>🚜 Farm Profile & Credentials · பண்ணை சுயவிவரம்</h2>
                  <p>Your verified farm story shown to conscious consumers across Tamil Nadu</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="fd-form-card">
                <div className="fd-grid-2">
                  <div className="fd-field">
                    <label>Farm Name (பண்ணை பெயர்) *</label>
                    <input
                      type="text"
                      required
                      className="fd-input"
                      placeholder="e.g. Ramasamy Natural Farms"
                      value={profileForm.farmName}
                      onChange={e => setProfileForm({ ...profileForm, farmName: e.target.value })}
                    />
                  </div>

                  <div className="fd-field">
                    <label>District (மாவட்டம்) *</label>
                    <input
                      type="text"
                      required
                      className="fd-input"
                      placeholder="e.g. Erode / Coimbatore / Thanjavur"
                      value={profileForm.district}
                      onChange={e => setProfileForm({ ...profileForm, district: e.target.value })}
                    />
                  </div>
                </div>

                <div className="fd-grid-3">
                  <div className="fd-field">
                    <label>Village / Taluk (கிராமம்)</label>
                    <input
                      type="text"
                      className="fd-input"
                      placeholder="e.g. Perundurai"
                      value={profileForm.village}
                      onChange={e => setProfileForm({ ...profileForm, village: e.target.value })}
                    />
                  </div>

                  <div className="fd-field">
                    <label>Years of Farming Experience</label>
                    <input
                      type="text"
                      className="fd-input"
                      placeholder="e.g. 18 years"
                      value={profileForm.experience}
                      onChange={e => setProfileForm({ ...profileForm, experience: e.target.value })}
                    />
                  </div>

                  <div className="fd-field">
                    <label>Farm Size (Acres / ஏக்கர்)</label>
                    <input
                      type="text"
                      className="fd-input"
                      placeholder="e.g. 6 Acres"
                      value={profileForm.farmSize}
                      onChange={e => setProfileForm({ ...profileForm, farmSize: e.target.value })}
                    />
                  </div>
                </div>

                <div className="fd-field">
                  <label>Farm Story / Bio for Buyers (பண்ணை அறிமுகம்)</label>
                  <textarea
                    rows={4}
                    className="fd-textarea"
                    placeholder="Tell buyers about your family farming heritage, soil health methods, and commitment to pesticide-free agriculture..."
                    value={profileForm.bio}
                    onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="fd-btn-submit-large"
                  disabled={loading.profile}
                >
                  {loading.profile ? 'Saving Profile...' : '💾 Save Farm Profile & Certifications'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
