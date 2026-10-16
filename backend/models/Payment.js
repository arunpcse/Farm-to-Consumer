const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  userId: { type: String, default: 'guest' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['UPI', 'Credit/Debit Card', 'Net Banking', 'Cash on Delivery']
  },
  paymentDetails: {
    upiId: { type: String },
    cardLast4: { type: String },
    bankName: { type: String }
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Failed', 'Refunded', 'Cancelled'],
    default: 'Completed'
  },
  gatewayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  failureReason: { type: String, default: '' },
  gatewayReference: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
