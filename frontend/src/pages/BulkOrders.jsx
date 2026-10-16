import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService, bulkOrderService } from '../services/api';
import './BulkOrders.css';

const STATUS_COLORS = {
  Requested: 'requested', Accepted: 'accepted', Rejected: 'rejected',
  Preparing: 'preparing', Ready: 'ready', Dispatched: 'dispatched',
  Delivered: 'delivered', Cancelled: 'cancelled'
};

export default function BulkOrders() {
  const user = authService.getCurrentUser();
  const [bulkOrders, setBulkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      try {
        const res = await bulkOrderService.getBulkOrders({ buyerId: user.id });
        setBulkOrders(res.bulkOrders || []);
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
      <div className="bulk-orders-page">
        <div className="bos-inner">
          <div className="bos-login-prompt">
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>🔒</span>
            <h2>Please Login</h2>
            <p>You need to be logged in to view your bulk orders.</p>
            <Link to="/login" className="fh-btn-primary">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-orders-page">
      <div className="bos-inner">
        <div className="bos-header">
          <h1>🏪 My Bulk Orders</h1>
          <p>Track your bulk order requests and their status from farmers.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : bulkOrders.length === 0 ? (
          <div className="bos-empty">
            <span className="bos-empty-icon">📋</span>
            <h3>No Bulk Orders Yet</h3>
            <p style={{ marginBottom: 20 }}>You haven't placed any bulk order requests. Find a farmer and request a bulk order!</p>
            <Link to="/find-farmers" className="fh-btn-primary">👨‍🌾 Find Farmers</Link>
          </div>
        ) : (
          <div className="bos-list">
            {bulkOrders.map(order => {
              const isOpen = expanded[order._id];
              const statusKey = (order.status || '').toLowerCase();
              return (
                <div key={order._id} className={`bos-card ${isOpen ? 'expanded' : ''}`}>
                  <div className="bos-card-header" onClick={() => setExpanded(prev => ({ ...prev, [order._id]: !prev[order._id] }))}>
                    <div className="bos-card-left">
                      <div>
                        <div className="bos-order-id">{order.bulkOrderId}</div>
                        <div className="bos-farmer">🌾 {order.farmerName || 'Farmer'}</div>
                        <div className="bos-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className="bos-card-right">
                      <span className={`bos-status bos-status-${STATUS_COLORS[order.status] || 'requested'}`}>{order.status}</span>
                      <span className="bos-total">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                      <span className="bos-expand-icon">▼</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="bos-card-body">
                      <div className="bos-items-title">Items Ordered</div>
                      <div className="bos-items-list">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="bos-item-tag">
                            <span className="bos-item-name">{item.name}</span>
                            <span className="bos-item-qty"> · {item.quantity}{item.unit} @ ₹{item.pricePerUnit}/{item.unit}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bos-detail-grid">
                        <div className="bos-detail">
                          <span className="bos-detail-label">Buyer Type</span>
                          <span className="bos-detail-value">{order.buyerType}</span>
                        </div>
                        <div className="bos-detail">
                          <span className="bos-detail-label">Requested Delivery</span>
                          <span className="bos-detail-value">
                            {order.requestedDeliveryDate
                              ? new Date(order.requestedDeliveryDate).toLocaleDateString('en-IN')
                              : 'Not specified'}
                          </span>
                        </div>
                        <div className="bos-detail">
                          <span className="bos-detail-label">Delivery Address</span>
                          <span className="bos-detail-value">
                            {order.deliveryAddress
                              ? `${order.deliveryAddress.city}, ${order.deliveryAddress.district}`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {order.buyerNote && (
                        <div className="bos-note">📝 Your note: {order.buyerNote}</div>
                      )}
                      {order.farmerNote && (
                        <div className="bos-note" style={{ background: '#fef3c7', color: '#92400e' }}>
                          👨‍🌾 Farmer's note: {order.farmerNote}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
