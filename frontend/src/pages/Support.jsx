import { useState, useEffect } from 'react';
import { supportService, contactService, authService } from '../services/api';
import './Support.css';

const FAQS = [
  {
    q: 'How does FreshHarvest ensure harvest freshness?',
    a: 'Produce is harvested either on the day of delivery or the evening before. Farmers input their exact harvest dates into the listing so you know the produce was picked within 24–48 hours.'
  },
  {
    q: 'What is the Surplus & Anti-Waste initiative?',
    a: 'When farmers experience high harvest yields, they list surplus produce at 15–40% discounts on the Surplus page. This helps local buyers purchase affordable bulk goods while preventing nutritious food from spoiling.'
  },
  {
    q: 'Can I directly contact the farmer before ordering?',
    a: 'Yes! On every farmer profile page and product page, you can use the "Direct Inquiry" button to message the farmer directly about upcoming harvests, custom bulk orders, or farming practices.'
  },
  {
    q: 'How does delivery tracking work?',
    a: 'Once your order is harvested and packed by the farmer, an assigned FreshHarvest fleet delivery partner is dispatched. You can track your order live via the Orders page with step-by-step progress and call the driver directly.'
  }
];

export default function Support() {
  const currentUser = authService.getCurrentUser();
  const [complaintType, setComplaintType] = useState('produce_quality');
  const [orderId, setOrderId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [tickets, setTickets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    loadMyTickets();
  }, []);

  async function loadMyTickets() {
    try {
      const res = await supportService.getMyTickets();
      if (res.tickets && res.tickets.length > 0) {
        setTickets(res.tickets);
      } else {
        const contactRes = await contactService.getMyInquiries().catch(() => ({ inquiries: [] }));
        setTickets(contactRes.inquiries || []);
      }
    } catch {
      // Fallback
      contactService.getMyInquiries().then(res => setTickets(res.inquiries || [])).catch(() => {});
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please describe your issue or complaint in detail.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await supportService.submitTicket({
        category: complaintType,
        subject: subject || `Support Ticket: Order #${orderId || 'General'}`,
        message: orderId ? `[Order Ref: ${orderId}] ${message}` : message,
        contactEmail,
        contactPhone,
        orderId
      });

      setSuccess(true);
      setMessage('');
      setOrderId('');
      setSubject('');
      await loadMyTickets();
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="support-page">
      <div className="support-hero">
        <span className="support-badge">🤝 FreshHarvest Customer Care</span>
        <h1>Help & Complaint Management</h1>
        <p>
          We stand 100% behind the quality of our farm produce and delivery reliability. Report any issues below for immediate resolution.
        </p>
      </div>

      <div className="support-layout">
        {/* Left Column: Complaint / Ticket Form */}
        <div className="support-form-card">
          <h3>File a Support Ticket / Complaint</h3>
          <p className="card-subtitle">
            Our resolution desk reviews produce quality, delivery delays, and payment queries within 2 hours.
          </p>

          {success && (
            <div className="support-alert success">
              ✓ Your complaint ticket has been logged successfully. A resolution specialist has been assigned.
            </div>
          )}

          {error && <div className="support-alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="ticket-form">
            <div className="form-group">
              <label>Complaint Category</label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="support-select"
              >
                <option value="support_complaint">Damaged / Spoiled Produce Issue</option>
                <option value="delivery_delay">Delivery Partner Delay / Missing Order</option>
                <option value="billing_dispute">Payment / UPI Transaction Issue</option>
                <option value="wrong_item">Wrong Produce Delivered</option>
                <option value="general_question">General Marketplace Assistance</option>
              </select>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Order Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. FH-ORD-54321"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="support-input"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  className="support-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                placeholder="youremail@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                className="support-input"
              />
            </div>

            <div className="form-group">
              <label>Complaint Summary *</label>
              <input
                type="text"
                placeholder="Brief summary of what went wrong..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="support-input"
              />
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                rows={4}
                placeholder="Please describe the issue, packaging condition, or refund request..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="support-textarea"
              />
            </div>

            <button type="submit" className="btn-submit-ticket" disabled={submitting}>
              {submitting ? 'Registering Ticket...' : 'Submit Complaint Ticket'}
            </button>
          </form>

          {/* Past Submitted Tickets */}
          {tickets.length > 0 && (
            <div className="past-tickets-section">
              <h4>Your Logged Tickets & Resolution Status</h4>
              <div className="tickets-list">
                {tickets.map((t) => (
                  <div key={t._id} className="ticket-item">
                    <div className="ticket-header">
                      <strong>{t.ticketId ? `[${t.ticketId}] ` : ''}{t.subject}</strong>
                      <span className={`status-pill ${t.status || 'pending'}`}>
                        {(t.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                    <p className="ticket-desc">{t.message}</p>
                    {t.response && (
                      <div className="ticket-resolution">
                        <strong>Resolution:</strong> {t.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: FAQ & Contact Info */}
        <div className="support-sidebar">
          <div className="direct-help-card">
            <h4>Direct Resolution Lines</h4>
            <div className="help-channel">
              <span className="channel-icon">📞</span>
              <div>
                <strong>Farmer & Customer Helpline</strong>
                <p>1800-419-FARM (Mon–Sat, 7 AM – 8 PM)</p>
              </div>
            </div>
            <div className="help-channel">
              <span className="channel-icon">✉️</span>
              <div>
                <strong>Email Support</strong>
                <p>support@freshharvest.in</p>
              </div>
            </div>
          </div>

          <div className="faq-card">
            <h4>Frequently Answered Questions</h4>
            <div className="faq-accordion">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-toggle">{openFaq === idx ? '−' : '+'}</span>
                  </button>
                  {openFaq === idx && <div className="faq-answer">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
