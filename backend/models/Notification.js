const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['order_status', 'payment_status', 'stock_alert', 'dispatch', 'delivery', 'harvest_availability', 'bulk_order'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // Order ID, Product ID, etc.
  relatedType: { type: String }, // 'order', 'product', 'bulk_order'
  isRead: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
