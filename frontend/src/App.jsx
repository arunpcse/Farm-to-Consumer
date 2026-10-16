import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentConfirmation from './pages/PaymentConfirmation';
import Orders from './pages/Orders';
import PaymentHistory from './pages/PaymentHistory';
import FindFarmers from './pages/FindFarmers';
import FarmerProfile from './pages/FarmerProfile';
import FarmerDashboard from './pages/FarmerDashboard';
import BulkOrder from './pages/BulkOrder';
import BulkOrders from './pages/BulkOrders';
import Reviews from './pages/Reviews';
import Surplus from './pages/Surplus';
import BulkBuyerDashboard from './pages/BulkBuyerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import Support from './pages/Support';
import ProductDetails from './pages/ProductDetails';
import About from './pages/About';
import TermsPolicies from './pages/TermsPolicies';
import ReportsAnalytics from './pages/ReportsAnalytics';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Navbar />
        <main className="main-content" id="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/find-farmers" element={<FindFarmers />} />
            <Route path="/farmers" element={<FindFarmers />} />
            <Route path="/farmer/:farmerId" element={<FarmerProfile />} />
            <Route path="/farmers/:farmerId" element={<FarmerProfile />} />
            <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
            <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
            <Route path="/bulk-order/:farmerId" element={<BulkOrder />} />
            <Route path="/bulk-order" element={<BulkOrder />} />
            <Route path="/bulk-orders" element={<BulkOrders />} />
            <Route path="/surplus" element={<Surplus />} />
            <Route path="/bulk-buyer-dashboard" element={<BulkBuyerDashboard />} />
            <Route path="/bulk-buyer/dashboard" element={<BulkBuyerDashboard />} />
            <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/reports" element={<ReportsAnalytics />} />
            <Route path="/analytics" element={<ReportsAnalytics />} />
            <Route path="/support" element={<Support />} />
            <Route path="/help" element={<Support />} />
            <Route path="/terms" element={<TermsPolicies />} />
            <Route path="/privacy" element={<TermsPolicies />} />
            <Route path="/policies" element={<TermsPolicies />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-confirmation/:transactionId" element={<PaymentConfirmation />} />
            <Route path="/order-confirmation/:transactionId" element={<PaymentConfirmation />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/payments" element={<PaymentHistory />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/reviews/:orderId" element={<Reviews />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;