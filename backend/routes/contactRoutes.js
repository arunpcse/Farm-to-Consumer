const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ContactInquiry = require('../models/ContactInquiry');
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

// POST /api/contact - Submit contact inquiry or support complaint
router.post('/', async (req, res) => {
  try {
    const {
      farmerId,
      farmerName,
      productId,
      productName,
      inquiryType,
      subject,
      message,
      contactEmail,
      contactPhone,
      orderId,
      urgency
    } = req.body;

    const user = getOptionalUser(req);
    const userId = user ? (user.id || user._id) : null;

    const inquiry = new ContactInquiry({
      userId,
      farmerId: farmerId || undefined,
      farmerName: farmerName || undefined,
      productId: productId || undefined,
      productName: productName || undefined,
      inquiryType: inquiryType || 'general',
      subject: subject || 'Customer Support Request',
      message,
      contactEmail: contactEmail || (user ? user.email : ''),
      contactPhone: contactPhone || '',
      status: 'pending'
    });

    await inquiry.save();
    res.status(201).json({ message: 'Inquiry or support ticket submitted successfully. We will follow up shortly.', inquiry });
  } catch (err) {
    console.error('[contactRoutes] POST / error:', err);
    res.status(500).json({ message: 'Failed to submit inquiry', error: err.message });
  }
});

// GET /api/contact/my - Get user's inquiries (auth required)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const inquiries = await ContactInquiry.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ inquiries });
  } catch (err) {
    console.error('[contactRoutes] GET /my error:', err);
    res.status(500).json({ message: 'Failed to fetch inquiries', error: err.message });
  }
});

// GET /api/contact/farmer/:farmerId - Get inquiries for a farmer (farmer only)
router.get('/farmer/:farmerId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ userId: req.user.id || req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const inquiries = await ContactInquiry.find({ farmerId: req.params.farmerId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ inquiries });
  } catch (err) {
    console.error('[contactRoutes] GET /farmer/:farmerId error:', err);
    res.status(500).json({ message: 'Failed to fetch inquiries', error: err.message });
  }
});

// PATCH /api/contact/:id/respond - Respond to inquiry (farmer only)
router.patch('/:id/respond', authMiddleware, async (req, res) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ userId: req.user.id || req.user._id });
    if (!farmer || inquiry.farmerId?.toString() !== farmer._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only respond to inquiries directed to you.' });
    }

    const { response } = req.body;
    await ContactInquiry.findByIdAndUpdate(req.params.id, {
      status: 'responded',
      response
    });

    res.json({ message: 'Response submitted successfully.' });
  } catch (err) {
    console.error('[contactRoutes] PATCH /:id/respond error:', err);
    res.status(500).json({ message: 'Failed to respond to inquiry', error: err.message });
  }
});

module.exports = router;
