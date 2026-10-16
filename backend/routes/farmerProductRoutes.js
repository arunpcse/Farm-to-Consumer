const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const { authMiddleware } = require('../middleware/auth');

// ─────────────────────────────────────────────
// POST /api/farmer-products
// Farmer adds a new product (requires auth, farmer role)
// ─────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const userId = req.user.id || req.user._id;

    // Fetch farmer profile to get farmerId and farmer details
    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({
        message: 'Farmer profile not found. Please create your farmer profile first.'
      });
    }

    const {
      name,
      description,
      category,
      price,
      unit,
      stock,
      image,
      harvestDate,
      expectedAvailability,
      minimumOrderQuantity,
      farmingMethod,
      farmingPractices,
      farmingInformation,
      fertilizerUsed,
      fertilizerInfo,
      pesticide,
      pestManagementInfo,
      batchPricing,
      isSurplus,
      surplusPrice,
      minBulkOrderQty,
      isOrganic,
      status
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'name, category, and price are required.' });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ message: 'Price cannot be negative.' });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative.' });
    }

    if (minimumOrderQuantity !== undefined && Number(minimumOrderQuantity) < 1) {
      return res.status(400).json({ message: 'Minimum order quantity must be at least 1.' });
    }

    // Validate batch pricing if provided
    let validatedBatchPricing = [];
    if (Array.isArray(batchPricing)) {
      for (const tier of batchPricing) {
        if (!tier.minQuantity || Number(tier.minQuantity) < 1) {
          return res.status(400).json({ message: 'Batch pricing tier minQuantity must be at least 1.' });
        }
        if (tier.discountPercentage !== undefined && (tier.discountPercentage < 0 || tier.discountPercentage > 100)) {
          return res.status(400).json({ message: 'Discount percentage must be between 0 and 100.' });
        }
        validatedBatchPricing.push({
          minQuantity: Number(tier.minQuantity),
          discountPercentage: Number(tier.discountPercentage || 0),
          pricePerUnit: tier.pricePerUnit !== undefined ? Number(tier.pricePerUnit) : Number((price * (1 - (tier.discountPercentage || 0) / 100)).toFixed(2))
        });
      }
    }

    const product = new Product({
      name: name.trim(),
      description: description || '',
      category,
      price: Number(price),
      unit: unit || 'kg',
      stock: stock !== undefined ? Number(stock) : 10,
      image: image || '',

      // Auto-populated from farmer profile
      farmerId: farmer._id.toString(),
      farmerName: farmer.farmName,
      farmLocation: `${farmer.district}, ${farmer.state || 'Tamil Nadu'}`,
      farmerNative: farmer.native,
      district: farmer.district,

      // Harvest & availability
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      expectedAvailability: expectedAvailability || '',
      minimumOrderQuantity: minimumOrderQuantity ? Number(minimumOrderQuantity) : 1,

      // Farming details
      farmingMethod: farmingMethod || farmer.farmingType || 'Organic',
      farmingPractices: farmingPractices || farmer.farmingPractices || '',
      farmingInformation: farmingInformation || '',
      fertilizerUsed: fertilizerUsed || farmer.fertilizerUsed || '',
      fertilizerInfo: fertilizerInfo || '',
      pesticide: pesticide || '',
      pestManagementInfo: pestManagementInfo || farmer.pestManagement || '',

      // Batch pricing
      batchPricing: validatedBatchPricing,

      // Surplus / bulk
      isSurplus: Boolean(isSurplus),
      surplusPrice: surplusPrice ? Number(surplusPrice) : 0,
      minBulkOrderQty: minBulkOrderQty ? Number(minBulkOrderQty) : 10,

      // Quality and status
      isOrganic: isOrganic !== undefined ? Boolean(isOrganic) : true,
      status: status || 'active'
    });

    await product.save();

    res.status(201).json({ message: 'Product added successfully.', product });
  } catch (err) {
    console.error('[farmerProductRoutes] POST / error:', err);
    res.status(500).json({ message: 'Failed to add product', error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/farmer-products/:productId
// Update a product (requires auth, must own product)
// ─────────────────────────────────────────────
router.put('/:productId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const userId = req.user.id || req.user._id;
    const { productId } = req.params;

    // Verify the product belongs to this farmer
    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (String(product.farmerId) !== String(farmer._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this product.' });
    }

    if (req.body.price !== undefined && Number(req.body.price) < 0) {
      return res.status(400).json({ message: 'Price cannot be negative.' });
    }

    if (req.body.stock !== undefined && Number(req.body.stock) < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative.' });
    }

    if (req.body.minimumOrderQuantity !== undefined && Number(req.body.minimumOrderQuantity) < 1) {
      return res.status(400).json({ message: 'Minimum order quantity must be at least 1.' });
    }

    const allowedUpdates = [
      'name', 'description', 'category', 'price', 'unit', 'stock', 'image',
      'harvestDate', 'expectedAvailability', 'minimumOrderQuantity',
      'farmingMethod', 'farmingPractices', 'farmingInformation',
      'fertilizerUsed', 'fertilizerInfo', 'pesticide', 'pestManagementInfo',
      'batchPricing', 'isSurplus', 'surplusPrice', 'minBulkOrderQty',
      'isOrganic', 'status'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'harvestDate') {
          updates[field] = req.body[field] ? new Date(req.body[field]) : undefined;
        } else if (field === 'price' || field === 'stock' || field === 'minimumOrderQuantity' || field === 'surplusPrice' || field === 'minBulkOrderQty') {
          updates[field] = Number(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Validate batch pricing if updated
    if (updates.batchPricing && Array.isArray(updates.batchPricing)) {
      for (const tier of updates.batchPricing) {
        if (!tier.minQuantity || Number(tier.minQuantity) < 1) {
          return res.status(400).json({ message: 'Batch pricing tier minQuantity must be at least 1.' });
        }
        if (tier.discountPercentage !== undefined && (tier.discountPercentage < 0 || tier.discountPercentage > 100)) {
          return res.status(400).json({ message: 'Discount percentage must be between 0 and 100.' });
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Product updated successfully.', product: updatedProduct });
  } catch (err) {
    console.error('[farmerProductRoutes] PUT /:productId error:', err);
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/farmer-products/:productId/status
// Toggle produce listing status (active, inactive, out_of_stock)
// ─────────────────────────────────────────────
router.patch('/:productId/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const userId = req.user.id || req.user._id;
    const { productId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'out_of_stock'].includes(status)) {
      return res.status(400).json({ message: "Valid status ('active', 'inactive', 'out_of_stock') is required." });
    }

    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (String(product.farmerId) !== String(farmer._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this product.' });
    }

    product.status = status;
    await product.save();

    res.json({ message: `Product status updated to ${status}.`, productId, status });
  } catch (err) {
    console.error('[farmerProductRoutes] PATCH /:productId/status error:', err);
    res.status(500).json({ message: 'Failed to update product status', error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/farmer-products/:productId
// Delete a product (requires auth, must own product)
// ─────────────────────────────────────────────
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Farmer role required.' });
    }

    const userId = req.user.id || req.user._id;
    const { productId } = req.params;

    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (String(product.farmerId) !== String(farmer._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this product.' });
    }

    await Product.findByIdAndDelete(productId);

    res.json({ message: 'Product deleted successfully.', productId });
  } catch (err) {
    console.error('[farmerProductRoutes] DELETE /:productId error:', err);
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/farmer-products/:productId/stock
// Update stock quantity only
// Body: { stock }
// ─────────────────────────────────────────────
router.patch('/:productId/stock', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.params;
    const { stock } = req.body;

    if (stock === undefined || typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ message: 'A valid non-negative stock number is required.' });
    }

    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (String(product.farmerId) !== String(farmer._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this product.' });
    }

    product.stock = stock;
    if (stock === 0) product.status = 'out_of_stock';
    else if (product.status === 'out_of_stock' && stock > 0) product.status = 'active';
    await product.save();

    res.json({ message: 'Stock updated successfully.', productId, stock: product.stock, status: product.status });
  } catch (err) {
    console.error('[farmerProductRoutes] PATCH /:productId/stock error:', err);
    res.status(500).json({ message: 'Failed to update stock', error: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/farmer-products/:productId/surplus
// Toggle surplus status and set surplus price
// Body: { isSurplus, surplusPrice }
// ─────────────────────────────────────────────
router.patch('/:productId/surplus', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.params;
    const { isSurplus, surplusPrice } = req.body;

    if (isSurplus === undefined) {
      return res.status(400).json({ message: 'isSurplus (boolean) is required.' });
    }

    const farmer = await Farmer.findOne({ userId }).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.farmerId !== farmer._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this product.' });
    }

    product.isSurplus = Boolean(isSurplus);
    if (surplusPrice !== undefined && surplusPrice >= 0) {
      product.surplusPrice = surplusPrice;
    }

    await product.save();

    res.json({
      message: `Product marked as ${product.isSurplus ? 'surplus' : 'non-surplus'} successfully.`,
      productId,
      isSurplus: product.isSurplus,
      surplusPrice: product.surplusPrice
    });
  } catch (err) {
    console.error('[farmerProductRoutes] PATCH /:productId/surplus error:', err);
    res.status(500).json({ message: 'Failed to update surplus status', error: err.message });
  }
});

module.exports = router;
