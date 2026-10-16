const mongoose = require('mongoose');

const responseMessageSchema = new mongoose.Schema({
  senderRole: { type: String, default: 'admin' },
  senderName: { type: String, default: 'Customer Care' },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, default: 'FreshHarvest Customer' },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  orderId: { type: String, default: '' },
  category: {
    type: String,
    enum: ['produce_quality', 'delivery_delay', 'billing_dispute', 'wrong_item', 'general_question', 'other'],
    default: 'general_question'
  },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  response: { type: String, default: '' },
  responses: [responseMessageSchema],
  resolutionNotes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
