const mongoose = require('mongoose');

const bulkOrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  pricePerUnit: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'kg' },
  totalPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const bulkOrderSchema = new mongoose.Schema({
  bulkOrderId: { type: String, required: true, unique: true, index: true },
  buyerId: { type: String, default: '' },
  buyerName: { type: String, required: true, trim: true },
  buyerEmail: { type: String, required: true, trim: true, lowercase: true },
  buyerPhone: { type: String, required: true, trim: true },
  buyerType: {
    type: String,
    enum: ['Grocery Shop', 'Restaurant', 'Hotel', 'College Canteen', 'Hostel Mess', 'Other'],
    default: 'Other'
  },
  farmerId: { type: String, default: '' },
  farmerName: { type: String, default: '', trim: true },
  items: [bulkOrderItemSchema],
  totalAmount: { type: Number, default: 0, min: 0 },
  deliveryAddress: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, default: 'Tamil Nadu', trim: true },
    zipCode: { type: String, required: true, trim: true }
  },
  requestedDeliveryDate: { type: Date },
  status: {
    type: String,
    enum: ['Requested', 'Accepted', 'Rejected', 'Preparing', 'Ready', 'Dispatched', 'Delivered', 'Cancelled'],
    default: 'Requested'
  },
  farmerNote: { type: String, default: '', trim: true },
  buyerNote: { type: String, default: '', trim: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('BulkOrder', bulkOrderSchema);
