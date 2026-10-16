import { useState } from 'react';
import { contactService, authService } from '../services/api';
import './DirectInquiryModal.css';

export default function DirectInquiryModal({ isOpen, onClose, farmer, product = null }) {
  const currentUser = authService.getCurrentUser();
  const [inquiryType, setInquiryType] = useState('product_availability');
  const [subject, setSubject] = useState(
    product ? `Inquiry regarding ${product.name}` : `Inquiry for ${farmer?.farmName || 'Farm'}`
  );
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a message or question for the farmer.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await contactService.submitInquiry({
        farmerId: farmer?._id || farmer?.farmerId,
        farmerName: farmer?.farmName || farmer?.name,
        productId: product?._id,
        productName: product?.name,
        inquiryType,
        subject,
        message,
        contactEmail,
        contactPhone
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="inquiry-overlay" onClick={onClose}>
      <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="inquiry-header">
          <div className="header-icon">💬</div>
          <div>
            <h3>Direct Contact with Farmer</h3>
            <p className="farmer-target">
              Sending to: <strong>{farmer?.farmName || 'Partner Farm'}</strong>
              {product && <span> • Regarding: {product.name}</span>}
            </p>
          </div>
          <button className="inquiry-close" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        {success ? (
          <div className="inquiry-success-state">
            <div className="success-icon">✅</div>
            <h4>Message Sent to Farmer!</h4>
            <p>The farmer has been notified and will contact you back directly via phone or email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="inquiry-form">
            {error && <div className="inquiry-error">{error}</div>}

            <div className="form-group-inline">
              <label>Inquiry Nature</label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="inquiry-select"
              >
                <option value="product_availability">Produce Availability & Stock</option>
                <option value="harvest_schedule">Harvest Schedule & Freshness</option>
                <option value="bulk_order">Wholesale / Bulk Requirement</option>
                <option value="quality_inquiry">Farming Practices & Organic Info</option>
                <option value="general_question">General Inquiry & Farm Visit</option>
              </select>
            </div>

            <div className="form-group-inline">
              <label>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="inquiry-input"
              />
            </div>

            <div className="form-group-inline">
              <label>Your Message / Requirements</label>
              <textarea
                rows={4}
                placeholder="Ask about harvest dates, custom quantities, bulk packaging, or farm practices..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="inquiry-textarea"
              />
            </div>

            <div className="form-row-two">
              <div className="form-group-inline">
                <label>Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="inquiry-input"
                />
              </div>

              <div className="form-group-inline">
                <label>Contact Email</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="inquiry-input"
                />
              </div>
            </div>

            <div className="inquiry-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-send" disabled={submitting}>
                {submitting ? 'Transmitting...' : 'Send Direct Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
