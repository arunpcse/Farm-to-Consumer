import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, farmerService, farmerProductService, bulkOrderService, contactService, surplusService } from '../services/api';
import './FarmerDashboard.css';

const ORDER_STATUS_FLOW = ['Placed', 'Farmer Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];
const CATEGORIES = ['Vegetables', 'Fruits', 'Grains & Pulses', 'Dairy & Organic', 'Herbs & Spices'];
const FARMING_METHODS = ['Organic', 'Natural', 'Conventional', 'Mixed'];

const EMPTY_PRODUCT = {
  name: '', category: 'Vegetables', price: '', unit: 'kg', stock: '',
  harvestDate: '', expectedAvailability: '', minimumOrderQuantity: 1,
  farmingMethod: 'Organic', farmingPractices: '',
  fertilizerUsed: '', pesticide: '', image: '',
  isSurplus: false, surplusPrice: '', minBulkOrderQty: 10, description: '',
  status: 'active',
  batchPricingMinQty: 10, batchPricingDiscount: 10
};

function StatusBadge({ status }) {
  const cls = `fd-status fd-status-${(status || '').toLowerCase().replace(/\s+/g, '-').replace('farmer-accepted','accepted').replace('ready-for-pickup','ready').replace('out-for-delivery','delivered')}`;
  return <span className={cls}>{status}</span>;
}

export default function FarmerDashboard() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
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
    productId: '', availableQuantity: '', offerPrice: '', minimumOrderQuantity: 5,
    offerNotes: '', offerEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // UI states
  const [loading, setLoading] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState(null);
  const [profileForm, setProfileForm] = useState({
    farmName: '', native: '', state: 'Tamil Nadu', district: '', taluk: '', village: '',
    experience: '', farmSize: '', farmingType: 'Mixed', farmingPractices: '',
    soilType: '', fertilizerUsed: '', pestManagement: '', bio: ''
  });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
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
        setProfile(profRes.value.farmer);
        const f = profRes.value.farmer;
        if (f) setProfileForm({
          farmName: f.farmName || '', native: f.native || '', state: f.state || 'Tamil Nadu',
          district: f.district || '', taluk: f.taluk || '', village: f.village || '',
          experience: f.experience || '', farmSize: f.farmSize || '', farmingType: f.farmingType || 'Mixed',
          farmingPractices: f.farmingPractices || '', soilType: f.soilType || '',
          fertilizerUsed: f.fertilizerUsed || '', pestManagement: f.pestManagement || '', bio: f.bio || ''
        });
      }
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.products || []);
      if (ordRes.status === 'fulfilled') setOrders(ordRes.value.orders || []);
      if (bulkRes.status === 'fulfilled') setBulkOrders(bulkRes.value.bulkOrders || []);
      if (earnRes.status === 'fulfilled') setEarnings(earnRes.value);
      if (inqRes.status === 'fulfilled') setInquiries(inqRes.value.inquiries || []);
      if (surpRes.status === 'fulfilled') setSurplusListings(surpRes.value.listings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoad('data', false);
    }
  }, [user?.id, earningsTimeframe]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!user) {
    return (
      <div className="fd-access-denied">
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2>Please Login</h2>
        <p>You need to be logged in to access the Farmer Dashboard.</p>
        <Link to="/login" className="fh-btn-primary">Login</Link>
      </div>
    );
  }

  if (user.role !== 'farmer') {
    return (
      <div className="fd-access-denied">
        <span style={{ fontSize: '3rem' }}>🚫</span>
        <h2>Access Denied</h2>
        <p>This dashboard is only for registered farmers. Please register as a farmer.</p>
        <Link to="/register" className="fh-btn-secondary">Register as Farmer</Link>
      </div>
    );
  }

  // ---- Handlers ----
  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      setLoad('profile', true);
      await farmerService.createOrUpdateProfile(profileForm);
      showMsg('success', 'Farm profile saved successfully!');
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to save profile.');
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
        showMsg('success', 'Produce listing updated successfully!');
      } else {
        await farmerProductService.addProduct(payload);
        showMsg('success', 'New produce added to catalog!');
      }
      setProductForm(EMPTY_PRODUCT);
      setEditingProductId(null);
      await loadData();
      setActiveTab('my-products');
    } catch (err) {
      showMsg('error', err.message || 'Failed to save product.');
    } finally {
      setLoad('product', false);
    }
  }

  function startEdit(product) {
    const tier = (product.batchPricing && product.batchPricing[0]) || {};
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      stock: product.stock,
      harvestDate: product.harvestDate ? product.harvestDate.split('T')[0] : '',
      expectedAvailability: product.expectedAvailability || '',
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
    setEditingProductId(product._id);
    setActiveTab('add-product');
  }

  async function handleToggleProductStatus(productId, currentStatus) {
    try {
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await farmerProductService.updateProductStatus(productId, nextStatus);
      showMsg('success', `Product ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to update product status.');
    }
  }

  async function handleDeleteProduct(productId, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await farmerProductService.deleteProduct(productId);
      showMsg('success', 'Product deleted.');
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      showMsg('error', err.message);
    }
  }

  async function handleAcceptOrder(orderId) {
    try {
      await farmerService.acceptOrder(orderId);
      showMsg('success', 'Order accepted!');
      await loadData();
    } catch (err) { showMsg('error', err.message); }
  }

  async function handleRejectOrder(orderId) {
    try {
      await farmerService.rejectOrder(orderId);
      showMsg('success', 'Order rejected.');
      await loadData();
    } catch (err) { showMsg('error', err.message); }
  }

  async function handleBulkStatus(bulkOrderId, status) {
    try {
      await bulkOrderService.updateBulkOrderStatus(bulkOrderId, status);
      showMsg('success', `Bulk order ${status.toLowerCase()}.`);
      await loadData();
    } catch (err) { showMsg('error', err.message); }
  }

  async function handleRespondInquiry(inquiryId) {
    const text = replyText[inquiryId];
    if (!text || !text.trim()) {
      showMsg('error', 'Please enter a reply message.');
      return;
    }
    try {
      await contactService.respondInquiry(inquiryId, text);
      showMsg('success', 'Reply sent to buyer.');
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to send reply.');
    }
  }

  async function handleCreateSurplus(e) {
    e.preventDefault();
    try {
      await surplusService.createSurplusListing(newSurplusForm);
      showMsg('success', 'Surplus flash deal listed!');
      setNewSurplusForm({
        productId: '', availableQuantity: '', offerPrice: '', minimumOrderQuantity: 5,
        offerNotes: '', offerEndDate: ''
      });
      await loadData();
    } catch (err) {
      showMsg('error', err.message || 'Failed to list surplus produce.');
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

  const navItems = [
    { key: 'overview', icon: '', label: 'Overview' },
    { key: 'my-products', icon: '', label: 'My products' },
    { key: 'add-product', icon: '', label: editingProductId ? 'Edit product' : 'Add product' },
    { key: 'orders', icon: '', label: 'Orders' },
    { key: 'bulk-orders', icon: '', label: 'Bulk orders' },
    { key: 'inquiries', icon: '', label: `Buyer inquiries (${inquiries.filter(i => i.status === 'pending').length})` },
    { key: 'surplus', icon: '', label: 'Surplus flash deals' },
    { key: 'earnings', icon: '', label: 'Sales & Earnings' },
    { key: 'profile', icon: '', label: 'Farm profile' },
  ];

  const pendingOrders = orders.filter(o => o.orderStatus === 'Placed').length;
  const totalEarned = earnings?.totalEarnings || orders.filter(o => o.orderStatus === 'Delivered').reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="fd-page">
      {/* Sidebar */}
      <aside className="fd-sidebar">
        <div className="fd-sidebar-title">Dashboard</div>
        {navItems.map(item => (
          <button
            key={item.key}
            className={`fd-nav-btn ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(item.key); if (item.key !== 'add-product') { setEditingProductId(null); setProductForm(EMPTY_PRODUCT); } }}
          >
            {item.label}
          </button>
        ))}
      </aside>

      {/* Main */}
      <main className="fd-main">
        {msg.text && (
          <div className={`fd-alert ${msg.type === 'success' ? 'fd-alert-success' : 'fd-alert-error'}`}>
            {msg.text}
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <div className="fd-section-title">📊 Overview</div>

            {!profile && (
              <div className="fd-profile-banner">
                <div>
                  <h3>Complete Your Farm Profile</h3>
                  <p>Add your farm details so buyers can find and trust you.</p>
                </div>
                <button className="fd-btn-setup" onClick={() => setActiveTab('profile')}>Set Up Profile →</button>
              </div>
            )}

            <div className="fd-stats-grid">
              {[
                { icon: '📦', label: 'Total Products', value: products.length },
                { icon: '🔔', label: 'Pending Orders', value: pendingOrders },
                { icon: '💰', label: 'Total Earned', value: `₹${(totalEarned || 0).toLocaleString('en-IN')}` },
                { icon: '✅', label: 'Completed Orders', value: orders.filter(o => o.orderStatus === 'Delivered').length },
              ].map(s => (
                <div key={s.label} className="fd-stat-card">
                  <span className="fd-stat-icon">{s.icon}</span>
                  <span className="fd-stat-label">{s.label}</span>
                  <span className="fd-stat-value">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="fd-table-wrap">
              <div className="fd-table-header">
                <h3>Recent Orders</h3>
                <button className="fd-btn-edit" onClick={() => setActiveTab('orders')}>View All →</button>
              </div>
              {orders.length === 0 ? (
                <div className="fd-empty">No orders yet. Your orders will appear here.</div>
              ) : (
                <table className="fd-table">
                  <thead>
                    <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o._id}>
                        <td><code style={{ fontSize: '0.8rem', color: 'var(--fh-primary)' }}>{o.orderId}</code></td>
                        <td>{o.customerName}</td>
                        <td><strong>₹{o.totalAmount?.toLocaleString('en-IN')}</strong></td>
                        <td><StatusBadge status={o.orderStatus} /></td>
                        <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* MY PRODUCTS */}
        {activeTab === 'my-products' && (
          <>
            <div className="fd-section-title">
              📦 My Products ({products.length})
              <button className="fh-btn-primary" style={{ marginLeft: 'auto', fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => { setEditingProductId(null); setProductForm(EMPTY_PRODUCT); setActiveTab('add-product'); }}>+ Add Product</button>
            </div>
            {products.length === 0 ? (
              <div className="fd-empty">
                <p style={{ fontSize: '2rem', marginBottom: 12 }}>📦</p>
                <p>No products yet. Add your first product!</p>
              </div>
            ) : (
              <div className="fd-table-wrap">
                <table className="fd-table">
                  <thead>
                    <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Harvest Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const isInactive = p.status === 'inactive';
                      const isOutOfStock = p.status === 'out_of_stock' || p.stock === 0;
                      return (
                        <tr key={p._id} style={{ opacity: isInactive ? 0.75 : 1 }}>
                          <td>
                            <strong>{p.name}</strong>
                            {p.minimumOrderQuantity > 1 && (
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Min Order: {p.minimumOrderQuantity} {p.unit}</div>
                            )}
                            {p.batchPricing && p.batchPricing.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: '#166534' }}>🏷️ Batch discount: ≥{p.batchPricing[0].minQuantity}{p.unit} (-{p.batchPricing[0].discountPercentage}%)</div>
                            )}
                          </td>
                          <td>{p.category}</td>
                          <td>₹{p.price}/{p.unit}</td>
                          <td>
                            <strong style={{ color: isOutOfStock ? '#dc2626' : 'inherit' }}>
                              {p.stock} {p.unit}
                            </strong>
                          </td>
                          <td>
                            <span className={`fd-status ${isInactive ? 'fd-status-rejected' : (isOutOfStock ? 'fd-status-pending' : 'fd-status-delivered')}`}>
                              {p.status || 'active'}
                            </span>
                          </td>
                          <td>{p.harvestDate ? new Date(p.harvestDate).toLocaleDateString('en-IN') : '—'}</td>
                          <td>
                            <div className="fd-action-row">
                              <button className="fd-btn-edit" onClick={() => startEdit(p)}>✏️ Edit</button>
                              <button
                                className={p.status === 'active' ? 'fd-btn-reject' : 'fd-btn-accept'}
                                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                onClick={() => handleToggleProductStatus(p._id, p.status || 'active')}
                              >
                                {p.status === 'active' ? '⏸ Deactivate' : '▶ Activate'}
                              </button>
                              <button className="fd-btn-delete" onClick={() => handleDeleteProduct(p._id, p.name)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ADD / EDIT PRODUCT */}
        {activeTab === 'add-product' && (
          <>
            <div className="fd-section-title">{editingProductId ? '✏️ Edit Product' : '➕ Add New Product'}</div>
            <div className="fd-form-wrap">
              <form onSubmit={handleAddProduct}>
                <div className="fd-form-grid">
                  <div className="fd-form-group full">
                    <label className="fd-form-label">Product Name *</label>
                    <input className="fd-form-input" value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Fresh Tomatoes" />
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Category *</label>
                    <select className="fd-form-select" value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Catalog Status</label>
                    <select className="fd-form-select" value={productForm.status || 'active'} onChange={e => setProductForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="active">Active (Visible in Store)</option>
                      <option value="inactive">Inactive (Hidden from Buyers)</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Price (₹) *</label>
                    <input className="fd-form-input" type="number" min="0" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} required placeholder="e.g. 28" />
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Unit</label>
                    <select className="fd-form-select" value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}>
                      {['kg', 'g', 'litre', 'bunch', 'dozen', 'piece', '500g'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Available Stock *</label>
                    <input className="fd-form-input" type="number" min="0" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} required placeholder="e.g. 85" />
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Minimum Order Quantity (MOQ)</label>
                    <input className="fd-form-input" type="number" min="1" value={productForm.minimumOrderQuantity || 1} onChange={e => setProductForm(p => ({ ...p, minimumOrderQuantity: e.target.value }))} placeholder="e.g. 1" />
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Harvest Date</label>
                    <input className="fd-form-input" type="date" value={productForm.harvestDate} onChange={e => setProductForm(p => ({ ...p, harvestDate: e.target.value }))} />
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Expected Availability</label>
                    <input className="fd-form-input" value={productForm.expectedAvailability} onChange={e => setProductForm(p => ({ ...p, expectedAvailability: e.target.value }))} placeholder="e.g. Next 3-5 days" />
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Farming Method</label>
                    <select className="fd-form-select" value={productForm.farmingMethod} onChange={e => setProductForm(p => ({ ...p, farmingMethod: e.target.value }))}>
                      {FARMING_METHODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Farming Practices</label>
                    <input className="fd-form-input" value={productForm.farmingPractices || ''} onChange={e => setProductForm(p => ({ ...p, farmingPractices: e.target.value }))} placeholder="e.g. Natural compost, drip irrigation" />
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Fertilizer Used</label>
                    <input className="fd-form-input" value={productForm.fertilizerUsed} onChange={e => setProductForm(p => ({ ...p, fertilizerUsed: e.target.value }))} placeholder="e.g. Compost, Vermicompost" />
                  </div>
                  <div className="fd-form-group">
                    <label className="fd-form-label">Pesticide Info</label>
                    <input className="fd-form-input" value={productForm.pesticide} onChange={e => setProductForm(p => ({ ...p, pesticide: e.target.value }))} placeholder="e.g. Neem oil spray" />
                  </div>
                  <div className="fd-form-group full">
                    <label className="fd-form-label">Product Image URL</label>
                    <input className="fd-form-input" value={productForm.image} onChange={e => setProductForm(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="fd-form-group full">
                    <label className="fd-form-label">Description</label>
                    <textarea className="fd-form-textarea" value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your product..." />
                  </div>

                  {/* Volume / Batch Pricing Configuration */}
                  <div className="fd-form-group full" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--fh-primary)' }}>🏷️ Volume / Batch Pricing Tier</h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#64748b' }}>Encourage bulk purchasing by automatically applying discounts when buyers order large volumes.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="fd-form-label">Min Volume Tier ({productForm.unit || 'kg'})</label>
                        <input className="fd-form-input" type="number" min="1" value={productForm.batchPricingMinQty || ''} onChange={e => setProductForm(p => ({ ...p, batchPricingMinQty: e.target.value }))} placeholder="e.g. 10" />
                      </div>
                      <div>
                        <label className="fd-form-label">Tier Discount (%)</label>
                        <input className="fd-form-input" type="number" min="0" max="100" value={productForm.batchPricingDiscount || ''} onChange={e => setProductForm(p => ({ ...p, batchPricingDiscount: e.target.value }))} placeholder="e.g. 10" />
                      </div>
                    </div>
                  </div>

                  <div className="fd-form-group full">
                    <label className="fd-form-checkbox">
                      <input type="checkbox" checked={productForm.isSurplus} onChange={e => setProductForm(p => ({ ...p, isSurplus: e.target.checked }))} />
                      ♻️ Mark as Surplus / Unsold Produce
                    </label>
                  </div>
                  {productForm.isSurplus && (
                    <>
                      <div className="fd-form-group">
                        <label className="fd-form-label">Surplus Price (₹)</label>
                        <input className="fd-form-input" type="number" min="0" value={productForm.surplusPrice} onChange={e => setProductForm(p => ({ ...p, surplusPrice: e.target.value }))} placeholder="Discounted price" />
                      </div>
                      <div className="fd-form-group">
                        <label className="fd-form-label">Min Bulk Order Qty (kg)</label>
                        <input className="fd-form-input" type="number" min="1" value={productForm.minBulkOrderQty} onChange={e => setProductForm(p => ({ ...p, minBulkOrderQty: e.target.value }))} />
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button type="submit" className="fd-form-submit" disabled={loading.product}>
                    {loading.product ? 'Saving...' : editingProductId ? '✅ Update Product' : '✅ Add Product'}
                  </button>
                  {editingProductId && (
                    <button type="button" className="fd-btn-edit" onClick={() => { setEditingProductId(null); setProductForm(EMPTY_PRODUCT); setActiveTab('my-products'); }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}

        {/* ORDERS */}
        {activeTab === 'orders' && (
          <>
            <div className="fd-section-title">📋 Customer Orders</div>
            {orders.length === 0 ? (
              <div className="fd-empty"><p style={{ fontSize: '2rem', marginBottom: 12 }}>📋</p><p>No orders received yet.</p></div>
            ) : (
              <div className="fd-table-wrap">
                <table className="fd-table">
                  <thead>
                    <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id}>
                        <td><code style={{ fontSize: '0.78rem', color: 'var(--fh-primary)' }}>{o.orderId}</code></td>
                        <td>{o.customerName}<br /><span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{o.customerPhone}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{(o.items || []).map(i => `${i.name} ×${i.quantity}`).join(', ')}</td>
                        <td><strong>₹{o.totalAmount?.toLocaleString('en-IN')}</strong></td>
                        <td><StatusBadge status={o.orderStatus} /></td>
                        <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          <div className="fd-action-row">
                            {o.orderStatus === 'Placed' && (
                              <>
                                <button className="fd-btn-accept" onClick={() => handleAcceptOrder(o.orderId)}>✅ Accept</button>
                                <button className="fd-btn-reject" onClick={() => handleRejectOrder(o.orderId)}>❌ Reject</button>
                              </>
                            )}
                            {o.orderStatus === 'Farmer Accepted' && <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Preparing...</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* BULK ORDERS */}
        {activeTab === 'bulk-orders' && (
          <>
            <div className="fd-section-title">🏪 Bulk Order Requests</div>
            {bulkOrders.length === 0 ? (
              <div className="fd-empty"><p style={{ fontSize: '2rem', marginBottom: 12 }}>🏪</p><p>No bulk order requests yet.</p></div>
            ) : (
              <div className="fd-table-wrap">
                <table className="fd-table">
                  <thead>
                    <tr><th>Bulk Order ID</th><th>Buyer</th><th>Type</th><th>Items</th><th>Total</th><th>Delivery Date</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {bulkOrders.map(b => (
                      <tr key={b._id}>
                        <td><code style={{ fontSize: '0.78rem', color: 'var(--fh-primary)' }}>{b.bulkOrderId}</code></td>
                        <td>{b.buyerName}<br /><span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{b.buyerPhone}</span></td>
                        <td><span className="fd-status fd-status-accepted">{b.buyerType}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{(b.items || []).map(i => `${i.name} ×${i.quantity}${i.unit}`).join(', ')}</td>
                        <td><strong>₹{b.totalAmount?.toLocaleString('en-IN')}</strong></td>
                        <td style={{ fontSize: '0.8rem' }}>{b.requestedDeliveryDate ? new Date(b.requestedDeliveryDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td><StatusBadge status={b.status} /></td>
                        <td>
                          <div className="fd-action-row">
                            {b.status === 'Requested' && (
                              <>
                                <button className="fd-btn-accept" onClick={() => handleBulkStatus(b.bulkOrderId, 'Accepted')}>✅ Accept</button>
                                <button className="fd-btn-reject" onClick={() => handleBulkStatus(b.bulkOrderId, 'Rejected')}>❌ Reject</button>
                              </>
                            )}
                            {b.status === 'Accepted' && <button className="fd-btn-advance" onClick={() => handleBulkStatus(b.bulkOrderId, 'Preparing')}>→ Preparing</button>}
                            {b.status === 'Preparing' && <button className="fd-btn-advance" onClick={() => handleBulkStatus(b.bulkOrderId, 'Ready')}>→ Ready</button>}
                            {b.status === 'Ready' && <button className="fd-btn-advance" onClick={() => handleBulkStatus(b.bulkOrderId, 'Dispatched')}>→ Dispatch</button>}
                            {b.status === 'Dispatched' && <button className="fd-btn-advance" onClick={() => handleBulkStatus(b.bulkOrderId, 'Delivered')}>→ Delivered</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* SALES & EARNINGS (Module 21: Farmer earnings and sales reports) */}
        {activeTab === 'earnings' && (
          <div className="fd-sales-report-wrap">
            <div className="fd-section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="fd-section-title-large" style={{ margin: 0 }}>💰 Farmer Sales & Earnings Analytics</h2>
                <p className="fd-section-desc" style={{ margin: '4px 0 0 0' }}>Real-time delivered revenue, 95% guaranteed net payouts, and transparent escrow order settlements.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>Timeframe:</span>
                {[
                  { key: 'all', label: 'All Time' },
                  { key: 'month', label: 'This Month' },
                  { key: 'week', label: 'This Week' },
                  { key: 'today', label: 'Today' }
                ].map(tf => (
                  <button
                    key={tf.key}
                    type="button"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: earningsTimeframe === tf.key ? 'none' : '1px solid #cbd5e1',
                      background: earningsTimeframe === tf.key ? 'var(--fh-primary)' : '#ffffff',
                      color: earningsTimeframe === tf.key ? '#ffffff' : '#334155'
                    }}
                    onClick={() => setEarningsTimeframe(tf.key)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fd-earnings-grid">
              <div className="fd-earnings-card fd-card-primary">
                <div className="fd-earnings-label">Delivered Gross Sales</div>
                <div className="fd-earnings-value">₹{(earnings?.deliveredRevenue || 0).toLocaleString('en-IN')}</div>
                <div className="fd-earnings-sub">{earnings?.completedOrders || 0} completed deliveries</div>
              </div>
              <div className="fd-earnings-card fd-card-accent">
                <div className="fd-earnings-label">Net Disbursed to Bank (95%)</div>
                <div className="fd-earnings-value">₹{(earnings?.netEarnings || 0).toLocaleString('en-IN')}</div>
                <div className="fd-earnings-sub">Fee: ₹{(earnings?.platformFees || 0).toLocaleString('en-IN')} (5% platform facilitation)</div>
              </div>
              <div className="fd-earnings-card">
                <div className="fd-earnings-label">Pipeline (In Fulfillment)</div>
                <div className="fd-earnings-value">₹{(earnings?.pendingRevenue || 0).toLocaleString('en-IN')}</div>
                <div className="fd-earnings-sub">{earnings?.pendingOrders || 0} active orders in delivery pipeline</div>
              </div>
              <div className="fd-earnings-card">
                <div className="fd-earnings-label">Cancelled / Void Orders</div>
                <div className="fd-earnings-value">₹{(earnings?.cancelledRevenue || 0).toLocaleString('en-IN')}</div>
                <div className="fd-earnings-sub">{earnings?.cancelledOrders || 0} cancelled/failed orders</div>
              </div>
            </div>

            {/* Sales by Crop Item Breakdown */}
            <div className="fd-table-wrap" style={{ marginBottom: '2rem' }}>
              <div className="fd-table-header">
                <h3>Harvest Sales by Crop Produce</h3>
                <span className="info-pill">Volume & Revenue Contribution</span>
              </div>
              {(!earnings?.cropsBreakdown || earnings.cropsBreakdown.length === 0) ? (
                <div className="fd-empty" style={{ padding: '24px' }}>
                  No delivered produce sales recorded for this timeframe yet. Sales will update automatically once orders are marked Delivered.
                </div>
              ) : (
                <table className="fd-table">
                  <thead>
                    <tr>
                      <th>Produce Name</th>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Average Rate</th>
                      <th>Gross Sales</th>
                      <th>Farmer Net Payout (95%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.cropsBreakdown.map((crop, idx) => (
                      <tr key={idx}>
                        <td><strong>{crop.name}</strong></td>
                        <td><span className="fd-chip-cat">{crop.category}</span></td>
                        <td>{crop.unitsSold} {crop.unit}</td>
                        <td>{crop.averageRate}</td>
                        <td><strong>{crop.grossSales}</strong></td>
                        <td><span className="fd-net-payout">{crop.netPayout}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent Completed Order Sales & Bank Settlement Details */}
            <div className="fd-table-wrap">
              <div className="fd-table-header">
                <h3>Recent Orders & Settlement Breakdown</h3>
                <span className="info-pill">Direct Bank Transfer Records</span>
              </div>
              {(!earnings?.orderHistory || earnings.orderHistory.length === 0) ? (
                <div className="fd-empty" style={{ padding: '24px' }}>
                  No orders found for the selected timeframe.
                </div>
              ) : (
                <table className="fd-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Gross Value</th>
                      <th>Net Disbursed</th>
                      <th>Payment Method</th>
                      <th>Settlement Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.orderHistory.map(tx => (
                      <tr key={tx._id || tx.orderId}>
                        <td><code style={{ fontSize: '0.82rem', fontWeight: 600 }}>{tx.orderId}</code></td>
                        <td>{tx.customerName}</td>
                        <td>₹{(tx.grossAmount || 0).toLocaleString('en-IN')}</td>
                        <td><strong style={{ color: '#065f46' }}>₹{(tx.netPayout || 0).toLocaleString('en-IN')}</strong></td>
                        <td><span style={{ fontSize: '0.8rem' }}>{tx.paymentMethod}</span></td>
                        <td>
                          <span className={tx.settlementStatus === 'Settled to Bank' ? 'fd-status-settled' : (tx.settlementStatus === 'Void / Cancelled' ? 'fd-status fd-status-rejected' : 'fd-status fd-status-pending')}>
                            {tx.settlementStatus === 'Settled to Bank' ? '✓ ' : ''}{tx.settlementStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* BUYER INQUIRIES (Module 9: Direct Farmer-Buyer Communication) */}
        {activeTab === 'inquiries' && (
          <>
            <div className="fd-section-title">💬 Buyer Inquiries & Messages</div>
            <div className="fd-table-wrap">
              <div className="fd-table-header">
                <h3>Direct Messages from Buyers ({inquiries.length})</h3>
                <span className="info-pill">Direct communication without intermediaries</span>
              </div>
              {inquiries.length === 0 ? (
                <div className="fd-empty">No buyer inquiries received yet.</div>
              ) : (
                <div className="fd-inquiries-list">
                  {inquiries.map((inq) => (
                    <div key={inq._id} className="fd-inquiry-item">
                      <div className="fd-inquiry-header">
                        <div>
                          <strong>{inq.subject}</strong>
                          <span className="inquiry-type-tag">
                            {(inq.inquiryType || 'general').replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className={`fd-status fd-status-${inq.status || 'pending'}`}>
                          {inq.status || 'pending'}
                        </span>
                      </div>
                      <p className="fd-inquiry-msg">"{inq.message}"</p>
                      <div className="fd-inquiry-contact">
                        <span>📧 {inq.contactEmail || 'N/A'}</span>
                        {inq.contactPhone && <span> • 📞 {inq.contactPhone}</span>}
                        {inq.productName && <span> • 🍅 Regarding: {inq.productName}</span>}
                      </div>

                      {inq.response ? (
                        <div className="fd-inquiry-reply">
                          <strong>Your Response:</strong> {inq.response}
                        </div>
                      ) : (
                        <div className="fd-reply-box">
                          <input
                            type="text"
                            placeholder="Type response for buyer (e.g. Yes, fresh harvest arriving Friday)..."
                            value={replyText[inq._id] || ''}
                            onChange={(e) => setReplyText({ ...replyText, [inq._id]: e.target.value })}
                            className="fd-reply-input"
                          />
                          <button
                            className="fd-btn-reply"
                            onClick={() => handleRespondInquiry(inq._id)}
                          >
                            Send Reply
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* SURPLUS & UNSOLD PRODUCE (Module 12) */}
        {activeTab === 'surplus' && (
          <>
            <div className="fd-section-title">🔥 Surplus & Unsold Produce Management</div>
            <div className="fd-form-wrap">
              <h3>List Excess Harvest Flash Deal</h3>
              <p className="fd-form-desc">
                Offer bumper crops at a discounted rate to prevent post-harvest spoilage and recover full yield revenue.
              </p>
              <form onSubmit={handleCreateSurplus}>
                <div className="fd-form-grid">
                  <div className="fd-form-group">
                    <label className="fd-form-label">Select Produce *</label>
                    <select
                      className="fd-form-select"
                      required
                      value={newSurplusForm.productId}
                      onChange={(e) => setNewSurplusForm({ ...newSurplusForm, productId: e.target.value })}
                    >
                      <option value="">-- Choose Harvest Product --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Regular: ₹{p.price}/{p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fd-form-group">
                    <label className="fd-form-label">Surplus Quantity (kg) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="fd-form-input"
                      placeholder="e.g. 50"
                      value={newSurplusForm.availableQuantity}
                      onChange={(e) => setNewSurplusForm({ ...newSurplusForm, availableQuantity: e.target.value })}
                    />
                  </div>

                  <div className="fd-form-group">
                    <label className="fd-form-label">Discounted Offer Price (₹/kg) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="fd-form-input"
                      placeholder="e.g. 25"
                      value={newSurplusForm.offerPrice}
                      onChange={(e) => setNewSurplusForm({ ...newSurplusForm, offerPrice: e.target.value })}
                    />
                  </div>

                  <div className="fd-form-group">
                    <label className="fd-form-label">Min Order Qty (kg)</label>
                    <input
                      type="number"
                      min="1"
                      className="fd-form-input"
                      value={newSurplusForm.minimumOrderQuantity}
                      onChange={(e) => setNewSurplusForm({ ...newSurplusForm, minimumOrderQuantity: e.target.value })}
                    />
                  </div>

                  <div className="fd-form-group">
                    <label className="fd-form-label">Offer Expiry Date *</label>
                    <input
                      type="date"
                      required
                      className="fd-form-input"
                      min={new Date().toISOString().split('T')[0]}
                      value={newSurplusForm.offerEndDate}
                      onChange={(e) => setNewSurplusForm({ ...newSurplusForm, offerEndDate: e.target.value })}
                    />
                  </div>

                  <div className="fd-form-group full">
                    <label className="fd-form-label">Offer Notes / Reason</label>
                    <input
                      type="text"
                      className="fd-form-input"
                      placeholder="e.g. High harvest yield today, special discount for bulk buyers and mess kitchens"
                      value={newSurplusForm.offerNotes}
                      onChange={(e) => setNewSurplusForm({ ...newSurplusForm, offerNotes: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="fd-form-submit">
                  + Publish Surplus Deal on Flash Marketplace
                </button>
              </form>
            </div>

            <div className="fd-table-wrap" style={{ marginTop: '2rem' }}>
              <div className="fd-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>My Surplus Flash Listings ({surplusListings.length})</h3>
                <button
                  type="button"
                  className="fd-btn-edit"
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  onClick={async () => {
                    try {
                      const res = await surplusService.runExpireCheck();
                      showMsg('success', `Checked surplus expirations (${res.expiredCount || 0} updated).`);
                      await loadData();
                    } catch (e) {
                      showMsg('error', e.message);
                    }
                  }}
                >
                  🔄 Check & Sync Expirations
                </button>
              </div>
              {surplusListings.length === 0 ? (
                <div className="fd-empty">No surplus deals listed.</div>
              ) : (
                <table className="fd-table">
                  <thead>
                    <tr><th>Produce</th><th>Surplus Qty</th><th>Regular Price</th><th>Flash Price</th><th>Expiry Date</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {surplusListings.map((s) => {
                      const isExpired = s.status === 'expired' || new Date(s.offerEndDate) < new Date();
                      return (
                        <tr key={s._id} style={{ opacity: isExpired ? 0.75 : 1 }}>
                          <td><strong>{s.productName}</strong></td>
                          <td>{s.availableQuantity} kg</td>
                          <td style={{ textDecoration: 'line-through', color: '#9ca3af' }}>₹{s.standardPrice}</td>
                          <td style={{ color: '#16a34a', fontWeight: 'bold' }}>₹{s.offerPrice}</td>
                          <td style={{ fontSize: '0.82rem' }}>{s.offerEndDate ? new Date(s.offerEndDate).toLocaleDateString('en-IN') : '—'}</td>
                          <td>
                            <span className={`fd-status ${isExpired ? 'fd-status-rejected' : 'fd-status-delivered'}`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td>
                            <button className="fd-btn-delete" onClick={() => handleDeleteSurplus(s._id)}>Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* FARM PROFILE */}
        {activeTab === 'profile' && (
          <>
            <div className="fd-section-title">🌾 Farm Profile</div>
            <div className="fd-form-wrap">
              <form onSubmit={handleSaveProfile}>
                <div className="fd-form-grid">
                  <div className="fd-form-group"><label className="fd-form-label">Farm Name *</label><input className="fd-form-input" value={profileForm.farmName} onChange={e => setProfileForm(p => ({ ...p, farmName: e.target.value }))} required placeholder="e.g. Green Valley Farm" /></div>
                  <div className="fd-form-group"><label className="fd-form-label">District *</label><input className="fd-form-input" value={profileForm.district} onChange={e => setProfileForm(p => ({ ...p, district: e.target.value }))} required placeholder="e.g. Erode" /></div>
                  <div className="fd-form-group"><label className="fd-form-label">Taluk</label><input className="fd-form-input" value={profileForm.taluk} onChange={e => setProfileForm(p => ({ ...p, taluk: e.target.value }))} placeholder="e.g. Perundurai" /></div>
                  <div className="fd-form-group"><label className="fd-form-label">Village / Native</label><input className="fd-form-input" value={profileForm.village} onChange={e => setProfileForm(p => ({ ...p, village: e.target.value }))} placeholder="e.g. Thiruchengode" /></div>
                  <div className="fd-form-group"><label className="fd-form-label">Experience (Years)</label><input className="fd-form-input" type="number" min="0" value={profileForm.experience} onChange={e => setProfileForm(p => ({ ...p, experience: e.target.value }))} placeholder="e.g. 15" /></div>
                  <div className="fd-form-group"><label className="fd-form-label">Farm Size</label><input className="fd-form-input" value={profileForm.farmSize} onChange={e => setProfileForm(p => ({ ...p, farmSize: e.target.value }))} placeholder="e.g. 5 acres" /></div>
                  <div className="fd-form-group"><label className="fd-form-label">Farming Type</label><select className="fd-form-select" value={profileForm.farmingType} onChange={e => setProfileForm(p => ({ ...p, farmingType: e.target.value }))}>{FARMING_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
                  <div className="fd-form-group"><label className="fd-form-label">Soil Type</label><input className="fd-form-input" value={profileForm.soilType} onChange={e => setProfileForm(p => ({ ...p, soilType: e.target.value }))} placeholder="e.g. Red loam soil" /></div>
                  <div className="fd-form-group"><label className="fd-form-label">Fertilizer Used</label><input className="fd-form-input" value={profileForm.fertilizerUsed} onChange={e => setProfileForm(p => ({ ...p, fertilizerUsed: e.target.value }))} placeholder="e.g. Vermicompost, FYM" /></div>
                  <div className="fd-form-group"><label className="fd-form-label">Pest Management</label><input className="fd-form-input" value={profileForm.pestManagement} onChange={e => setProfileForm(p => ({ ...p, pestManagement: e.target.value }))} placeholder="e.g. Neem spray" /></div>
                  <div className="fd-form-group full"><label className="fd-form-label">Farming Practices</label><input className="fd-form-input" value={profileForm.farmingPractices} onChange={e => setProfileForm(p => ({ ...p, farmingPractices: e.target.value }))} placeholder="e.g. Drip irrigation, mulching" /></div>
                  <div className="fd-form-group full"><label className="fd-form-label">About You / Bio</label><textarea className="fd-form-textarea" value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell buyers about yourself and your farming journey..." /></div>
                </div>
                <button type="submit" className="fd-form-submit" disabled={loading.profile}>{loading.profile ? 'Saving...' : '✅ Save Farm Profile'}</button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
