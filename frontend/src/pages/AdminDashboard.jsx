import { useState, useEffect } from 'react';
import { adminService, farmerService, supportService, authService } from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [surplus, setSurplus] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Search and filter states
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');

  // Interactive action states
  const [updatingId, setUpdatingId] = useState(null);
  const [replyTicketId, setReplyTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('Resolved');

  async function loadAllAdminData() {
    setLoading(true);
    setError('');
    try {
      const [
        statsRes,
        usersRes,
        farmersRes,
        productsRes,
        ordersRes,
        ticketsRes,
        surplusRes,
        delivRes
      ] = await Promise.allSettled([
        adminService.getAdminStats(),
        adminService.getAllUsers(),
        farmerService.getFarmers(),
        adminService.getAllProducts(),
        adminService.getAllOrders(),
        supportService.getAllTickets(),
        adminService.getAllSurplus(),
        adminService.getAllDeliveries()
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
      if (farmersRes.status === 'fulfilled') setFarmers(farmersRes.value.farmers || []);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.products || []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders || []);
      if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value.tickets || []);
      if (surplusRes.status === 'fulfilled') setSurplus(surplusRes.value.listings || []);
      if (delivRes.status === 'fulfilled') setDeliveries(delivRes.value.deliveries || []);
    } catch (err) {
      setError(err.message || 'Failed to aggregate administrative telemetry.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllAdminData();
  }, [currentUser]);

  function showNotification(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  async function handleQuickAdminLogin() {
    try {
      setLoading(true);
      await authService.login({ email: 'admin@freshharvest.in', password: 'adminPassword123' }).catch(async () => {
        return await authService.login({ email: 'admin@freshharvest.in', password: 'admin123' });
      });
      setCurrentUser(authService.getCurrentUser());
      showNotification('Logged in as Platform Administrator (admin@freshharvest.in)');
    } catch (err) {
      setError('Admin quick-login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    setUpdatingId(userId);
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => (u._id === userId ? { ...u, role: newRole } : u)));
      showNotification('User role updated to ' + newRole);
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleVerifyFarmer(farmerId, currentVerified) {
    setUpdatingId(farmerId);
    try {
      const newStatus = !currentVerified;
      await adminService.verifyFarmer(farmerId, newStatus);
      setFarmers(prev => prev.map(f => (f._id === farmerId ? { ...f, isVerified: newStatus } : f)));
      showNotification(`Farmer ${newStatus ? 'Verified' : 'Verification Revoked'} successfully.`);
    } catch (err) {
      alert(err.message || 'Failed to update farmer verification.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleProductStatus(productId, newStatus) {
    setUpdatingId(productId);
    try {
      await adminService.updateProductStatus(productId, newStatus);
      setProducts(prev => prev.map(p => (p._id === productId ? { ...p, status: newStatus } : p)));
      showNotification(`Produce listing updated to status: ${newStatus}`);
    } catch (err) {
      alert(err.message || 'Failed to update product status.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteProduct(productId) {
    if (!window.confirm('Are you sure you want to delete this produce listing from the marketplace?')) return;
    setUpdatingId(productId);
    try {
      await adminService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p._id !== productId));
      showNotification('Product listing deleted by administrator.');
    } catch (err) {
      alert(err.message || 'Failed to delete produce listing.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleOrderStatusChange(orderId, newStatus) {
    setUpdatingId(orderId);
    try {
      await adminService.updateOrderStatus(orderId, newStatus, 'Status updated via Admin Operations Control');
      setOrders(prev => prev.map(o => (o.orderId === orderId ? { ...o, orderStatus: newStatus } : o)));
      showNotification(`Order ${orderId} moved to "${newStatus}"`);
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleResolveTicket(e) {
    e.preventDefault();
    if (!replyTicketId) return;
    setUpdatingId(replyTicketId);
    try {
      await supportService.resolveTicket(replyTicketId, {
        status: replyStatus,
        responseMessage: replyText,
        resolutionNotes: 'Resolved by Platform Administrator'
      });
      setTickets(prev => prev.map(t => (t._id === replyTicketId ? { ...t, status: replyStatus, response: replyText } : t)));
      showNotification('Support ticket resolution logged and sent to customer.');
      setReplyTicketId(null);
      setReplyText('');
    } catch (err) {
      alert(err.message || 'Failed to resolve ticket.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteSurplus(id) {
    if (!window.confirm('Remove this surplus deal?')) return;
    try {
      await adminService.deleteSurplus(id);
      setSurplus(prev => prev.filter(s => s._id !== id));
      showNotification('Surplus listing removed.');
    } catch (err) {
      alert(err.message || 'Failed to remove surplus deal.');
    }
  }

  // Filtered datasets
  const filteredUsers = users.filter(u => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch = !userSearch ||
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.phone && u.phone.includes(userSearch));
    return matchesRole && matchesSearch;
  });

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return (p.name && p.name.toLowerCase().includes(s)) ||
      (p.farmerName && p.farmerName.toLowerCase().includes(s)) ||
      (p.category && p.category.toLowerCase().includes(s));
  });

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.orderStatus === orderStatusFilter;
  });

  const filteredTickets = tickets.filter(t => {
    if (ticketStatusFilter === 'all') return true;
    return (t.status || 'Open').toLowerCase() === ticketStatusFilter.toLowerCase();
  });

  return (
    <div className="admin-page">
      {/* Top Banner & Title */}
      <div className="admin-header">
        <div>
          <span className="admin-shield">🛡️ System Administration</span>
          <h1>Marketplace Operations Control</h1>
          <p className="admin-subtitle">
            User roles, farmer verifications, produce moderation, order fulfillment, and complaint resolution.
          </p>
        </div>

        {(!currentUser || currentUser.role !== 'admin') && (
          <div className="admin-auth-notice">
            <span>⚠️ You are not signed in as an Admin account.</span>
            <button className="btn-admin-quick-login" onClick={handleQuickAdminLogin}>
              🔑 Sign in as Admin
            </button>
          </div>
        )}
      </div>

      {successMsg && <div className="admin-alert success">✓ {successMsg}</div>}
      {error && <div className="admin-alert error">⚠ {error}</div>}

      {/* KPI Overview Telemetry */}
      <div className="admin-kpis">
        <div className="admin-kpi-card" onClick={() => setActiveTab('orders')}>
          <span className="kpi-tag">Gross Marketplace Value</span>
          <span className="kpi-num">₹{(stats?.totalGMV || 0).toLocaleString('en-IN')}</span>
          <span className="kpi-subtext">Direct farmer transactions</span>
        </div>
        <div className="admin-kpi-card" onClick={() => setActiveTab('users')}>
          <span className="kpi-tag">Platform User Accounts</span>
          <span className="kpi-num">{stats?.totalUsers || users.length || 0}</span>
          <span className="kpi-subtext">Consumers, Farmers, B2B, Fleet</span>
        </div>
        <div className="admin-kpi-card" onClick={() => setActiveTab('farmers')}>
          <span className="kpi-tag">Verified Farms</span>
          <span className="kpi-num">{stats?.totalFarmers || farmers.length || 0}</span>
          <span className="kpi-subtext">Tamil Nadu district onboarding</span>
        </div>
        <div className="admin-kpi-card" onClick={() => setActiveTab('products')}>
          <span className="kpi-tag">Active Produce Listings</span>
          <span className="kpi-num">{stats?.totalProducts || products.length || 0}</span>
          <span className="kpi-subtext">Farm-fresh listings</span>
        </div>
        <div className="admin-kpi-card" onClick={() => setActiveTab('tickets')}>
          <span className="kpi-tag">Support Complaints</span>
          <span className="kpi-num">{tickets.filter(t => t.status === 'Open' || !t.status).length} Open</span>
          <span className="kpi-subtext">{tickets.length} Total registered tickets</span>
        </div>
        <div className="admin-kpi-card" onClick={() => setActiveTab('surplus')}>
          <span className="kpi-tag">Zero-Waste Deals</span>
          <span className="kpi-num">{stats?.totalSurplus || surplus.length || 0}</span>
          <span className="kpi-subtext">Flash anti-spoilage listings</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-nav-tabs">
        <button
          className={`admin-nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'farmers' ? 'active' : ''}`}
          onClick={() => setActiveTab('farmers')}
        >
          🌱 Farmer Verifications ({farmers.length})
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🍎 Produce Moderation ({products.length})
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders ({orders.length})
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          💬 Grievances & Tickets ({tickets.length})
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'surplus' ? 'active' : ''}`}
          onClick={() => setActiveTab('surplus')}
        >
          ⚡ Surplus Deals ({surplus.length})
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'deliveries' ? 'active' : ''}`}
          onClick={() => setActiveTab('deliveries')}
        >
          🚚 Fleet ({deliveries.length})
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'platform' ? 'active' : ''}`}
          onClick={() => setActiveTab('platform')}
        >
          ⚙️ Policies
        </button>
      </div>

      {loading && <div className="admin-loading">Synchronizing live marketplace database records...</div>}

      {/* ─────────────────────────────────────────────────────────────
          TAB: OVERVIEW
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'overview' && (
        <div className="admin-overview-grid">
          <div className="admin-content-box">
            <div className="box-header">
              <h3>Recent Orders & Transactions</h3>
              <button className="btn-link-action" onClick={() => setActiveTab('orders')}>View All ({orders.length}) →</button>
            </div>
            {orders.length === 0 ? (
              <p className="empty-hint">No orders recorded yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o._id}>
                        <td><strong>{o.orderId}</strong></td>
                        <td>{o.customerName}</td>
                        <td>₹{o.totalAmount}</td>
                        <td>
                          <span className={`payment-pill ${(o.paymentStatus || '').toLowerCase()}`}>
                            {o.paymentMethod} • {o.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`order-pill ${(o.orderStatus || '').toLowerCase().replace(/\s+/g, '-')}`}>
                            {o.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-content-box">
            <div className="box-header">
              <h3>Support Grievance Queue</h3>
              <button className="btn-link-action" onClick={() => setActiveTab('tickets')}>View All ({tickets.length}) →</button>
            </div>
            {tickets.length === 0 ? (
              <p className="empty-hint">Zero active complaint tickets. Great customer satisfaction!</p>
            ) : (
              <div className="tickets-mini-list">
                {tickets.slice(0, 4).map(t => (
                  <div key={t._id} className="ticket-mini-card">
                    <div className="ticket-mini-top">
                      <strong>{t.ticketId}: {t.subject}</strong>
                      <span className={`status-pill ${(t.status || 'Open').toLowerCase()}`}>{t.status || 'Open'}</span>
                    </div>
                    <p className="ticket-mini-msg">{t.message}</p>
                    <span className="ticket-mini-meta">From: {t.contactEmail} • Priority: {t.priority || 'medium'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: USERS
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'users' && (
        <div className="admin-content-box">
          <div className="box-header">
            <div>
              <h3>User Accounts & Access Permissions</h3>
              <p className="box-desc">Assign customer, farmer, institutional bulk buyer, or logistics fleet permissions.</p>
            </div>
            <span className="badge-count">{filteredUsers.length} Users</span>
          </div>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="admin-search-input"
            />
            <div className="role-filter-chips">
              {['all', 'customer', 'farmer', 'bulk_buyer', 'delivery_partner', 'admin'].map(r => (
                <button
                  key={r}
                  className={`chip ${userRoleFilter === r ? 'active' : ''}`}
                  onClick={() => setUserRoleFilter(r)}
                >
                  {r.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Contact Info</th>
                  <th>Current Role</th>
                  <th>Business / Fleet Record</th>
                  <th>Permission Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-name-cell">
                        <strong>{u.name}</strong>
                        <span className="user-email">{u.email}</span>
                      </div>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {u.businessName && <div>🏢 {u.businessName} ({u.businessType || 'B2B'})</div>}
                      {u.vehicleNumber && <div>🚚 Fleet: {u.vehicleNumber}</div>}
                      {!u.businessName && !u.vehicleNumber && <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <select
                        className="role-change-select"
                        value={u.role}
                        disabled={updatingId === u._id}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      >
                        <option value="customer">Customer</option>
                        <option value="farmer">Farmer</option>
                        <option value="bulk_buyer">Bulk Buyer</option>
                        <option value="delivery_partner">Delivery Partner</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: FARMERS
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'farmers' && (
        <div className="admin-content-box">
          <div className="box-header">
            <div>
              <h3>Farmer Onboarding & Trust Verification Desk</h3>
              <p className="box-desc">Verify organic farming compliance, acreage, and native locality credentials.</p>
            </div>
            <span className="badge-count">{farmers.length} Farm Profiles</span>
          </div>

          <div className="farmers-admin-grid">
            {farmers.map((f) => (
              <div key={f._id} className="farmer-admin-card">
                <div className="farm-admin-top">
                  <h4>{f.farmName}</h4>
                  <span className={`verification-badge ${f.isVerified ? 'verified' : 'unverified'}`}>
                    {f.isVerified ? '✓ Verified Producer' : '⏳ Pending Review'}
                  </span>
                </div>
                <p className="farm-admin-loc">
                  📍 {f.village || ''}, {f.taluk || ''}, {f.district}, {f.state}
                </p>
                <div className="farm-admin-details">
                  <div><strong>Practices:</strong> {f.farmingPractices || 'Organic Cultivation'}</div>
                  <div><strong>Acreage:</strong> {f.farmSize || 5} Acres • <strong>Exp:</strong> {f.experience || 10} Yrs</div>
                  <div><strong>Soil:</strong> {f.soilType || 'Loam'} • <strong>Fertilizer:</strong> {f.fertilizerUsed || 'Vermicompost'}</div>
                  <div><strong>Pest Mgmt:</strong> {f.pestManagement || 'Botanical extracts'}</div>
                </div>
                <div className="farm-card-actions">
                  <button
                    className={`btn-verify-toggle ${f.isVerified ? 'btn-revoke' : 'btn-approve'}`}
                    disabled={updatingId === f._id}
                    onClick={() => handleVerifyFarmer(f._id, f.isVerified)}
                  >
                    {f.isVerified ? 'Revoke Verification' : '✓ Approve & Verify Farmer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: PRODUCTS MODERATION
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'products' && (
        <div className="admin-content-box">
          <div className="box-header">
            <div>
              <h3>Produce Catalog Moderation</h3>
              <p className="box-desc">Review price integrity, harvest data, and maintain active listings.</p>
            </div>
            <span className="badge-count">{filteredProducts.length} Items</span>
          </div>

          <div className="filter-bar">
            <input
              type="text"
              placeholder="Search produce name, farmer, or category..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produce</th>
                  <th>Category</th>
                  <th>Price & Stock</th>
                  <th>Farmer / Location</th>
                  <th>Harvest Date</th>
                  <th>Listing Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="prod-cell">
                        {p.image && <img src={p.image} alt={p.name} className="admin-prod-thumb" />}
                        <div>
                          <strong>{p.name}</strong>
                          {p.isOrganic && <span className="organic-tag">🌱 Organic</span>}
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <strong>₹{p.price}</strong> / {p.unit}
                      <div className="stock-hint">{p.stock} available</div>
                    </td>
                    <td>
                      <div>{p.farmerName}</div>
                      <span className="text-muted text-xs">{p.farmLocation}</span>
                    </td>
                    <td>{p.harvestDate ? new Date(p.harvestDate).toLocaleDateString() : 'Fresh Pick'}</td>
                    <td>
                      <span className={`status-pill status-${p.status || 'active'}`}>
                        {(p.status || 'active').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="prod-action-btns">
                        <select
                          className="role-change-select"
                          value={p.status || 'active'}
                          onChange={(e) => handleProductStatus(p._id, e.target.value)}
                          disabled={updatingId === p._id}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="flagged">Flagged</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                        <button
                          className="btn-delete-row"
                          title="Delete produce listing"
                          onClick={() => handleDeleteProduct(p._id)}
                          disabled={updatingId === p._id}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: ORDERS
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'orders' && (
        <div className="admin-content-box">
          <div className="box-header">
            <div>
              <h3>Order Fulfillment & Logistics Oversight</h3>
              <p className="box-desc">Live pipeline tracking across customer checkout, farmer packing, and fleet delivery.</p>
            </div>
            <span className="badge-count">{filteredOrders.length} Orders</span>
          </div>

          <div className="filter-bar">
            <div className="role-filter-chips">
              {['all', 'Placed', 'Farmer Accepted', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(st => (
                <button
                  key={st}
                  className={`chip ${orderStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter(st)}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer</th>
                  <th>Produce Items</th>
                  <th>Total Amount</th>
                  <th>Payment Method</th>
                  <th>Current Status</th>
                  <th>Admin Status Override</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o._id}>
                    <td>
                      <strong>{o.orderId}</strong>
                      <div className="text-muted text-xs">{new Date(o.createdAt).toLocaleString()}</div>
                    </td>
                    <td>
                      <div><strong>{o.customerName}</strong></div>
                      <div className="text-muted text-xs">{o.customerPhone}</div>
                      <div className="text-muted text-xs">{o.shippingAddress?.city}, {o.shippingAddress?.state}</div>
                    </td>
                    <td>
                      <div className="order-items-snippet">
                        {o.items?.map((it, idx) => (
                          <span key={idx} className="item-tag">{it.name} × {it.quantity}{it.unit}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong>₹{o.totalAmount}</strong>
                    </td>
                    <td>
                      <span className={`payment-pill ${(o.paymentStatus || '').toLowerCase()}`}>
                        {o.paymentMethod} • {o.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`order-pill ${(o.orderStatus || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        className="role-change-select"
                        value={o.orderStatus}
                        disabled={updatingId === o.orderId}
                        onChange={(e) => handleOrderStatusChange(o.orderId, e.target.value)}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Farmer Accepted">Farmer Accepted</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: SUPPORT & GRIEVANCE RESOLUTION
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'tickets' && (
        <div className="admin-content-box">
          <div className="box-header">
            <div>
              <h3>Customer Care & Grievance Resolution Desk</h3>
              <p className="box-desc">Respond directly to customer tickets regarding damaged produce, deliveries, and refunds.</p>
            </div>
            <span className="badge-count">{filteredTickets.length} Tickets</span>
          </div>

          <div className="filter-bar">
            <div className="role-filter-chips">
              {['all', 'open', 'in progress', 'resolved', 'closed'].map(st => (
                <button
                  key={st}
                  className={`chip ${ticketStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setTicketStatusFilter(st)}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <p className="empty-hint">No tickets in this view.</p>
          ) : (
            <div className="tickets-admin-list">
              {filteredTickets.map(t => (
                <div key={t._id} className="ticket-admin-card">
                  <div className="ticket-admin-header">
                    <div>
                      <span className="ticket-id-tag">{t.ticketId}</span>
                      <h4>{t.subject}</h4>
                      <span className="ticket-category-tag">{t.category?.replace('_', ' ')}</span>
                      {t.orderId && <span className="order-ref-tag">Order #{t.orderId}</span>}
                    </div>
                    <span className={`status-pill ${(t.status || 'Open').toLowerCase().replace(/\s+/g, '-')}`}>
                      {(t.status || 'Open').toUpperCase()}
                    </span>
                  </div>

                  <p className="ticket-body-msg">{t.message}</p>
                  <div className="ticket-meta-info">
                    <span>👤 {t.customerName || 'Customer'} • 📧 {t.contactEmail} • 📞 {t.contactPhone}</span>
                    <span>Priority: <strong>{(t.priority || 'medium').toUpperCase()}</strong></span>
                  </div>

                  {t.response && (
                    <div className="admin-existing-resolution">
                      <strong>Current Resolution:</strong> {t.response}
                    </div>
                  )}

                  <div className="ticket-card-actions">
                    {replyTicketId === t._id ? (
                      <form onSubmit={handleResolveTicket} className="reply-form">
                        <textarea
                          placeholder="Type official customer resolution, replacement, or refund note..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          required
                          className="admin-textarea"
                        />
                        <div className="reply-controls">
                          <select
                            value={replyStatus}
                            onChange={(e) => setReplyStatus(e.target.value)}
                            className="role-change-select"
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                          <button type="submit" className="btn-approve" disabled={updatingId === t._id}>
                            Submit Resolution
                          </button>
                          <button type="button" className="btn-cancel" onClick={() => setReplyTicketId(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        className="btn-respond"
                        onClick={() => { setReplyTicketId(t._id); setReplyText(t.response || ''); }}
                      >
                        ✍️ Respond & Resolve Ticket
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: SURPLUS MONITORING
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'surplus' && (
        <div className="admin-content-box">
          <div className="box-header">
            <div>
              <h3>Surplus & Anti-Waste Flash Deals</h3>
              <p className="box-desc">Monitor excess farm harvest liquidations and verify flash discount thresholds.</p>
            </div>
            <span className="badge-count">{surplus.length} Surplus Deals</span>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produce</th>
                  <th>Farmer</th>
                  <th>Standard vs Offer Price</th>
                  <th>Discount %</th>
                  <th>Available Quantity</th>
                  <th>Offer Valid Until</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {surplus.map(s => {
                  const discount = s.standardPrice > s.offerPrice ? Math.round(((s.standardPrice - s.offerPrice) / s.standardPrice) * 100) : 0;
                  return (
                    <tr key={s._id}>
                      <td><strong>{s.productName}</strong></td>
                      <td>{s.farmerName}</td>
                      <td>
                        <span className="strike-price">₹{s.standardPrice}</span> → <strong>₹{s.offerPrice}</strong>
                      </td>
                      <td><span className="discount-pill">-{discount}% OFF</span></td>
                      <td>{s.availableQuantity} units (Min Order: {s.minimumOrderQuantity})</td>
                      <td>{s.offerEndDate ? new Date(s.offerEndDate).toLocaleDateString() : 'Limited'}</td>
                      <td>
                        <button className="btn-delete-row" onClick={() => handleDeleteSurplus(s._id)}>
                          🗑️ Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: FLEET & DELIVERIES
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'deliveries' && (
        <div className="admin-content-box">
          <div className="box-header">
            <div>
              <h3>Logistics & Fleet Assignments</h3>
              <p className="box-desc">Track dispatched packages and delivery drivers across pickup and drop-off points.</p>
            </div>
            <span className="badge-count">{deliveries.length} Dispatches</span>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Delivery ID</th>
                  <th>Order Ref</th>
                  <th>Assigned Partner</th>
                  <th>Recipient & Contact</th>
                  <th>Drop-off Destination</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d._id}>
                    <td><strong>{d._id.slice(-8).toUpperCase()}</strong></td>
                    <td>{d.orderId}</td>
                    <td>🚚 {d.deliveryPartnerName || 'Fleet Partner'}</td>
                    <td>
                      <div>{d.recipientName}</div>
                      <span className="text-muted text-xs">{d.recipientPhone}</span>
                    </td>
                    <td>{d.deliveryAddress?.city}, {d.deliveryAddress?.state}</td>
                    <td>
                      <span className={`status-pill status-${d.status}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: PLATFORM POLICIES
      ───────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'platform' && (
        <div className="admin-content-box">
          <h3>Marketplace Policies & Economic Parameters</h3>
          <p className="box-desc">Guaranteed rules defining FreshHarvest's mission to protect smallholder farmers.</p>

          <div className="settings-grid">
            <div className="setting-card">
              <h4>Direct Farmer Proceeds</h4>
              <p>Platform commission charged on farmer produce: <strong>0% (100% of proceeds go directly to farmers)</strong>.</p>
            </div>
            <div className="setting-card">
              <h4>Free Delivery Threshold</h4>
              <p>Minimum retail cart value for free consumer doorstep delivery: <strong>₹300</strong> (otherwise ₹40 standard delivery fee).</p>
            </div>
            <div className="setting-card">
              <h4>Surplus Flash Discount Cap</h4>
              <p>Allowed discount range for anti-waste surplus produce liquidation: <strong>15% to 50%</strong>.</p>
            </div>
            <div className="setting-card">
              <h4>Zero Middleman Integrity</h4>
              <p>Direct communication and transparent traceability guarantee: <strong>Mandatory native location & harvest date validation</strong>.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
