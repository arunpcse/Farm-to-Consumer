const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

function getOptionalUser(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
  return null;
}

function generateTicketId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `FH-TCK-${num}`;
}

// POST /api/support - Submit a new support ticket
router.post('/', async (req, res) => {
  try {
    const {
      subject,
      message,
      contactEmail,
      contactPhone,
      orderId,
      category,
      priority
    } = req.body;

    if (!subject || !message || !contactEmail || !contactPhone) {
      return res.status(400).json({
        message: 'Subject, detailed message, contact email, and phone number are required.'
      });
    }

    const user = getOptionalUser(req);
    const userId = user ? (user.id || user._id) : null;
    const ticketId = generateTicketId();

    const allowedCategories = ['produce_quality', 'delivery_delay', 'billing_dispute', 'wrong_item', 'general_question', 'other'];
    const safeCategory = allowedCategories.includes(category) ? category : 'general_question';

    const ticket = new SupportTicket({
      ticketId,
      userId,
      customerName: user?.name || 'Customer',
      contactEmail: contactEmail.trim().toLowerCase(),
      contactPhone: contactPhone.trim(),
      orderId: orderId ? orderId.trim() : '',
      category: safeCategory,
      subject: subject.trim(),
      message: message.trim(),
      priority: priority || 'medium',
      status: 'Open'
    });

    await ticket.save();

    // Trigger notification to customer
    if (userId) {
      Notification.create({
        userId,
        title: 'Support Ticket Registered',
        message: `Your support ticket #${ticketId} ("${ticket.subject}") has been assigned to our care desk.`,
        type: 'order_status',
        link: '/support'
      }).catch(() => {});
    }

    res.status(201).json({
      message: 'Support ticket registered successfully.',
      ticket
    });
  } catch (error) {
    console.error('[supportRoutes] POST / error:', error);
    res.status(500).json({ message: 'Failed to create support ticket', error: error.message });
  }
});

// GET /api/support/my - Get user's logged tickets
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userEmail = req.user.email?.toLowerCase();

    const tickets = await SupportTicket.find({
      $or: [
        { userId },
        ...(userEmail ? [{ contactEmail: userEmail }] : [])
      ]
    }).sort({ createdAt: -1 });

    res.json({ tickets });
  } catch (error) {
    console.error('[supportRoutes] GET /my error:', error);
    res.status(500).json({ message: 'Failed to retrieve support tickets', error: error.message });
  }
});

// GET /api/support/:id - Get specific ticket
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found.' });
    }
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving ticket', error: error.message });
  }
});

module.exports = router;
