import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import './Register.css';

const ROLES = [
  { id: 'customer', icon: '🛒', title: 'Household Buyer', desc: 'Shop farm-fresh produce delivered to your doorstep in 24 hours.' },
  { id: 'farmer', icon: '👨‍🌾', title: 'Local Farmer', desc: 'List your harvest yields, set transparent prices, and receive direct bank payouts.' },
  { id: 'bulk_buyer', icon: '🏨', title: 'Commercial / B2B', desc: 'Procure wholesale produce for restaurants, hostel messes, and catering canteens.' },
  { id: 'delivery_partner', icon: '🚚', title: 'Delivery Partner', desc: 'Earn income transporting farm crates gently from farm gates to consumers.' },
];

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');

  // Role specific fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [gstNumber, setGstNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
        businessName: role === 'bulk_buyer' ? businessName.trim() : undefined,
        businessType: role === 'bulk_buyer' ? businessType : undefined,
        gstNumber: role === 'bulk_buyer' ? gstNumber.trim() : undefined,
        vehicleNumber: role === 'delivery_partner' ? vehicleNumber.trim() : undefined,
        licenseNumber: role === 'delivery_partner' ? licenseNumber.trim() : undefined
      });

      setSuccess('Account created successfully! Welcome to FreshHarvest.');
      setTimeout(() => {
        if (role === 'farmer') navigate('/farmer-dashboard');
        else if (role === 'bulk_buyer') navigate('/bulk-buyer-dashboard');
        else if (role === 'delivery_partner') navigate('/delivery-dashboard');
        else navigate('/products');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reg-page">
      <div className="reg-card">
        <div className="reg-header">
          <span className="reg-kicker">Join the FreshHarvest Network</span>
          <h1>Create Your Account</h1>
          <p className="reg-sub">
            Direct Farm-to-Consumer & Bulk Procurement Marketplace in Tamil Nadu.
          </p>
        </div>

        {error && <div className="reg-alert reg-alert-error">{error}</div>}
        {success && <div className="reg-alert reg-alert-success">{success}</div>}

        {/* Role Selector Grid */}
        <div className="reg-role-section">
          <label className="reg-field-label">Select Account Type:</label>
          <div className="reg-roles-grid">
            {ROLES.map(r => (
              <div
                key={r.id}
                className={`reg-role-card ${role === r.id ? 'active' : ''}`}
                onClick={() => setRole(r.id)}
                role="button"
                tabIndex={0}
              >
                <span className="reg-rc-icon">{r.icon}</span>
                <div className="reg-rc-info">
                  <strong>{r.title}</strong>
                  <p>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="reg-form">
          <div className="reg-form-grid">
            <div className="reg-group">
              <label htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                type="text"
                placeholder="e.g. Murugan Rajan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="reg-group">
              <label htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                type="email"
                placeholder="e.g. murugan@farms.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="reg-group">
              <label htmlFor="reg-password">Password (min. 6 characters) *</label>
              <input
                id="reg-password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="reg-group">
              <label htmlFor="reg-phone">Phone Number</label>
              <input
                id="reg-phone"
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Role specific inputs */}
          {role === 'bulk_buyer' && (
            <div className="reg-role-fields">
              <h3>🏨 Commercial / B2B Details</h3>
              <div className="reg-form-grid">
                <div className="reg-group">
                  <label htmlFor="reg-bizname">Business Name</label>
                  <input
                    id="reg-bizname"
                    type="text"
                    placeholder="e.g. PSG Tech Hostel Mess / Anandha Bhavan"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="reg-group">
                  <label htmlFor="reg-biztype">Establishment Type</label>
                  <select
                    id="reg-biztype"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  >
                    <option value="restaurant">Restaurant / Hotel</option>
                    <option value="hostel_mess">College / Hostel Mess</option>
                    <option value="canteen">Industrial / Hospital Canteen</option>
                    <option value="grocery_store">Organic Grocery Store</option>
                  </select>
                </div>
                <div className="reg-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="reg-gst">GST Number (Optional)</label>
                  <input
                    id="reg-gst"
                    type="text"
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {role === 'delivery_partner' && (
            <div className="reg-role-fields">
              <h3>🚚 Delivery Fleet Information</h3>
              <div className="reg-form-grid">
                <div className="reg-group">
                  <label htmlFor="reg-vehiclenum">Vehicle Number</label>
                  <input
                    id="reg-vehiclenum"
                    type="text"
                    placeholder="e.g. TN 33 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>
                <div className="reg-group">
                  <label htmlFor="reg-licensenum">Driving License Number</label>
                  <input
                    id="reg-licensenum"
                    type="text"
                    placeholder="e.g. TN33 20180004567"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="reg-btn-submit" disabled={loading}>
            {loading ? 'Creating Account…' : 'Register Free & Get Started →'}
          </button>
        </form>

        <p className="reg-footer-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;