import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/api';
import './PaymentConfirmation.css';

function PaymentConfirmation() {
  const { transactionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchConfirmation() {
      if (!transactionId) {
        setLoading(false);
        return;
      }
      try {
        const res = await orderService.getPaymentConfirmation(transactionId);
        setData(res);
      } catch (err) {
        // Fallback: check if transactionId was actually an orderId
        try {
          const orderRes = await orderService.getOrderById(transactionId);
          if (orderRes.order) {
            setData({
              order: orderRes.order,
              payment: {
                transactionId: orderRes.order.transactionId,
                orderId: orderRes.order.orderId,
                amount: orderRes.order.totalAmount,
                paymentMethod: orderRes.order.paymentMethod,
                status: orderRes.order.paymentStatus === 'Paid' ? 'Completed' : 'Pending',
                customerName: orderRes.order.customerName,
                customerEmail: orderRes.order.customerEmail,
                createdAt: orderRes.order.createdAt
              }
            });
          }
        } catch {
          setError(err.message || 'Payment confirmation details could not be found.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchConfirmation();
  }, [transactionId]);

  if (loading) {
    return (
      <div className="payment-confirm-page loading-box">
        <div className="spinner"></div>
        <p>Loading payment confirmation & receipt...</p>
      </div>
    );
  }

  const payment = data?.payment;
  const order = data?.order;

  return (
    <div className="payment-confirm-page">
      <div className="confirm-card-wrapper">
        {/* Success Header Banner */}
        <div className="confirm-header-card">
          <div className="success-badge-circle">
            <span className="checkmark-icon">✓</span>
          </div>
          <span className="confirm-chip">Official Payment Receipt</span>
          <h1 className="confirm-main-title">Payment Confirmation</h1>
          <p className="confirm-sub">
            Your transaction has been processed successfully. Your fresh harvest order is confirmed!
          </p>
        </div>

        {/* Transaction Summary Grid */}
        <div className="receipt-details-box">
          <div className="receipt-grid-3">
            <div className="receipt-field">
              <span className="field-label">Transaction ID</span>
              <span className="field-value highlight-mono">{payment?.transactionId || transactionId}</span>
            </div>

            <div className="receipt-field">
              <span className="field-label">Order Reference</span>
              <span className="field-value highlight-mono">{order?.orderId || payment?.orderId || 'FH-ORD-RECENT'}</span>
            </div>

            <div className="receipt-field">
              <span className="field-label">Payment Status</span>
              <span className={`status-pill ${payment?.status === 'Completed' || order?.paymentStatus === 'Paid' ? 'paid' : 'pending'}`}>
                ● {payment?.status === 'Completed' || order?.paymentStatus === 'Paid' ? 'Payment Verified (Completed)' : 'Cash On Delivery (Pending)'}
              </span>
            </div>

            <div className="receipt-field">
              <span className="field-label">Payment Method</span>
              <span className="field-value">
                {payment?.paymentMethod === 'UPI' && '📱 UPI / QR'}
                {payment?.paymentMethod === 'Credit/Debit Card' && '💳 Credit / Debit Card'}
                {payment?.paymentMethod === 'Net Banking' && '🏦 Net Banking'}
                {payment?.paymentMethod === 'Cash on Delivery' && '💵 Cash on Delivery'}
                {!['UPI', 'Credit/Debit Card', 'Net Banking', 'Cash on Delivery'].includes(payment?.paymentMethod) && (payment?.paymentMethod || 'Online Payment')}
              </span>
            </div>

            <div className="receipt-field">
              <span className="field-label">Amount Paid</span>
              <span className="field-value amount-text">₹{payment?.amount || order?.totalAmount || '0'}</span>
            </div>

            <div className="receipt-field">
              <span className="field-label">Date & Time</span>
              <span className="field-value">
                {payment?.createdAt ? new Date(payment.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : new Date().toLocaleString()}
              </span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Delivery & Recipient Snapshot */}
          <div className="recipient-snapshot-box">
            <div className="snapshot-col">
              <h4>📦 Delivery Destination</h4>
              <p><strong>{order?.customerName || payment?.customerName}</strong></p>
              <p>{order?.shippingAddress?.street || 'Campus Road'}</p>
              <p>{order?.shippingAddress?.city}, {order?.shippingAddress?.state} - {order?.shippingAddress?.zipCode}</p>
              <p>📞 {order?.customerPhone || '9876543210'}</p>
            </div>

            <div className="snapshot-col">
              <h4>🌱 Harvest Schedule</h4>
              <p className="harvest-date">
                Estimated Delivery: <strong>Tomorrow morning before 10:00 AM</strong>
              </p>
              <span className="harvest-note">Direct from farm gate to your kitchen table.</span>
            </div>
          </div>

          {/* Purchased Items Breakdown */}
          {order?.items && order.items.length > 0 && (
            <div className="items-receipt-list">
              <h4>Ordered Items Summary</h4>
              <div className="items-table">
                {order.items.map((it, idx) => (
                  <div key={idx} className="item-line">
                    <span className="item-title">{it.name} ({it.quantity} {it.unit || 'kg'})</span>
                    <span className="item-farmer">👨‍🌾 {it.farmerName || 'Local Organic Farmer'}</span>
                    <span className="item-price">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <Link to="/orders" className="fh-btn-primary action-btn">
            🚚 Track Delivery & Confirm Delivery Status
          </Link>

          <Link to="/payments" className="fh-btn-secondary action-btn">
            📜 View Payment History
          </Link>

          <Link to="/products" className="fh-btn-outline action-btn">
            🌾 Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentConfirmation;
