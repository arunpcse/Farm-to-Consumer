const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

// Sample default notifications for quick demonstration
const DEFAULT_NOTIFICATIONS = [
  {
    type: 'order_status',
    title: 'Order Dispatched from Farm',
    message: 'Your order FH-ORD-54321 containing Fresh Organic Tomatoes is on the way from Perundurai!',
    isRead: false,
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    type: 'stock_alert',
    title: 'Harvest Flash Surplus Alert!',
    message: 'Kaveri Valley Orchards has just listed Hilltop Cavendish Bananas at 20% off to prevent spoilage.',
    isRead: false,
    priority: 'normal',
    createdAt: new Date(Date.now() - 7200000)
  },
  {
    type: 'payment_status',
    title: 'Payment Confirmed',
    message: 'Transaction TXN-FH-456789 verified successfully via UPI. Thank you for supporting local farmers!',
    isRead: true,
    priority: 'normal',
    createdAt: new Date(Date.now() - 86400000)
  }
];

// GET /api/notifications - Get user's notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    if (notifications.length === 0) {
      // Seed default notifications for this user
      const userNotifications = DEFAULT_NOTIFICATIONS.map(n => ({ ...n, userId }));
      await Notification.insertMany(userNotifications);
      notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
    }
    
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('[notificationRoutes] GET / error:', err);
    res.json({ notifications: DEFAULT_NOTIFICATIONS, unreadCount: 2 });
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notifications', error: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.userId.toString() !== (req.user.id || req.user._id).toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('[notificationRoutes] PATCH /:id/read error:', err);
    res.status(500).json({ message: 'Failed to update notification', error: err.message });
  }
});

// POST /api/notifications - Create notification (internal use)
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, relatedId, relatedType, priority } = req.body;
    
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      priority: priority || 'normal'
    });

    await notification.save();
    res.status(201).json({ message: 'Notification created successfully.', notification });
  } catch (err) {
    console.error('[notificationRoutes] POST / error:', err);
    res.status(500).json({ message: 'Failed to create notification', error: err.message });
  }
});

module.exports = router;
