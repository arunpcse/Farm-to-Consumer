const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  label: { type: String, default: 'Home', trim: true },
  isDefault: { type: Boolean, default: false }
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, default: '', trim: true },
  role: {
    type: String,
    enum: ['customer', 'farmer', 'bulk_buyer', 'delivery_partner', 'admin'],
    default: 'customer'
  },
  addresses: [addressSchema],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // Bulk buyer specific fields
  businessName: { type: String },
  businessType: { type: String, enum: ['restaurant', 'grocery_shop', 'hotel', 'canteen', 'hostel_mess', 'other'] },
  gstNumber: { type: String },
  // Delivery partner specific fields
  vehicleNumber: { type: String },
  licenseNumber: { type: String },
  isAvailable: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
