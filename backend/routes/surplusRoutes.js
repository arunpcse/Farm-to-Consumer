const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SurplusListing = require('../models/SurplusListing');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');

// Demo surplus listings for fallback
const DEMO_SURPLUS_LISTINGS = [
  {
    _id: 's1',
    productId: 'demo-1',
    farmerId: 'f1',
    farmerName: 'Ramasamy Farms',
    productName: 'Fresh Organic Farm Tomatoes',
    productImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    availableQuantity: 50,
    standardPrice: 38,
    offerPrice: 28,
    minimumOrderQuantity: 10,
    offerStartDate: new Date('2024-10-13'),
    offerEndDate: new Date('2024-10-20'),
    offerNotes: 'Harvest surplus available at discounted price for bulk buyers.',
    status: 'active'
  },
  {
    _id: 's2',
    productId: 'demo-2',
    farmerId: 'f2',
    farmerName: 'Kaveri Valley Orchards',
    productName: 'Hilltop Cavendish Bananas',
    productImage: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    availableQuantity: 30,
    standardPrice: 55,
    offerPrice: 45,
    minimumOrderQuantity: 5,
    offerStartDate: new Date('2024-10-13'),
    offerEndDate: new Date('2024-10-18'),
    offerNotes: 'Fresh batch available at special price.',
    status: 'active'
  }
];

// Helper to expire outdated listings and notify farmers
async function expireSurplusListings() {
  if (mongoose.connection.readyState !== 1) return 0;
  try {
    const now = new Date();
    const expiredListings = await SurplusListing.find({
      status: 'active',
      offerEndDate: { $lt: now }
    });

    if (expiredListings.length === 0) return 0;

    await SurplusListing.updateMany(
      { status: 'active', offerEndDate: { $lt: now } },
      { $set: { status: 'expired' } }
    );

    // Persist notifications to farmers
    const Notification = require('../models/Notification');
    const Farmer = require('../models/Farmer');

    for (const listing of expiredListings) {
      try {
        const farmer = await Farmer.findById(listing.farmerId);
        if (farmer && farmer.userId) {
          await Notification.create({
            userId: farmer.userId,
            title: 'Surplus Flash Deal Expired',
            message: `Your flash offer for "${listing.productName}" expired on ${listing.offerEndDate.toLocaleDateString('en-IN')}.`,
            type: 'stock_alert',
            priority: 'normal'
          });
        }
      } catch (err) {
        console.warn('[surplusRoutes] Notification trigger warning:', err.message);
      }
    }

    return expiredListings.length;
  } catch (err) {
    console.error('[surplusRoutes] Error expiring listings:', err);
    return 0;
  }
}

// GET /api/surplus - Get all active surplus listings (auto-expires outdated)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo surplus listings');
      return res.json({ listings: DEMO_SURPLUS_LISTINGS.filter(s => s.status === 'active') });
    }

    // Auto-expire outdated deals
    await expireSurplusListings();

    const now = new Date();
    let listings = await SurplusListing.find({
      status: 'active',
      offerEndDate: { $gte: now }
    })
      .sort({ offerEndDate: 1 })
      .lean();

    if (listings.length === 0) {
      const demoWithFutureDates = DEMO_SURPLUS_LISTINGS.map(d => ({
        ...d,
        offerStartDate: new Date(),
        offerEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }));
      await SurplusListing.insertMany(demoWithFutureDates);
      listings = await SurplusListing.find({ status: 'active', offerEndDate: { $gte: now } }).sort({ offerEndDate: 1 }).lean();
    }

    res.json({ listings, count: listings.length });
  } catch (err) {
    console.error('[surplusRoutes] GET / error:', err);
    res.json({ listings: DEMO_SURPLUS_LISTINGS.filter(s => s.status === 'active') });
  }
});

// POST /api/surplus/expire-check - Explicit scheduled or on-demand check for expired deals
router.post('/expire-check', async (req, res) => {
  try {
    const expiredCount = await expireSurplusListings();
    res.json({ message: 'Surplus expiration check complete.', expiredCount });
  } catch (err) {
    console.error('[surplusRoutes] POST /expire-check error:', err);
    res.status(500).json({ message: 'Failed to run expiration check', error: err.message });
  }
});

