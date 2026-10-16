const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryPartnerName: { type: String, required: true },
  pickupAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  pickupTime: { type: Date },
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
    default: 'assigned'
  },
  notes: { type: String },
  distance: { type: Number }, // in km
  deliveryFee: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
