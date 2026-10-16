import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService, authService } from '../services/api';
import DeliveryTrackingModal from '../components/DeliveryTrackingModal';
import './Orders.css';

const DELIVERY_STEPS = [
  { key: 'Placed', label: 'Order Placed', icon: '📦' },
  { key: 'Packed', label: 'Packed at Farm', icon: '🌾' },
  { key: 'Shipped', label: 'Dispatched / In Transit', icon: '🚚' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: '🛵' },
  { key: 'Delivered', label: 'Order Delivered', icon: '✅' }
];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Placed order by mistake');
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [trackingOrder, setTrackingOrder] = useState(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  }

  function showMessage(msg) {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  }

  // Confirm Delivery / Advance Delivery Status
  async function handleAdvanceDelivery(order) {
    const currentIdx = DELIVERY_STEPS.findIndex(s => s.key === order.orderStatus);
    if (currentIdx === -1 || currentIdx >= DELIVERY_STEPS.length - 1) return;

    const nextStatus = DELIVERY_STEPS[currentIdx + 1].key;
    setActionLoading(true);

    try {
      const res = await orderService.updateDeliveryStatus(
        order.orderId,
        nextStatus,
        nextStatus === 'Delivered'
          ? 'Delivery verified and completed by recipient.'
          : `Package updated to ${nextStatus}`
      );
      setOrders(prev => prev.map(o => o.orderId === order.orderId ? res.order : o));
      showMessage(nextStatus === 'Delivered' ? `🎉 Order ${order.orderId} Confirmed Delivered!` : `Updated status to ${nextStatus}`);
    } catch (err) {
      alert(err.message || 'Failed to update delivery status');
    } finally {
      setActionLoading(false);
    }
  }

  // Quick Direct "Confirm Delivery"
  async function handleDirectConfirmDelivery(order) {
    setActionLoading(true);
    try {
      const res = await orderService.updateDeliveryStatus(
        order.orderId,
        'Delivered',
        'Customer confirmed delivery of fresh harvest at doorstep.'
      );
      setOrders(prev => prev.map(o => o.orderId === order.orderId ? res.order : o));
      showMessage(`🎉 Delivery confirmed! Order ${order.orderId} marked as Order Delivered.`);
    } catch (err) {
      alert(err.message || 'Failed to confirm delivery');
    } finally {
      setActionLoading(false);
    }
  }

  // Cancel Order
  async function handleCancelOrder() {
    if (!cancelModalOrder) return;
    setActionLoading(true);
    try {
      const res = await orderService.cancelOrder(cancelModalOrder.orderId, cancelReason);
      setOrders(prev => prev.map(o => o.orderId === cancelModalOrder.orderId ? res.order : o));
      showMessage(`Order ${cancelModalOrder.orderId} has been cancelled successfully.`);
      setCancelModalOrder(null);
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        {/* Toast */}
        {successToast && (
          <div className="orders-toast">
            <span>🌿</span>
            <span>{successToast}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="orders-header">
          <div>
            <span className="orders-tag">Order Tracking & Delivery Management</span>
            <h1 className="orders-title">Orders & Delivery Tracking</h1>
            <p className="orders-subtitle">
              Manage live farm fulfillment, step through delivery tracking, confirm delivery, or cancel orders.
            </p>
          </div>
          <div className="orders-header-actions">
            <Link to="/products" className="fh-btn-primary">
              + Shop More Fresh Produce
            </Link>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="orders-loading">
            <div className="spinner"></div>
            <p>Loading your farm orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-orders-card">
            <span className="empty-icon">📦</span>
            <h2>No orders placed yet</h2>
            <p>You haven't placed any orders yet. Discover fresh harvests and place your first order!</p>
            <Link to="/products" className="fh-btn-primary">
              🌾 Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const currentStepIdx = DELIVERY_STEPS.findIndex(s => s.key === order.orderStatus);
              const isDelivered = order.orderStatus === 'Delivered';
              const isCancelled = order.orderStatus === 'Cancelled';
              const canCancel = !isDelivered && !isCancelled && ['Placed', 'Packed'].includes(order.orderStatus);

              return (
                <div key={order.orderId} className={`order-card ${isCancelled ? 'cancelled' : ''} ${isDelivered ? 'delivered' : ''}`}>
                  {/* Order Top Bar */}
                  <div className="order-top-bar">
                    <div className="order-id-group">
                      <span className="order-id-label">Order ID</span>
                      <strong className="order-id-val">{order.orderId}</strong>
                      <span className="order-date">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="order-badges-group">
                      <span className={`order-status-badge status-${order.orderStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                        {isDelivered && '✅ '}
                        {isCancelled && '✕ '}
                        {order.orderStatus}
                      </span>
                      <span className={`payment-status-badge pay-${order.paymentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Tracking Stepper */}
                  {!isCancelled && (
                    <div className="delivery-tracking-panel">
                      <div className="tracking-header">
                        <span className="tracking-title">🚚 Delivery Status Timeline</span>
                        {isDelivered ? (
                          <span className="delivered-time-chip">
                            Delivered at {order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}
                          </span>
                        ) : (
                          <span className="est-arrival">
                            Estimated Arrival: Tomorrow morning
                          </span>
                        )}
                      </div>

                      <div className="stepper-track">
                        {DELIVERY_STEPS.map((step, idx) => {
                          const isComplete = currentStepIdx >= idx;
                          const isCurrent = currentStepIdx === idx;

                          return (
                            <div key={step.key} className={`stepper-node ${isComplete ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                              <div className="node-icon-circle">
                                {isComplete ? step.icon : idx + 1}
                              </div>
                              <span className="node-label">{step.label}</span>
                              {idx < DELIVERY_STEPS.length - 1 && (
                                <div className={`stepper-line ${currentStepIdx > idx ? 'completed-line' : ''}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Interactive Delivery Controls */}
                      <div className="delivery-controls-bar">
                        <button
                          type="button"
                          className="advance-btn"
                          style={{ background: '#0284c7' }}
                          onClick={() => setTrackingOrder(order)}
                        >
                          📍 Live Delivery & Driver Tracking
                        </button>

                        {!isDelivered ? (
                          <>
                            <button
                              type="button"
                              className="advance-btn"
                              disabled={actionLoading}
                              onClick={() => handleAdvanceDelivery(order)}
                            >
                              ⚡ Advance Status →
                            </button>

                            <button
                              type="button"
                              className="confirm-delivery-btn"
                              disabled={actionLoading}
                              onClick={() => handleDirectConfirmDelivery(order)}
                            >
                              ✅ Confirm Delivered
                            </button>
                          </>
                        ) : (
                          <div className="delivered-confirmation-banner">
                            <span className="banner-icon">🎉</span>
                            <div>
                              <strong>Order Delivered Successfully!</strong>
                              <span>Recipient verified produce quality at doorstep. Enjoy your fresh organic harvest!</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* If Cancelled */}
                  {isCancelled && (
                    <div className="order-cancelled-notice">
                      <span className="cancelled-icon">✕</span>
                      <div>
                        <strong>Order Cancelled</strong>
                        <p>Reason: {order.cancellationReason || 'Cancelled by customer'}</p>
                        <span className="refund-tag">Payment Status: {order.paymentStatus}</span>
                      </div>
                    </div>
                  )}

                  {/* Order Items & Summary */}
                  <div className="order-content-grid">
                    <div className="order-items-column">
                      <span className="column-title">Purchased Farm Produce ({order.items?.length || 0})</span>
                      <div className="order-items-table">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="order-item-tile">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="tile-img"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="tile-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5e9', fontSize: '1.4rem' }}>
                                🌱
                              </div>
                            )}
                            <div className="tile-info">
                              <span className="tile-name">{item.name}</span>
                              <span className="tile-farmer">👨‍🌾 {item.farmerName}</span>
                              <span className="tile-qty">{item.quantity} {item.unit || 'kg'} × ₹{item.price}</span>
                            </div>
                            <span className="tile-total">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="order-details-column">
                      <span className="column-title">Delivery & Payment Information</span>
                      <div className="info-card">
                        <div className="info-row">
                          <span className="info-label">Recipient</span>
                          <span className="info-val">{order.customerName} ({order.customerPhone})</span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Address</span>
                          <span className="info-val">
                            {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Payment Method</span>
                          <span className="info-val font-bold">{order.paymentMethod}</span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Transaction ID</span>
                          <span className="info-val highlight-mono">{order.transactionId}</span>
                        </div>

                        <div className="info-divider"></div>

                        <div className="info-row total-row">
                          <span className="total-label">Grand Total Paid</span>
                          <span className="total-val">₹{order.totalAmount}</span>
                        </div>
                      </div>

                      {/* Cancel Order Button */}
                      {canCancel && (
                        <div className="cancel-action-wrap">
                          <button
                            type="button"
                            className="cancel-order-trigger-btn"
                            onClick={() => setCancelModalOrder(order)}
                          >
                            ✕ Cancel Order
                          </button>
                          <span className="cancel-note">Order can be cancelled before dispatch</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Order Modal */}
        {cancelModalOrder && (
          <div className="modal-overlay">
            <div className="cancel-modal-card">
              <div className="modal-header">
                <h3>Cancel Order #{cancelModalOrder.orderId}</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setCancelModalOrder(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <p>Are you sure you want to cancel this order? If paid online, a full refund of <strong>₹{cancelModalOrder.totalAmount}</strong> will be initiated.</p>

                <div className="form-group">
                  <label>Please select a cancellation reason:</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="cancel-select"
                  >
                    <option value="Placed order by mistake">Placed order by mistake</option>
                    <option value="Want to change shipping address">Want to change shipping address</option>
                    <option value="Need different quantity/produce">Need different quantity/produce</option>
                    <option value="Found alternative harvest locally">Found alternative harvest locally</option>
                    <option value="Other personal reason">Other personal reason</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="fh-btn-secondary"
                  onClick={() => setCancelModalOrder(null)}
                  disabled={actionLoading}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="confirm-cancel-btn"
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Live Delivery Tracking Modal (Module 18) */}
        <DeliveryTrackingModal
          isOpen={Boolean(trackingOrder)}
          onClose={() => setTrackingOrder(null)}
          order={trackingOrder}
        />
      </div>
    </div>
  );
}

export default Orders;
