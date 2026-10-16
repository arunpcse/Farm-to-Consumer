import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bulkOrderService, authService } from '../services/api';
import './BulkBuyerDashboard.css';

export default function BulkBuyerDashboard() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    async function loadBulkOrders() {
      setLoading(true);
      try {
        const res = await bulkOrderService.getBulkOrders();
        setOrders(res.bulkOrders || []);
      } catch (err) {
        setError(err.message || 'Failed to load bulk procurement history.');
      } finally {
        setLoading(false);
      }
    }
    loadBulkOrders();
  }, []);

  const totalProcuredAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalVolumeKg = orders.reduce(
    (sum, o) => sum + (o.items ? o.items.reduce((s, it) => s + (it.quantity || 0), 0) : 0),
    0
  );

  return (
    <div className="bb-dashboard-page">
      {/* Top Header Card */}
      <div className="bb-header-card">
        <div className="bb-header-main">
          <div className="bb-avatar">🏢</div>
          <div>
            <div className="bb-tags-row">
              <span className="badge-b2b">Verified B2B Buyer</span>
              <span className="badge-type">{user?.businessType ? user.businessType.toUpperCase() : 'HOTEL & MESS'}</span>
            </div>
            <h2>{user?.businessName || user?.name || 'Commercial Procurement Hub'}</h2>
            <p className="bb-gst">
              GSTIN: <strong>{user?.gstNumber || '33AAAAA0000A1Z5'}</strong> • Contact: {user?.phone || '+91 98941 77890'}
            </p>
          </div>
        </div>

        <div className="bb-header-actions">
          <Link to="/bulk-order" className="btn-new-rfq">
            + Request New Bulk Quote
          </Link>
          <Link to="/find-farmers" className="btn-find-farms">
            Connect Native Farms
          </Link>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="bb-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Volume Procured</span>
          <span className="kpi-val">{totalVolumeKg} kg</span>
          <span className="kpi-sub">Direct farm produce</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Gross Spend</span>
          <span className="kpi-val">₹{totalProcuredAmount.toLocaleString('en-IN')}</span>
          <span className="kpi-sub">Zero middleman markup</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Active Bulk Orders</span>
          <span className="kpi-val">{orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}</span>
          <span className="kpi-sub">In preparation & transit</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Estimated Savings</span>
          <span className="kpi-val">~28%</span>
          <span className="kpi-sub">Compared to city mandis</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bb-tabs">
        <button
          className={`bb-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Bulk Orders & RFQs ({orders.length})
        </button>
        <button
          className={`bb-tab ${activeTab === 'recurring' ? 'active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          📅 Harvest Standing Schedule
        </button>
        <button
          className={`bb-tab ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          🤝 Preferred Farmer Network
        </button>
      </div>

      {/* Tab 1: Orders List */}
      {activeTab === 'orders' && (
        <div className="bb-content-card">
          <div className="card-top-bar">
            <h3>Procurement Batches & Quotations</h3>
            <span className="info-pill">Updated in real-time</span>
          </div>

          {loading && <div className="bb-loading">Loading bulk contracts...</div>}
          {error && <div className="bb-error">{error}</div>}

          {!loading && orders.length === 0 && (
            <div className="bb-empty">
              <p>No bulk orders requested yet.</p>
              <Link to="/bulk-order" className="btn-primary-small">Create your first bulk requisition</Link>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="bb-table-wrap">
              <table className="bb-table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Partner Farm</th>
                    <th>Items & Volumes</th>
                    <th>Total Value</th>
                    <th>Status</th>
                    <th>Requested Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord._id || ord.bulkOrderId}>
                      <td className="fw-bold">{ord.bulkOrderId || 'FH-BLK-N/A'}</td>
                      <td>
                        <strong>{ord.farmerName || 'Assigned Farmer'}</strong>
                      </td>
                      <td>
                        {ord.items && ord.items.map((it, idx) => (
                          <div key={idx} className="order-sub-item">
                            • {it.name} — {it.quantity} {it.unit || 'kg'} (@ ₹{it.pricePerUnit})
                          </div>
                        ))}
                      </td>
                      <td className="text-price">₹{ord.totalAmount?.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`status-pill status-${(ord.status || 'requested').toLowerCase()}`}>
                          {ord.status || 'Requested'}
                        </span>
                      </td>
                      <td>
                        {ord.requestedDeliveryDate
                          ? new Date(ord.requestedDeliveryDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Immediate Harvest'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Harvest Standing Schedule */}
      {activeTab === 'recurring' && (
        <div className="bb-content-card">
          <h3>Mess & Commercial Kitchen Standing Procurements</h3>
          <p className="card-desc">
            Lock in regular farm harvest dispatches on defined days of the week to ensure kitchens receive fresh farm stock without placing daily orders.
          </p>

          <div className="schedule-grid">
            <div className="schedule-card">
              <div className="schedule-day">Every Monday & Thursday</div>
              <h4>Organic Farm Vegetables Kit</h4>
              <p>Tomatoes (60kg), Country Spinach (30 bunches), Onions (40kg)</p>
              <div className="schedule-meta">
                <span>Supplier: Ramasamy Farms, Perundurai</span>
                <span className="status-tag active">Standing Active</span>
              </div>
            </div>

            <div className="schedule-card">
              <div className="schedule-day">Every Wednesday</div>
              <h4>Breakfast Hill Fruits Supply</h4>
              <p>Cavendish Bananas (40 dozen), Tender Coconuts (50 pieces)</p>
              <div className="schedule-meta">
                <span>Supplier: Kaveri Valley Orchards, Pollachi</span>
                <span className="status-tag active">Standing Active</span>
              </div>
            </div>

            <div className="schedule-card new-slot">
              <div className="plus-icon">+</div>
              <h4>Add New Kitchen Standing Schedule</h4>
              <p>Select crops, weekly delivery days, and pre-negotiated farm rate.</p>
              <Link to="/bulk-order" className="btn-setup">Setup Schedule</Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preferred Farmer Network */}
      {activeTab === 'contracts' && (
        <div className="bb-content-card">
          <h3>Your Direct Farm Partners</h3>
          <p className="card-desc">
            Directly contracted local family farms providing regular batches for your establishment.
          </p>

          <div className="partners-grid">
            <div className="partner-card">
              <div className="partner-icon">🌱</div>
              <h4>Ramasamy Farms</h4>
              <p className="partner-loc">📍 Perundurai, Erode • 5 Acres Organic</p>
              <p className="partner-bio">Contracted supplier for heirloom tomatoes and country single-boiled rice.</p>
              <Link to="/farmer/f1" className="btn-view-farm-small">View Farm Catalog</Link>
            </div>

            <div className="partner-card">
              <div className="partner-icon">🍌</div>
              <h4>Kaveri Valley Orchards</h4>
              <p className="partner-loc">📍 Pollachi, Coimbatore • 8 Acres Natural</p>
              <p className="partner-bio">Contracted supplier for sweet hill bananas and tender coconuts.</p>
              <Link to="/farmer/f2" className="btn-view-farm-small">View Farm Catalog</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
