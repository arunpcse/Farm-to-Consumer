import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/api';
import './PaymentHistory.css';

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getPaymentHistory();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch payment history records.');
    } finally {
      setLoading(false);
    }
  }

  const filteredPayments = payments.filter(p => {
    if (filterMethod === 'All') return true;
    return p.paymentMethod === filterMethod;
  });

  const totalSpent = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const completedCount = payments.filter(p => p.status === 'Completed').length;

  return (
    <div className="payment-history-page">
      <div className="payment-history-container">
        {/* Header */}
        <div className="history-header">
          <div>
            <span className="history-tag">Financial Records & Gateway Audits</span>
            <h1 className="history-title">View Payment History</h1>
            <p className="history-subtitle">
              All payment transactions, mock gateway verifications, and invoice receipts.
            </p>
          </div>
          <Link to="/products" className="fh-btn-primary">
            + Shop Fresh Produce
          </Link>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Total Transactions</span>
            <span className="stat-value">{payments.length}</span>
            <span className="stat-sub">Lifetime orders</span>
          </div>

          <div className="stat-card highlight">
            <span className="stat-label">Total Amount Paid</span>
            <span className="stat-value">₹{totalSpent}</span>
            <span className="stat-sub">Direct to local farmers</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Successful Payments</span>
            <span className="stat-value">{completedCount}</span>
            <span className="stat-sub">Verified completions</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="history-filter-bar">
          <div className="filter-group">
            <label>Filter by Payment Method:</label>
            <div className="filter-chips">
              {['All', 'UPI', 'Credit/Debit Card', 'Net Banking', 'Cash on Delivery'].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`chip-btn ${filterMethod === m ? 'active' : ''}`}
                  onClick={() => setFilterMethod(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Table */}
        {loading ? (
          <div className="history-loading">
            <div className="spinner"></div>
            <p>Fetching payment transactions...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="empty-history-card">
            <span className="empty-icon">💳</span>
            <h3>No payment records found</h3>
            <p>
              {filterMethod !== 'All'
                ? `No transactions recorded using ${filterMethod}.`
                : 'No payments have been made yet. Once you place an order, payment records will appear here.'}
            </p>
            <Link to="/products" className="fh-btn-primary">
              Browse Produce & Shop
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Order Reference</th>
                  <th>Date & Time</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Receipt / Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const isCompleted = p.status === 'Completed';
                  const isRefunded = p.status === 'Refunded';

                  return (
                    <tr key={p.transactionId}>
                      <td>
                        <span className="txn-id-pill">{p.transactionId}</span>
                      </td>
                      <td>
                        <strong className="order-ref-link">{p.orderId}</strong>
                      </td>
                      <td>
                        <span className="date-cell">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          <small>
                            {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </span>
                      </td>
                      <td>
                        <div className="method-cell">
                          {p.paymentMethod === 'UPI' && '📱 UPI / QR'}
                          {p.paymentMethod === 'Credit/Debit Card' && '💳 Card'}
                          {p.paymentMethod === 'Net Banking' && '🏦 Net Banking'}
                          {p.paymentMethod === 'Cash on Delivery' && '💵 Cash On Delivery'}
                          {!['UPI', 'Credit/Debit Card', 'Net Banking', 'Cash on Delivery'].includes(p.paymentMethod) && p.paymentMethod}
                        </div>
                      </td>
                      <td>
                        <strong className="amount-cell">₹{p.amount}</strong>
                      </td>
                      <td>
                        <span className={`status-tag ${isCompleted ? 'success' : isRefunded ? 'refunded' : 'pending'}`}>
                          ● {p.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/payment-confirmation/${p.transactionId}`}
                          className="view-receipt-btn"
                          title="View Payment Confirmation & Receipt"
                        >
                          📄 View Receipt
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentHistory;
