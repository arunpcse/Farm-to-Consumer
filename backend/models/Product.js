const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Vegetables', 'Fruits', 'Grains & Pulses', 'Dairy & Organic', 'Herbs & Spices'],
    default: 'Vegetables'
  },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'kg' },
  stock: { type: Number, default: 10, min: 0 },
  image: { type: String, default: '' },
  farmerName: { type: String, required: true, default: 'Local Organic Farmer' },
  farmLocation: { type: String, default: 'Erode, Tamil Nadu' },
  farmerId: { type: String, index: true },
  rating: { type: Number, default: 4.8 },
  isOrganic: { type: Boolean, default: true },
  // Harvest and availability management
  harvestDate: { type: Date },
  expectedAvailability: { type: String },
  minimumOrderQuantity: { type: Number, default: 1, min: 1 },
  // Farming information
  farmingInformation: { type: String, trim: true },
  farmingPractices: { type: String, trim: true },
  farmingMethod: { type: String, trim: true },
  fertilizerInfo: { type: String, trim: true },
  fertilizerUsed: { type: String, trim: true },
  pestManagementInfo: { type: String, trim: true },
  pesticide: { type: String, trim: true },
  // Batch / Volume Pricing
  batchPricing: [
    {
      minQuantity: { type: Number, min: 1 },
      discountPercentage: { type: Number, min: 0, max: 100 },
      pricePerUnit: { type: Number, min: 0 }
    }
  ],
  // Status
  status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
