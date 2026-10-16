const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Review = require('../models/Review');
const Farmer = require('../models/Farmer');
const { authMiddleware } = require('../middleware/auth');

// Demo reviews for fallback when MongoDB is not available
const DEMO_REVIEWS = [
  {
    _id: 'r1',
    orderId: 'FH-ORD-98765',
    productId: 'demo-3',
    farmerId: 'f3',
    reviewerId: 'u1',
    reviewerName: 'M. Anand',
    rating: 5,
    comment: 'Excellent quality rice! Traditional taste and perfect for making idli/dosa. Will order again.',
    createdAt: new Date('2024-10-11')
  },
  {
    _id: 'r2',
    orderId: 'FH-ORD-54321',
    productId: 'demo-1',
    farmerId: 'f1',
    reviewerId: 'u2',
    reviewerName: 'R. Kumar',
    rating: 4,
    comment: 'Fresh tomatoes delivered on time. Good quality but slightly smaller than expected.',
    createdAt: new Date('2024-10-13')
  },
  {
    _id: 'r3',
    productId: 'demo-4',
    farmerId: 'f4',
    reviewerId: 'u3',
    reviewerName: 'S. Lakshmi',
    rating: 5,
    comment: 'Best A2 milk I have ever tasted! Pure and fresh. My family loves it.',
    createdAt: new Date('2024-10-10')
  },
  {
    _id: 'r4',
    productId: 'demo-6',
    farmerId: 'f6',
    reviewerId: 'u4',
    reviewerName: 'K. Rajan',
    rating: 5,
    comment: 'Authentic wild honey from Nilgiris. Great taste and quality. Worth every rupee!',
    createdAt: new Date('2024-10-08')
  },
  {
    _id: 'r5',
    productId: 'demo-2',
    farmerId: 'f2',
    reviewerId: 'u5',
    reviewerName: 'P. Devi',
    rating: 4,
    comment: 'Sweet and fresh bananas from Pollachi. Good for making traditional dishes.',
    createdAt: new Date('2024-10-12')
  }
];

// ─────────────────────────────────────────────
// POST /api/reviews
// Create a new review (requires auth)
// Body: { productId, farmerId, orderId, rating, comment }
// ─────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, farmerId, orderId, rating, comment } = req.body;
    const reviewerId = req.user.id || req.user._id;
    const reviewerName = req.user.name || 'Anonymous';

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating is required and must be between 1 and 5.' });
    }

    if (!productId && !farmerId) {
      return res.status(400).json({ message: 'At least one of productId or farmerId is required.' });
    }

    const review = new Review({
      orderId: orderId || '',
      productId: productId || '',
      farmerId: farmerId || '',
      reviewerId: reviewerId.toString(),
      reviewerName,
      rating,
      comment: comment || ''
    });

    await review.save();

    // If farmerId provided, update farmer's aggregate rating
    if (farmerId) {
      const reviews = await Review.find({ farmerId }).select('rating').lean();
      const totalReviews = reviews.length;
      const avgRating = parseFloat(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      );

      await Farmer.findByIdAndUpdate(farmerId, {
        $set: { rating: avgRating, totalReviews }
      });
    }

    res.status(201).json({ message: 'Review submitted successfully.', review });
  } catch (err) {
    console.error('[reviewRoutes] POST / error:', err);
    res.status(500).json({ message: 'Failed to submit review', error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/reviews/farmer/:farmerId
// Get all reviews for a specific farmer
// ─────────────────────────────────────────────
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo reviews');
      const farmerReviews = DEMO_REVIEWS.filter(r => r.farmerId === req.params.farmerId);
      const avgRating = farmerReviews.length > 0
        ? parseFloat((farmerReviews.reduce((sum, r) => sum + r.rating, 0) / farmerReviews.length).toFixed(1))
        : 0;
      return res.json({
        reviews: farmerReviews,
        avgRating,
        pagination: {
          total: farmerReviews.length,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });
    }

    const { farmerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [reviews, total] = await Promise.all([
      Review.find({ farmerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Review.countDocuments({ farmerId })
    ]);

    const avgRating = total > 0
      ? parseFloat(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        )
      : 0;

    res.json({
      reviews,
      avgRating,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error('[reviewRoutes] GET /farmer/:farmerId error:', err);
    const farmerReviews = DEMO_REVIEWS.filter(r => r.farmerId === req.params.farmerId);
    const avgRating = farmerReviews.length > 0
      ? parseFloat((farmerReviews.reduce((sum, r) => sum + r.rating, 0) / farmerReviews.length).toFixed(1))
      : 0;
    return res.json({
      reviews: farmerReviews,
      avgRating,
      pagination: {
        total: farmerReviews.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/reviews/product/:productId
// Get all reviews for a specific product
// ─────────────────────────────────────────────
router.get('/product/:productId', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo reviews');
      const productReviews = DEMO_REVIEWS.filter(r => r.productId === req.params.productId);
      const avgRating = productReviews.length > 0
        ? parseFloat((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1))
        : 0;
      return res.json({
        reviews: productReviews,
        avgRating,
        pagination: {
          total: productReviews.length,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });
    }

    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [reviews, total] = await Promise.all([
      Review.find({ productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Review.countDocuments({ productId })
    ]);

    const avgRating = total > 0
      ? parseFloat(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        )
      : 0;

    res.json({
      reviews,
      avgRating,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error('[reviewRoutes] GET /product/:productId error:', err);
    const productReviews = DEMO_REVIEWS.filter(r => r.productId === req.params.productId);
    const avgRating = productReviews.length > 0
      ? parseFloat((productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1))
      : 0;
    return res.json({
      reviews: productReviews,
      avgRating,
      pagination: {
        total: productReviews.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    });
  }
});

module.exports = router;
