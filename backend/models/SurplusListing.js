const mongoose = require('mongoose');

const surplusListingSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  farmerName: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String },
  availableQuantity: { type: Number, required: true, min: 0 },
  standardPrice: { type: Number, required: true, min: 0 },
  offerPrice: { type: Number },
  minimumOrderQuantity: { type: Number, default: 1 },
  offerStartDate: { type: Date, required: true },
  offerEndDate: { type: Date, required: true },
  offerNotes: { type: String },
  status: { type: String, enum: ['active', 'expired', 'sold_out'], default: 'active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('SurplusListing', surplusListingSchema);
