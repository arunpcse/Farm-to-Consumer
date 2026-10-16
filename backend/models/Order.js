const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'kg' },
  image: { type: String, default: '' },
  farmerId: { type: String, default: '' },
  farmerName: { type: String, default: 'Organic Farmer' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, default: 'guest' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: 'Tamil Nadu' },
    zipCode: { type: String, required: true },
    label: { type: String, default: 'Home' }
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['UPI', 'Credit/Debit Card', 'Net Banking', 'Cash on Delivery']
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed', 'Refund Initiated', 'Cancelled'],
    default: 'Paid'
  },
  transactionId: { type: String, required: true },
  idempotencyKey: { type: String, index: true },
  orderStatus: {
    type: String,
    enum: ['Placed', 'Farmer Accepted', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Payment Failed'],
    default: 'Placed'
  },
  statusTimeline: [
    {
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      note: { type: String }
    }
  ],
  cancellationReason: { type: String, default: '' },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
