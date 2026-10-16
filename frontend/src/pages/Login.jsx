import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import './Login.css';

const QUICK_ACCOUNTS = [
  { role: 'Consumer', email: 'customer@freshharvest.in', pass: 'password123', icon: '🛒' },
  { role: 'Farmer', email: 'farmer@freshharvest.in', pass: 'password123', icon: '👨‍🌾' },
  { role: 'Bulk Buyer', email: 'bulkbuyer@freshharvest.in', pass: 'password123', icon: '🏨' },
  { role: 'Delivery', email: 'delivery@freshharvest.in', pass: 'password123', icon: '🚚' },
  { role: 'Admin', email: 'admin@freshharvest.in', pass: 'admin123', icon: '🛡️' },
];

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login({
        email: email.trim(),
        password
      });

      setSuccess(`Welcome back, ${data.user.name}! Redirecting...`);
      setTimeout(() => {
        if (data.user.role === 'farmer') navigate('/farmer-dashboard');
        else if (data.user.role === 'bulk_buyer') navigate('/bulk-buyer-dashboard');
        else if (data.user.role === 'delivery_partner') navigate('/delivery-dashboard');
        else if (data.user.role === 'admin') navigate('/admin');
        else navigate('/products');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(acc) {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-kicker">Welcome Back to FreshHarvest</span>
          <h1>Sign In</h1>
          <p className="login-subtitle">Access your orders, harvest catalog, or B2B deliveries.</p>
        </div>

        {error && <div className="login-alert login-alert-error">{error}</div>}
        {success && <div className="login-alert login-alert-success">{success}</div>}

        <form onSubmit={handleSubmit} noValidate className="login-form">
          <div className="login-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="e.g. farmer@freshharvest.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-group">
            <div className="password-label-wrapper">
              <label htmlFor="login-password">Password</label>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* Quick Demo Role Fill Section */}
        <div className="login-quick-section">
          <span className="quick-label">⚡ 1-Click Test Login By Role:</span>
          <div className="quick-buttons-row">
            {QUICK_ACCOUNTS.map(acc => (
              <button
                key={acc.role}
                type="button"
                className="quick-role-btn"
                onClick={() => handleQuickFill(acc)}
                title={`Fill credentials for ${acc.role} (${acc.email})`}
              >
                <span>{acc.icon}</span> {acc.role}
              </button>
            ))}
          </div>
        </div>

        <p className="login-footer-text">
          Don't have an account yet? <Link to="/register">Create an account free</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
