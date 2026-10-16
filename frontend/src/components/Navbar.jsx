import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService, notificationService } from '../services/api';
import { useCart } from '../context/CartContext';
import BrandMark from './BrandMark';
import './Navbar.css';

const LOCATIONS = ['Erode', 'Perundurai', 'Bhavani', 'Gobichettipalayam', 'Coimbatore'];

function Navbar() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [deliveryLocation, setDeliveryLocation] = useState(
    () => localStorage.getItem('fh_location') || 'Erode'
  );
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setMenuOpen(false);

    if (currentUser) {
      notificationService.getNotifications()
        .then(res => setUnreadNotifs(res.unreadCount || 0))
        .catch(() => setUnreadNotifs(2));
    }
  }, [location]);

  function handleLogout() {
    authService.logout();
    setUser(null);
    navigate('/login');
  }

  function handleLocation(e) {
    setDeliveryLocation(e.target.value);
    localStorage.setItem('fh_location', e.target.value);
  }

  const farmerActive =
    location.pathname.startsWith('/find-farmers') ||
    location.pathname.startsWith('/farmers') ||
    (location.pathname.startsWith('/farmer') && !location.pathname.includes('dashboard'));

  return (
    <header className="fh-navbar">
      <div className="fh-navbar-container">
        <Link to="/" className="fh-brand">
          <BrandMark />
          <span className="fh-brand-text">
            <span className="fh-brand-name">FreshHarvest</span>
            <span className="fh-brand-tag">Farm to table</span>
          </span>
        </Link>

        <button
          type="button"
          className="fh-menu-toggle"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`fh-nav-links ${menuOpen ? 'is-open' : ''}`}>
          <Link to="/" className={`fh-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link
            to="/products"
            className={`fh-link ${location.pathname === '/products' ? 'active' : ''}`}
          >
            Shop
          </Link>
          <Link
            to="/surplus"
            className={`fh-link surplus-highlight ${location.pathname === '/surplus' ? 'active' : ''}`}
          >
            🔥 Surplus Deals
          </Link>
          <Link to="/find-farmers" className={`fh-link ${farmerActive ? 'active' : ''}`}>
            Farmers
          </Link>
          <Link
            to="/bulk-buyer-dashboard"
            className={`fh-link ${location.pathname.includes('bulk') ? 'active' : ''}`}
          >
            B2B Hub
          </Link>
          <Link
            to="/reports"
            className={`fh-link ${location.pathname === '/reports' || location.pathname === '/analytics' ? 'active' : ''}`}
          >
            📊 Analytics
          </Link>
          {user?.role === 'farmer' && (
            <Link
              to="/farmer-dashboard"
              className={`fh-link ${location.pathname.includes('farmer-dashboard') ? 'active' : ''}`}
            >
              Farm Ops
            </Link>
          )}
          {user?.role === 'delivery_partner' && (
            <Link
              to="/delivery-dashboard"
              className={`fh-link ${location.pathname.includes('delivery-dashboard') ? 'active' : ''}`}
            >
              Fleet
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`fh-link ${location.pathname.includes('admin') ? 'active' : ''}`}
            >
              Admin
            </Link>
          )}
          <Link
            to="/orders"
            className={`fh-link ${location.pathname === '/orders' ? 'active' : ''}`}
          >
            Orders
          </Link>
          <Link
            to="/support"
            className={`fh-link ${location.pathname === '/support' ? 'active' : ''}`}
          >
            Support
          </Link>
        </nav>

        <div className={`fh-nav-actions ${menuOpen ? 'is-open' : ''}`}>
          <label className="fh-location">
            <span className="fh-location-label">Deliver to</span>
            <select
              aria-label="Delivery location"
              value={deliveryLocation}
              onChange={handleLocation}
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>

          <Link
            to="/notifications"
            className={`fh-cart-link fh-notif-link ${location.pathname === '/notifications' ? 'active' : ''}`}
            aria-label="Notifications"
          >
            🔔
            {unreadNotifs > 0 && <span className="fh-cart-count notif-count">{unreadNotifs}</span>}
          </Link>

          <Link
            to="/cart"
            className={`fh-cart-link ${location.pathname === '/cart' ? 'active' : ''}`}
            aria-label={`Shopping cart, ${cartCount} items`}
          >
            Cart
            <span className="fh-cart-count">{cartCount}</span>
          </Link>

          {user ? (
            <div className="fh-user-menu">
              <Link to="/profile" className="fh-user-pill">
                <span className="fh-avatar">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                <span className="fh-user-name">{user.name}</span>
                <span className="fh-role-tag">{user.role || 'customer'}</span>
              </Link>
              <button type="button" onClick={handleLogout} className="fh-btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="fh-auth-buttons">
              <Link to="/login" className="fh-btn-secondary">
                Login
              </Link>
              <Link to="/register" className="fh-btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
