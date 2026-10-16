const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  orderId: { type: String, default: '', index: true },
  productId: { type: String, default: '', index: true },
  farmerId: { type: String, default: '', index: true },
  reviewerId: { type: String, default: '' },
  reviewerName: { type: String, required: true, trim: true },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: { type: String, trim: true, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
