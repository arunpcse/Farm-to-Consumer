import { useState, useEffect } from 'react';
import { deliveryService, authService } from '../services/api';
import './DeliveryDashboard.css';

export default function DeliveryDashboard() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    setLoading(true);
    try {
      const res = await deliveryService.getAssignedDeliveries();
      setDeliveries(res.deliveries || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch deliveries.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id, newStatus) {
    setUpdatingId(id);
    try {
      await deliveryService.updateDeliveryStatus(id, newStatus);
      await loadDeliveries();
    } catch (err) {
      alert(err.message || 'Status update failed.');
    } finally {
      setUpdatingId(null);
    }
  }

  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled');
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');
  const totalEarnings = completedDeliveries.reduce((sum, d) => sum + (d.deliveryFee || 50), 0);

  return (
    <div className="del-dashboard-page">
      {/* Top Driver Header */}
      <div className="del-header">
        <div className="driver-info">
          <div className="driver-avatar">🚚</div>
          <div>
            <div className="driver-badge-row">
              <span className="badge-role">FreshHarvest Fleet Partner</span>
              <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                ● {isOnline ? 'Active on Duty' : 'Off Duty'}
              </span>
            </div>
            <h2>{user?.name || 'Karthik Raja'}</h2>
            <p className="vehicle-details">
              Vehicle: <strong>{user?.vehicleNumber || 'TN-33-AX-8942'}</strong> • DL: {user?.licenseNumber || 'TN3320210045678'}
            </p>
          </div>
        </div>

        <div className="driver-actions">
          <button
            className={`btn-duty-toggle ${isOnline ? 'btn-offline' : 'btn-online'}`}
            onClick={() => setIsOnline(!isOnline)}
          >
            {isOnline ? 'Go Off Duty' : 'Go Online & Accept Deliveries'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="del-stats-grid">
        <div className="stat-box">
          <span className="stat-title">Assigned Active Trips</span>
          <span className="stat-value">{activeDeliveries.length}</span>
          <span className="stat-trend">Ready for pickup & dispatch</span>
        </div>
        <div className="stat-box">
          <span className="stat-title">Completed Today</span>
          <span className="stat-value">{completedDeliveries.length}</span>
          <span className="stat-trend">Deliveries completed</span>
        </div>
        <div className="stat-box">
          <span className="stat-title">Delivery Earnings</span>
          <span className="stat-value">₹{totalEarnings}</span>
          <span className="stat-trend">Direct payout to bank</span>
        </div>
      </div>

      {/* Main Delivery Queue */}
      <div className="del-main-section">
        <h3>📍 Active Delivery Task Queue</h3>

        {loading && <div className="del-loading">Loading assigned deliveries...</div>}
        {error && <div className="del-error">{error}</div>}

        {!loading && activeDeliveries.length === 0 && (
          <div className="del-empty">
            <span className="empty-emoji">✨</span>
            <h4>No Pending Deliveries</h4>
            <p>You have cleared all assigned farm-to-table deliveries for now. New orders will appear here.</p>
          </div>
        )}

        <div className="del-cards-list">
          {activeDeliveries.map((delivery) => (
            <div key={delivery._id} className="del-card">
              <div className="del-card-header">
                <span className="order-tag">Order #{delivery.orderId}</span>
                <span className={`del-status-badge ${delivery.status}`}>
                  {delivery.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="del-route">
                <div className="route-stop pickup">
                  <span className="stop-marker">A</span>
                  <div className="stop-text">
                    <span className="stop-label">Farm Pickup Location:</span>
                    <strong className="stop-address">
                      {delivery.pickupAddress?.street}, {delivery.pickupAddress?.city}
                    </strong>
                  </div>
                </div>

                <div className="route-line"></div>

                <div className="route-stop dropoff">
                  <span className="stop-marker">B</span>
                  <div className="stop-text">
                    <span className="stop-label">Customer Delivery Address:</span>
                    <strong className="stop-address">
                      {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.city}
                    </strong>
                    <div className="recipient-row">
                      <span>👤 {delivery.recipientName}</span>
                      <a href={`tel:${delivery.recipientPhone}`} className="phone-btn">
                        📞 Call {delivery.recipientPhone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {delivery.notes && (
                <div className="del-notes">
                  ℹ️ Handling Notes: {delivery.notes}
                </div>
              )}

              <div className="del-card-footer">
                <div className="fee-info">
                  <span>Trip Fare:</span> <strong>₹{delivery.deliveryFee || 65}</strong>
                </div>

                <div className="step-actions">
                  {delivery.status === 'assigned' && (
                    <button
                      className="btn-step pickup-btn"
                      disabled={updatingId === delivery._id}
                      onClick={() => handleStatusUpdate(delivery._id, 'picked_up')}
                    >
                      {updatingId === delivery._id ? 'Updating...' : '✓ Confirm Pickup from Farm'}
                    </button>
                  )}

                  {delivery.status === 'picked_up' && (
                    <button
                      className="btn-step transit-btn"
                      disabled={updatingId === delivery._id}
                      onClick={() => handleStatusUpdate(delivery._id, 'out_for_delivery')}
                    >
                      {updatingId === delivery._id ? 'Updating...' : '🚀 Start Out for Delivery'}
                    </button>
                  )}

                  {delivery.status === 'out_for_delivery' && (
                    <button
                      className="btn-step deliver-btn"
                      disabled={updatingId === delivery._id}
                      onClick={() => handleStatusUpdate(delivery._id, 'delivered')}
                    >
                      {updatingId === delivery._id ? 'Updating...' : '📦 Confirm Delivered to Customer'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
