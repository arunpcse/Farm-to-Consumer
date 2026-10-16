import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-logo">
            <BrandMark size={26} />
            <span>FreshHarvest</span>
          </div>
          <p>
            A Tamil Nadu farm-to-consumer marketplace that helps farmers list produce
            and helps buyers see origin, harvest dates, and available quantity before they order.
          </p>
        </div>
        <div className="site-footer-col">
          <h4>Marketplace</h4>
          <ul>
            <li><Link to="/products">Shop produce</Link></li>
            <li><Link to="/find-farmers">Find farmers</Link></li>
            <li><Link to="/surplus">Surplus flash deals</Link></li>
            <li><Link to="/bulk-buyer-dashboard">B2B bulk portal</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div className="site-footer-col">
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/orders">Order tracking</Link></li>
            <li><Link to="/farmer-dashboard">Farmer dashboard</Link></li>
            <li><Link to="/delivery-dashboard">Delivery portal</Link></li>
          </ul>
        </div>
        <div className="site-footer-col">
          <h4>Information</h4>
          <ul>
            <li><Link to="/about">About FreshHarvest</Link></li>
            <li><Link to="/support">Help center & FAQ</Link></li>
            <li><Link to="/terms">Fair trade policy</Link></li>
            <li><Link to="/privacy">Privacy & terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="site-footer-bottom">
        <p>© 2026 FreshHarvest. Direct Farm-to-Consumer & Bulk Procurement Marketplace.</p>
      </div>
    </footer>
  );
}

export default Footer;