// GET /api/surplus/my - Get logged-in farmer's surplus listings (both active & expired)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ userId: req.user.id || req.user._id }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    // Run expiration check first
    await expireSurplusListings();

    const listings = await SurplusListing.find({ farmerId: farmer._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ listings, total: listings.length });
  } catch (err) {
    console.error('[surplusRoutes] GET /my error:', err);
    res.status(500).json({ message: 'Failed to fetch farmer surplus listings', error: err.message });
  }
});

// POST /api/surplus - Create surplus listing (farmer only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const {
      productId,
      availableQuantity,
      offerPrice,
      minimumOrderQuantity,
      offerStartDate,
      offerEndDate,
      offerNotes
    } = req.body;

    if (!productId || availableQuantity === undefined || offerPrice === undefined || !offerEndDate) {
      return res.status(400).json({ message: 'productId, availableQuantity, offerPrice, and offerEndDate are required.' });
    }

    if (Number(availableQuantity) <= 0) {
      return res.status(400).json({ message: 'availableQuantity must be greater than 0.' });
    }

    if (Number(offerPrice) <= 0) {
      return res.status(400).json({ message: 'offerPrice must be greater than 0.' });
    }

    const endDate = new Date(offerEndDate);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid offerEndDate date format.' });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Get farmer profile
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ userId: req.user.id || req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    // Check if surplus listing already exists for this product
    const existing = await SurplusListing.findOne({ productId, status: 'active' });
    if (existing) {
      return res.status(400).json({ message: 'Active surplus listing already exists for this product.' });
    }

    const listing = new SurplusListing({
      productId,
      farmerId: farmer._id,
      farmerName: farmer.farmName,
      productName: product.name,
      productImage: product.image,
      availableQuantity: Number(availableQuantity),
      standardPrice: product.price,
      offerPrice: Number(offerPrice),
      minimumOrderQuantity: minimumOrderQuantity ? Number(minimumOrderQuantity) : 1,
      offerStartDate: offerStartDate ? new Date(offerStartDate) : new Date(),
      offerEndDate: endDate,
      offerNotes: offerNotes || '',
      status: endDate < new Date() ? 'expired' : 'active'
    });

    await listing.save();
    res.status(201).json({ message: 'Surplus listing created successfully.', listing });
  } catch (err) {
    console.error('[surplusRoutes] POST / error:', err);
    res.status(500).json({ message: 'Failed to create surplus listing', error: err.message });
  }
});

// PATCH /api/surplus/:id - Update surplus listing
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await SurplusListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Surplus listing not found.' });
    }

    // Check ownership
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ userId: req.user.id || req.user._id });
    if (String(listing.farmerId) !== String(farmer._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only update your own listings.' });
    }

    const updates = {};
    if (req.body.availableQuantity !== undefined) updates.availableQuantity = Number(req.body.availableQuantity);
    if (req.body.offerPrice !== undefined) updates.offerPrice = Number(req.body.offerPrice);
    if (req.body.offerEndDate !== undefined) {
      updates.offerEndDate = new Date(req.body.offerEndDate);
    }
    if (req.body.offerNotes !== undefined) updates.offerNotes = req.body.offerNotes;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const updated = await SurplusListing.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    res.json({ message: 'Surplus listing updated successfully.', listing: updated });
  } catch (err) {
    console.error('[surplusRoutes] PATCH /:id error:', err);
    res.status(500).json({ message: 'Failed to update surplus listing', error: err.message });
  }
});

// DELETE /api/surplus/:id - Delete surplus listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await SurplusListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Surplus listing not found.' });
    }

    // Check ownership
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ userId: req.user.id || req.user._id });
    if (String(listing.farmerId) !== String(farmer._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only delete your own listings.' });
    }

    await SurplusListing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Surplus listing deleted successfully.' });
  } catch (err) {
    console.error('[surplusRoutes] DELETE /:id error:', err);
    res.status(500).json({ message: 'Failed to delete surplus listing', error: err.message });
  }
});

module.exports = router;
