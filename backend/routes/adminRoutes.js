const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SurplusListing = require('../models/SurplusListing');
const SupportTicket = require('../models/SupportTicket');
const Delivery = require('../models/Delivery');
const ContactInquiry = require('../models/ContactInquiry');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All admin routes are strictly guarded: authenticated + admin role required
router.use(authMiddleware);
router.use(requireRole('admin'));

// GET /api/admin/stats - Marketplace overview telemetry
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFarmers = await Farmer.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalSurplus = await SurplusListing.countDocuments();

    const orders = await Order.find().lean();
    const totalGMV = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    let totalTickets = 0;
    try {
      totalTickets = await SupportTicket.countDocuments();
    } catch {
      // SupportTicket might be empty initially
    }

    res.json({
      totalUsers,
      totalFarmers,
      totalProducts,
      totalOrders,
      totalSurplus,
      totalGMV,
      totalTickets
    });
  } catch (error) {
    console.error('[adminRoutes] GET /stats error:', error);
    res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
  }
});

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['customer', 'farmer', 'bulk_buyer', 'delivery_partner', 'admin'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User role updated successfully.', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

// PATCH /api/admin/farmers/:id/verify - Verify or unverify farmer
router.patch('/farmers/:id/verify', async (req, res) => {
  try {
    const { isVerified } = req.body;
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      { isVerified: Boolean(isVerified) },
      { new: true }
    );
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found.' });
    }
    res.json({ message: `Farmer ${farmer.isVerified ? 'verified' : 'unverified'} successfully.`, farmer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating farmer verification', error: error.message });
  }
});

// GET /api/admin/orders - Monitor all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// GET /api/admin/tickets - View all support tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching support tickets', error: error.message });
  }
});

// PATCH /api/admin/tickets/:id/resolve - Admin response & status update
router.patch('/tickets/:id/resolve', async (req, res) => {
  try {
    const { status, responseMessage, resolutionNotes } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found.' });
    }

    if (status) ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (responseMessage) {
      ticket.responses.push({
        senderRole: 'admin',
        senderName: req.user.name || 'Support Desk',
        message: responseMessage,
        timestamp: new Date()
      });
      ticket.response = responseMessage;
    }

    await ticket.save();

    // Trigger notification to ticket owner
    if (ticket.userId) {
      const Notification = require('../models/Notification');
      Notification.create({
        userId: ticket.userId,
        title: `Support Ticket Updated: ${ticket.status}`,
        message: `Your ticket "${ticket.subject}" has received an update from customer care.`,
        type: 'order_status',
        link: '/support'
      }).catch(() => {});
    }

    res.json({ message: 'Support ticket updated successfully.', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error updating support ticket', error: error.message });
  }
});

// GET /api/admin/products - List all products for moderation
router.get('/products', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { farmerName: new RegExp(search, 'i') },
        { farmLocation: new RegExp(search, 'i') }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ products, total: products.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products for moderation', error: error.message });
  }
});

// PATCH /api/admin/products/:id/status - Moderate product status
router.patch('/products/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'inactive', 'out_of_stock', 'flagged', 'suspended'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json({ message: `Product status updated to ${status}.`, product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product status', error: error.message });
  }
});

// DELETE /api/admin/products/:id - Delete product listing
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ message: 'Product removed from marketplace by moderator.', productId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// GET /api/admin/surplus - Monitor surplus produce listings
router.get('/surplus', async (req, res) => {
  try {
    const listings = await SurplusListing.find().sort({ createdAt: -1 });
    res.json({ listings, total: listings.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching surplus listings', error: error.message });
  }
});

// DELETE /api/admin/surplus/:id - Remove surplus deal
router.delete('/surplus/:id', async (req, res) => {
  try {
    const listing = await SurplusListing.findByIdAndDelete(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Surplus listing not found.' });
    }
    res.json({ message: 'Surplus listing removed.', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting surplus listing', error: error.message });
  }
});

// GET /api/admin/deliveries - Monitor all logistics & delivery assignments
router.get('/deliveries', async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });
    res.json({ deliveries, total: deliveries.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
  }
});

// GET /api/admin/inquiries - Direct farmer inquiries & grievances
router.get('/inquiries', async (req, res) => {
  try {
    const inquiries = await ContactInquiry.find().sort({ createdAt: -1 });
    res.json({ inquiries, total: inquiries.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching direct inquiries', error: error.message });
  }
});

// PATCH /api/admin/orders/:id/status - Admin status override
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { orderStatus, note } = req.body;
    const allowed = ['Placed', 'Farmer Accepted', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!orderStatus || !allowed.includes(orderStatus)) {
      return res.status(400).json({ message: `Invalid order status. Allowed: ${allowed.join(', ')}` });
    }

    const order = await Order.findOne({
      $or: [
        { orderId: req.params.id },
        ...(mongoose.Types.ObjectId.isValid(req.params.id) ? [{ _id: req.params.id }] : [])
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.orderStatus = orderStatus;
    order.statusTimeline.push({
      status: orderStatus,
      timestamp: new Date(),
      note: note || `Order status updated to ${orderStatus} by platform administrator`
    });

    await order.save();
    res.json({ message: `Order status updated to ${orderStatus}.`, order });
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

module.exports = router;
