const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  farmName: { type: String, required: true, trim: true },
  native: { type: String, required: true, trim: true },
  state: { type: String, default: 'Tamil Nadu', trim: true },
  district: { type: String, required: true, trim: true },
  taluk: { type: String, trim: true, default: '' },
  village: { type: String, trim: true, default: '' },
  experience: { type: mongoose.Schema.Types.Mixed, default: 0 }, // e.g. 15 or '15 Years'
  farmSize: { type: String, trim: true, default: '' }, // e.g. '5 acres'
  farmingType: {
    type: String,
    enum: ['Organic', 'Natural', 'Conventional', 'Mixed'],
    default: 'Organic'
  },
  farmingPractices: { type: String, trim: true, default: '' },
  soilType: { type: String, trim: true, default: '' },
  fertilizerUsed: { type: String, trim: true, default: '' },
  pestManagement: { type: String, trim: true, default: '' },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0, min: 0 },
  bio: { type: String, trim: true, default: '' },
  profileImage: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Farmer', farmerSchema);
