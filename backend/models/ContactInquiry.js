const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
  farmerName: { type: String },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String },
  inquiryType: {
    type: String,
    enum: ['product_availability', 'bulk_order', 'general_question', 'quality_inquiry', 'harvest_schedule', 'support_complaint', 'general'],
    required: true
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  status: { type: String, enum: ['pending', 'responded', 'closed'], default: 'pending' },
  response: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
