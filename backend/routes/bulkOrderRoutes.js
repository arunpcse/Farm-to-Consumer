const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const BulkOrder = require('../models/BulkOrder');

// Demo bulk orders for fallback when MongoDB is not available
const DEMO_BULK_ORDERS = [
  {
    bulkOrderId: 'FH-BULK-123456',
    buyerId: 'b1',
    buyerName: 'Saravana Bhavan Hotel',
    buyerEmail: 'orders@saravanabhavan.com',
    buyerPhone: '9876543210',
    buyerType: 'hotel',
    farmerId: 'f1',
    farmerName: 'Ramasamy Farms',
    items: [
      {
        productId: 'demo-1',
        name: 'Fresh Organic Farm Tomatoes',
        quantity: 100,
        pricePerUnit: 35,
        unit: 'kg',
        totalPrice: 3500
      },
      {
        productId: 'demo-10',
        name: 'Fresh Farm Onions',
        quantity: 80,
        pricePerUnit: 32,
        unit: 'kg',
        totalPrice: 2560
      }
    ],
    totalAmount: 6060,
    deliveryAddress: {
      street: '101 Anna Salai',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600002'
    },
    requestedDeliveryDate: new Date('2024-10-20'),
    buyerNote: 'Please deliver before 10 AM for lunch service',
    status: 'Accepted',
    farmerNote: 'Order confirmed. Will deliver as requested.',
    createdAt: new Date('2024-10-13')
  },
  {
    bulkOrderId: 'FH-BULK-789012',
    buyerId: 'b2',
    buyerName: 'Kirana King Grocery Store',
    buyerEmail: 'contact@kiranking.com',
    buyerPhone: '9876543211',
    buyerType: 'grocery_shop',
    farmerId: 'f3',
    farmerName: 'Thirunavukkarasu Naturals',
    items: [
      {
        productId: 'demo-3',
        name: 'Traditional Brown Ponni Rice',
        quantity: 500,
        pricePerUnit: 80,
        unit: 'kg',
        totalPrice: 40000
      },
      {
        productId: 'demo-12',
        name: 'Basmati Rice',
        quantity: 200,
        pricePerUnit: 115,
        unit: 'kg',
        totalPrice: 23000
      }
    ],
    totalAmount: 63000,
    deliveryAddress: {
      street: '202 Gandhi Road',
      city: 'Erode',
      district: 'Erode',
      state: 'Tamil Nadu',
      zipCode: '638001'
    },
    requestedDeliveryDate: new Date('2024-10-25'),
    buyerNote: 'Need rice stock for festival season',
    status: 'Requested',
    farmerNote: '',
    createdAt: new Date('2024-10-13')
  }
];

// ─────────────────────────────────────────────
// POST /api/bulk-orders
// Create a new bulk order request
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      buyerId,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerType,
      farmerId,
      farmerName,
      items,
      deliveryAddress,
      requestedDeliveryDate,
      buyerNote
    } = req.body;

    // Validate required fields
    if (!buyerName || !buyerPhone || !buyerEmail) {
      return res.status(400).json({ message: 'buyerName, buyerEmail, and buyerPhone are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required in the bulk order.' });
    }

    if (
      !deliveryAddress ||
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.district ||
      !deliveryAddress.zipCode
    ) {
      return res.status(400).json({
        message: 'deliveryAddress with street, city, district, and zipCode is required.'
      });
    }

    // Validate and compute item totals
    const validatedItems = items.map((item, idx) => {
      if (!item.productId || !item.name || !item.quantity || !item.pricePerUnit) {
        throw new Error(`Item at index ${idx} is missing required fields (productId, name, quantity, pricePerUnit).`);
      }
      const totalPrice = parseFloat((item.pricePerUnit * item.quantity).toFixed(2));
      return {
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        unit: item.unit || 'kg',
        totalPrice
      };
    });

    const totalAmount = parseFloat(
      validatedItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
    );

    // Generate unique bulk order ID
    const bulkOrderId = `FH-BULK-${Date.now().toString().slice(-6)}`;

    const bulkOrder = new BulkOrder({
      bulkOrderId,
      buyerId: buyerId || '',
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerType: buyerType || 'Other',
      farmerId: farmerId || '',
      farmerName: farmerName || '',
      items: validatedItems,
      totalAmount,
      deliveryAddress,
      requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate) : undefined,
      buyerNote: buyerNote || '',
      status: 'Requested'
    });

    await bulkOrder.save();

    res.status(201).json({
      message: 'Bulk order request submitted successfully.',
      bulkOrderId,
      bulkOrder
    });
  } catch (err) {
    console.error('[bulkOrderRoutes] POST / error:', err);
    res.status(500).json({ message: 'Failed to create bulk order', error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/bulk-orders
// List bulk orders, filter by buyerId or farmerId
// Query: ?buyerId=&farmerId=&status=&page=&limit=
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning demo bulk orders');
      return res.json({
        bulkOrders: DEMO_BULK_ORDERS,
        pagination: {
          total: DEMO_BULK_ORDERS.length,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      });
    }

    const {
      buyerId,
      farmerId,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};
    if (buyerId) filter.buyerId = buyerId;
    if (farmerId) filter.farmerId = farmerId;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [bulkOrders, total] = await Promise.all([
      BulkOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      BulkOrder.countDocuments(filter)
    ]);

    res.json({
      bulkOrders,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    console.error('[bulkOrderRoutes] GET / error:', err);
    // Return demo bulk orders on error
    return res.json({
      bulkOrders: DEMO_BULK_ORDERS,
      pagination: {
        total: DEMO_BULK_ORDERS.length,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/bulk-orders/:bulkOrderId
// Get a single bulk order by bulkOrderId
// ─────────────────────────────────────────────
router.get('/:bulkOrderId', async (req, res) => {
  try {
    const { bulkOrderId } = req.params;

    const bulkOrder = await BulkOrder.findOne({ bulkOrderId }).lean();
    if (!bulkOrder) {
      return res.status(404).json({ message: `Bulk order '${bulkOrderId}' not found.` });
    }

    res.json({ bulkOrder });
  } catch (err) {
    console.error('[bulkOrderRoutes] GET /:bulkOrderId error:', err);
    res.status(500).json({ message: 'Failed to fetch bulk order', error: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/bulk-orders/:bulkOrderId/status
// Update status of a bulk order
// Body: { status, farmerNote }
// ─────────────────────────────────────────────
router.patch('/:bulkOrderId/status', async (req, res) => {
  try {
    const { bulkOrderId } = req.params;
    const { status, farmerNote } = req.body;

    const allowedStatuses = [
      'Requested', 'Accepted', 'Rejected', 'Preparing',
      'Ready', 'Dispatched', 'Delivered', 'Cancelled'
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const updateData = { status };
    if (farmerNote !== undefined) updateData.farmerNote = farmerNote;

    const bulkOrder = await BulkOrder.findOneAndUpdate(
      { bulkOrderId },
      { $set: updateData },
      { new: true }
    );

    if (!bulkOrder) {
      return res.status(404).json({ message: `Bulk order '${bulkOrderId}' not found.` });
    }

    res.json({ message: `Bulk order status updated to '${status}'.`, bulkOrder });
  } catch (err) {
    console.error('[bulkOrderRoutes] PATCH /:bulkOrderId/status error:', err);
    res.status(500).json({ message: 'Failed to update bulk order status', error: err.message });
  }
});

module.exports = router;
